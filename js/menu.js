document.addEventListener("DOMContentLoaded", () => {
  const boton = document.querySelector(".menu-toggle");
  const nav = document.querySelector("header nav");
  if (!boton || !nav) return;

  boton.addEventListener("click", () => {
    const abierta = nav.classList.toggle("abierta");
    boton.setAttribute("aria-expanded", abierta ? "true" : "false");
  });
});
