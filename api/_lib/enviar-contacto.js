const { Resend } = require("resend");

class ErrorValidacion extends Error {}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Manda el formulario de contacto a info@tulipeseditorial.com con el correo
// de quien escribe como Reply-To, para poder responderle directo.
async function enviarContacto({ nombre, email, mensaje }) {
  if (!nombre || !email || !mensaje) {
    throw new ErrorValidacion("Faltan campos requeridos");
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const { error } = await resend.emails.send({
    from: "Editorial Tulipes <pedidos@tulipeseditorial.com>",
    to: "info@tulipeseditorial.com",
    replyTo: email,
    subject: `Contacto desde la web — ${nombre}`,
    html: `
      <p><strong>Nombre:</strong> ${escapeHtml(nombre)}</p>
      <p><strong>Correo:</strong> ${escapeHtml(email)}</p>
      <p><strong>Mensaje:</strong></p>
      <p>${escapeHtml(mensaje).replace(/\n/g, "<br>")}</p>
    `,
  });

  // La API de Resend no lanza excepción en errores de envío, los devuelve
  // en `error` — si no revisamos esto, un envío fallido se ve como éxito.
  if (error) throw new Error(`Resend rechazó el envío: ${error.message}`);
}

module.exports = { enviarContacto, ErrorValidacion };
