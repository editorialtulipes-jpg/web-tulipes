const libros = require("../libros.json");
const productos = require("../productos.json");
const { construirFeedTxt } = require("../lib/product-feed");

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  const feed = await construirFeedTxt({ libros, productos });
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=1800");
  res.status(200).send(feed);
};
