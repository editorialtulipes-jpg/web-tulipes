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

function tarjetaArticulo(a, prefijo = "") {
  const imagenTag = a.imagen
    ? `<img src="${prefijo}${a.imagen}" alt="imagen del articulo">`
    : `<div style="width:100%;aspect-ratio:4/3;background:var(--accent-secundario);display:flex;align-items:center;justify-content:center;color:var(--bg);font-size:0.85rem;margin-bottom:0.8rem;">Imagen pendiente</div>`;

  return `
    <div class="articulo">
      ${imagenTag}
      <a class="etiqueta-genero" href="${prefijo}genero.html?tipo=${encodeURIComponent(a.genero)}">${a.genero}</a>
      <h3>
        <a href="${prefijo}textos/${a.slug}.html">${a.titulo}</a>
      </h3>
      <p class="autor">${a.autor}</p>
      <p class="descripcion">
        ${a.descripcion}
      </p>
    </div>
  `;
}

function tarjetaAnuncioNativo() {
  return `
    <div class="articulo ad-slot ad-slot--card">
      <span class="ad-label">Publicidad</span>
      <span class="ad-dims">Espacio disponible</span>
    </div>
  `;
}

async function tarjetaAnuncioLibro(anuncio, prefijo = "") {
  const res = await fetch(`${prefijo}libros.json`);
  const libros = await res.json();
  const libro = libros.find((l) => l.id === anuncio.id);
  if (!libro) return tarjetaAnuncioNativo();

  const desde = libro.precio_digital ?? libro.precio_fisico;

  return `
    <div class="articulo anuncio">
      <a class="anuncio-link" href="${prefijo}libro.html?id=${encodeURIComponent(libro.id)}">
        <span class="anuncio-etiqueta">Publicidad</span>
        <img class="anuncio-portada" src="${prefijo}${libro.imagen}" alt="Portada de ${libro.titulo}">
        <h3>${libro.titulo}</h3>
        <p class="autor">${libro.autor}</p>
        <p class="descripcion">${anuncio.texto}</p>
        <div class="anuncio-pie">
          <span class="anuncio-precio">Desde <b>$${desde}</b></span>
          <span class="anuncio-cta">Ver en la tienda →</span>
        </div>
      </a>
    </div>
  `;
}

async function cargarArticulos(contenedorId, { genero, excluir, prefijo = "", anuncioEn, anuncioLibro } = {}) {
  const contenedor = document.getElementById(contenedorId);
  if (!contenedor) return;

  const res = await fetch(`${prefijo}revista.json`);
  let articulos = await res.json();

  if (genero) articulos = articulos.filter((a) => a.genero === genero);
  if (excluir) articulos = articulos.filter((a) => a.slug !== excluir);

  const tarjetas = articulos.map((a) => tarjetaArticulo(a, prefijo));
  if (anuncioEn != null && anuncioEn < tarjetas.length) {
    const tarjetaAd = anuncioLibro
      ? await tarjetaAnuncioLibro(anuncioLibro, prefijo)
      : tarjetaAnuncioNativo();
    tarjetas.splice(anuncioEn, 0, tarjetaAd);
  }

  contenedor.innerHTML = tarjetas.join("");
}
