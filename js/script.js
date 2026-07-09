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

function tarjetaProducto(producto) {
  const portada = producto.imagen
    ? `<img src="${producto.imagen}" alt="${producto.titulo}">`
    : `<div class="portada-tipografica" style="background:var(--accent-secundario)">
         <span class="titulo-cubierta">${producto.titulo}</span>
       </div>`;

  return `
    <section class="libro">
      <a class="libro-enlace" href="producto.html?id=${encodeURIComponent(producto.id)}">
        ${portada}
        <h4>${producto.titulo}</h4>
      </a>
      <p class="precio">$${producto.precio_fisico}</p>
      <button class="btn-agregar" data-agregar-carrito data-id="${producto.id}" data-titulo="${producto.titulo}" data-imagen="${producto.imagen ?? ""}" data-precio-fisico="${producto.precio_fisico}">Agregar al carrito</button>
    </section>
  `;
}

async function cargarProductos(contenedorId) {
  const contenedor = document.getElementById(contenedorId);
  if (!contenedor) return;

  const res = await fetch("productos.json");
  const productos = await res.json();

  contenedor.innerHTML = productos.map((p) => tarjetaProducto(p)).join("");
}

async function cargarDetalleProducto(contenedorId) {
  const contenedor = document.getElementById(contenedorId);
  if (!contenedor) return;

  const id = new URLSearchParams(window.location.search).get("id");
  const res = await fetch("productos.json");
  const productos = await res.json();
  const producto = productos.find((p) => p.id === id);

  if (!producto) {
    contenedor.innerHTML = `<p>No encontramos ese producto. <a href="Catalogo.html">Volver a la tienda</a>.</p>`;
    return;
  }

  document.title = `${producto.titulo} — Editorial Tulipes`;

  const medios = producto.medios ?? [];
  const imagenPrincipal = producto.imagen ?? medios.find((m) => m.tipo === "imagen")?.src ?? "";

  const miniaturas = medios
    .map((m, i) => {
      const miniSrc = m.tipo === "video" ? m.poster : m.src;
      const iconoPlay = m.tipo === "video" ? `<span class="galeria-miniatura-play">▶</span>` : "";
      return `
        <button class="galeria-miniatura${i === 0 ? " activa" : ""}" data-galeria-miniatura data-indice="${i}">
          <img src="${miniSrc}" alt="Vista ${i + 1} de ${producto.titulo}">
          ${iconoPlay}
        </button>
      `;
    })
    .join("");

  contenedor.innerHTML = `
    <section class="libro detalle-libro detalle-producto">
      <div class="detalle-libro-portada">
        <div class="galeria-producto">
          <div class="galeria-principal" data-galeria-principal></div>
          <div class="galeria-miniaturas">${miniaturas}</div>
        </div>
      </div>
      <div class="detalle-libro-info">
        <h1>${producto.titulo}</h1>
        <dl class="ficha-tecnica">
          <div><dt>Diseño</dt><dd>${producto.disenadora}</dd></div>
          <div><dt>Técnica</dt><dd>${producto.tecnica}</dd></div>
        </dl>
        <p class="sinopsis">${producto.descripcion ?? ""}</p>
        <p class="precio">$${producto.precio_fisico}</p>
        <button class="btn-agregar" data-agregar-carrito data-id="${producto.id}" data-titulo="${producto.titulo}" data-imagen="${imagenPrincipal}" data-precio-fisico="${producto.precio_fisico}">Agregar al carrito</button>
      </div>
    </section>

    <div class="zoom-fondo" data-zoom-fondo>
      <button class="zoom-cerrar" data-zoom-cerrar aria-label="Cerrar">&times;</button>
      <img class="zoom-imagen" data-zoom-imagen src="" alt="">
    </div>
  `;

  let indiceActual = 0;
  const galeriaPrincipal = contenedor.querySelector("[data-galeria-principal]");

  function mostrarImagen(i) {
    indiceActual = i;
    const m = medios[i];

    if (m.tipo === "video") {
      galeriaPrincipal.innerHTML = `<video src="${m.src}" poster="${m.poster}" muted loop playsinline controls autoplay></video>`;
      galeriaPrincipal.classList.add("es-video");
    } else {
      galeriaPrincipal.innerHTML = `<img src="${m.src}" alt="${producto.titulo}">`;
      galeriaPrincipal.classList.remove("es-video");
    }

    contenedor.querySelectorAll("[data-galeria-miniatura]").forEach((btn) => {
      btn.classList.toggle("activa", Number(btn.dataset.indice) === i);
    });
  }

  function abrirZoom() {
    const m = medios[indiceActual];
    if (m.tipo !== "imagen") return;
    const zoomImagen = contenedor.querySelector("[data-zoom-imagen]");
    zoomImagen.src = m.src;
    zoomImagen.alt = producto.titulo;
    contenedor.querySelector("[data-zoom-fondo]").classList.add("visible");
  }

  function cerrarZoom() {
    contenedor.querySelector("[data-zoom-fondo]").classList.remove("visible");
  }

  contenedor.querySelectorAll("[data-galeria-miniatura]").forEach((btn) => {
    btn.addEventListener("click", () => mostrarImagen(Number(btn.dataset.indice)));
  });
  galeriaPrincipal.addEventListener("click", abrirZoom);
  contenedor.querySelector("[data-zoom-cerrar]").addEventListener("click", cerrarZoom);
  contenedor.querySelector("[data-zoom-fondo]").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) cerrarZoom();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") cerrarZoom();
  });

  mostrarImagen(0);
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
