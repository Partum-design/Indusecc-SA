alter table public.audits
  add column if not exists history jsonb not null default '[]'::jsonb;

comment on column public.audits.history is 'Control de cambios del documento de auditoría (versión/fecha/autor/descripción), lista corta de metadatos, no archivos.';
