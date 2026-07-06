const Stripe = require("stripe");
const libros = require("../../libros.json");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let items;
  try {
    ({ items } = JSON.parse(event.body));
  } catch {
    return { statusCode: 400, body: "JSON inválido" };
  }

  if (!Array.isArray(items) || items.length === 0) {
    return { statusCode: 400, body: "El carrito está vacío" };
  }

  let line_items;
  try {
    line_items = items.map((item) => {
      const libro = libros.find((l) => l.id === item.id);
      if (!libro || libro.precio == null) {
        throw new Error(`Libro inválido: ${item.id}`);
      }
      const cantidad = Math.max(1, Math.min(10, parseInt(item.cantidad, 10) || 1));
      return {
        quantity: cantidad,
        price_data: {
          currency: "mxn",
          unit_amount: Math.round(libro.precio * 100),
          product_data: { name: libro.titulo },
        },
      };
    });
  } catch (err) {
    return { statusCode: 400, body: err.message };
  }

  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
  const origin = event.headers.origin || "https://www.tulipeseditorial.com";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items,
    success_url: `${origin}/pago-exitoso.html`,
    cancel_url: `${origin}/pago-cancelado.html`,
  });

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: session.url }),
  };
};
