const { enviarContacto, ErrorValidacion } = require("../lib/enviar-contacto");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  try {
    await enviarContacto(req.body || {});
  } catch (err) {
    if (err instanceof ErrorValidacion) {
      res.status(400).send(err.message);
      return;
    }
    res.status(502).send("No se pudo enviar el mensaje. Intenta de nuevo o escríbenos directo a info@tulipeseditorial.com.");
    return;
  }

  res.status(200).json({ ok: true });
};
