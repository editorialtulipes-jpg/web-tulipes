const fs = require("fs");
const path = require("path");
const { Resend } = require("resend");

// Envía por correo los libros digitales de una compra ya pagada.
// items: [{ id, cantidad }] — tal como se guardó en session.metadata.digital_items
async function enviarLibrosDigitales({ email, items, libros, projectRoot }) {
  const resend = new Resend(process.env.RESEND_API_KEY);

  const encontrados = items
    .map((item) => libros.find((l) => l.id === item.id))
    .filter((libro) => libro && libro.archivos_digitales?.length > 0);

  if (encontrados.length === 0) return;

  const attachments = encontrados.flatMap((libro) =>
    libro.archivos_digitales.map((archivo) => ({
      filename: path.basename(archivo),
      content: fs.readFileSync(path.join(projectRoot, archivo)).toString("base64"),
    }))
  );

  const titulos = encontrados.map((libro) => libro.titulo).join(", ");

  const { error } = await resend.emails.send({
    from: "Editorial Tulipes <pedidos@tulipeseditorial.com>",
    to: email,
    subject: "Tu libro digital — Editorial Tulipes",
    html: `
      <p>¡Gracias por tu compra! Adjunto encontrarás: <strong>${titulos}</strong>.</p>
      <p style="color:#666;font-size:0.85rem;">¿Necesitas ayuda con tu pedido? Escríbenos a
        <a href="mailto:info@tulipeseditorial.com">info@tulipeseditorial.com</a>.</p>
    `,
    attachments,
  });

  // La API de Resend no lanza excepción en errores de envío, los devuelve
  // en `error` — si no revisamos esto, un envío fallido se ve como éxito.
  if (error) throw new Error(`Resend rechazó el envío: ${error.message}`);
}

module.exports = { enviarLibrosDigitales };
