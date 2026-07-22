-- =========================================================
-- 018: Evidencia por enlace + límites antiabuso de carga de archivos
-- =========================================================
-- Permite registrar evidencia como enlace externo (además de archivo subido)
-- y agrega topes server-side (no solo en el cliente) para que nadie pueda
-- saturar el bucket de evidencia subiendo cientos de archivos.

-- ---------- audit_evidence: soporta 'file' o 'link' ----------
alter table public.audit_evidence
  add column if not exists evidence_type text not null default 'file',
  add column if not exists external_url text;

alter table public.audit_evidence
  alter column storage_path drop not null,
  alter column file_name drop not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'audit_evidence_type_check'
  ) then
    alter table public.audit_evidence
      add constraint audit_evidence_type_check check (evidence_type in ('file', 'link'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'audit_evidence_shape_check'
  ) then
    alter table public.audit_evidence
      add constraint audit_evidence_shape_check check (
        (evidence_type = 'file' and storage_path is not null and file_name is not null and external_url is null)
        or
        (evidence_type = 'link' and external_url is not null and storage_path is null and file_name is null)
      );
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'audit_evidence_url_scheme_check'
  ) then
    alter table public.audit_evidence
      add constraint audit_evidence_url_scheme_check check (external_url is null or external_url ~* '^https?://');
  end if;
end $$;

comment on column public.audit_evidence.evidence_type is '''file'' = binario en Storage (storage_path/file_name); ''link'' = referencia externa (external_url). Nunca ambos.';
comment on column public.audit_evidence.external_url is 'URL http(s) cuando evidence_type = link. Se abre con noopener desde el cliente, nunca se ejecuta en el servidor.';

-- ---------- Tope de archivos por punto y por persona/día (antiabuso) ----------
-- Se aplica en la base de datos (no solo en el cliente) para que nadie lo
-- evada llamando a la API de Supabase directamente. Mismo criterio que el
-- límite diario de NORA (016_nora_usage_limits.sql): conteo server-side,
-- security definer para que el conteo sea real y no dependa de qué filas
-- pueda ver el propio usuario por RLS. Vive en "private" (no "public") para
-- que PostgREST no la exponga como endpoint RPC a anon/authenticated, igual
-- que private.current_role_name / is_active_user / current_organization_id.
create or replace function private.enforce_evidence_limits()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_per_finding int;
  v_per_day int;
begin
  if new.evidence_type = 'file' then
    select count(*) into v_per_finding
    from public.audit_evidence
    where finding_id = new.finding_id;

    if v_per_finding >= 15 then
      raise exception 'Este punto ya tiene el máximo de 15 evidencias. Elimina alguna antes de agregar otra.';
    end if;
  end if;

  if new.uploaded_by is not null then
    select count(*) into v_per_day
    from public.audit_evidence
    where uploaded_by = new.uploaded_by
      and created_at > now() - interval '24 hours';

    if v_per_day >= 60 then
      raise exception 'Alcanzaste el límite de 60 evidencias en 24 horas. Vuelve a intentarlo más tarde.';
    end if;
  end if;

  return new;
end;
$$;

comment on function private.enforce_evidence_limits() is 'Bloquea abuso de carga: máx. 15 evidencias por punto/hallazgo y 60 por persona cada 24h, sin importar el cliente que llame a la API.';

revoke all on function private.enforce_evidence_limits() from public, anon, authenticated;

drop trigger if exists trg_evidence_limits on public.audit_evidence;
create trigger trg_evidence_limits
  before insert on public.audit_evidence
  for each row execute function private.enforce_evidence_limits();

-- ---------- Restringe tipos de archivo permitidos en el bucket de evidencia ----------
-- Antes aceptaba cualquier mime type; se limita a formatos legítimos de
-- evidencia de auditoría (imágenes, PDF, Office, texto plano/CSV).
update storage.buckets
set allowed_mime_types = array[
  'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'text/plain'
]
where id = 'audit-evidence';
