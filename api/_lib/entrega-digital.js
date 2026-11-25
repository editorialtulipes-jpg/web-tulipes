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

function escapeHtml(valor) {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function enviarNotificacionPedido({ session, catalogo }) {
  const resend = new Resend(process.env.RESEND_API_KEY);

  const itemsFisicos = session.metadata?.physical_items
    ? JSON.parse(session.metadata.physical_items)
    : [];
  const itemsDigitales = session.metadata?.digital_items
    ? JSON.parse(session.metadata.digital_items)
    : [];

  const formatoItem = (item, tipo) => {
    const producto = catalogo.find((entrada) => entrada.id === item.id);
    return `<li>${escapeHtml(producto?.titulo ?? item.id)} — ${tipo} — ${item.cantidad} pieza(s)</li>`;
  };

  const articulos = [
    ...itemsFisicos.map((item) => formatoItem(item, "físico")),
    ...itemsDigitales.map((item) => formatoItem(item, "digital")),
  ].join("");

  const envio = session.shipping_details?.address;
  const direccion = envio
    ? [envio.line1, envio.line2, envio.postal_code, envio.city, envio.state, envio.country]
        .filter(Boolean)
        .join(", ")
    : "No aplica (pedido únicamente digital)";

  const comprador = session.customer_details?.name
    || session.shipping_details?.name
    || "No proporcionado";
  const correoComprador = session.metadata?.digital_email
    || session.customer_details?.email
    || "No proporcionado";
  const total = typeof session.amount_total === "number"
    ? `$${(session.amount_total / 100).toFixed(2)} MXN`
    : "No disponible";

  const { error } = await resend.emails.send({
    from: "Editorial Tulipes <pedidos@tulipeseditorial.com>",
    to: "info@tulipeseditorial.com",
    replyTo: correoComprador,
    subject: `Nuevo pedido pagado #${session.id}`,
    html: `
      <h2>Nuevo pedido pagado</h2>
      <p><strong>Compra Stripe:</strong> ${escapeHtml(session.id)}</p>
      <p><strong>Comprador:</strong> ${escapeHtml(comprador)}</p>
      <p><strong>Correo:</strong> ${escapeHtml(correoComprador)}</p>
      <p><strong>Total pagado:</strong> ${escapeHtml(total)}</p>
      <p><strong>Tipo de envío:</strong> ${escapeHtml(session.metadata?.shipping_zone ?? "No registrado")}</p>
      <p><strong>Dirección:</strong> ${escapeHtml(direccion)}</p>
      <p><strong>Artículos:</strong></p>
      <ul>${articulos}</ul>
      <p><a href="https://dashboard.stripe.com/payments/${escapeHtml(session.payment_intent)}">Ver pago en Stripe</a></p>
    `,
  });

  if (error) throw new Error(`Resend rechazó la notificación: ${error.message}`);
}

module.exports = { enviarLibrosDigitales, enviarNotificacionPedido };
