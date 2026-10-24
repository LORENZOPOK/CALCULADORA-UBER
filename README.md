# CalculaTuRuta

Web app (PWA) para conductores de Uber, DiDi, Cabify e InDrive en Chile. Calcula tu **ganancia neta real** descontando bencina, desgaste del auto, arriendo y comisión de la app.

- Funciona **sin internet** una vez abierta (service worker).
- Se instala en la pantalla de inicio del iPhone con su propio ícono.
- Todos los datos se guardan **solo en tu teléfono** (localStorage). No hay servidor ni cuentas.
- HTML, CSS y JavaScript puros, sin frameworks ni dependencias.

## Pantallas

| Pestaña | Qué hace |
|---|---|
| **Inicio** | Ganancia neta, $/km, $/hora y km de hoy, esta semana y este mes. Barra de progreso hacia tu meta diaria. |
| **Registrar** | Asistente en 4 pasos: Jornada → Auto → Comisión → Resultado. Recuerda los datos del auto, la bencina y la comisión de la última vez. |
| **¿Conviene?** | Ingresa precio y km, y te dice *Conviene*, *Justo* o *No conviene*. Muestra tu punto de equilibrio por km y cuántos km necesitas al día para tu meta. |
| **Historial** | Lista de jornadas (tocar para ver, editar o borrar) y resumen semanal/mensual con gráfico de barras. |
| **Ajustes** (⚙️) | Valores por defecto, meta diaria, respaldo CSV (exportar/importar) y borrar todo. |

## Cálculos

- Litros = km ÷ rendimiento
- Gasto en bencina = litros × precio por litro
- Desgaste = km × desgaste por km
- Comisión = generado × % (solo si el monto no venía con la comisión descontada)
- Ganancia neta = generado − bencina − desgaste − arriendo − comisión
- $/km neto = ganancia neta ÷ km · $/hora neto = ganancia neta ÷ horas
- Costo por km (punto de equilibrio) = (precio bencina ÷ rendimiento) + desgaste por km
- Punto de equilibrio de un viaje = costo por km × (km hasta recoger + km del viaje)
- Km diarios para la meta = (meta + arriendo diario) ÷ (ingreso promedio por km del historial − costo por km)
  - El ingreso promedio por km es lo generado (menos comisión) ÷ km de todas tus jornadas.

**Veredicto de “¿Conviene?”**: *No conviene* si la ganancia del viaje es 0 o negativa; *Justo* si cubre tus costos pero gana menos que el margen configurado en Ajustes (40% por defecto); *Conviene* si lo supera.

## Archivos

```
index.html      Estructura de todas las pantallas
styles.css      Diseño (tema oscuro, acento verde)
app.js          Lógica, cálculos y almacenamiento
sw.js           Service worker (modo sin internet)
manifest.json   Datos para instalar la app
icons/          Íconos (SVG + PNG 180, 192, 512 y maskable)
```

## Publicar con GitHub Pages (gratis)

1. Crea una cuenta en <https://github.com> si no tienes.
2. Crea un repositorio nuevo: botón **New** → nombre, por ejemplo `calculaturuta` → **Public** → **Create repository**.
3. Sube los archivos: en el repositorio, **Add file → Upload files**, arrastra **todo el contenido** de esta carpeta (incluida la carpeta `icons`) y presiona **Commit changes**.
   `index.html` debe quedar en la raíz del repositorio, no dentro de otra carpeta.

   O con la terminal:
   ```bash
   cd calculaturuta
   git init
   git add .
   git commit -m "CalculaTuRuta"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/calculaturuta.git
   git push -u origin main
   ```
4. Ve a **Settings → Pages**. En *Build and deployment* elige **Source: Deploy from a branch**, rama **main** y carpeta **/ (root)**. Guarda.
5. Espera 1–2 minutos. Tu app quedará en:
   `https://TU_USUARIO.github.io/calculaturuta/`

GitHub Pages usa HTTPS, que es obligatorio para que funcione el service worker.

### Instalar en el iPhone

1. Abre la dirección en **Safari** (no en Chrome ni dentro de otra app).
2. Toca el botón **Compartir** (cuadrado con flecha hacia arriba).
3. Elige **Agregar a pantalla de inicio** → **Agregar**.
4. Ábrela una vez con internet; desde ahí funciona sin conexión.

### Publicar una actualización

Si cambias algún archivo, sube el número de versión en `sw.js`
(`const CACHE = 'calculaturuta-v1'` → `'calculaturuta-v2'`) y vuelve a subir los archivos. Los teléfonos descargarán la nueva versión la próxima vez que abran la app con internet (a veces hay que cerrarla y abrirla dos veces).

## Respaldo de datos

Los datos viven solo en el teléfono. Si borras la app de la pantalla de inicio o los datos de Safari, se pierden. Usa **Ajustes → Exportar a CSV** de vez en cuando y guarda el archivo en *Archivos*, iCloud o envíatelo por correo. Para recuperarlos: **Ajustes → Importar desde CSV**.

El CSV usa punto y coma (`;`) y coma decimal, para que se abra bien en Excel en español. Incluye una sección `AJUSTES` al final con tus valores por defecto.

## Probar en el computador

El service worker necesita un servidor (no funciona abriendo el archivo con doble clic):

```bash
cd calculaturuta
python3 -m http.server 8000
# abre http://localhost:8000
```
