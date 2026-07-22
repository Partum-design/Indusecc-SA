-- =========================================================
-- 020b: Revoca el EXECUTE público sobre enforce_audit_limit()
-- =========================================================
-- enforce_audit_limit() (020) es una función de trigger: solo debe correr
-- de forma implícita en el BEFORE INSERT de audits, nunca como llamada
-- directa. Al crearse sin revoke, Postgres le deja EXECUTE a PUBLIC por
-- default y PostgREST la expone como /rest/v1/rpc/enforce_audit_limit,
-- callable incluso por anon (detectado por el advisor de seguridad de
-- Supabase justo después de aplicar 020). Los triggers no necesitan
-- EXECUTE otorgado al rol que dispara el INSERT -- mismo criterio que
-- public.set_updated_at() (001) y public.handle_new_user() (001), que
-- tampoco lo tienen.

revoke all on function public.enforce_audit_limit() from public, anon, authenticated;
