-- =========================================================
-- 010: Endurecimiento de helpers RLS e índices operativos
-- =========================================================

-- Los helpers usados por RLS no deben aparecer como endpoints RPC públicos.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create or replace function private.current_role_name()
returns public.user_role
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select role from public.profiles where id = (select auth.uid());
$$;

create or replace function private.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce((select active from public.profiles where id = (select auth.uid())), false);
$$;

revoke all on function private.current_role_name() from public, anon;
revoke all on function private.is_active_user() from public, anon;
grant execute on function private.current_role_name() to authenticated;
grant execute on function private.is_active_user() to authenticated;

-- El pulso de presencia sí se invoca desde el cliente, pero no requiere privilegios elevados.
create or replace function public.touch_presence()
returns timestamptz
language plpgsql
set search_path = public, pg_temp
as $$
declare
  touched_at timestamptz := now();
begin
  update public.profiles
  set last_seen_at = touched_at
  where id = (select auth.uid()) and active = true;
  return touched_at;
end;
$$;

revoke all on function public.touch_presence() from public, anon;
grant execute on function public.touch_presence() to authenticated;

-- ---------- profiles ----------
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
drop policy if exists "profiles_update_own_limited" on public.profiles;
drop policy if exists "profiles_admin_all" on public.profiles;

create policy "profiles_select_own_or_admin"
  on public.profiles for select
  to authenticated
  using (
    id = (select auth.uid())
    or (select private.current_role_name()) = 'admin'
  );

create policy "profiles_update_own_or_admin"
  on public.profiles for update
  to authenticated
  using (
    id = (select auth.uid())
    or (select private.current_role_name()) = 'admin'
  )
  with check (
    (select private.current_role_name()) = 'admin'
    or (
      id = (select auth.uid())
      and role = (select p.role from public.profiles p where p.id = (select auth.uid()))
      and active = (select p.active from public.profiles p where p.id = (select auth.uid()))
    )
  );

-- ---------- audit policies ----------
drop policy if exists "audits_select" on public.audits;
drop policy if exists "audits_insert" on public.audits;
drop policy if exists "audits_update" on public.audits;
drop policy if exists "audits_delete_admin_only" on public.audits;

create policy "audits_select"
  on public.audits for select
  to authenticated
  using (
    (select private.is_active_user())
    and (
      (select private.current_role_name()) in ('admin', 'viewer')
      or created_by = (select auth.uid())
      or auditor_id = (select auth.uid())
    )
  );

create policy "audits_insert"
  on public.audits for insert
  to authenticated
  with check (
    (select private.is_active_user())
    and (select private.current_role_name()) in ('admin', 'auditor')
    and created_by = (select auth.uid())
  );

create policy "audits_update"
  on public.audits for update
  to authenticated
  using (
    (select private.is_active_user())
    and (
      (select private.current_role_name()) = 'admin'
      or created_by = (select auth.uid())
      or auditor_id = (select auth.uid())
    )
  )
  with check (
    (select private.is_active_user())
    and (
      (select private.current_role_name()) = 'admin'
      or created_by = (select auth.uid())
      or auditor_id = (select auth.uid())
    )
  );

create policy "audits_delete_admin_only"
  on public.audits for delete
  to authenticated
  using ((select private.current_role_name()) = 'admin');

-- ---------- audit_findings ----------
drop policy if exists "findings_select" on public.audit_findings;
drop policy if exists "findings_write" on public.audit_findings;
drop policy if exists "findings_update" on public.audit_findings;
drop policy if exists "findings_delete_admin_only" on public.audit_findings;

create policy "findings_select"
  on public.audit_findings for select
  to authenticated
  using (
    (select private.is_active_user()) and exists (
      select 1 from public.audits a
      where a.id = audit_findings.audit_id
        and (
          (select private.current_role_name()) in ('admin', 'viewer')
          or a.created_by = (select auth.uid())
          or a.auditor_id = (select auth.uid())
        )
    )
  );

create policy "findings_write"
  on public.audit_findings for insert
  to authenticated
  with check (
    (select private.is_active_user())
    and (select private.current_role_name()) in ('admin', 'auditor')
    and exists (
      select 1 from public.audits a where a.id = audit_findings.audit_id
        and (a.created_by = (select auth.uid()) or a.auditor_id = (select auth.uid()) or (select private.current_role_name()) = 'admin')
    )
  );

create policy "findings_update"
  on public.audit_findings for update
  to authenticated
  using (
    (select private.is_active_user())
    and (select private.current_role_name()) in ('admin', 'auditor')
    and exists (
      select 1 from public.audits a where a.id = audit_findings.audit_id
        and (a.created_by = (select auth.uid()) or a.auditor_id = (select auth.uid()) or (select private.current_role_name()) = 'admin')
    )
  )
  with check (
    (select private.is_active_user())
    and (select private.current_role_name()) in ('admin', 'auditor')
    and exists (
      select 1 from public.audits a where a.id = audit_findings.audit_id
        and (a.created_by = (select auth.uid()) or a.auditor_id = (select auth.uid()) or (select private.current_role_name()) = 'admin')
    )
  );

create policy "findings_delete_admin_only"
  on public.audit_findings for delete
  to authenticated
  using ((select private.current_role_name()) = 'admin');

-- ---------- audit_evidence ----------
drop policy if exists "evidence_select" on public.audit_evidence;
drop policy if exists "evidence_insert" on public.audit_evidence;
drop policy if exists "evidence_delete" on public.audit_evidence;

create policy "evidence_select"
  on public.audit_evidence for select
  to authenticated
  using (
    (select private.is_active_user()) and exists (
      select 1 from public.audit_findings f join public.audits a on a.id = f.audit_id
      where f.id = audit_evidence.finding_id
        and (
          (select private.current_role_name()) in ('admin', 'viewer')
          or a.created_by = (select auth.uid())
          or a.auditor_id = (select auth.uid())
        )
    )
  );

create policy "evidence_insert"
  on public.audit_evidence for insert
  to authenticated
  with check (
    (select private.is_active_user())
    and (select private.current_role_name()) in ('admin', 'auditor')
    and exists (
      select 1 from public.audit_findings f join public.audits a on a.id = f.audit_id
      where f.id = audit_evidence.finding_id
        and (a.created_by = (select auth.uid()) or a.auditor_id = (select auth.uid()) or (select private.current_role_name()) = 'admin')
    )
  );

create policy "evidence_delete"
  on public.audit_evidence for delete
  to authenticated
  using ((select private.current_role_name()) = 'admin' or uploaded_by = (select auth.uid()));

-- ---------- signatures ----------
drop policy if exists "signatures_select" on public.audit_signatures;
drop policy if exists "signatures_insert" on public.audit_signatures;

create policy "signatures_select"
  on public.audit_signatures for select
  to authenticated
  using (
    (select private.is_active_user()) and exists (
      select 1 from public.audits a where a.id = audit_signatures.audit_id
        and (
          (select private.current_role_name()) in ('admin', 'viewer')
          or a.created_by = (select auth.uid())
          or a.auditor_id = (select auth.uid())
        )
    )
  );

create policy "signatures_insert"
  on public.audit_signatures for insert
  to authenticated
  with check (
    (select private.is_active_user())
    and (select private.current_role_name()) in ('admin', 'auditor')
    and exists (
      select 1 from public.audits a where a.id = audit_signatures.audit_id
        and (a.created_by = (select auth.uid()) or a.auditor_id = (select auth.uid()) or (select private.current_role_name()) = 'admin')
    )
  );

-- ---------- NORA ----------
drop policy if exists "nora_select" on public.nora_conversations;
drop policy if exists "nora_insert" on public.nora_conversations;

create policy "nora_select"
  on public.nora_conversations for select
  to authenticated
  using (
    (select private.is_active_user()) and exists (
      select 1 from public.audits a where a.id = nora_conversations.audit_id
        and ((select private.current_role_name()) = 'admin' or a.created_by = (select auth.uid()) or a.auditor_id = (select auth.uid()))
    )
  );

create policy "nora_insert"
  on public.nora_conversations for insert
  to authenticated
  with check (
    (select private.is_active_user()) and exists (
      select 1 from public.audits a where a.id = nora_conversations.audit_id
        and (a.created_by = (select auth.uid()) or a.auditor_id = (select auth.uid()) or (select private.current_role_name()) = 'admin')
    )
  );

-- ---------- activity log ----------
drop policy if exists "activity_select" on public.audit_activity_log;
drop policy if exists "activity_insert" on public.audit_activity_log;

create policy "activity_select"
  on public.audit_activity_log for select
  to authenticated
  using ((select private.current_role_name()) = 'admin' or actor_id = (select auth.uid()));

create policy "activity_insert"
  on public.audit_activity_log for insert
  to authenticated
  with check ((select private.is_active_user()) and actor_id = (select auth.uid()));

-- ---------- Storage ----------
drop policy if exists "evidence_storage_insert" on storage.objects;
drop policy if exists "evidence_storage_select" on storage.objects;
drop policy if exists "evidence_storage_delete" on storage.objects;
drop policy if exists "signatures_storage_insert" on storage.objects;
drop policy if exists "signatures_storage_select" on storage.objects;

create policy "evidence_storage_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'audit-evidence'
    and (select private.is_active_user())
    and (select private.current_role_name()) in ('admin', 'auditor')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "evidence_storage_select"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'audit-evidence'
    and (select private.is_active_user())
    and ((select private.current_role_name()) in ('admin', 'viewer') or (storage.foldername(name))[1] = (select auth.uid())::text)
  );

create policy "evidence_storage_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'audit-evidence'
    and ((select private.current_role_name()) = 'admin' or (storage.foldername(name))[1] = (select auth.uid())::text)
  );

create policy "signatures_storage_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'audit-signatures'
    and (select private.is_active_user())
    and (select private.current_role_name()) in ('admin', 'auditor')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "signatures_storage_select"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'audit-signatures'
    and (select private.is_active_user())
    and ((select private.current_role_name()) in ('admin', 'viewer') or (storage.foldername(name))[1] = (select auth.uid())::text)
  );

-- Índices sobre claves foráneas que reciben escrituras o filtros frecuentes.
create index if not exists idx_audits_auditor_id on public.audits(auditor_id);
create index if not exists idx_audit_findings_updated_by on public.audit_findings(updated_by);
create index if not exists idx_audit_evidence_uploaded_by on public.audit_evidence(uploaded_by);
create index if not exists idx_audit_signatures_signed_by on public.audit_signatures(signed_by);
create index if not exists idx_audit_activity_log_actor_id on public.audit_activity_log(actor_id);

-- Ya no se necesitan como funciones públicas: la aplicación solo usa los helpers privados.
drop function if exists public.current_role_name();
drop function if exists public.is_active_user();
