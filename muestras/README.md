# Muestras · Laboratorio Polinyà (beta)

Aplicación para registrar la **recepción de muestras** del laboratorio, enlazarlas con los **PLR y QTP de ARAS** e imprimir
sus **etiquetas en la DYMO LabelWriter 550**. Tiene el formato de Control de ensayos en una aplicación aparte, que puedes
**instalar en el ordenador** como una aplicación de escritorio.

**Abrir la aplicación:** https://polinya-lab.github.io/new-projects/muestras/

## Qué hace

- **Muestras:** una tarjeta por PLR, con sus QTP en orden de ensayo y las muestras recibidas frente a las piezas pedidas
  (por ejemplo *2 / 6 recibidas*). Tiene además una vista de lista, filtros por estado y fase, y búsqueda por FLS, PLR, QTP o
  número de serie, con teclado o con un lector de QR o de código de barras.
- **Numeración:** la app da a cada recepción un número `FLS-xxxxx` y a cada unidad física su sufijo `-1, -2…`, aunque haya
  una sola unidad. Una unidad retirada conserva su número y la app no lo reutiliza.
- **Dos columnas:** estado de la muestra (*Recibida, En espera, En ensayo, Ensayada, Almacenada, Devuelta, Desechada*) y
  fase del proyecto (*Feasibility, MSL, ESL, Pilot, Production, N/A*).
- **Varios PLR:** puedes enlazar a más de un PLR una muestra que repite ensayo. La app acepta los números antiguos `FLT-xxxx`.
- **Etiquetas DYMO:** tamaños 99012 (89 × 36 mm), 99010 (89 × 28 mm), 11354 (57 × 32 mm) y 11352 (54 × 25 mm), con QR que abre la muestra en
  la app, código de barras Code 128 o sin código. Las imprimes desde el navegador, sin instalar nada más.
- **Import ARAS:** la misma importación que Control de ensayos (búsqueda `a_Lab_Dashboard` exportada a Excel).
- **Idioma:** castellano, con botón ES / EN.

## Instalarla en el ordenador

1. Abre la dirección de arriba con **Chrome** o **Edge**.
2. Pulsa **⤓ Instalar app** en la cabecera, o el icono de instalar que aparece en la barra de direcciones.
3. La app aparece en el menú Inicio o en el escritorio con su icono y se abre en una ventana propia, sin pestañas del navegador.

El ordenador guarda los archivos de la aplicación, así que se abre sin conexión. Los datos del laboratorio los lee de
GitHub. Para desinstalarla: en la ventana de la app, menú **⋮ → Desinstalar**.

Para instalarla, ábrela desde la dirección publicada (https). Con doble clic en `index.html` no se instala.

## Datos (versión de prueba)

- Con **Connect GitHub** lee los datos reales de `ensayos/ensayos.json` en `lab-data` (ensayos y la colección nueva
  `muestras`) y **no guarda nada en GitHub**: pierdes los cambios al recargar.
- Sin clave, el aviso rojo ofrece **datos de ejemplo** inventados. Con ellos pruebas todo, incluida la importación de
  ARAS; los cambios quedan en ese navegador.

Cuando la aplicación pase a `management-tools`, guardará en `ensayos/ensayos.json` como las demás. Los pasos están en
[INTEGRACION.md](INTEGRACION.md).

## Archivos

| Archivo | Para qué |
| --- | --- |
| `index.html` | Página de la app (`<body data-app="samples">`) |
| `app.js`, `app.css` | Copia del código de Control de ensayos con el módulo de muestras (en management-tools se comparte) |
| `demo-data.js` | Datos de ejemplo, solo para esta versión de prueba |
| `manifest.webmanifest`, `sw.js`, `icons/` | Lo que la convierte en app instalable y la abre sin conexión |
| `integracion/` | Archivos y parche para incorporarla a `management-tools` |
