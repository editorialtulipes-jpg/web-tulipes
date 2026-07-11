const { obtenerStockVarios, STOCK_INICIAL } = require("../../lib/inventario");

exports.handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const stock = await obtenerStockVarios(Object.keys(STOCK_INICIAL));
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=0, s-maxage=30" },
    body: JSON.stringify(stock),
  };
};
