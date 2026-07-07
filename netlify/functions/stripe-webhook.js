const Stripe = require("stripe");
const path = require("path");
const libros = require("../../libros.json");
const { enviarLibrosDigitales } = require("../../lib/entrega-digital");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
  const rawBody = event.isBase64Encoded ? Buffer.from(event.body, "base64") : event.body;

  let evento;
  try {
    evento = stripe.webhooks.constructEvent(
      rawBody,
      event.headers["stripe-signature"],
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return { statusCode: 400, body: `Firma inválida: ${err.message}` };
  }

  if (evento.type === "checkout.session.completed") {
    const session = evento.data.object;
    const email = session.customer_details?.email;
    const itemsDigitales = session.metadata?.digital_items ? JSON.parse(session.metadata.digital_items) : [];

    if (email && itemsDigitales.length > 0) {
      await enviarLibrosDigitales({ email, items: itemsDigitales, libros, projectRoot: path.join(__dirname, "../..") });
    }
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};
