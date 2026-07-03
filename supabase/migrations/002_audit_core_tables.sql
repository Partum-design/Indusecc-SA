-- =========================================================
-- 002: Tablas núcleo de auditorías (reemplaza el localStorage)
-- =========================================================

create table if not exists public.audits (
  id uuid primary key default gen_random_uuid(),
  iso_code text not null,
  iso_version text,
  name text not null default '',
  site text,
  audit_date date,
  scope text,
  doc_version text,
  audited_rep text,
  status text not null default 'in_progress' check (status in ('in_progress', 'completed', 'cancelled')),
  created_by uuid not null references public.profiles(id),
  auditor_id uuid references public.profiles(id),
  deleted_at timestamptz, -- borrado lógico: nunca se destruye información sin dejar rastro
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.audits is 'Cabecera de cada auditoría (antes vivía en localStorage state.project).';

drop trigger if exists trg_audits_updated_at on public.audits;
create trigger trg_audits_updated_at
  before update on public.audits
  for each row execute function public.set_updated_at();

create table if not exists public.audit_findings (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid not null references public.audits(id) on delete cascade,
  clause_id text not null,
  status text not null default '',
  risk text not null default '',
  note text not null default '',
  action text not null default '',
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (audit_id, clause_id)
);

comment on table public.audit_findings is 'Un renglón por punto/cláusula ISO evaluado dentro de una auditoría.';

drop trigger if exists trg_findings_updated_at on public.audit_findings;
create trigger trg_findings_updated_at
  before update on public.audit_findings
  for each row execute function public.set_updated_at();

-- Metadatos de evidencia. El archivo en sí vive en Supabase Storage (bucket privado),
-- nunca como base64 dentro de la base de datos.
create table if not exists public.audit_evidence (
  id uuid primary key default gen_random_uuid(),
  finding_id uuid not null references public.audit_findings(id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  mime_type text,
  size_bytes bigint,
  uploaded_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.audit_signatures (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid not null unique references public.audits(id) on delete cascade,
  storage_path text not null,
  signed_by uuid references public.profiles(id),
  signed_at timestamptz not null default now()
);

create table if not exists public.nora_conversations (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid not null references public.audits(id) on delete cascade,
  role text not null check (role in ('user', 'model')),
  message text not null,
  created_at timestamptz not null default now()
);

comment on table public.nora_conversations is 'Historial del chat con NORA por auditoría.';

-- Bitácora de actividad: solo inserciones, nunca update/delete.
-- Es la base del manejo ético de datos (trazabilidad de quién hizo qué y cuándo).
create table if not exists public.audit_activity_log (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid references public.audits(id) on delete set null,
  actor_id uuid references public.profiles(id),
  action text not null,
  detail jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_findings_audit_id on public.audit_findings(audit_id);
create index if not exists idx_audit_evidence_finding_id on public.audit_evidence(finding_id);
create index if not exists idx_nora_conversations_audit_id on public.nora_conversations(audit_id);
create index if not exists idx_audits_created_by on public.audits(created_by);
create index if not exists idx_audit_activity_log_audit_id on public.audit_activity_log(audit_id);
