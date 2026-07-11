# Editorial Tulipes — web-tulipes

Sitio y tienda de Editorial Tulipes. Desplegado en Vercel (`www.tulipeseditorial.com`), con una copia en paridad de las funciones serverless para Netlify.

## Estructura

```
paginas/     Las páginas del sitio (una por URL: autores, contacto, revista, etc.)
             Vercel las sirve en la raíz del sitio vía "rewrites" en vercel.json,
             así que aunque el archivo viva en paginas/autores.html, la URL
             pública sigue siendo tulipeseditorial.com/autores.
textos/      Los artículos de la revista (una página por texto).
data/        Los catálogos: libros.json, productos.json, revista.json.
             Los lee tanto el navegador (fetch) como las funciones serverless
             (require), son la fuente de verdad del contenido de la tienda
             y la revista.
assets/      Imágenes, videos y archivos digitales (PDF/ePub) del catálogo.
css/         Una sola hoja de estilos para todo el sitio.
js/          Scripts del navegador: script.js (renderizado de libros/
             productos/artículos), carrito.js, menu.js, contacto.js.
lib/         Lógica compartida por las funciones serverless: checkout,
             entrega de libros digitales, inventario, envío de correo de
             contacto. La usan tanto api/ (Vercel) como netlify/functions/.
api/         Funciones serverless de Vercel (checkout, webhook de Stripe,
             inventario, contacto).
netlify/functions/   Las mismas funciones, en paridad, para Netlify.
```

## Inventario y pagos

El stock físico (libros y totes) se controla en Redis (Vercel KV / Upstash),
no en `data/libros.json` — ver `lib/inventario.js`. El checkout valida stock
disponible antes de crear la sesión de Stripe, y solo descuenta cuando el
pago se confirma (`checkout.session.completed`), nunca al iniciar el pago.

## Desarrollo local

No hay build step — es HTML/CSS/JS estático más funciones serverless. Para
probar localmente, levantar cualquier servidor estático desde la raíz del
proyecto sirve para las páginas; las rutas limpias (`/autores` en vez de
`/paginas/autores.html`) solo las resuelve Vercel/Netlify en producción vía
sus respectivos rewrites (`vercel.json` / `netlify.toml`).
