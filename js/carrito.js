(function () {
  const CLAVE = "tulipes_carrito";
  const CLAVE_ZONA = "tulipes_zona_envio";

  // Debe coincidir con la tabla del servidor (api/create-checkout-session.js
  // y netlify/functions/create-checkout-session.js) — el servidor nunca confía
  // en un monto de envío que venga del cliente, solo en la zona elegida.
  const ZONAS_ENVIO = {
    gdl: { nombre: "Guadalajara y zona metropolitana", precio: 70 },
    jalisco: { nombre: "Resto de Jalisco", precio: 100 },
    nacional: { nombre: "Resto de México", precio: 150 },
    internacional: { nombre: "Envío internacional", precio: 450 },
  };

  function claveItem(id, formato) {
    return `${id}::${formato}`;
  }

  function leerCarrito() {
    try {
      return JSON.parse(localStorage.getItem(CLAVE)) || [];
    } catch {
      return [];
    }
  }

  function guardarCarrito(items) {
    localStorage.setItem(CLAVE, JSON.stringify(items));
    actualizarContador();
  }

  function leerZona() {
    return localStorage.getItem(CLAVE_ZONA) || "gdl";
  }

  function guardarZona(zona) {
    localStorage.setItem(CLAVE_ZONA, zona);
  }

  function agregarAlCarrito(libro) {
    const items = leerCarrito();
    const clave = claveItem(libro.id, libro.formato);
    const existente = items.find((i) => i.clave === clave);
    if (existente) {
      existente.cantidad += 1;
    } else {
      items.push({ ...libro, clave, cantidad: 1 });
    }
    guardarCarrito(items);
    abrirCarrito();
  }

  function cambiarCantidad(clave, delta) {
    const items = leerCarrito();
    const item = items.find((i) => i.clave === clave);
    if (!item) return;
    item.cantidad += delta;
    const restantes = item.cantidad > 0 ? items : items.filter((i) => i.clave !== clave);
    guardarCarrito(restantes);
    renderizarCarrito();
  }

  function quitarDelCarrito(clave) {
    guardarCarrito(leerCarrito().filter((i) => i.clave !== clave));
    renderizarCarrito();
  }

  function hayFisico(items) {
    return items.some((i) => i.formato === "fisico");
  }

  function montoEnvio(items, zona) {
    if (!hayFisico(items)) return 0;
    return ZONAS_ENVIO[zona]?.precio ?? 0;
  }

  function total(items, zona) {
    const subtotal = items.reduce((suma, i) => suma + i.precio * i.cantidad, 0);
    return subtotal + montoEnvio(items, zona);
  }

  function actualizarContador() {
    const cantidad = leerCarrito().reduce((suma, i) => suma + i.cantidad, 0);
    document.querySelectorAll("[data-carrito-contador]").forEach((el) => {
      el.textContent = cantidad;
      el.style.display = cantidad > 0 ? "flex" : "none";
    });
  }

  function renderizarCarrito() {
    const items = leerCarrito();
    const zona = leerZona();
    const lista = document.querySelector("[data-carrito-lista]");
    const vacio = document.querySelector("[data-carrito-vacio]");
    const totalEl = document.querySelector("[data-carrito-total]");
    const pagarBtn = document.querySelector("[data-carrito-pagar]");
    const envioSeccion = document.querySelector("[data-envio-seccion]");
    if (!lista) return;

    lista.innerHTML = "";
    vacio.style.display = items.length === 0 ? "block" : "none";
    pagarBtn.disabled = items.length === 0;

    items.forEach((item) => {
      const etiquetaFormato = item.formato === "digital" ? "Digital" : "Físico";
      const fila = document.createElement("div");
      fila.className = "carrito-item";
      fila.innerHTML = `
        <div class="carrito-item-info">
          <h5>${item.titulo} <span class="carrito-item-formato">${etiquetaFormato}</span></h5>
          <span>$${item.precio} c/u</span>
        </div>
        <div class="carrito-item-cantidad">
          <button data-restar aria-label="Quitar uno">−</button>
          <span>${item.cantidad}</span>
          <button data-sumar aria-label="Agregar uno">+</button>
        </div>
        <button class="carrito-item-quitar" data-quitar>Quitar</button>
      `;
      fila.querySelector("[data-restar]").addEventListener("click", () => cambiarCantidad(item.clave, -1));
      fila.querySelector("[data-sumar]").addEventListener("click", () => cambiarCantidad(item.clave, 1));
      fila.querySelector("[data-quitar]").addEventListener("click", () => quitarDelCarrito(item.clave));
      lista.appendChild(fila);
    });

    // El cotizador de envío solo se muestra si hay al menos un libro físico en el carrito.
    if (envioSeccion) {
      if (hayFisico(items)) {
        envioSeccion.style.display = "block";
        const select = envioSeccion.querySelector("[data-zona-envio]");
        if (select && select.options.length === 0) {
          Object.entries(ZONAS_ENVIO).forEach(([clave, datos]) => {
            const opt = document.createElement("option");
            opt.value = clave;
            opt.textContent = `${datos.nombre} — $${datos.precio}`;
            select.appendChild(opt);
          });
        }
        if (select) select.value = zona;
        const montoEl = envioSeccion.querySelector("[data-envio-monto]");
        if (montoEl) montoEl.textContent = `$${montoEnvio(items, zona)}`;
      } else {
        envioSeccion.style.display = "none";
      }
    }

    totalEl.textContent = `$${total(items, zona)}`;
  }

  function abrirCarrito() {
    document.querySelector("[data-carrito-panel]")?.classList.add("abierto");
    document.querySelector("[data-carrito-fondo]")?.classList.add("visible");
    renderizarCarrito();
  }

  function cerrarCarrito() {
    document.querySelector("[data-carrito-panel]")?.classList.remove("abierto");
    document.querySelector("[data-carrito-fondo]")?.classList.remove("visible");
  }

  async function pagar() {
    const items = leerCarrito();
    if (items.length === 0) return;
    const zona = leerZona();

    const boton = document.querySelector("[data-carrito-pagar]");
    const textoOriginal = boton.textContent;
    boton.disabled = true;
    boton.textContent = "Procesando…";

    try {
      const payload = {
        items: items.map((i) => ({ id: i.id, cantidad: i.cantidad, formato: i.formato })),
      };
      if (hayFisico(items)) payload.zona = zona;

      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Fallo al crear la sesión de pago");
      const { url } = await res.json();
      window.location.href = url;
    } catch (err) {
      alert("Hubo un problema al iniciar el pago. Intenta de nuevo.");
      boton.disabled = false;
      boton.textContent = textoOriginal;
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    actualizarContador();

    document.addEventListener("click", (e) => {
      const boton = e.target.closest("[data-agregar-carrito]");
      if (!boton) return;

      const tarjeta = boton.closest(".libro");
      const radioMarcado = tarjeta?.querySelector('[data-formato-opciones] input[type="radio"]:checked');
      const formato = radioMarcado ? radioMarcado.value : (boton.dataset.formato || "fisico");
      const precio = radioMarcado
        ? Number(radioMarcado.dataset.precio)
        : Number(boton.dataset.precioFisico);

      agregarAlCarrito({
        id: boton.dataset.id,
        titulo: boton.dataset.titulo,
        precio,
        imagen: boton.dataset.imagen,
        formato,
      });
    });

    document.querySelector("[data-carrito-toggle]")?.addEventListener("click", abrirCarrito);
    document.querySelector("[data-carrito-cerrar]")?.addEventListener("click", cerrarCarrito);
    document.querySelector("[data-carrito-fondo]")?.addEventListener("click", cerrarCarrito);
    document.querySelector("[data-carrito-pagar]")?.addEventListener("click", pagar);
    document.querySelector("[data-zona-envio]")?.addEventListener("change", (e) => {
      guardarZona(e.target.value);
      renderizarCarrito();
    });
  });
})();
