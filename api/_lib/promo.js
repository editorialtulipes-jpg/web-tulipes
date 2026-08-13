// Promoción de lanzamiento: 20% de descuento en toda la tienda.
// Debe coincidir con el bloque PROMO al inicio de js/script.js (ahí solo se
// usa para mostrar el precio; el cobro real siempre se calcula aquí).
const PROMO = {
  descuento: 0.2,
  desde: new Date("2026-08-13T00:00:00-06:00"),
  hasta: new Date("2026-08-25T23:59:59-06:00"),
};

function promoActiva(ahora = new Date()) {
  return ahora >= PROMO.desde && ahora <= PROMO.hasta;
}

function precioConDescuento(precio) {
  return Math.round(precio * (1 - PROMO.descuento));
}

module.exports = { PROMO, promoActiva, precioConDescuento };
