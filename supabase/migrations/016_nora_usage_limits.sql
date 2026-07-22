-- =========================================================
-- 016: Límite de uso diario de NORA (Gemini) para evitar abuso/costos
-- =========================================================

create table if not exists public.nora_usage_daily (
  usage_date date not null default (now() at time zone 'utc')::date,
  identity text not null,
  request_count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (usage_date, identity)
);

comment on table public.nora_usage_daily is 'Conteo diario de solicitudes a NORA (Gemini) por identidad (usuario autenticado o IP) más un renglón "__global__" para el tope total del día. Solo la usa /api/nora vía service_role.';

alter table public.nora_usage_daily enable row level security;
-- Sin políticas para anon/authenticated: nadie puede leer ni escribir esta tabla
-- vía la API pública. Solo el backend con la service_role key (que ignora RLS).

create or replace function public.nora_register_usage(p_identity text, p_max int)
returns table (allowed boolean, request_count int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_date date := (now() at time zone 'utc')::date;
  v_count int;
begin
  insert into public.nora_usage_daily as u (usage_date, identity, request_count, updated_at)
  values (v_date, p_identity, 1, now())
  on conflict (usage_date, identity)
  do update set
    request_count = case
      when u.request_count >= p_max then u.request_count
      else u.request_count + 1
    end,
    updated_at = now()
  returning u.request_count into v_count;

  return query select (v_count <= p_max), v_count;
end;
$$;

comment on function public.nora_register_usage(text, int) is 'Incrementa (con tope p_max) el contador diario de una identidad y devuelve si la solicitud está permitida. Se usa dos veces por solicitud: una para el usuario/IP y otra para el renglón "__global__".';

revoke execute on function public.nora_register_usage(text, int) from public, anon, authenticated;
