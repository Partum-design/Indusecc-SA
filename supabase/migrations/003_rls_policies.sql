-- =========================================================
-- 003: Row Level Security para todas las tablas de auditoría
-- =========================================================

alter table public.audits enable row level security;
alter table public.audit_findings enable row level security;
alter table public.audit_evidence enable row level security;
alter table public.audit_signatures enable row level security;
alter table public.nora_conversations enable row level security;
alter table public.audit_activity_log enable row level security;

-- ---------- audits ----------
-- Lectura: admin ve todo; auditor ve lo que creó o le asignaron; viewer ve todo (solo lectura),
-- siempre que su cuenta esté activa.
drop policy if exists "audits_select" on public.audits;
create policy "audits_select"
  on public.audits for select
  using (
    public.is_active_user() and (
      public.current_role_name() = 'admin'
      or public.current_role_name() = 'viewer'
      or created_by = auth.uid()
      or auditor_id = auth.uid()
    )
  );

drop policy if exists "audits_insert" on public.audits;
create policy "audits_insert"
  on public.audits for insert
  with check (
    public.is_active_user()
    and public.current_role_name() in ('admin', 'auditor')
    and created_by = auth.uid()
  );

drop policy if exists "audits_update" on public.audits;
create policy "audits_update"
  on public.audits for update
  using (
    public.is_active_user() and (
      public.current_role_name() = 'admin'
      or created_by = auth.uid()
      or auditor_id = auth.uid()
    )
  );

-- Nadie borra físicamente: solo admin, y se recomienda usar deleted_at en vez de delete.
drop policy if exists "audits_delete_admin_only" on public.audits;
create policy "audits_delete_admin_only"
  on public.audits for delete
  using (public.current_role_name() = 'admin');

-- ---------- audit_findings ----------
drop policy if exists "findings_select" on public.audit_findings;
create policy "findings_select"
  on public.audit_findings for select
  using (
    public.is_active_user() and exists (
      select 1 from public.audits a
      where a.id = audit_findings.audit_id
        and (
          public.current_role_name() = 'admin'
          or public.current_role_name() = 'viewer'
          or a.created_by = auth.uid()
          or a.auditor_id = auth.uid()
        )
    )
  );

drop policy if exists "findings_write" on public.audit_findings;
create policy "findings_write"
  on public.audit_findings for insert
  with check (
    public.is_active_user()
    and public.current_role_name() in ('admin', 'auditor')
    and exists (
      select 1 from public.audits a where a.id = audit_findings.audit_id
        and (a.created_by = auth.uid() or a.auditor_id = auth.uid() or public.current_role_name() = 'admin')
    )
  );

drop policy if exists "findings_update" on public.audit_findings;
create policy "findings_update"
  on public.audit_findings for update
  using (
    public.is_active_user()
    and public.current_role_name() in ('admin', 'auditor')
    and exists (
      select 1 from public.audits a where a.id = audit_findings.audit_id
        and (a.created_by = auth.uid() or a.auditor_id = auth.uid() or public.current_role_name() = 'admin')
    )
  );

drop policy if exists "findings_delete_admin_only" on public.audit_findings;
create policy "findings_delete_admin_only"
  on public.audit_findings for delete
  using (public.current_role_name() = 'admin');

-- ---------- audit_evidence ----------
drop policy if exists "evidence_select" on public.audit_evidence;
create policy "evidence_select"
  on public.audit_evidence for select
  using (
    public.is_active_user() and exists (
      select 1 from public.audit_findings f join public.audits a on a.id = f.audit_id
      where f.id = audit_evidence.finding_id
        and (
          public.current_role_name() = 'admin'
          or public.current_role_name() = 'viewer'
          or a.created_by = auth.uid()
          or a.auditor_id = auth.uid()
        )
    )
  );

drop policy if exists "evidence_insert" on public.audit_evidence;
create policy "evidence_insert"
  on public.audit_evidence for insert
  with check (
    public.is_active_user()
    and public.current_role_name() in ('admin', 'auditor')
    and exists (
      select 1 from public.audit_findings f join public.audits a on a.id = f.audit_id
      where f.id = audit_evidence.finding_id
        and (a.created_by = auth.uid() or a.auditor_id = auth.uid() or public.current_role_name() = 'admin')
    )
  );

drop policy if exists "evidence_delete" on public.audit_evidence;
create policy "evidence_delete"
  on public.audit_evidence for delete
  using (
    public.current_role_name() = 'admin'
    or uploaded_by = auth.uid()
  );

-- ---------- audit_signatures ----------
drop policy if exists "signatures_select" on public.audit_signatures;
create policy "signatures_select"
  on public.audit_signatures for select
  using (
    public.is_active_user() and exists (
      select 1 from public.audits a where a.id = audit_signatures.audit_id
        and (
          public.current_role_name() = 'admin'
          or public.current_role_name() = 'viewer'
          or a.created_by = auth.uid()
          or a.auditor_id = auth.uid()
        )
    )
  );

drop policy if exists "signatures_insert" on public.audit_signatures;
create policy "signatures_insert"
  on public.audit_signatures for insert
  with check (
    public.is_active_user()
    and public.current_role_name() in ('admin', 'auditor')
    and exists (
      select 1 from public.audits a where a.id = audit_signatures.audit_id
        and (a.created_by = auth.uid() or a.auditor_id = auth.uid() or public.current_role_name() = 'admin')
    )
  );

-- ---------- nora_conversations ----------
drop policy if exists "nora_select" on public.nora_conversations;
create policy "nora_select"
  on public.nora_conversations for select
  using (
    public.is_active_user() and exists (
      select 1 from public.audits a where a.id = nora_conversations.audit_id
        and (
          public.current_role_name() = 'admin'
          or a.created_by = auth.uid()
          or a.auditor_id = auth.uid()
        )
    )
  );

drop policy if exists "nora_insert" on public.nora_conversations;
create policy "nora_insert"
  on public.nora_conversations for insert
  with check (
    public.is_active_user() and exists (
      select 1 from public.audits a where a.id = nora_conversations.audit_id
        and (a.created_by = auth.uid() or a.auditor_id = auth.uid() or public.current_role_name() = 'admin')
    )
  );

-- ---------- audit_activity_log ----------
-- Nadie actualiza ni borra la bitácora directamente (integridad de auditoría).
drop policy if exists "activity_select" on public.audit_activity_log;
create policy "activity_select"
  on public.audit_activity_log for select
  using (
    public.current_role_name() = 'admin'
    or actor_id = auth.uid()
  );

drop policy if exists "activity_insert" on public.audit_activity_log;
create policy "activity_insert"
  on public.audit_activity_log for insert
  with check (public.is_active_user() and actor_id = auth.uid());
