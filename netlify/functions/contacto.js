const { enviarContacto, ErrorValidacion } = require("../../lib/enviar-contacto");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    await enviarContacto(JSON.parse(event.body || "{}"));
  } catch (err) {
    if (err instanceof ErrorValidacion) {
      return { statusCode: 400, body: err.message };
    }
    return {
      statusCode: 502,
      body: "No se pudo enviar el mensaje. Intenta de nuevo o escríbenos directo a info@tulipeseditorial.com.",
    };
  }

  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
};
