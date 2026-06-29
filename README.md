# Venezuela Unida — Guía de instalación

Sigue estos pasos en orden. No necesitas saber programar.

---

## PASO 1 — Crear la base de datos en Supabase

1. Ve a [supabase.com](https://supabase.com) e inicia sesión (o crea cuenta gratis)
2. Haz clic en **"New project"**
   - Nombre del proyecto: `venezuelaunida`
   - Contraseña de base de datos: elige una y guárdala (no la necesitarás después)
   - Región: elige **US East** o **EU West** (la más cercana)
3. Espera ~2 minutos a que el proyecto se cree
4. En el menú lateral ve a **SQL Editor**
5. Haz clic en **"New query"**
6. Abre el archivo `supabase_setup.sql` de este proyecto, copia TODO el contenido y pégalo en el editor
7. Haz clic en **"Run"** (botón verde)
8. Deberías ver: `Success. No rows returned`

### Obtener las credenciales de Supabase

1. En el menú lateral ve a **Settings → API**
2. Copia estos dos valores (los necesitas para el siguiente paso):
   - **Project URL** → algo como `https://abcdefgh.supabase.co`
   - **anon public key** → una cadena larga que empieza por `eyJ...`

---

## PASO 2 — Configurar el proyecto con tus credenciales

1. Abre el archivo `config.js`
2. Reemplaza los dos valores:

```js
const SUPABASE_URL = 'https://TU-PROYECTO.supabase.co';   // ← tu Project URL
const SUPABASE_ANON_KEY = 'eyJ...';                        // ← tu anon public key
```

3. Guarda el archivo

---

## PASO 3 — Subir el proyecto a GitHub

1. Ve a [github.com](https://github.com) e inicia sesión
2. Haz clic en **"New repository"** (botón verde o el ícono +)
   - Nombre: `venezuelaunida`
   - Visibilidad: **Public**
   - No marques ninguna opción extra
3. Haz clic en **"Create repository"**
4. Verás una página con instrucciones. Busca la sección **"uploading an existing file"** y haz clic ahí
5. Arrastra todos los archivos del proyecto a la zona de carga:
   - `index.html`
   - `admin.html`
   - `style.css`
   - `app.js`
   - `admin.js`
   - `config.js`
   - *(no subas `supabase_setup.sql` ni este README si no quieres)*
6. Haz clic en **"Commit changes"**

---

## PASO 4 — Publicar en Vercel

1. Ve a [vercel.com](https://vercel.com) e inicia sesión con tu cuenta de GitHub
2. Haz clic en **"Add New Project"**
3. Busca el repositorio `venezuelaunida` y haz clic en **"Import"**
4. En la configuración no cambies nada — Vercel lo detecta automáticamente
5. Haz clic en **"Deploy"**
6. En ~1 minuto verás: **"Congratulations!"**
7. Tu URL será algo como: `venezuelaunida.vercel.app`

---

## PASO 5 — Primer acceso al panel admin

1. Ve a `TU-URL.vercel.app/admin.html`
2. Usuario: `adriana`
3. Contraseña: `admin2024`
4. **Cambia la contraseña inmediatamente** desde la pestaña "Admins" → elimínate y vuelve a crearte con una contraseña nueva

---

## Cómo editar textos de la web

Todos los textos editables están en `index.html`. Puedes cambiarlos directamente en GitHub:

1. Ve a tu repositorio en GitHub
2. Haz clic en `index.html`
3. Haz clic en el ícono del lápiz (✏️ Edit this file)
4. Edita el texto que quieras
5. Haz clic en **"Commit changes"**
6. Vercel actualiza la web automáticamente en ~30 segundos

### Textos principales que puedes cambiar

| Qué es | Dónde buscarlo en index.html |
|---|---|
| Título de la pestaña del navegador | `<title>Venezuela Unida — ...</title>` |
| Nombre de la web (logo) | `Venezuela <span>Unida</span>` |
| Título del hero | `<h1>Encuentra o agrega...` |
| Descripción del hero | El `<p>` debajo del h1 |
| Texto del footer | Al final del archivo |

---

## Cómo actualizar la web después de cambios en los archivos

Si editas algún archivo localmente (no en GitHub):
1. Ve a tu repositorio en GitHub
2. Haz clic en el archivo que quieres actualizar
3. Haz clic en ✏️ y pega el nuevo contenido
4. Commit → Vercel redeploya automáticamente

---

## Cambiar el subdominio de Vercel

1. Ve a [vercel.com/dashboard](https://vercel.com/dashboard)
2. Entra a tu proyecto
3. **Settings → Domains**
4. Ahí puedes cambiar el subdominio gratuito o añadir un dominio propio

---

## Estructura de archivos

```
venezuelaunida/
├── index.html        → Página pública (causas, filtros, formulario)
├── admin.html        → Panel de administración
├── style.css         → Todos los estilos visuales
├── app.js            → Lógica de la página pública
├── admin.js          → Lógica del panel admin
├── config.js         → Credenciales de Supabase ← editar esto primero
└── supabase_setup.sql → SQL para crear las tablas (solo se usa una vez)
```

---

## Preguntas frecuentes

**¿Puedo usar esto con un dominio propio como venezuelaunida.org?**
Sí. Compra el dominio (Namecheap, Google Domains, etc.), luego en Vercel → Settings → Domains → Add Domain. Ellos te dan las instrucciones exactas para apuntarlo.

**¿Qué pasa si se me olvida la contraseña de un admin?**
Entra al SQL Editor de Supabase y ejecuta:
```sql
update admins set password = 'nueva_contraseña' where username = 'adriana';
```

**¿Cuántos casos puede manejar?**
El plan gratuito de Supabase soporta hasta 500MB de base de datos y 2GB de transferencia mensual. Para esta plataforma eso equivale a decenas de miles de casos sin problema.

**¿Cómo agrego una nueva categoría?**
En `app.js` y `admin.js` busca el array `CATS` al inicio del archivo y agrega una nueva línea. También añade el estilo correspondiente en `style.css` buscando `.tag-vivienda` como referencia.
