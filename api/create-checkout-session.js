const Stripe = require("stripe");
const libros = require("../libros.json");
const productos = require("../productos.json");
const { construirParametrosSesion, ErrorValidacion } = require("../lib/checkout-shared");

const catalogo = [...libros, ...productos];

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  const { items, zona } = req.body || {};

  let params;
  try {
    params = construirParametrosSesion({ items, zona, libros: catalogo });
  } catch (err) {
    if (err instanceof ErrorValidacion) {
      res.status(400).send(err.message);
      return;
    }
    throw err;
  }

  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
  const origin = req.headers.origin || "https://www.tulipeseditorial.com";

  const session = await stripe.checkout.sessions.create({
    ...params,
    success_url: `${origin}/pago-exitoso.html`,
    cancel_url: `${origin}/pago-cancelado.html`,
  });

  res.status(200).json({ url: session.url });
};
