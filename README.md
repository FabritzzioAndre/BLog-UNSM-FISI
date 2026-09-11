# Blogdetareas · UNSM FISI

Blog académico de la **Facultad de Ingeniería de Sistemas e Informática** de la
**Universidad Nacional de San Martín – Tarapoto (UNSM)**. Diseño inspirado en la
plantilla *Maya* de BTemplates, adaptado a los colores oficiales de la universidad (verde y blanco).

- **3 unidades**: Unidad 1 (4 semanas), Unidad 2 (4 semanas), Unidad 3 (6 semanas).
- Los visitantes leen los trabajos semanales y comentan (iniciando sesión con correo).
- El administrador sube sus trabajos semanales desde el **Panel** (`admin.html`).

## Tecnologías

| Capa            | Tecnología                                                        |
|-----------------|-------------------------------------------------------------------|
| Frontend        | HTML5 + CSS3 + JavaScript (Vanilla)                               |
| Framework CSS   | Bootstrap 5 (CDN) + Bootstrap Icons                                |
| Base de datos   | Supabase (PostgreSQL) con Row Level Security                      |
| Autenticación   | Supabase Auth (correo + contraseña)                               |
| Almacenamiento  | Supabase Storage (bucket público `trabajos`)                      |
| Despliegue      | GitHub Actions → GitHub Pages (sitio estático, gratis)            |

## Estructura

```
├── index.html          # Inicio: unidades y semanas
├── trabajo.html        # Vista de un trabajo semanal + comentarios
├── admin.html          # Panel de administración (subir/editar trabajos)
├── css/style.css       # Estilos (tema Maya, colores UNSM)
├── js/
│   ├── config.js       # URL y key pública de Supabase + unidades del curso
│   ├── common.js       # Sesión, login y utilidades compartidas
│   ├── app.js          # Lógica del inicio
│   ├── trabajo.js      # Lógica de la entrada semanal y comentarios
│   └── admin.js        # Lógica del panel
├── sql/schema.sql      # Script SQL: tablas, RLS, trigger y storage
├── img/escudo.png      # Escudo de la UNSM
└── .github/workflows/deploy.yml  # Publicación automática en GitHub Pages
```

## Configuración (una sola vez)

### 1. Crear las tablas en Supabase

1. Entra a [Supabase Dashboard](https://supabase.com) → abre tu proyecto.
2. Ve a **SQL Editor** → **New query**.
3. Copia todo el contenido de [`sql/schema.sql`](sql/schema.sql) y pégalo.
4. Haz clic en **Run**. Debe terminar sin errores.

> Esto crea las tablas `profiles`, `posts` y `comments`, activa la seguridad (RLS),
> permite que **el primer usuario registrado sea el administrador** y configura el
> bucket público `trabajos`.

> Si tu proyecto es nuevo y la API no responde, activa el **Data API**:
> dashboard → **Integrations → Data API → Settings** → añade el esquema `public`
> (y marca "Default privileges for new entities").

### 2. Publicar la página en GitHub

El repositorio ya incluye el flujo de **GitHub Actions** (`deploy.yml`).
Al hacer el primer `push` a la rama `main`, la página se despliega sola en:
`https://<tu-usuario>.github.io/BLog-UNSM-FISI/`

Si no aparece publicada en unos minutos, actívala manualmente:
**Settings → Pages → Build and deployment → Source: "GitHub Actions"**.

### 3. Subir tu primer trabajo

1. Abre el blog → clic en **Iniciar sesión** → **Regístrate** (nombre, correo y contraseña).
   Al ser el primer usuario registrado, te conviertes automáticamente en **administrador**.
2. Entra a **Panel** (aparece en la barra junto a tu nombre) → selecciona unidad y semana.
3. Escribe título, resumen, contenido y adjunta un archivo (PDF/Word/imagen) → **Publicar trabajo**.

Para que otra persona pueda administrar, cambia su rol en Supabase:
**Table Editor → profiles** → actualiza el campo `role` a `admin`.

## Seguridad

- La clave publica (`sb_publishable_...`) es la única incluida en el código del cliente.
- La clave secreta (`sb_secret_...`) **nunca** va en el sitio; solo se usa para
  creado de tablas/bucket y debe guardarse fuera del código.
- Row Level Security: cualquiera puede leer y comentar; solo el admin publica.

## Cambiar logo y colores

- Reemplaza `img/escudo.png` por el escudo oficial (PNG con transparencia).
- Ajusta las variables `--verde`, `--verde-oscuro`, `--dorado` en `css/style.css`.