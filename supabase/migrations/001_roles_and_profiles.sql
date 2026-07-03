-- =========================================================
-- 001: Roles y perfiles de usuario
-- =========================================================

create extension if not exists "pgcrypto" with schema extensions;
create extension if not exists "uuid-ossp" with schema extensions;

-- Roles del sistema. admin: control total y gestión de usuarios.
-- auditor: crea y edita auditorías, hallazgos y evidencia.
-- viewer: solo lectura (gerencia / clientes internos).
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('admin', 'auditor', 'viewer');
  end if;
end $$;

-- Perfil 1:1 con auth.users. Nunca se guarda contraseña aquí:
-- la autenticación y el hash de contraseña los maneja Supabase Auth.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role public.user_role not null default 'viewer',
  active boolean not null default false, -- requiere activación explícita de un admin
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Perfil y rol de cada usuario autenticado. Los usuarios nuevos entran inactivos hasta que un admin los activa.';

-- Función utilitaria para trigger de updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Alta automática de perfil cuando se registra un usuario en auth.users.
-- SECURITY DEFINER: corre con privilegios elevados para poder escribir en public.profiles
-- aunque el usuario recién creado todavía no tenga permisos.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role, active)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    'viewer',
    false
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Helper para leer el rol del usuario actual sin recursión de RLS.
create or replace function public.current_role_name()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select active from public.profiles where id = auth.uid()), false);
$$;

revoke execute on function public.current_role_name() from public, anon;
grant execute on function public.current_role_name() to authenticated;

revoke execute on function public.is_active_user() from public, anon;
grant execute on function public.is_active_user() to authenticated;

alter table public.profiles enable row level security;

-- Un usuario ve y edita su propio perfil (pero no puede cambiar su propio rol/estado activo).
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using (id = auth.uid() or public.current_role_name() = 'admin');

drop policy if exists "profiles_update_own_limited" on public.profiles;
create policy "profiles_update_own_limited"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()) and active = (select active from public.profiles where id = auth.uid()));

drop policy if exists "profiles_admin_all" on public.profiles;
create policy "profiles_admin_all"
  on public.profiles for all
  using (public.current_role_name() = 'admin')
  with check (public.current_role_name() = 'admin');
