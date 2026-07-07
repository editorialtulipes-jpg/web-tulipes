async function cargarLibros(contenedorId, { comprable = true, mostrarPrecio = true } = {}) {
  const contenedor = document.getElementById(contenedorId);
  if (!contenedor) return;

  const res = await fetch("libros.json");
  const libros = await res.json();

  contenedor.innerHTML = "";

  const coloresPortada = ["var(--accent)", "var(--accent-secundario)", "var(--text)"];

  libros.forEach((libro, i) => {
    const portada = libro.imagen
      ? `<img src="${libro.imagen}" alt="${libro.titulo}">`
      : `<div class="portada-tipografica" style="background:${coloresPortada[i % coloresPortada.length]}">
           <span class="titulo-cubierta">${libro.titulo}</span>
         </div>`;

    const subtitulo = libro.subtitulo
      ? `<p class="subtitulo">${libro.subtitulo}</p>`
      : "";

    const antologador = libro.antologador
      ? `<p class="antologador">Antologadora: ${libro.antologador}</p>`
      : "";

    const tieneDigital = libro.precio_digital != null && !!libro.archivo_digital;
    const tieneFisico = libro.precio_fisico != null;

    const mostrarSelectorFormato = comprable && tieneFisico && tieneDigital;

    const precio = mostrarPrecio && !mostrarSelectorFormato
      ? (tieneFisico
          ? `<p class="precio">$${libro.precio_fisico}</p>`
          : `<p class="precio">Precio a consultar</p>`)
      : "";

    const formatoOpciones = mostrarSelectorFormato
      ? `<div class="formato-opciones" data-formato-opciones>
           <label><input type="radio" name="formato-${libro.id}" value="fisico" data-precio="${libro.precio_fisico}" checked> Físico — $${libro.precio_fisico}</label>
           <label><input type="radio" name="formato-${libro.id}" value="digital" data-precio="${libro.precio_digital}"> Digital — $${libro.precio_digital}</label>
         </div>`
      : "";

    const botonAgregar = comprable && tieneFisico
      ? `<button class="btn-agregar" data-agregar-carrito data-id="${libro.id}" data-titulo="${libro.titulo}" data-imagen="${libro.imagen}" data-precio-fisico="${libro.precio_fisico}">Agregar al carrito</button>`
      : "";

    contenedor.innerHTML += `
      <section class="libro">
        ${portada}
        <h4>${libro.titulo}</h4>
        ${subtitulo}
        <span>${libro.autor}</span>
        ${antologador}
        ${precio}
        ${formatoOpciones}
        ${botonAgregar}
      </section>
    `;
  });
}
