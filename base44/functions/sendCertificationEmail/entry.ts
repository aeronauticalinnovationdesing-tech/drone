import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { form } = body;

    const emailBody = `
Solicitud de Asesoría para Certificación RAC 100

DATOS DE LA EMPRESA:
${form.name ? `Empresa: ${form.name}` : ""}
${form.nit ? `NIT: ${form.nit}` : ""}
${form.city ? `Ciudad: ${form.city}` : ""}
${form.address ? `Dirección: ${form.address}` : ""}
${form.phone ? `Teléfono: ${form.phone}` : ""}
${form.email ? `Email: ${form.email}` : ""}

CERTIFICACIÓN AAC / RAC 100:
${form.aac_cert_number ? `Número de Certificado: ${form.aac_cert_number}` : ""}
${form.aac_cert_expiry ? `Vencimiento: ${form.aac_cert_expiry}` : ""}
${form.aac_cert_phase ? `Fase: ${form.aac_cert_phase}` : ""}
${form.activity_type ? `Tipo de Actividad: ${form.activity_type}` : ""}
${form.operation_category_type ? `Tipo de Operación: ${form.operation_category_type}` : ""}

SISTEMA DE GESTIÓN DE SEGURIDAD (SMS):
${form.sms_manager_name ? `Gerente SMS: ${form.sms_manager_name}` : ""}
${form.sms_manager_email ? `Email Gerente: ${form.sms_manager_email}` : ""}
${form.chief_pilot_name ? `Jefe de Pilotos: ${form.chief_pilot_name}` : ""}

VUELOS ESPECIALES AUTORIZADOS:
${form.special_flights && form.special_flights.length > 0 ? form.special_flights.join(", ") : "Ninguno"}

EQUIPOS TECNOLÓGICOS:
${form.tech_equipment && form.tech_equipment.length > 0 ? form.tech_equipment.join(", ") : "Ninguno"}
${form.other_equipment ? `Otros: ${form.other_equipment}` : ""}

REFERENCIAS DE DRONES:
${form.drone_references && form.drone_references.length > 0 ? form.drone_references.map(d => `${d.model} (Cantidad: ${d.quantity})`).join(", ") : "Ninguno"}

SEGUROS:
${form.insurance_policy_number ? `Póliza: ${form.insurance_policy_number}` : ""}
${form.insurance_expiry ? `Vencimiento: ${form.insurance_expiry}` : ""}

---
Usuario que solicita: ${user.full_name} (${user.email})
Fecha: ${new Date().toISOString()}
    `.trim();

    await base44.integrations.Core.SendEmail({
      to: "gerencia@aeronauticalinnovation.co",
      subject: `Consulta de Asesoría Certificación RAC 100 - ${form.name || "Nueva Solicitud"}`,
      body: emailBody
    });

    return Response.json({ success: true, message: "Solicitud enviada exitosamente" });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});