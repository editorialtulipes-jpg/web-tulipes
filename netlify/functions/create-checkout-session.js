const Stripe = require("stripe");
const libros = require("../../libros.json");
const { construirParametrosSesion, ErrorValidacion } = require("../../lib/checkout-shared");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let items, zona;
  try {
    ({ items, zona } = JSON.parse(event.body));
  } catch {
    return { statusCode: 400, body: "JSON inválido" };
  }

  let params;
  try {
    params = construirParametrosSesion({ items, zona, libros });
  } catch (err) {
    if (err instanceof ErrorValidacion) {
      return { statusCode: 400, body: err.message };
    }
    throw err;
  }

  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
  const origin = event.headers.origin || "https://www.tulipeseditorial.com";

  const session = await stripe.checkout.sessions.create({
    ...params,
    success_url: `${origin}/pago-exitoso.html`,
    cancel_url: `${origin}/pago-cancelado.html`,
  });

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: session.url }),
  };
};
