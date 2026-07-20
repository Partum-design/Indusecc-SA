const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CONFIRM_PHRASE = "BORRAR TODO";
const BUCKETS = ["audit-evidence", "audit-signatures", "audit-exports"];
// Orden seguro respecto a llaves foráneas: hijos antes que padres.
const TABLES = [
  "audit_exports",
  "login_events",
  "audit_activity_log",
  "nora_conversations",
  "audit_evidence",
  "audit_signatures",
  "audit_findings",
  "audits"
];

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
      Prefer: "return=minimal",
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

async function emptyBucket(bucket) {
  const listResponse = await fetch(`${SUPABASE_URL}/storage/v1/object/list/${bucket}`, {
    method: "POST",
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ prefix: "", limit: 1000, offset: 0 })
  });
  if (!listResponse.ok) return;
  const folders = await listResponse.json();

  const paths = [];
  for (const entry of Array.isArray(folders) ? folders : []) {
    if (!entry || !entry.name || entry.id) continue;
    // Es una "carpeta" (uid de usuario): lista su contenido.
    const innerResponse = await fetch(`${SUPABASE_URL}/storage/v1/object/list/${bucket}`, {
      method: "POST",
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ prefix: entry.name + "/", limit: 1000, offset: 0 })
    });
    if (!innerResponse.ok) continue;
    const files = await innerResponse.json();
    for (const file of Array.isArray(files) ? files : []) {
      if (file && file.name) paths.push(`${entry.name}/${file.name}`);
    }
  }

  if (!paths.length) return;
  await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}`, {
    method: "DELETE",
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ prefixes: paths })
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return send(res, 405, { error: "Método no permitido." });
  }
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

  if (String(body.confirm || "").trim() !== CONFIRM_PHRASE) {
    return send(res, 400, { error: 'Escribe exactamente "' + CONFIRM_PHRASE + '" para confirmar.' });
  }

  for (const table of TABLES) {
    const response = await supabaseFetch(`/rest/v1/${table}?id=not.is.null`, { method: "DELETE" });
    if (!response.ok) {
      const detail = await response.text();
      return send(res, 500, { error: `No se pudo vaciar ${table}: ${detail.slice(0, 200)}` });
    }
  }

  for (const bucket of BUCKETS) {
    await emptyBucket(bucket);
  }

  return send(res, 200, { wiped: true });
}
