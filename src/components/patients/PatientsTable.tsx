
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Pencil, Trash2, CheckCircle, XCircle, FileText, Upload } from "lucide-react";
import type { Patient, Transaction } from "@/lib/types";
import { PaymentDialog } from "./PaymentDialog";

interface PatientsTableProps {
  patients: (Patient & { transactions: Transaction[] })[];
  onEdit: (patient: Patient) => void;
  onDelete: (id: string) => void;
  showPaymentDialog: boolean;
  setShowPaymentDialog: (show: boolean) => void;
  selectedPatient: Patient | null;
  setSelectedPatient: (patient: Patient | null) => void;
}

export const PatientsTable = ({
  patients,
  onEdit,
  onDelete,
  showPaymentDialog,
  setShowPaymentDialog,
  selectedPatient,
  setSelectedPatient,
}: PatientsTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Teléfono</TableHead>
          <TableHead>Último Pago</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {patients.map((patient) => {
          const lastTransaction = patient.transactions?.[0];
          return (
            <TableRow key={patient.id}>
              <TableCell>
                {patient.first_name} {patient.last_name}
              </TableCell>
              <TableCell>{patient.email}</TableCell>
              <TableCell>{patient.phone}</TableCell>
              <TableCell>
                {lastTransaction ? (
                  <div className="flex items-center">
                    <span className="mr-2">
                      ${lastTransaction.amount}
                    </span>
                    {lastTransaction.status === "completed" ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : lastTransaction.status === "pending" ? (
                      <FileText className="w-4 h-4 text-yellow-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                ) : (
                  "Sin pagos"
                )}
              </TableCell>
              <TableCell>
                {lastTransaction?.status === "completed" ? (
                  <span className="text-green-500">Al día</span>
                ) : (
                  <span className="text-yellow-500">Pendiente</span>
                )}
              </TableCell>
              <TableCell className="text-right space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(patient)}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedPatient(patient);
                        setShowPaymentDialog(true);
                      }}
                    >
                      <Upload className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  {selectedPatient && (
                    <PaymentDialog
                      patient={selectedPatient}
                      onClose={() => {
                        setShowPaymentDialog(false);
                        setSelectedPatient(null);
                      }}
                    />
                  )}
                </Dialog>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (window.confirm("¿Estás seguro de eliminar este paciente?")) {
                      onDelete(patient.id);
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};
