-- =========================================================
-- 011: Permisos completos para reemplazar firmas
-- =========================================================

-- El cliente usa upsert para guardar una firma nueva sobre la anterior.
drop policy if exists "signatures_update" on public.audit_signatures;
create policy "signatures_update"
  on public.audit_signatures for update
  to authenticated
  using (
    (select private.is_active_user())
    and (select private.current_role_name()) in ('admin', 'auditor')
    and exists (
      select 1 from public.audits a where a.id = audit_signatures.audit_id
        and (a.created_by = (select auth.uid()) or a.auditor_id = (select auth.uid()) or (select private.current_role_name()) = 'admin')
    )
  )
  with check (
    (select private.is_active_user())
    and (select private.current_role_name()) in ('admin', 'auditor')
    and exists (
      select 1 from public.audits a where a.id = audit_signatures.audit_id
        and (a.created_by = (select auth.uid()) or a.auditor_id = (select auth.uid()) or (select private.current_role_name()) = 'admin')
    )
  );

drop policy if exists "signatures_storage_update" on storage.objects;
create policy "signatures_storage_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'audit-signatures'
    and (select private.is_active_user())
    and (select private.current_role_name()) in ('admin', 'auditor')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'audit-signatures'
    and (select private.is_active_user())
    and (select private.current_role_name()) in ('admin', 'auditor')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

