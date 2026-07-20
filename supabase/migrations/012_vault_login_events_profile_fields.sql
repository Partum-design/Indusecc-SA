-- =========================================================
-- 012: Bóveda de exportaciones, bitácora de conexiones y datos de perfil
-- =========================================================

-- ---------- profiles: datos de contacto y bandera de alta completada ----------
alter table public.profiles
  add column if not exists phone text,
  add column if not exists department text,
  add column if not exists onboarded_at timestamptz;

comment on column public.profiles.phone is 'Teléfono de contacto capturado en el alta de datos (primer inicio de sesión o alta administrativa).';
comment on column public.profiles.department is 'Área o puesto dentro de la organización.';
comment on column public.profiles.onboarded_at is 'Momento en que la persona completó el formulario de datos de primer acceso. NULL = aún no lo llena.';

-- ---------- login_events: bitácora de conexiones ----------
create table if not exists public.login_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  email text,
  ip text,
  user_agent text,
  created_at timestamptz not null default now()
);

comment on table public.login_events is 'Bitácora de inicios de sesión (quién, cuándo, IP y dispositivo). Solo la escribe el backend con service_role.';

create index if not exists idx_login_events_user_id on public.login_events(user_id, created_at desc);
create index if not exists idx_login_events_created_at on public.login_events(created_at desc);

alter table public.login_events enable row level security;

drop policy if exists "login_events_select" on public.login_events;
create policy "login_events_select"
  on public.login_events for select
  to authenticated
  using ((select private.current_role_name()) = 'admin' or user_id = (select auth.uid()));

-- Sin política de insert/update/delete para authenticated ni anon: solo escribe el
-- backend con la service_role key (/api/log-login), que ignora RLS por diseño.

-- ---------- audit_exports: bóveda de PDFs exportados ----------
create table if not exists public.audit_exports (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid references public.audits(id) on delete set null,
  actor_id uuid references public.profiles(id) on delete set null,
  filename text not null,
  storage_path text not null,
  iso_code text,
  file_size bigint,
  created_at timestamptz not null default now()
);

comment on table public.audit_exports is 'Bóveda: metadatos de cada PDF de auditoría exportado; el binario vive en el bucket audit-exports.';

create index if not exists idx_audit_exports_actor_id on public.audit_exports(actor_id, created_at desc);
create index if not exists idx_audit_exports_created_at on public.audit_exports(created_at desc);

alter table public.audit_exports enable row level security;

drop policy if exists "audit_exports_select" on public.audit_exports;
create policy "audit_exports_select"
  on public.audit_exports for select
  to authenticated
  using (
    (select private.current_role_name()) in ('admin', 'viewer')
    or actor_id = (select auth.uid())
  );

drop policy if exists "audit_exports_insert" on public.audit_exports;
create policy "audit_exports_insert"
  on public.audit_exports for insert
  to authenticated
  with check (
    (select private.is_active_user())
    and actor_id = (select auth.uid())
  );

-- ---------- storage: bucket privado para la bóveda ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('audit-exports', 'audit-exports', false, 26214400, array['application/pdf'])
on conflict (id) do nothing;

drop policy if exists "exports_storage_insert" on storage.objects;
create policy "exports_storage_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'audit-exports'
    and (select private.is_active_user())
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "exports_storage_select" on storage.objects;
create policy "exports_storage_select"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'audit-exports'
    and (select private.is_active_user())
    and (
      (select private.current_role_name()) in ('admin', 'viewer')
      or (storage.foldername(name))[1] = (select auth.uid())::text
    )
  );
