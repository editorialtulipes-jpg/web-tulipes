const { obtenerStockVarios } = require("./inventario");

const SITIO_BASE = "https://www.tulipeseditorial.com";
const MARCA = "Editorial Tulipes";

function limpiarTexto(texto) {
  return String(texto ?? "").replace(/[\t\r\n]+/g, " ").trim();
}

function lineaFeed(campos) {
  return campos.map(limpiarTexto).join("\t");
}

async function construirFeedTxt({ libros, productos }) {
  const items = [
    ...libros.map((l) => ({
      id: l.id,
      title: l.titulo,
      description: l.sinopsis ?? l.titulo,
      link: `${SITIO_BASE}/libro?id=${encodeURIComponent(l.id)}`,
      image_link: `${SITIO_BASE}/${l.imagen}`,
      price: l.precio_fisico,
      isbn: l.isbn,
    })),
    ...productos.map((p) => ({
      id: p.id,
      title: p.titulo,
      description: p.descripcion ?? p.titulo,
      link: `${SITIO_BASE}/producto?id=${encodeURIComponent(p.id)}`,
      image_link: `${SITIO_BASE}/${p.imagen}`,
      price: p.precio_fisico,
      isbn: null,
    })),
  ].filter((item) => typeof item.price === "number");

  const stock = await obtenerStockVarios(items.map((i) => i.id));

  const encabezado = [
    "id", "title", "description", "link", "image_link", "availability",
    "price", "brand", "condition", "gtin", "identifier_exists",
  ];

  const filas = items.map((item) => {
    const cantidad = stock[item.id];
    const disponible = typeof cantidad === "number" && cantidad <= 0 ? "out_of_stock" : "in_stock";
    const gtinValido = item.isbn && /^\d{10,13}$/.test(item.isbn);

    return lineaFeed([
      item.id,
      item.title,
      item.description,
      item.link,
      item.image_link,
      disponible,
      `${Number(item.price).toFixed(2)} MXN`,
      MARCA,
      "new",
      gtinValido ? item.isbn : "",
      gtinValido ? "" : "no",
    ]);
  });

  return [lineaFeed(encabezado), ...filas].join("\n") + "\n";
}

module.exports = { construirFeedTxt };
