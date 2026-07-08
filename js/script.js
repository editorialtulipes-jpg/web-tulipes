const COLORES_PORTADA = ["var(--accent)", "var(--accent-secundario)", "var(--text)"];

function tarjetaLibro(libro, i, { comprable = true, mostrarPrecio = true } = {}) {
  const portada = libro.imagen
    ? `<img src="${libro.imagen}" alt="${libro.titulo}">`
    : `<div class="portada-tipografica" style="background:${COLORES_PORTADA[i % COLORES_PORTADA.length]}">
         <span class="titulo-cubierta">${libro.titulo}</span>
       </div>`;

  const subtitulo = libro.subtitulo
    ? `<p class="subtitulo">${libro.subtitulo}</p>`
    : "";

  const antologador = libro.antologador
    ? `<p class="antologador">Antologadora: ${libro.antologador}</p>`
    : "";

  const tieneDigital = libro.precio_digital != null && libro.archivos_digitales?.length > 0;
  const tieneFisico = libro.precio_fisico != null;

  const mostrarSelectorFormato = comprable && tieneFisico && tieneDigital;

  const precio = mostrarPrecio && !mostrarSelectorFormato
    ? (tieneFisico
        ? `<p class="precio">$${libro.precio_fisico}</p>`
        : `<p class="precio">Precio a consultar</p>`)
    : "";

  const formatoOpciones = mostrarSelectorFormato
    ? `<div class="formato-opciones" data-formato-opciones>
         <label class="formato-opcion">
           <input type="radio" name="formato-${libro.id}" value="fisico" data-precio="${libro.precio_fisico}" checked>
           <span>Físico<b>$${libro.precio_fisico}</b></span>
         </label>
         <label class="formato-opcion">
           <input type="radio" name="formato-${libro.id}" value="digital" data-precio="${libro.precio_digital}">
           <span>Digital<b>$${libro.precio_digital}</b></span>
         </label>
       </div>`
    : "";

  const botonAgregar = comprable && tieneFisico
    ? `<button class="btn-agregar" data-agregar-carrito data-id="${libro.id}" data-titulo="${libro.titulo}" data-imagen="${libro.imagen}" data-precio-fisico="${libro.precio_fisico}">Agregar al carrito</button>`
    : "";

  return `
    <section class="libro">
      <a class="libro-enlace" href="libro.html?id=${encodeURIComponent(libro.id)}">
        ${portada}
        <h4>${libro.titulo}</h4>
        ${subtitulo}
        <span>${libro.autor}</span>
        ${antologador}
      </a>
      ${precio}
      ${formatoOpciones}
      ${botonAgregar}
    </section>
  `;
}

async function cargarLibros(contenedorId, { comprable = true, mostrarPrecio = true } = {}) {
  const contenedor = document.getElementById(contenedorId);
  if (!contenedor) return;

  const res = await fetch("libros.json");
  const libros = await res.json();

  contenedor.innerHTML = libros
    .map((libro, i) => tarjetaLibro(libro, i, { comprable, mostrarPrecio }))
    .join("");
}

async function cargarDetalleLibro(contenedorId) {
  const contenedor = document.getElementById(contenedorId);
  if (!contenedor) return;

  const id = new URLSearchParams(window.location.search).get("id");
  const res = await fetch("libros.json");
  const libros = await res.json();
  const libro = libros.find((l) => l.id === id);

  if (!libro) {
    contenedor.innerHTML = `<p>No encontramos ese libro. <a href="Catalogo.html">Volver a la tienda</a>.</p>`;
    return;
  }

  document.title = `${libro.titulo} — Editorial Tulipes`;

  const portada = libro.imagen
    ? `<img src="${libro.imagen}" alt="${libro.titulo}">`
    : `<div class="portada-tipografica" style="background:var(--accent)">
         <span class="titulo-cubierta">${libro.titulo}</span>
       </div>`;

  const subtitulo = libro.subtitulo ? `<p class="subtitulo">${libro.subtitulo}</p>` : "";
  const antologador = libro.antologador ? `<p class="antologador">Antologadora: ${libro.antologador}</p>` : "";

  const tieneDigital = libro.precio_digital != null && libro.archivos_digitales?.length > 0;
  const tieneFisico = libro.precio_fisico != null;
  const mostrarSelectorFormato = tieneFisico && tieneDigital;

  const precio = !mostrarSelectorFormato
    ? (tieneFisico
        ? `<p class="precio">$${libro.precio_fisico}</p>`
        : `<p class="precio">Precio a consultar</p>`)
    : "";

  const formatoOpciones = mostrarSelectorFormato
    ? `<div class="formato-opciones" data-formato-opciones>
         <label class="formato-opcion">
           <input type="radio" name="formato-${libro.id}" value="fisico" data-precio="${libro.precio_fisico}" checked>
           <span>Físico<b>$${libro.precio_fisico}</b></span>
         </label>
         <label class="formato-opcion">
           <input type="radio" name="formato-${libro.id}" value="digital" data-precio="${libro.precio_digital}">
           <span>Digital<b>$${libro.precio_digital}</b></span>
         </label>
       </div>`
    : "";

  const botonAgregar = tieneFisico
    ? `<button class="btn-agregar" data-agregar-carrito data-id="${libro.id}" data-titulo="${libro.titulo}" data-imagen="${libro.imagen}" data-precio-fisico="${libro.precio_fisico}">Agregar al carrito</button>`
    : "";

  const otros = libros.filter((l) => l.id !== libro.id);
  const otrosLibros = otros.length
    ? `<section class="catalogo">
         <h3>Más libros</h3>
         <div class="grid">
           ${otros.map((l, i) => tarjetaLibro(l, i, { comprable: true, mostrarPrecio: true })).join("")}
         </div>
       </section>`
    : "";

  contenedor.innerHTML = `
    <section class="libro detalle-libro">
      <div class="detalle-libro-portada">${portada}</div>
      <div class="detalle-libro-info">
        <h1>${libro.titulo}</h1>
        ${subtitulo}
        <span>${libro.autor}</span>
        ${antologador}
        <dl class="ficha-tecnica">
          <div><dt>ISBN</dt><dd>${libro.isbn ?? "Pendiente"}</dd></div>
          <div><dt>Páginas</dt><dd>${libro.paginas ?? "Pendiente"}</dd></div>
          <div><dt>Género</dt><dd>${libro.genero ?? "Pendiente"}</dd></div>
        </dl>
        <p class="sinopsis">${libro.sinopsis ?? ""}</p>
        ${precio}
        ${formatoOpciones}
        ${botonAgregar}
      </div>
    </section>
  `;

  contenedor.insertAdjacentHTML("afterend", otrosLibros);
}
