(function () {
  const CLAVE = "tulipes_carrito";

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

  function agregarAlCarrito(libro) {
    const items = leerCarrito();
    const existente = items.find((i) => i.id === libro.id);
    if (existente) {
      existente.cantidad += 1;
    } else {
      items.push({ ...libro, cantidad: 1 });
    }
    guardarCarrito(items);
    abrirCarrito();
  }

  function cambiarCantidad(id, delta) {
    const items = leerCarrito();
    const item = items.find((i) => i.id === id);
    if (!item) return;
    item.cantidad += delta;
    const restantes = item.cantidad > 0 ? items : items.filter((i) => i.id !== id);
    guardarCarrito(restantes);
    renderizarCarrito();
  }

  function quitarDelCarrito(id) {
    guardarCarrito(leerCarrito().filter((i) => i.id !== id));
    renderizarCarrito();
  }

  function total(items) {
    return items.reduce((suma, i) => suma + i.precio * i.cantidad, 0);
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
    const lista = document.querySelector("[data-carrito-lista]");
    const vacio = document.querySelector("[data-carrito-vacio]");
    const totalEl = document.querySelector("[data-carrito-total]");
    const pagarBtn = document.querySelector("[data-carrito-pagar]");
    if (!lista) return;

    lista.innerHTML = "";
    vacio.style.display = items.length === 0 ? "block" : "none";
    pagarBtn.disabled = items.length === 0;

    items.forEach((item) => {
      const fila = document.createElement("div");
      fila.className = "carrito-item";
      fila.innerHTML = `
        <div class="carrito-item-info">
          <h5>${item.titulo}</h5>
          <span>$${item.precio} c/u</span>
        </div>
        <div class="carrito-item-cantidad">
          <button data-restar aria-label="Quitar uno">−</button>
          <span>${item.cantidad}</span>
          <button data-sumar aria-label="Agregar uno">+</button>
        </div>
        <button class="carrito-item-quitar" data-quitar>Quitar</button>
      `;
      fila.querySelector("[data-restar]").addEventListener("click", () => cambiarCantidad(item.id, -1));
      fila.querySelector("[data-sumar]").addEventListener("click", () => cambiarCantidad(item.id, 1));
      fila.querySelector("[data-quitar]").addEventListener("click", () => quitarDelCarrito(item.id));
      lista.appendChild(fila);
    });

    totalEl.textContent = `$${total(items)}`;
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

    const boton = document.querySelector("[data-carrito-pagar]");
    const textoOriginal = boton.textContent;
    boton.disabled = true;
    boton.textContent = "Procesando…";

    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ id: i.id, cantidad: i.cantidad })),
        }),
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
      agregarAlCarrito({
        id: boton.dataset.id,
        titulo: boton.dataset.titulo,
        precio: Number(boton.dataset.precio),
        imagen: boton.dataset.imagen,
      });
    });

    document.querySelector("[data-carrito-toggle]")?.addEventListener("click", abrirCarrito);
    document.querySelector("[data-carrito-cerrar]")?.addEventListener("click", cerrarCarrito);
    document.querySelector("[data-carrito-fondo]")?.addEventListener("click", cerrarCarrito);
    document.querySelector("[data-carrito-pagar]")?.addEventListener("click", pagar);
  });
})();
