import { randomBytes } from "crypto";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PASSWORD_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

async function supabaseFetch(path, options = {}) {
  return fetch(`${SUPABASE_URL}${path}`, {
    ...options,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(options.headers || {})
    }
  });
}

async function requireAdmin(req) {
  const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) return null;

  const userResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${token}` }
  });
  if (!userResponse.ok) return null;
  const user = await userResponse.json();

  const profileResponse = await supabaseFetch(
    `/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=id,role,active`
  );
  const profiles = profileResponse.ok ? await profileResponse.json() : [];
  const profile = profiles[0];
  return profile && profile.active && profile.role === "admin" ? user : null;
}

function parseAuditLimit(value) {
  if (value === null || value === undefined || value === "") return { ok: true, value: null };
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) return { ok: false };
  return { ok: true, value: n };
}

function generatePassword() {
  const bytes = randomBytes(16);
  let out = "";
  for (let i = 0; i < 14; i += 1) {
    out += PASSWORD_CHARS[bytes[i] % PASSWORD_CHARS.length];
  }
  return out;
}

function siteOrigin(req) {
  const configured = process.env.APP_URL;
  if (configured) return configured.replace(/\/$/, "");
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const proto = req.headers["x-forwarded-proto"] || "https";
  return host ? `${proto}://${host}` : "";
}

function requestPasswordEmail(req, email) {
  // Se dispara sin esperar la respuesta: el correo de Supabase puede tardar o fallar
  // (sobre todo sin SMTP propio configurado) y nunca debe bloquear ni tumbar la petición.
  const origin = siteOrigin(req);
  const redirect = origin ? `${origin}/reset.html` : undefined;
  const path = redirect ? `/auth/v1/recover?redirect_to=${encodeURIComponent(redirect)}` : "/auth/v1/recover";
  supabaseFetch(path, {
    method: "POST",
    body: JSON.stringify({ email })
  }).catch(() => {});
}

export default async function handler(req, res) {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    return send(res, 503, { error: "Falta configurar Supabase en el servidor." });
  }

  const admin = await requireAdmin(req);
  if (!admin) return send(res, 403, { error: "Se requiere una sesión de administrador." });

  let body = {};
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  } catch {
    return send(res, 400, { error: "La solicitud no contiene JSON válido." });
  }

  if (req.method === "POST") {
    const email = String(body.email || "").trim().toLowerCase();
    const fullName = String(body.fullName || "").trim();
    const role = ["admin", "auditor", "viewer"].includes(body.role) ? body.role : "viewer";
    const phone = String(body.phone || "").trim();
    const department = String(body.department || "").trim();
    const organizationId = body.organizationId ? String(body.organizationId) : null;
    const autoPassword = !body.password;
    const password = autoPassword ? generatePassword() : String(body.password);

    if (!email || !email.includes("@") || password.length < 8) {
      return send(res, 400, { error: "Escribe un correo válido y una contraseña de al menos 8 caracteres." });
    }

    const auditLimitParsed = parseAuditLimit(body.auditLimit);
    if (!auditLimitParsed.ok) {
      return send(res, 400, { error: "El límite de auditorías debe ser un entero positivo, o vacío para ilimitadas." });
    }
    const auditLimit = auditLimitParsed.value;

    const createResponse = await supabaseFetch("/auth/v1/admin/users", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName }
      })
    });
    const created = await createResponse.json();
    if (!createResponse.ok) {
      return send(res, createResponse.status, { error: created.msg || created.message || "No se pudo crear el usuario." });
    }

    await new Promise((resolve) => setTimeout(resolve, 180));
    const profileResponse = await supabaseFetch(`/rest/v1/profiles?id=eq.${encodeURIComponent(created.id)}`, {
      method: "PATCH",
      body: JSON.stringify({ full_name: fullName, role, active: body.active !== false, phone, department, organization_id: organizationId, audit_limit: auditLimit })
    });
    if (!profileResponse.ok) {
      await supabaseFetch(`/auth/v1/admin/users/${created.id}`, { method: "DELETE" });
      return send(res, 500, { error: "La cuenta se creó, pero no fue posible preparar su perfil." });
    }

    const emailRequested = Boolean(body.sendEmail);
    if (emailRequested) requestPasswordEmail(req, email);

    return send(res, 201, {
      user: { id: created.id, email, full_name: fullName, role },
      tempPassword: password,
      emailSent: emailRequested
    });
  }

  if (req.method === "PATCH") {
    const userId = String(body.userId || "");
    if (!userId) return send(res, 400, { error: "Falta el usuario a modificar." });

    const patch = {};
    if (typeof body.fullName === "string") patch.full_name = body.fullName.trim();
    if (["admin", "auditor", "viewer"].includes(body.role)) patch.role = body.role;
    if (typeof body.active === "boolean") patch.active = body.active;
    if (typeof body.phone === "string") patch.phone = body.phone.trim();
    if (typeof body.department === "string") patch.department = body.department.trim();
    if ("organizationId" in body) patch.organization_id = body.organizationId ? String(body.organizationId) : null;
    if ("auditLimit" in body) {
      const auditLimitParsed = parseAuditLimit(body.auditLimit);
      if (!auditLimitParsed.ok) {
        return send(res, 400, { error: "El límite de auditorías debe ser un entero positivo, o vacío para ilimitadas." });
      }
      patch.audit_limit = auditLimitParsed.value;
    }

    if (userId === admin.id && (patch.role || typeof patch.active === "boolean")) {
      return send(res, 400, { error: "No puedes cambiar tu propio rol o estado desde este panel." });
    }

    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (email) {
      const emailUpdate = await supabaseFetch(`/auth/v1/admin/users/${encodeURIComponent(userId)}`, {
        method: "PUT",
        body: JSON.stringify({ email, email_confirm: true })
      });
      if (!emailUpdate.ok) {
        const detail = await emailUpdate.json();
        return send(res, emailUpdate.status, { error: detail.msg || detail.message || "No se pudo actualizar el correo." });
      }
      patch.email = email;
    }

    let tempPassword = null;
    let emailSent = false;
    if (body.resetPassword) {
      tempPassword = generatePassword();
      const passwordUpdate = await supabaseFetch(`/auth/v1/admin/users/${encodeURIComponent(userId)}`, {
        method: "PUT",
        body: JSON.stringify({ password: tempPassword })
      });
      if (!passwordUpdate.ok) {
        const detail = await passwordUpdate.json();
        return send(res, passwordUpdate.status, { error: detail.msg || detail.message || "No se pudo restablecer la contraseña." });
      }
      const targetEmail = email || String(body.currentEmail || "");
      if (targetEmail && body.sendEmail !== false) {
        requestPasswordEmail(req, targetEmail);
        emailSent = true;
      }
    } else if (body.resendAccessEmail) {
      // A diferencia de resetPassword, esto NO genera ni cambia la contraseña:
      // solo reenvía el enlace de acceso, así que no invalida la sesión ni la
      // contraseña de alguien que ya está usando su cuenta con normalidad.
      const targetEmail = email || String(body.currentEmail || "");
      if (!targetEmail) return send(res, 400, { error: "Falta el correo de la persona." });
      requestPasswordEmail(req, targetEmail);
      emailSent = true;
    }

    if (Object.keys(patch).length) {
      const profileUpdate = await supabaseFetch(`/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}`, {
        method: "PATCH",
        body: JSON.stringify(patch)
      });
      if (!profileUpdate.ok) {
        return send(res, 500, { error: "No se pudo actualizar el perfil." });
      }
    }

    return send(res, 200, { updated: true, tempPassword, emailSent });
  }

  if (req.method === "DELETE") {
    const userId = String(body.userId || "");
    if (!userId || userId === admin.id) {
      return send(res, 400, { error: "No puedes eliminar tu propia cuenta desde este panel." });
    }

    const auditResponse = await supabaseFetch(`/rest/v1/audits?or=(created_by.eq.${userId},auditor_id.eq.${userId})&select=id&limit=1`);
    const audits = auditResponse.ok ? await auditResponse.json() : [];
    if (audits.length) {
      return send(res, 409, {
        error: "Este usuario tiene auditorías asociadas. Desactívalo para conservar la trazabilidad."
      });
    }

    const deleteResponse = await supabaseFetch(`/auth/v1/admin/users/${encodeURIComponent(userId)}`, {
      method: "DELETE"
    });
    if (!deleteResponse.ok) {
      const detail = await deleteResponse.json();
      return send(res, deleteResponse.status, { error: detail.msg || detail.message || "No se pudo eliminar el usuario." });
    }
    return send(res, 200, { deleted: true });
  }

  res.setHeader("Allow", "POST, PATCH, DELETE");
  return send(res, 405, { error: "Método no permitido." });
}
