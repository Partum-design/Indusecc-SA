-- =========================================================
-- 004: Storage privado para evidencias y firmas
-- =========================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('audit-evidence', 'audit-evidence', false, 26214400, null), -- 25MB por archivo
  ('audit-signatures', 'audit-signatures', false, 2097152, array['image/png', 'image/jpeg'])
on conflict (id) do nothing;

-- Los usuarios activos (admin/auditor) pueden subir dentro de una carpeta con su propio uid
-- como primer segmento de la ruta: {uid}/{audit_id}/{archivo}
drop policy if exists "evidence_storage_insert" on storage.objects;
create policy "evidence_storage_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'audit-evidence'
    and public.is_active_user()
    and public.current_role_name() in ('admin', 'auditor')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "evidence_storage_select" on storage.objects;
create policy "evidence_storage_select"
  on storage.objects for select
  using (
    bucket_id = 'audit-evidence'
    and public.is_active_user()
    and (
      public.current_role_name() in ('admin', 'viewer')
      or (storage.foldername(name))[1] = auth.uid()::text
    )
  );

drop policy if exists "evidence_storage_delete" on storage.objects;
create policy "evidence_storage_delete"
  on storage.objects for delete
  using (
    bucket_id = 'audit-evidence'
    and (
      public.current_role_name() = 'admin'
      or (storage.foldername(name))[1] = auth.uid()::text
    )
  );

drop policy if exists "signatures_storage_insert" on storage.objects;
create policy "signatures_storage_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'audit-signatures'
    and public.is_active_user()
    and public.current_role_name() in ('admin', 'auditor')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "signatures_storage_select" on storage.objects;
create policy "signatures_storage_select"
  on storage.objects for select
  using (
    bucket_id = 'audit-signatures'
    and public.is_active_user()
    and (
      public.current_role_name() in ('admin', 'viewer')
      or (storage.foldername(name))[1] = auth.uid()::text
    )
  );
