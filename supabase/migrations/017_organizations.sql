-- =========================================================
-- 017: Empresas (organizaciones) y asignación de usuarios
-- =========================================================
-- Permite al admin dar de alta las empresas/clientes que usan la plataforma,
-- asignar cada persona a una empresa y, desde ahí, revocar el acceso de una
-- sola persona (ya existía) o de toda la organización de un solo movimiento.

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  notes text,
  active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (name)
);

comment on table public.organizations is 'Empresas/clientes cuyas personas acceden a la plataforma. Agrupa usuarios para administración y revocación de acceso masiva.';
comment on column public.organizations.active is 'Bandera de archivado (solo visual/organizativa). No desactiva por sí sola el acceso de sus personas: eso se hace explícitamente desde el panel.';

drop trigger if exists trg_organizations_updated_at on public.organizations;
create trigger trg_organizations_updated_at
  before update on public.organizations
  for each row execute function public.set_updated_at();

-- ---------- profiles: empresa a la que pertenece cada persona ----------
alter table public.profiles
  add column if not exists organization_id uuid references public.organizations(id) on delete set null;

comment on column public.profiles.organization_id is 'Empresa a la que pertenece esta persona. NULL = sin asignar.';

create index if not exists idx_profiles_organization_id on public.profiles(organization_id);

-- Helper de solo lectura (mismo patrón que private.current_role_name /
-- private.is_active_user) para poder comparar organization_id en políticas
-- sin volver a consultar profiles dentro de su propia política (eso causó
-- la recursión infinita corregida en 014_fix_profiles_update_recursion.sql).
create or replace function private.current_organization_id()
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select organization_id from public.profiles where id = (select auth.uid());
$$;

revoke all on function private.current_organization_id() from public, anon;
grant execute on function private.current_organization_id() to authenticated;

-- Ninguna persona no-admin puede reasignarse a sí misma de empresa: se agrega
-- organization_id a los campos "anclados" del with check existente, igual
-- que ya ocurre con role/active.
drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin"
  on public.profiles for update
  to authenticated
  using (
    id = (select auth.uid())
    or (select private.current_role_name()) = 'admin'
  )
  with check (
    (select private.current_role_name()) = 'admin'
    or (
      id = (select auth.uid())
      and role = (select private.current_role_name())
      and active = (select private.is_active_user())
      and organization_id is not distinct from (select private.current_organization_id())
    )
  );

-- ---------- organizations: RLS ----------
alter table public.organizations enable row level security;

-- Cualquier persona autenticada puede ver su propia empresa (por ejemplo para
-- mostrar el nombre en su perfil); el admin ve y administra todas.
drop policy if exists "organizations_select" on public.organizations;
create policy "organizations_select"
  on public.organizations for select
  to authenticated
  using (
    (select private.current_role_name()) = 'admin'
    or id = (select private.current_organization_id())
  );

-- Escritura solo-admin, separada por comando (no "for all") para no duplicar
-- una política permisiva de SELECT junto con organizations_select y disparar
-- el advisor "multiple_permissive_policies".
drop policy if exists "organizations_admin_write" on public.organizations;

drop policy if exists "organizations_admin_insert" on public.organizations;
create policy "organizations_admin_insert"
  on public.organizations for insert
  to authenticated
  with check ((select private.current_role_name()) = 'admin');

drop policy if exists "organizations_admin_update" on public.organizations;
create policy "organizations_admin_update"
  on public.organizations for update
  to authenticated
  using ((select private.current_role_name()) = 'admin')
  with check ((select private.current_role_name()) = 'admin');

drop policy if exists "organizations_admin_delete" on public.organizations;
create policy "organizations_admin_delete"
  on public.organizations for delete
  to authenticated
  using ((select private.current_role_name()) = 'admin');

create index if not exists idx_organizations_created_by on public.organizations(created_by);
