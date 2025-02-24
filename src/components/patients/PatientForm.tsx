
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Patient } from "@/lib/types";

interface PatientFormData {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  email: string;
  phone: string;
  address: string;
  diagnosis: string;
  notes: string;
}

interface PatientFormProps {
  formData: PatientFormData;
  onSubmit: (e: React.FormEvent) => void;
  onChange: (data: PatientFormData) => void;
  onCancel: () => void;
  isEditing: boolean;
}

export const PatientForm = ({
  formData,
  onSubmit,
  onChange,
  onCancel,
  isEditing,
}: PatientFormProps) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="first_name">Nombre</Label>
          <Input
            id="first_name"
            value={formData.first_name}
            onChange={(e) =>
              onChange({ ...formData, first_name: e.target.value })
            }
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="last_name">Apellidos</Label>
          <Input
            id="last_name"
            value={formData.last_name}
            onChange={(e) =>
              onChange({ ...formData, last_name: e.target.value })
            }
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="date_of_birth">Fecha de Nacimiento</Label>
          <Input
            id="date_of_birth"
            type="date"
            value={formData.date_of_birth}
            onChange={(e) =>
              onChange({ ...formData, date_of_birth: e.target.value })
            }
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) =>
              onChange({ ...formData, email: e.target.value })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Teléfono</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) =>
              onChange({ ...formData, phone: e.target.value })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">Dirección</Label>
          <Input
            id="address"
            value={formData.address}
            onChange={(e) =>
              onChange({ ...formData, address: e.target.value })
            }
          />
        </div>
        <div className="space-y-2 col-span-2">
          <Label htmlFor="diagnosis">Diagnóstico</Label>
          <Textarea
            id="diagnosis"
            value={formData.diagnosis}
            onChange={(e) =>
              onChange({ ...formData, diagnosis: e.target.value })
            }
          />
        </div>
        <div className="space-y-2 col-span-2">
          <Label htmlFor="notes">Notas</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) =>
              onChange({ ...formData, notes: e.target.value })
            }
          />
        </div>
      </div>
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          {isEditing ? "Actualizar" : "Crear"}
        </Button>
      </div>
    </form>
  );
};
