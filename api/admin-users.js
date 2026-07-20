const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

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
    const password = String(body.password || "");
    const fullName = String(body.fullName || "").trim();
    const role = ["admin", "auditor", "viewer"].includes(body.role) ? body.role : "viewer";
    if (!email || !email.includes("@") || password.length < 8) {
      return send(res, 400, { error: "Escribe un correo válido y una contraseña de al menos 8 caracteres." });
    }

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
      body: JSON.stringify({ full_name: fullName, role, active: body.active !== false })
    });
    if (!profileResponse.ok) {
      await supabaseFetch(`/auth/v1/admin/users/${created.id}`, { method: "DELETE" });
      return send(res, 500, { error: "La cuenta se creó, pero no fue posible preparar su perfil." });
    }

    return send(res, 201, { user: { id: created.id, email, full_name: fullName, role } });
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

  res.setHeader("Allow", "POST, DELETE");
  return send(res, 405, { error: "Método no permitido." });
}
