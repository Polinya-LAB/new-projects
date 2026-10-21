# Muestras · Laboratorio Polinyà (beta)

Aplicación para registrar la **recepción de muestras** del laboratorio, enlazarlas con los **PLR y QTP de ARAS** e imprimir
sus **etiquetas en la DYMO LabelWriter 550**. Tiene el mismo formato que Control de ensayos, pero es una aplicación aparte
y se puede **instalar en el ordenador** como una aplicación de escritorio.

**Abrir la aplicación:** https://polinya-lab.github.io/new-projects/muestras/

## Qué hace

- **Muestras:** una tarjeta por PLR, con sus QTP en orden de ensayo y las muestras recibidas frente a las piezas pedidas
  (por ejemplo *2 / 6 recibidas*). También hay una vista de lista, filtros por estado y fase, y búsqueda por FLS, PLR, QTP o
  número de serie (también con un lector de QR o de código de barras).
- **Numeración:** cada recepción recibe un número `FLS-xxxxx` y cada unidad física su sufijo `-1, -2…`, también cuando hay
  una sola unidad. Una unidad retirada conserva su número y no se vuelve a usar.
- **Dos columnas:** estado de la muestra (*Recibida, En espera, En ensayo, Ensayada, Almacenada, Devuelta, Desechada*) y
  fase del proyecto (*Feasibility, MSL, ESL, Pilot, Production, N/A*).
- **Varios PLR:** una muestra que repite ensayo se puede enlazar a más de un PLR. También acepta los números antiguos `FLT-xxxx`.
- **Etiquetas DYMO:** tamaños 99012 (89 × 36 mm), 99010 (89 × 28 mm), 11354 (57 × 32 mm) y 11352 (54 × 25 mm), con QR que abre la muestra en
  la app, código de barras Code 128 o sin código. Se imprimen desde el navegador, sin instalar nada más.
- **Import ARAS:** la misma importación que Control de ensayos (búsqueda `a_Lab_Dashboard` exportada a Excel).
- **Idioma:** castellano, con botón ES / EN.

## Instalarla en el ordenador

1. Abre la dirección de arriba con **Chrome** o **Edge**.
2. Pulsa **⤓ Instalar app** en la cabecera, o el icono de instalar que aparece en la barra de direcciones.
3. Queda en el menú Inicio / escritorio con su propio icono y se abre en su propia ventana, sin pestañas del navegador.

Los archivos de la aplicación quedan guardados en el ordenador, así que se abre aunque no haya conexión. Los datos del
laboratorio siempre se leen de GitHub. Para desinstalarla: en la ventana de la app, menú **⋮ → Desinstalar**.

La instalación solo funciona desde la dirección publicada (https), no abriendo `index.html` con doble clic.

## Datos (versión de prueba)

- Con **Connect GitHub** lee los datos reales de `ensayos/ensayos.json` en `lab-data` (ensayos y la colección nueva
  `muestras`), pero **no guarda nada en GitHub**: los cambios se pierden al recargar.
- Sin clave, el aviso rojo ofrece **datos de ejemplo** inventados. Con ellos se puede probar todo, incluida la importación de
  ARAS; los cambios se guardan solo en ese navegador.

Cuando la aplicación pase a `management-tools` guardará en `ensayos/ensayos.json` como las demás. Los pasos están en
[INTEGRACION.md](INTEGRACION.md).

## Archivos

| Archivo | Para qué |
| --- | --- |
| `index.html` | Página de la app (`<body data-app="samples">`) |
| `app.js`, `app.css` | Copia del código de Control de ensayos con el módulo de muestras (en management-tools se comparte) |
| `demo-data.js` | Datos de ejemplo, solo para esta versión de prueba |
| `manifest.webmanifest`, `sw.js`, `icons/` | Lo que la convierte en app instalable y la abre sin conexión |
| `integracion/` | Archivos y parche para incorporarla a `management-tools` |
