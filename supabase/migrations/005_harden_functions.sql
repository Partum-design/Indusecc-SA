-- =========================================================
-- 005: Endurecer funciones (search_path fijo, permisos mínimos)
-- =========================================================

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

-- Nadie debe invocar handle_new_user() directamente vía API; solo el trigger de auth.users.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- current_role_name / is_active_user solo tiene sentido para usuarios autenticados,
-- y solo devuelven información sobre el propio usuario que llama (auth.uid()), por lo que
-- no exponen datos de terceros; aun así se restringe a 'authenticated'.
revoke execute on function public.current_role_name() from public, anon;
grant execute on function public.current_role_name() to authenticated;

revoke execute on function public.is_active_user() from public, anon;
grant execute on function public.is_active_user() to authenticated;
