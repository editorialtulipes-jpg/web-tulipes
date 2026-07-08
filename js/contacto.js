document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".form-contacto");
  if (!form) return;

  const estado = document.createElement("p");
  estado.className = "form-contacto-estado";
  form.appendChild(estado);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const boton = form.querySelector("button[type=submit]");
    const textoOriginal = boton.textContent;
    boton.disabled = true;
    boton.textContent = "Enviando…";
    estado.textContent = "";
    estado.classList.remove("form-contacto-exito", "form-contacto-error");

    const datos = {
      nombre: form.nombre.value,
      email: form.email.value,
      mensaje: form.mensaje.value,
    };

    try {
      const res = await fetch("/api/contacto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
      });
      if (!res.ok) throw new Error("Fallo al enviar el mensaje");

      estado.textContent = "¡Gracias! Tu mensaje fue enviado, te responderemos pronto.";
      estado.classList.add("form-contacto-exito");
      form.reset();
    } catch (err) {
      estado.textContent = "Hubo un problema al enviar tu mensaje. Intenta de nuevo o escríbenos directo a info@tulipeseditorial.com.";
      estado.classList.add("form-contacto-error");
    } finally {
      boton.disabled = false;
      boton.textContent = textoOriginal;
    }
  });
});
