// Vercel sirve como estático público cualquier archivo del repo que no esté
// en api/. Este handler existe para que vercel.json pueda redirigir aquí las
// rutas que nunca deben ser públicas (código fuente del servidor, PDFs/EPUBs
// de venta digital) y devolver un 404 real en vez de servir el archivo.
module.exports = (req, res) => {
  res.status(404).send("Not Found");
};
