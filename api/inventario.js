const { obtenerStockVarios, STOCK_INICIAL } = require("../lib/inventario");

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  const stock = await obtenerStockVarios(Object.keys(STOCK_INICIAL));
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=30");
  res.status(200).json(stock);
};
