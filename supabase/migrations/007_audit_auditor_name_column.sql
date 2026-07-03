alter table public.audits
  add column if not exists auditor_name text not null default '';

comment on column public.audits.auditor_name is 'Nombre del auditor mostrado en el reporte (texto libre, puede diferir del usuario que capturó el registro).';
comment on column public.audits.auditor_id is 'Usuario de Supabase Auth responsable/asignado a esta auditoría (para control de acceso, no necesariamente igual a auditor_name).';
