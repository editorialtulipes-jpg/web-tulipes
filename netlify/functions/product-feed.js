const libros = require("../../libros.json");
const productos = require("../../productos.json");
const { construirFeedTxt } = require("../../lib/product-feed");

exports.handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const feed = await construirFeedTxt({ libros, productos });
  return {
    statusCode: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=0, s-maxage=1800" },
    body: feed,
  };
};
