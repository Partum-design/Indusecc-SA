# Backend Supabase — Indusecc OS

Proyecto: `fexfgdttbowtjtppkmqj` (https://fexfgdttbowtjtppkmqj.supabase.co)

## URLs de autenticación

Configura en Supabase → Authentication → URL Configuration:

- Site URL: `https://indusecc-auditorias.vercel.app`
- Redirect URLs: `https://indusecc-auditorias.vercel.app/**` y `http://localhost:3000/**`

Para trabajar en local, inicia Vercel con `vercel dev` para que exista el puerto 3000.

## Estado de la integración administrativa

La migración `009_admin_observability.sql` agrega `last_login_at`, `last_seen_at` y la función segura
`touch_presence()`. La interfaz usa esos datos para mostrar personas conectadas, último acceso y
exportaciones PDF registradas en `audit_activity_log`.

Para que el panel pueda crear y eliminar usuarios de Supabase Auth, configura en Vercel únicamente
como variable privada del servidor:

```text
SUPABASE_SERVICE_ROLE_KEY=<service_role del proyecto fexfgdttbowtjtppkmqj>
```

Nunca pongas esa llave en `assets/js/supabase-config.js`, en el navegador o en Git. La ruta
`/api/admin-users` rechaza las operaciones con `503` mientras esa variable no exista.

## Esquema

- `profiles` — 1:1 con `auth.users`. Guarda `role` (`admin` | `auditor` | `viewer`) y `active`.
  Todo usuario nuevo entra con `role = viewer`, `active = false` (alta automática vía trigger).
- `audits` — cabecera de cada auditoría (antes `state.project` en localStorage).
- `audit_findings` — un renglón por cláusula ISO evaluada.
- `audit_evidence` — metadatos de archivos; el binario vive en el bucket `audit-evidence`.
- `audit_signatures` — metadato de la firma; el binario vive en el bucket `audit-signatures`.
- `nora_conversations` — historial del chat con NORA por auditoría.
- `audit_activity_log` — bitácora de solo-inserción (quién hizo qué y cuándo).
- `login_events` — bitácora de conexiones (usuario, IP, dispositivo, fecha). Solo la escribe
  `/api/log-login` con la `service_role` key; nadie puede insertarla desde el navegador.
- `audit_exports` — bóveda: metadato de cada PDF exportado (quién, cuándo, norma, tamaño). El
  binario vive en el bucket privado `audit-exports`.
- `organizations` — empresas/clientes. Permite agrupar personas por empresa desde el panel
  administrativo (`/administracion` → Empresas) y revocar el acceso de una organización completa
  de un solo movimiento (desactiva en bloque los `profiles` con ese `organization_id`).

`profiles` también incluye `phone`, `department`, `onboarded_at` (se llena la primera vez que la
persona guarda sus datos de contacto desde el modal de bienvenida en `index.html`) y
`organization_id` (empresa asignada; `NULL` = sin asignar). Una persona no-admin no puede
reasignarse su propia `organization_id` (política `profiles_update_own_or_admin`, igual que ya
ocurría con `role`/`active`); solo un `admin` la cambia, desde el selector de "Empresa" en el
directorio de Personas y accesos o al crear/editar una cuenta.

`audit_evidence` admite dos tipos (`evidence_type`): `file` (binario en el bucket `audit-evidence`,
como antes) o `link` (una URL http(s) externa en `external_url`, sin binario). Para evitar abuso de
carga: el bucket `audit-evidence` solo acepta imágenes, PDF, Office (Word/Excel) y texto/CSV
(antes aceptaba cualquier tipo), y un trigger (`private.enforce_evidence_limits`) bloquea más de 15
evidencias por punto/hallazgo y más de 60 por persona cada 24 horas, sin importar qué cliente llame
a la API — el límite vive en la base, no solo en el frontend.

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

## Contraseñas: generación automática y correo de acceso

Desde el panel administrativo (`/administracion` → Personas y accesos) el admin puede crear una
cuenta sin escribir contraseña: `/api/admin-users` genera una contraseña temporal fuerte (14
caracteres) con `crypto.randomBytes`, la asigna a la cuenta y, si el checkbox "Enviar correo de
acceso" está activo, dispara el correo nativo de Supabase (`POST /auth/v1/recover`) para que la
persona configure su propia contraseña desde un enlace seguro (`/reset.html`). No se manda la
contraseña en texto plano por correo; el panel la muestra una sola vez para que el admin la
comparta manualmente si lo necesita como respaldo.

El botón "Generar y enviar nueva contraseña" dentro de Editar cuenta hace lo mismo para restablecer
el acceso de alguien que ya existe. En login.html hay además un enlace "¿Olvidaste tu contraseña?"
para que cualquier usuario active este mismo flujo por sí mismo.

Para que la entrega del correo sea confiable en producción, configura un proveedor SMTP propio en
Supabase Dashboard → Authentication → Emails (el SMTP por defecto de Supabase tiene límites bajos,
pensados solo para pruebas). También puedes editar ahí las plantillas "Reset password" / "Invite
user" con la marca de INDUSECC.

## Cómo dar de alta al primer administrador

1. Crea la primera cuenta desde Supabase Dashboard → Authentication → Users (email + contraseña).
   Queda creada en `profiles` con `role = viewer`, `active = false`.
2. Con acceso directo a la base (SQL editor de Supabase o `service_role` key, nunca desde el
   cliente), promover manualmente a esa primera cuenta:

   ```sql
   update public.profiles
   set role = 'admin', active = true
   where email = 'correo-del-admin@indusecc.com';
   ```

3. De ahí en adelante, ese admin activa y asigna rol a los demás usuarios desde la app
   (usando su sesión, protegido por la política `profiles_update_own_or_admin`).

## Roles

| Rol      | Puede |
|----------|-------|
| `admin`  | Todo: gestionar usuarios/roles, ver y editar cualquier auditoría, borrar (con rastro). |
| `auditor`| Crear auditorías propias, editar hallazgos/evidencia/firma de las auditorías que creó o le asignaron. |
| `viewer` | Solo lectura de todas las auditorías (pensado para gerencia / revisión). |

Si se necesitan más roles o permisos distintos (ej. "viewer" limitado a su propia sucursal),
son cambios de una sola política RLS en `003_rls_policies.sql`.

## Empresas y revocación de acceso por organización

Desde `/administracion` → Empresas, un `admin` puede:

1. Dar de alta empresas (`organizations`: nombre, notas, activa/archivada).
2. Asignar cada persona a una empresa desde el selector "Empresa" en el directorio de Personas y
   accesos (o al crear/editar una cuenta) y filtrar el directorio por empresa.
3. Quitar el acceso de una sola persona (botón existente en su fila) o de **toda la organización**
   con un clic ("Revocar acceso a todas sus personas"): desactiva en bloque (`active = false`) a
   todas las personas activas de esa empresa. Es reversible por persona desde su propia fila.
4. Eliminar una empresa solo si ya no tiene personas asignadas (evita huérfanos accidentales;
   `profiles.organization_id` de todas formas usa `on delete set null` como respaldo).

Todo esto corre con la sesión del propio admin vía RLS (`organizations_admin_write`,
`profiles_update_own_or_admin`), sin pasar por `service_role`.

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
