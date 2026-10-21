# Integrar Muestras en management-tools

Muestras se incorpora como **una aplicación más** del portal, igual que Ocupación: su propia página `muestras/`, con el
código compartido de Control de ensayos (`control-ensayos/app.js` y `app.css`) y los mismos datos (`ensayos/ensayos.json`
en `lab-data`, colección nueva `muestras`). Control de ensayos no gana ninguna pestaña: solo muestra en el tablero el chip
*📦 Muestras x/y* de cada PLR y, al abrir un ensayo, sus muestras.

> ⚠️ **Antes de registrar muestras de verdad** tiene que estar publicado el `app.js` nuevo. El actual, al guardar, borra del
> archivo las colecciones que no conoce: si alguien guardara con la versión antigua, se perderían las muestras.
> Como Control de ensayos, Ocupación y Muestras comparten `app.js`, al aplicar el paso 1 quedan todas actualizadas a la vez.

## Pasos

Desde la raíz de `management-tools`, con esta carpeta (`new-projects/muestras/`) a mano:

1. **Código compartido.** Aplica el parche, que añade el módulo de muestras, el modo `data-app="samples"`, la colección
   `muestras` y sus estilos:
   ```
   git apply -p1 ../new-projects/muestras/integracion/control-ensayos.patch
   ```
   El parche ya deja `PREVIEW=false`: la app guarda en GitHub como las demás y no ofrece datos de ejemplo.
   Está hecho sobre el commit `5f0eae9` de management-tools; si `app.js` ha cambiado después y no aplica, hay que rehacerlo.
2. **Página de la app.** Crea `muestras/` con:
   - `integracion/index.html` → `muestras/index.html` (ya apunta a `../control-ensayos/app.js` y `app.css`, sin datos de ejemplo)
   - `integracion/sw.js` → `muestras/sw.js`
   - `manifest.webmanifest` e `icons/` tal cual
3. **Versión de los archivos.** En `control-ensayos/index.html` y `ocupacion/index.html` cambia `?v=…` de `app.js` y `app.css`
   por la misma versión que usa `muestras/index.html` (`20261021`), para que los navegadores carguen el código nuevo.
4. **Portada.** En el `index.html` raíz añade la tarjeta:
   ```html
   <a class="app" href="muestras/">
     <div><h2>Muestras</h2><p>Recepción de muestras, enlace con los PLR de ARAS y etiquetas DYMO.</p></div>
     <span class="go">Abrir →</span>
   </a>
   ```
5. **README.** Añade una sección *Muestras* con el enlace https://polinya-lab.github.io/management-tools/muestras/ y menciona
   la colección `muestras` en la descripción de `ensayos/ensayos.json`.
6. **Comprobar** (con una clave de escritura en `lab-data`):
   - Control de ensayos y Ocupación abren y guardan como antes.
   - En Muestras, recibir una muestra crea un commit «Muestras: …» y la colección `muestras` aparece en `ensayos.json`.
   - Guardar un ensayo desde Control de ensayos no borra las muestras.
   - Chrome o Edge ofrecen **Instalar app** en `…/management-tools/muestras/`.
7. **Retirar la versión de prueba** de `new-projects` (carpeta `muestras/`, tarjeta y fila del README).

## Qué cambia el parche en `app.js`

- `APP` admite `samples`, con las vistas *Muestras* e *Import ARAS*; `APP_NAME` = «Muestras» para los commits.
- `COL.samples='muestras'` y `DATA_COLS` incluye `muestras`, de modo que ninguna de las tres apps la borra al guardar.
- Módulo de muestras (`smp…`): vista por PLR y lista, recepción, unidades con sufijo, estados, fases, etiquetas DYMO, QR que
  abre `muestras/#m=FLS-xxxxx-n`.
- Chip de muestras en el tablero y bloque de muestras en el editor de ensayos de Control de ensayos.
- Bloque `PREVIEW` / `DEMO` (desactivado con `PREVIEW=false`); se puede borrar más adelante.
