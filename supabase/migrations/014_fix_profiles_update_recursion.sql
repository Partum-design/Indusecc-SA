-- =========================================================
-- 014: Corrige la recursión infinita en la política de UPDATE de profiles
-- =========================================================
--
-- "profiles_update_own_or_admin" (migración 010) comparaba role/active contra
-- una subconsulta directa a public.profiles dentro de su propio WITH CHECK.
-- Postgres detecta eso como referencia circular a la misma relación y aborta
-- con "infinite recursion detected in policy for relation profiles" en
-- cualquier UPDATE a profiles hecho por un usuario autenticado (no service_role):
-- el panel admin no podía cambiar rol/estado y touch_presence fallaba siempre.
-- Se reemplaza por los helpers ya existentes (private.current_role_name /
-- private.is_active_user), que son security definer y sí evitan la recursión.

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
    )
  );

-- touch_presence perdió su "security definer" en la migración 010, así que su
-- propio UPDATE volvía a caer bajo la política de arriba (misma recursión).
create or replace function public.touch_presence()
returns timestamptz
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  touched_at timestamptz := now();
begin
  update public.profiles
  set last_seen_at = touched_at
  where id = (select auth.uid()) and active = true;
  return touched_at;
end;
$$;

revoke all on function public.touch_presence() from public, anon;
grant execute on function public.touch_presence() to authenticated;
