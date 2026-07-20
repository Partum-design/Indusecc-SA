const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function clientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length) return forwarded.split(",")[0].trim();
  return req.socket && req.socket.remoteAddress ? req.socket.remoteAddress : null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return send(res, 405, { error: "Método no permitido." });
  }
  if (!SUPABASE_URL || !SERVICE_KEY) {
    return send(res, 503, { error: "Falta configurar Supabase en el servidor." });
  }

  const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) return send(res, 401, { error: "Falta la sesión." });

  const userResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${token}` }
  });
  if (!userResponse.ok) return send(res, 401, { error: "Sesión inválida." });
  const user = await userResponse.json();

  const insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/login_events`, {
    method: "POST",
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal"
    },
    body: JSON.stringify({
      user_id: user.id,
      email: user.email,
      ip: clientIp(req),
      user_agent: String(req.headers["user-agent"] || "").slice(0, 300)
    })
  });

  if (!insertResponse.ok) {
    return send(res, 500, { error: "No se pudo registrar la conexión." });
  }
  return send(res, 200, { logged: true });
}
