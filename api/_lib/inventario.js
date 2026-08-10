const { Redis } = require("@upstash/redis");

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

// Inventario inicial por id de libro/producto — solo se usa la primera vez
// que se consulta cada clave (si ya existe en Redis, se respeta ese valor).
const STOCK_INICIAL = {
  "cuerpos-y-territorios": 50,
  contragolpe: 50,
  "lectura-marina-arrecife": 50,
  "lectura-marina-archipielago": 50,
  "tote-crisantemos": 5,
};

function claveStock(id) {
  return `stock:${id}`;
}

async function obtenerStock(id) {
  const clave = claveStock(id);
  const valor = await redis.get(clave);
  if (valor != null) return Number(valor);

  const inicial = STOCK_INICIAL[id] ?? 0;
  await redis.set(clave, inicial);
  return inicial;
}

async function obtenerStockVarios(ids) {
  const resultado = {};
  await Promise.all(
    ids.map(async (id) => {
      resultado[id] = await obtenerStock(id);
    })
  );
  return resultado;
}

// Resta `cantidad` del stock de `id` de forma atómica. Si el resultado
// quedaría negativo, revierte la resta y regresa null (sin stock suficiente).
async function descontarStock(id, cantidad) {
  const clave = claveStock(id);
  await obtenerStock(id); // asegura que la clave exista con su valor inicial

  const restante = await redis.decrby(clave, cantidad);
  if (restante < 0) {
    await redis.incrby(clave, cantidad);
    return null;
  }
  return restante;
}

// Evita descontar stock dos veces si Stripe reintenta el mismo webhook
// (ej. porque el envío del libro digital falló y se respondió 500).
async function marcarProcesado(claveIdempotencia) {
  const resultado = await redis.set(`procesado:${claveIdempotencia}`, "1", {
    nx: true,
    ex: 60 * 60 * 24 * 7,
  });
  return resultado === "OK";
}

module.exports = { obtenerStock, obtenerStockVarios, descontarStock, marcarProcesado, STOCK_INICIAL };
