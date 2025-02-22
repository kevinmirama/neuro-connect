
import { Layout } from "@/components/Layout";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";

const Appointments = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-neuro-600">Agenda de Citas</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Calendario</CardTitle>
              <CardDescription>
                Visualiza y gestiona tus citas programadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Citas del día</CardTitle>
              <CardDescription>
                {date ? date.toLocaleDateString() : "Selecciona una fecha"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-gray-500 py-8">
                <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No hay citas programadas para este día</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Appointments;
