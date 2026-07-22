-- =========================================================
-- 019: Tope diario de exportaciones PDF (auditor limitado, admin libre)
-- =========================================================
create table if not exists public.pdf_export_daily (
  usage_date date not null default (now() at time zone 'utc')::date,
  user_id uuid not null references public.profiles(id) on delete cascade,
  export_count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (usage_date, user_id)
);

comment on table public.pdf_export_daily is 'Conteo diario de exportaciones PDF por persona (solo se limita a role=auditor; admin siempre pasa). Solo se escribe vía private.register_pdf_export.';

alter table public.pdf_export_daily enable row level security;
-- Sin políticas: nadie lee/escribe esta tabla directo, solo la función security definer.

-- Vive en "public" (no "private"): a diferencia de los helpers de RLS, esta
-- función la invoca el cliente directo vía sb.rpc(), sin backend intermedio
-- (no hay endpoint /api/ en el flujo de exportar PDF). Mismo criterio que
-- public.touch_presence(): valida auth.uid() internamente y solo toca la
-- fila de quien llama, así que exponerla es seguro.
create or replace function public.register_pdf_export()
returns table (allowed boolean, export_count int, is_limited boolean)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_max constant int := 15; -- tope diario para role=auditor; admin no se mide
  v_role public.user_role;
  v_uid uuid := (select auth.uid());
  v_date date := (now() at time zone 'utc')::date;
  v_count int;
begin
  select role into v_role from public.profiles where id = v_uid;

  if v_role = 'admin' then
    return query select true, 0, false;
    return;
  end if;

  insert into public.pdf_export_daily as u (usage_date, user_id, export_count, updated_at)
  values (v_date, v_uid, 1, now())
  on conflict (usage_date, user_id)
  do update set
    export_count = case when u.export_count >= v_max then u.export_count else u.export_count + 1 end,
    updated_at = now()
  returning u.export_count into v_count;

  return query select (v_count <= v_max), v_count, true;
end;
$$;

comment on function public.register_pdf_export() is 'Incrementa (con tope de 15/día) el contador de exportaciones PDF de auditor y dice si se permite. admin siempre allowed=true sin contarse. Expuesta en public a propósito: el cliente la invoca directo (mismo criterio que touch_presence).';

revoke all on function public.register_pdf_export() from public, anon;
grant execute on function public.register_pdf_export() to authenticated;
