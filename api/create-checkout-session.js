const Stripe = require("stripe");
const libros = require("../libros.json");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  const { items } = req.body || {};

  if (!Array.isArray(items) || items.length === 0) {
    res.status(400).send("El carrito está vacío");
    return;
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
    res.status(400).send(err.message);
    return;
  }

  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
  const origin = req.headers.origin || "https://www.tulipeseditorial.com";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items,
    success_url: `${origin}/pago-exitoso.html`,
    cancel_url: `${origin}/pago-cancelado.html`,
  });

  res.status(200).json({ url: session.url });
};
