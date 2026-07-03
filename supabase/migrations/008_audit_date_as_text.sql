alter table public.audits
  alter column audit_date type text using audit_date::text;

comment on column public.audits.audit_date is 'Texto libre tal como lo captura el auditor (formato DD/MM/AAAA en el formulario), no se fuerza a tipo date porque se guarda mientras el usuario escribe.';
