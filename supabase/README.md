# Backend Supabase — Indusecc OS

Proyecto: `tyxugmbnpszilcgguwlw` (https://tyxugmbnpszilcgguwlw.supabase.co)

## Esquema

- `profiles` — 1:1 con `auth.users`. Guarda `role` (`admin` | `auditor` | `viewer`) y `active`.
  Todo usuario nuevo entra con `role = viewer`, `active = false` (alta automática vía trigger).
- `audits` — cabecera de cada auditoría (antes `state.project` en localStorage).
- `audit_findings` — un renglón por cláusula ISO evaluada.
- `audit_evidence` — metadatos de archivos; el binario vive en el bucket `audit-evidence`.
- `audit_signatures` — metadato de la firma; el binario vive en el bucket `audit-signatures`.
- `nora_conversations` — historial del chat con NORA por auditoría.
- `audit_activity_log` — bitácora de solo-inserción (quién hizo qué y cuándo).

Todo tiene Row Level Security activo. Nadie borra físicamente auditorías o hallazgos salvo `admin`
(se prefiere `deleted_at` para borrado lógico).

`audits` también incluye `history` (jsonb, control de cambios del documento), `auditor_name`
(texto libre para el reporte) y `auditor_id` (usuario de Supabase asignado, para RLS).

## Frontend ya conectado

`login.html`/`login.js` y `index.html`/`assets/js/app.js` ya usan Supabase Auth real
(`signInWithPassword`) y las tablas de arriba en vez de `localStorage`:

- Ya no existe usuario/contraseña fijos en el código.
- Un usuario nuevo entra inactivo; hasta que un `admin` lo activa no puede pasar del login.
- Cada cambio en el formulario (proyecto, hallazgos, control de cambios) se sincroniza a `audits`
  y `audit_findings` con un pequeño debounce (~700ms).
- Adjuntar/quitar evidencia sube o borra el archivo real en el bucket `audit-evidence` y registra
  el metadato en `audit_evidence`; hay botón de "Descargar" que genera una URL firmada temporal.
- La firma (dibujada o subida) se sube como PNG a `audit-signatures`.
- El botón "Limpiar proyecto" ya no borra nada: archiva la auditoría actual (`status = completed`)
  y abre una nueva en blanco para el mismo estándar.
- Los `viewer` ven todo pero tienen los campos deshabilitados en el cliente (y bloqueados también
  por RLS del lado del servidor, por si acaso).

## Cómo dar de alta al primer administrador

1. La persona se registra normalmente (Supabase Auth: email + contraseña, o el método que se
   habilite). Queda creada en `profiles` con `role = viewer`, `active = false`.
2. Con acceso directo a la base (SQL editor de Supabase o `service_role` key, nunca desde el
   cliente), promover manualmente a esa primera cuenta:

   ```sql
   update public.profiles
   set role = 'admin', active = true
   where email = 'correo-del-admin@indusecc.com';
   ```

3. De ahí en adelante, ese admin activa y asigna rol a los demás usuarios desde la app
   (usando su sesión, protegido por la política `profiles_admin_all`).

## Roles

| Rol      | Puede |
|----------|-------|
| `admin`  | Todo: gestionar usuarios/roles, ver y editar cualquier auditoría, borrar (con rastro). |
| `auditor`| Crear auditorías propias, editar hallazgos/evidencia/firma de las auditorías que creó o le asignaron. |
| `viewer` | Solo lectura de todas las auditorías (pensado para gerencia / revisión). |

Si se necesitan más roles o permisos distintos (ej. "viewer" limitado a su propia sucursal),
son cambios de una sola política RLS en `003_rls_policies.sql`.

## Cifrado

- **En tránsito:** TLS obligatorio en todos los endpoints de Supabase.
- **En reposo:** Supabase cifra el volumen de la base de datos y de Storage con AES-256 a nivel
  de infraestructura.
- **Contraseñas:** las gestiona Supabase Auth (hash, nunca texto plano); esta base de datos nunca
  almacena contraseñas.
- **Extensión `pgcrypto`** ya está habilitada por si se requiere cifrado a nivel de columna para
  algún campo especialmente sensible en el futuro (`pgp_sym_encrypt` / `pgp_sym_decrypt`).

## Respaldos (manejo ético de datos)

1. Activar **Point-in-Time Recovery (PITR)** o los backups diarios automáticos desde
   *Project Settings → Backups* en el panel de Supabase (según el plan contratado).
2. No hay borrado silencioso: `audits` y `audit_findings` solo se eliminan vía `admin`, y toda
   acción relevante debe registrarse en `audit_activity_log` (tabla append-only, sin política de
   `update`/`delete`).
3. Antes de borrar información real de una auditoría, preferir marcar `deleted_at` en vez de
   `delete`, para poder auditar o restaurar si hace falta.
4. Los archivos de evidencia y firmas están en buckets **privados** (no públicos): solo se acceden
   con URLs firmadas de corta duración generadas por el backend/cliente autenticado, nunca por URL
   directa pública.

## Cliente

`assets/js/supabase-config.js` expone `window.SUPABASE_CONFIG` (`url` + `anonKey`, ambos públicos
por diseño). La anon key nunca debe reemplazarse por la `service_role` key en código de cliente.
