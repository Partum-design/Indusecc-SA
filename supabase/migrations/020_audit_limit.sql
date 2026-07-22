-- =========================================================
-- 020: Límite de auditorías por persona (plan/cuenta)
-- =========================================================
-- Permite al admin limitar cuántas auditorías puede crear una persona en
-- total (histórico). NULL = ilimitadas. Se aplica con un trigger en el
-- INSERT de audits para que quede garantizado del lado del servidor sin
-- importar qué cliente haga el insert (mismo criterio de "topes server-side"
-- que 018/019). role=admin nunca se mide, igual que en el tope de PDF (019).

alter table public.profiles
  add column if not exists audit_limit integer;

alter table public.profiles
  drop constraint if exists profiles_audit_limit_positive;
alter table public.profiles
  add constraint profiles_audit_limit_positive check (audit_limit is null or audit_limit > 0);

comment on column public.profiles.audit_limit is 'Máximo de auditorías (total histórico creadas por created_by) que esta persona puede iniciar. NULL = ilimitadas. role=admin nunca se mide.';

-- ---------- Ancla audit_limit en el UPDATE propio, igual que role/active/organization_id ----------
-- Sin esto, cualquier persona autenticada podría llamar
-- sb.from('profiles').update({audit_limit: null}) sobre su propia fila y
-- quitarse el tope ella misma.
--
-- IMPORTANTE: no se puede comparar contra una subconsulta directa a
-- public.profiles dentro de este mismo WITH CHECK -- eso es justo lo que
-- causó "infinite recursion detected in policy for relation profiles" y
-- rompió todos los UPDATE de perfiles, corregido en
-- 014_fix_profiles_update_recursion.sql. Por eso se agrega un helper
-- security definer (mismo patrón que private.current_role_name /
-- is_active_user / current_organization_id) en vez de un subselect crudo.
create or replace function private.current_audit_limit()
returns integer
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select audit_limit from public.profiles where id = (select auth.uid());
$$;

revoke all on function private.current_audit_limit() from public, anon;
grant execute on function private.current_audit_limit() to authenticated;

-- Redefine la política completa (mismo patrón que 017_organizations.sql al
-- agregar organization_id a este check).
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
      and audit_limit is not distinct from (select private.current_audit_limit())
    )
  );

-- ---------- Trigger que aplica el tope al crear una auditoría ----------
create or replace function public.enforce_audit_limit()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_role public.user_role;
  v_limit int;
  v_count int;
begin
  select role, audit_limit into v_role, v_limit from public.profiles where id = new.created_by;

  if v_role = 'admin' or v_limit is null then
    return new;
  end if;

  select count(*) into v_count from public.audits where created_by = new.created_by;

  if v_count >= v_limit then
    raise exception 'audit_limit_reached'
      using errcode = 'P0001',
            detail = format('created_by=%s tiene %s de %s auditorías permitidas', new.created_by, v_count, v_limit);
  end if;

  return new;
end;
$$;

comment on function public.enforce_audit_limit() is 'Bloquea el INSERT en audits si created_by ya alcanzó su profiles.audit_limit (NULL o role=admin = sin tope).';

drop trigger if exists trg_audits_enforce_limit on public.audits;
create trigger trg_audits_enforce_limit
  before insert on public.audits
  for each row execute function public.enforce_audit_limit();
