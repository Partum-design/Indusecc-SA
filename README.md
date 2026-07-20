# INDUSECC OS

Aplicación web estática para auditorías ISO, con autenticación, datos y Storage en Supabase y funciones de servidor en Vercel.

## Estructura

```text
/
├── login.html / login.js / login.css   Acceso y autenticación
├── index.html                          Plataforma de auditorías
├── admin.html                          Administración de usuarios
├── assets/
│   ├── js/supabase-config.js           URL y anon key públicas del cliente
│   ├── js/app.js                       Estado y workspace de auditorías
│   ├── js/admin.js                     Panel administrativo
│   └── js/iso-library.js               Catálogo ISO
├── api/
│   ├── admin-users.js                  Operaciones privilegiadas de usuarios
│   └── nora.js                          Proxy server-side para Gemini
├── supabase/migrations/                Esquema, RLS, Storage y funciones
└── vercel.json                          Rutas públicas y rewrites
```

## Supabase conectado

El cliente apunta al proyecto `fexfgdttbowtjtppkmqj`:

`https://fexfgdttbowtjtppkmqj.supabase.co`

Las migraciones `001` a `011` ya quedaron aplicadas en ese proyecto. El repositorio conserva el historial para reproducir y revisar la configuración.

## Variables de Vercel

Copia `.env.example` y agrega estas variables en el proyecto correcto de Vercel:

```text
SUPABASE_URL=https://fexfgdttbowtjtppkmqj.supabase.co
SUPABASE_SERVICE_ROLE_KEY=la_service_role_key_del_mismo_proyecto
GOOGLE_API_KEY=opcional_para_NORA
GEMINI_MODEL=gemini-2.5-flash-lite
```

`SUPABASE_SERVICE_ROLE_KEY` es privada. No debe aparecer en `assets/js/`, HTML, el navegador ni Git.

El login del navegador usa `url + anonKey` de `assets/js/supabase-config.js`. La anon key es pública y está protegida por RLS; las variables de Vercel no se inyectan automáticamente en HTML estático.

## Primer administrador

Después de crear la primera cuenta en Supabase Auth, actívala desde SQL Editor:

```sql
update public.profiles
set role = 'admin', active = true
where email = 'correo-del-admin@indusecc.com';
```

Después de guardar variables en Vercel, crea un nuevo deployment para que las funciones las reciban.
