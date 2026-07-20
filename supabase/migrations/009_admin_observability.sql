-- =========================================================
-- 009: Observabilidad de usuarios para el panel administrativo
-- =========================================================

alter table public.profiles
  add column if not exists last_login_at timestamptz,
  add column if not exists last_seen_at timestamptz;

comment on column public.profiles.last_login_at is 'Último inicio de sesión correcto registrado por la aplicación.';
comment on column public.profiles.last_seen_at is 'Última señal de presencia; se considera en línea durante una ventana corta.';

create index if not exists idx_profiles_last_seen_at on public.profiles(last_seen_at desc);
create index if not exists idx_activity_action_actor on public.audit_activity_log(action, actor_id);

-- Un usuario autenticado solo puede marcar su propia presencia.
create or replace function public.touch_presence()
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  touched_at timestamptz := now();
begin
  update public.profiles
  set last_seen_at = touched_at
  where id = auth.uid() and active = true;
  return touched_at;
end;
$$;

revoke execute on function public.touch_presence() from public, anon;
grant execute on function public.touch_presence() to authenticated;
