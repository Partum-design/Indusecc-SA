-- =========================================================
-- 015: Retención de 7 días y avance capturado por exportación
-- =========================================================
--
-- El panel "Mis exportaciones" necesita saber cuánto avance tenía la
-- auditoría en el momento de exportar (progress) y cuándo caduca cada
-- archivo (expires_at = created_at + 7 días) para mostrarlo y para que el
-- cliente (app.js/admin.js) pueda purgar lo vencido con la Storage API real
-- (que sí borra el binario, a diferencia de un DELETE directo en
-- storage.objects).

alter table public.audit_exports
  add column if not exists progress smallint,
  add column if not exists expires_at timestamptz not null default (now() + interval '7 days');

-- Filas insertadas antes de esta migración: fija su vencimiento a 7 días desde su created_at real.
update public.audit_exports set expires_at = created_at + interval '7 days';

comment on column public.audit_exports.progress is 'Avance (%) de la auditoría en el momento de exportar el PDF.';
comment on column public.audit_exports.expires_at is 'created_at + 7 días (fijado en el default al insertar). El cliente elimina automáticamente los archivos vencidos (metadato + binario) al abrir el panel de exportaciones o el panel administrativo.';

create index if not exists idx_audit_exports_expires_at on public.audit_exports(expires_at);
