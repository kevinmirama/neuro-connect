
import React from "react";
import { Layout } from "@/components/Layout";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ = () => {
  const faqs = [
    {
      question: "¿Cómo puedo agendar una cita?",
      answer: "Para agendar una cita, dirígete a la sección 'Agenda' en el menú lateral. Allí podrás seleccionar el profesional, la fecha y hora disponible que mejor se ajuste a tus necesidades."
    },
    {
      question: "¿Cómo puedo ver mi historial de citas?",
      answer: "En la sección 'Pacientes', podrás encontrar tu historial completo de citas, incluyendo fechas, profesionales y notas relevantes de cada sesión."
    },
    {
      question: "¿Cómo funciona el sistema de pagos?",
      answer: "Los pagos se pueden realizar a través de la sección 'Finanzas'. Aceptamos diferentes métodos de pago incluyendo tarjetas de crédito, débito y transferencias bancarias."
    },
    {
      question: "¿Puedo cancelar o reprogramar una cita?",
      answer: "Sí, puedes cancelar o reprogramar tu cita hasta 24 horas antes de la hora programada. Para hacerlo, ve a la sección 'Agenda' y selecciona la cita que deseas modificar."
    },
    {
      question: "¿Cómo actualizo mi información personal?",
      answer: "Para actualizar tu información personal, dirígete a tu perfil haciendo clic en tu nombre en la parte superior del menú lateral. Allí podrás modificar tus datos de contacto y otra información relevante."
    },
    {
      question: "¿Qué hago si tengo problemas técnicos?",
      answer: "Si experimentas problemas técnicos, puedes contactar a nuestro soporte técnico a través del correo soporte@neuroconnect.com o llamando al número de atención al cliente."
    },
  ];

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold text-neuro-600 mb-8">
          Preguntas Frecuentes
        </h1>
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-lg font-medium text-neuro-600">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-gray-600">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </Layout>
  );
};

export default FAQ;
