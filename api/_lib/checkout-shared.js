// Lógica compartida entre api/create-checkout-session.js (Vercel) y
// netlify/functions/create-checkout-session.js (Netlify). El precio y el
// costo de envío siempre se calculan aquí, del lado del servidor — nunca se
// confía en un precio o monto de envío que venga del cliente.

const { obtenerStockVarios, STOCK_INICIAL } = require("./inventario");

const ZONAS_ENVIO = {
  gdl: { nombre: "Guadalajara y zona metropolitana", precio: 70 },
  jalisco: { nombre: "Resto de Jalisco", precio: 100 },
  nacional: { nombre: "Resto de México", precio: 150 },
};

class ErrorValidacion extends Error {}

async function construirParametrosSesion({ items, zona, libros }) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new ErrorValidacion("El carrito está vacío");
  }

  let hayFisico = false;
  const itemsDigitales = [];
  const itemsFisicos = [];
  const pedidosControlados = {};

  const lineasCrudas = items.map((item) => {
    const libro = libros.find((l) => l.id === item.id);
    if (!libro) throw new ErrorValidacion(`Libro inválido: ${item.id}`);

    const formato = item.formato === "digital" ? "digital" : "fisico";
    const cantidad = Math.max(1, Math.min(10, parseInt(item.cantidad, 10) || 1));
    let precioUnitario;

    if (formato === "digital") {
      if (libro.precio_digital == null || !(libro.archivos_digitales?.length > 0)) {
        throw new ErrorValidacion(`Formato digital no disponible: ${item.id}`);
      }
      precioUnitario = libro.precio_digital;
      itemsDigitales.push({ id: libro.id, cantidad });
    } else {
      if (libro.precio_fisico == null) {
        throw new ErrorValidacion(`Libro inválido: ${item.id}`);
      }
      precioUnitario = libro.precio_fisico;
      hayFisico = true;
      itemsFisicos.push({ id: libro.id, cantidad });
      if (STOCK_INICIAL[libro.id] != null) {
        pedidosControlados[libro.id] = (pedidosControlados[libro.id] ?? 0) + cantidad;
      }
    }

    return { libro, formato, cantidad, precioUnitario };
  });

  const idsAChecar = Object.keys(pedidosControlados);
  if (idsAChecar.length > 0) {
    const stockActual = await obtenerStockVarios(idsAChecar);
    for (const id of idsAChecar) {
      if (pedidosControlados[id] > (stockActual[id] ?? 0)) {
        const libro = libros.find((l) => l.id === id);
        throw new ErrorValidacion(
          `Ya no queda suficiente inventario de "${libro?.titulo ?? id}" (quedan ${stockActual[id] ?? 0}).`
        );
      }
    }
  }

  const line_items = lineasCrudas.map(({ libro, formato, cantidad, precioUnitario }) => ({
    quantity: cantidad,
    price_data: {
      currency: "mxn",
      unit_amount: Math.round(precioUnitario * 100),
      product_data: {
        name: `${libro.titulo} (${formato === "digital" ? "digital" : "físico"})`,
      },
    },
  }));

  const params = { mode: "payment", line_items };

  if (hayFisico) {
    const zonaInfo = ZONAS_ENVIO[zona];
    if (!zonaInfo) throw new ErrorValidacion("Zona de envío inválida");

    params.shipping_address_collection = {
      allowed_countries: ["MX"],
    };
    params.shipping_options = [
      {
        shipping_rate_data: {
          type: "fixed_amount",
          fixed_amount: { amount: Math.round(zonaInfo.precio * 100), currency: "mxn" },
          display_name: `Envío — ${zonaInfo.nombre}`,
        },
      },
    ];
  }

  const metadata = {};
  if (itemsDigitales.length > 0) metadata.digital_items = JSON.stringify(itemsDigitales);
  if (itemsFisicos.length > 0) metadata.physical_items = JSON.stringify(itemsFisicos);
  if (Object.keys(metadata).length > 0) params.metadata = metadata;

  return params;
}

module.exports = { ZONAS_ENVIO, construirParametrosSesion, ErrorValidacion };
