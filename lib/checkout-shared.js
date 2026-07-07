// Lógica compartida entre api/create-checkout-session.js (Vercel) y
// netlify/functions/create-checkout-session.js (Netlify). El precio y el
// costo de envío siempre se calculan aquí, del lado del servidor — nunca se
// confía en un precio o monto de envío que venga del cliente.

const ZONAS_ENVIO = {
  gdl: { nombre: "Guadalajara y zona metropolitana", precio: 70 },
  jalisco: { nombre: "Resto de Jalisco", precio: 100 },
  nacional: { nombre: "Resto de México", precio: 150 },
  internacional: { nombre: "Envío internacional", precio: 450 },
};

const PAISES_INTERNACIONAL = ["US", "CA", "ES", "AR", "CL", "CO", "PE"];

class ErrorValidacion extends Error {}

function construirParametrosSesion({ items, zona, libros }) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new ErrorValidacion("El carrito está vacío");
  }

  let hayFisico = false;
  const itemsDigitales = [];

  const line_items = items.map((item) => {
    const libro = libros.find((l) => l.id === item.id);
    if (!libro) throw new ErrorValidacion(`Libro inválido: ${item.id}`);

    const formato = item.formato === "digital" ? "digital" : "fisico";
    const cantidad = Math.max(1, Math.min(10, parseInt(item.cantidad, 10) || 1));
    let precioUnitario;

    if (formato === "digital") {
      if (libro.precio_digital == null || !libro.archivo_digital) {
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
    }

    return {
      quantity: cantidad,
      price_data: {
        currency: "mxn",
        unit_amount: Math.round(precioUnitario * 100),
        product_data: {
          name: `${libro.titulo} (${formato === "digital" ? "digital" : "físico"})`,
        },
      },
    };
  });

  const params = { mode: "payment", line_items };

  if (hayFisico) {
    const zonaInfo = ZONAS_ENVIO[zona];
    if (!zonaInfo) throw new ErrorValidacion("Zona de envío inválida");

    params.shipping_address_collection = {
      allowed_countries: zona === "internacional" ? PAISES_INTERNACIONAL : ["MX"],
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

  if (itemsDigitales.length > 0) {
    params.metadata = { digital_items: JSON.stringify(itemsDigitales) };
  }

  return params;
}

module.exports = { ZONAS_ENVIO, construirParametrosSesion, ErrorValidacion };
