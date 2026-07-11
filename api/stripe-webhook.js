const Stripe = require("stripe");
const path = require("path");
const libros = require("../libros.json");
const { enviarLibrosDigitales } = require("../lib/entrega-digital");
const { descontarStock, marcarProcesado } = require("../lib/inventario");

function leerRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
  const rawBody = await leerRawBody(req);

  let evento;
  try {
    evento = stripe.webhooks.constructEvent(
      rawBody,
      req.headers["stripe-signature"],
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    res.status(400).send(`Firma inválida: ${err.message}`);
    return;
  }

  if (evento.type === "checkout.session.completed") {
    const session = evento.data.object;
    const email = session.customer_details?.email;
    const itemsDigitales = session.metadata?.digital_items ? JSON.parse(session.metadata.digital_items) : [];
    const itemsFisicos = session.metadata?.physical_items ? JSON.parse(session.metadata.physical_items) : [];

    if (itemsFisicos.length > 0) {
      // Idempotente: si Stripe reintenta este webhook (ej. porque el envío
      // digital falló abajo y respondimos 500), no se vuelve a descontar.
      const esNuevo = await marcarProcesado(`stock:${session.id}`);
      if (esNuevo) {
        await Promise.all(itemsFisicos.map((item) => descontarStock(item.id, item.cantidad)));
      }
    }

    if (email && itemsDigitales.length > 0) {
      // Si esto falla (ej. falta RESEND_API_KEY), respondemos 500 para que
      // Stripe reintente el webhook más adelante en vez de perder el envío.
      await enviarLibrosDigitales({ email, items: itemsDigitales, libros, projectRoot: process.cwd() });
    }
  }

  res.status(200).json({ received: true });
}

module.exports = handler;
// Stripe firma el cuerpo crudo de la petición; si Vercel lo parseara a JSON
// antes de llegar aquí, la verificación de firma fallaría siempre. Debe
// asignarse después de exportar el handler, no antes.
module.exports.config = { api: { bodyParser: false } };
