-- =========================================================
-- 013: Permite borrar archivos de la bóveda desde el panel
-- =========================================================

drop policy if exists "audit_exports_delete" on public.audit_exports;
create policy "audit_exports_delete"
  on public.audit_exports for delete
  to authenticated
  using (
    (select private.current_role_name()) = 'admin'
    or actor_id = (select auth.uid())
  );

drop policy if exists "exports_storage_delete" on storage.objects;
create policy "exports_storage_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'audit-exports'
    and (
      (select private.current_role_name()) = 'admin'
      or (storage.foldername(name))[1] = (select auth.uid())::text
    )
  );
