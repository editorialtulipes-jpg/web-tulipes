async function cargarLibros(contenedorId, { enlazado = true, mostrarPrecio = true } = {}) {
  const contenedor = document.getElementById(contenedorId);
  if (!contenedor) return;

  const res = await fetch("libros.json");
  const libros = await res.json();

  contenedor.innerHTML = "";

  libros.forEach(libro => {
    const portada = libro.imagen
      ? `<img src="${libro.imagen}" alt="${libro.titulo}">`
      : `<div class="libro-sin-portada">Sin portada</div>`;

    const subtitulo = libro.subtitulo
      ? `<p class="subtitulo">${libro.subtitulo}</p>`
      : "";

    const antologador = libro.antologador
      ? `<p class="antologador">Antologadora: ${libro.antologador}</p>`
      : "";

    const precio = mostrarPrecio
      ? (libro.precio != null
          ? `<p class="precio">$${libro.precio}</p>`
          : `<p class="precio">Precio a consultar</p>`)
      : "";

    const contenido = `
      ${portada}
      <h4>${libro.titulo}</h4>
      ${subtitulo}
      <span>${libro.autor}</span>
      ${antologador}
      ${precio}
    `;

    contenedor.innerHTML += enlazado
      ? `<a href="${libro.link}" class="libro">${contenido}</a>`
      : `<section class="libro">${contenido}</section>`;
  });
}
