var SUPABASE_URL = process.env.SUPABASE_URL;
var SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
var NORA_DAILY_LIMIT_PER_USER = parseInt(process.env.NORA_DAILY_LIMIT_PER_USER, 10) || 40;
var NORA_DAILY_LIMIT_GLOBAL = parseInt(process.env.NORA_DAILY_LIMIT_GLOBAL, 10) || 300;

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  var apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || process.env.NORA_GEMINI_API_KEY;
  var model = process.env.GEMINI_MODEL || process.env.GOOGLE_MODEL || process.env.NORA_GEMINI_MODEL || 'gemini-2.5-flash-lite';

  if (!apiKey) {
    return res.status(500).json({
      error: 'Falta configurar GOOGLE_API_KEY o GEMINI_API_KEY en el servidor.'
    });
  }

  var quota = await checkNoraQuota(req);
  if (quota && quota.allowed === false) {
    return res.status(429).json({ error: quota.message });
  }

  var payload = req.body || {};
  if (typeof payload === 'string') {
    try {
      payload = JSON.parse(payload);
    } catch (error) {
      payload = {};
    }
  }

  var conversation = normalizeConversation(payload.conversation, payload.question);
  var systemPrompt = buildSystemPrompt(payload);
  var contents = buildContents(conversation, payload.question);

  try {
    var response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        contents: contents,
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 512
        }
      })
    });

    var data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: extractGeminiError(data)
      });
    }

    var text = extractGeminiText(data);
    if (!text) {
      return res.status(502).json({
        error: 'Gemini respondió sin texto utilizable.'
      });
    }

    return res.status(200).json({
      text: text,
      model: model,
      provider: 'Google Gemini'
    });
  } catch (error) {
    return res.status(500).json({
      error: error && error.message ? error.message : 'Error inesperado en NORA.'
    });
  }
};

function normalizeConversation(conversation, question) {
  var source = Array.isArray(conversation) ? conversation.slice(-12) : [];
  var normalized = [];
  var i;
  var questionText = normalizeText(question);

  for (i = 0; i < source.length; i += 1) {
    var item = source[i] || {};
    var text = normalizeText(item.text);
    if (!text) continue;
    if (i === source.length - 1 && item.role === 'user' && questionText && text === questionText) {
      continue;
    }
    normalized.push({
      role: item.role === 'user' ? 'user' : 'model',
      text: text
    });
  }

  return normalized;
}

function buildContents(conversation, question) {
  var contents = [];
  var i;

  for (i = 0; i < conversation.length; i += 1) {
    contents.push({
      role: conversation[i].role,
      parts: [{ text: conversation[i].text }]
    });
  }

  contents.push({
    role: 'user',
    parts: [{ text: normalizeText(question) || 'Ayúdame con la auditoría.' }]
  });

  return contents;
}

function buildSystemPrompt(payload) {
  var lines = [
    'Eres NORA, copiloto profesional de auditorías ISO para INDUSECC.',
    'Responde siempre en español.',
    'Tu trabajo es ayudar a tomar la siguiente decisión, no dar teoría genérica.',
    'Usa lenguaje claro, directo y profesional; evita introducciones, elogios, relleno y frases de asistente artificial.',
    'No inventes evidencia ni afirmes cumplimiento sin datos del auditor.',
    'Prioriza hechos verificables, trazabilidad, riesgos y acciones aplicables.',
    'Si falta información, identifica exactamente qué dato falta y formula una sola pregunta útil.',
    'Cuando el usuario pida llenar un punto, ayuda a completar Conformidad, Hallazgo/observación, Acción o plan de mejora y Evidencia sugerida.',
    'Para llenado de puntos, incluye un borrador breve y editable claramente marcado como borrador; no lo presentes como hecho si falta evidencia.',
    'Usa encabezados cortos y máximo 5 viñetas. Mantén la respuesta debajo de 220 palabras salvo que el usuario pida más detalle.'
  ];

  if (payload && payload.intent === 'fill') {
    lines.push('Intención detectada: ayudar a llenar el punto. Responde con: 1) qué pide el punto, 2) cómo marcar conformidad, 3) texto sugerido para hallazgo/observación, 4) acción recomendada, 5) evidencia sugerida.');
  }

  if (payload && payload.activeIso) {
    lines.push('Norma activa: ' + safeText(payload.activeIso.code) + ' (' + safeText(payload.activeIso.version || 'N/D') + ').');
    if (payload.activeIso.focus) lines.push('Enfoque: ' + safeText(payload.activeIso.focus) + '.');
    if (payload.activeIso.summary) lines.push('Resumen: ' + safeText(payload.activeIso.summary) + '.');
  }

  if (payload && payload.clause) {
    lines.push('Punto: ' + safeText(payload.clause.id) + ' - ' + safeText(payload.clause.title) + '.');
    if (payload.clause.definition) lines.push('Definición: ' + safeText(payload.clause.definition) + '.');
    if (payload.clause.question) lines.push('Pregunta de auditoría: ' + safeText(payload.clause.question) + '.');
    if (payload.clause.evidence && payload.clause.evidence.length) lines.push('Evidencia sugerida: ' + safeText(payload.clause.evidence.join(', ')) + '.');
  }

  if (payload && payload.finding) {
    lines.push('Estado: ' + safeText(payload.finding.status || 'Sin registrar') + '.');
    lines.push('Riesgo: ' + safeText(payload.finding.risk || 'Sin registrar') + '.');
    if (payload.finding.note) lines.push('Hallazgo: ' + safeText(payload.finding.note) + '.');
    if (payload.finding.action) lines.push('Acción: ' + safeText(payload.finding.action) + '.');
  }

  if (payload && payload.auditSummary) {
    lines.push('Avance: ' + safeText(payload.auditSummary.progress || 0) + '%; ' + safeText(payload.auditSummary.evaluated || 0) + ' de ' + safeText(payload.auditSummary.total || 0) + ' requisitos evaluados.');
    lines.push('Pendientes: ' + safeText(payload.auditSummary.remaining || 0) + '; cumplen: ' + safeText(payload.auditSummary.ok || 0) + '; parciales: ' + safeText(payload.auditSummary.partial || 0) + '; no cumplen: ' + safeText(payload.auditSummary.bad || 0) + '; evidencias: ' + safeText(payload.auditSummary.evidenceTotal || 0) + '.');
    if (payload.auditSummary.nextClauseId) lines.push('Siguiente requisito pendiente: ' + safeText(payload.auditSummary.nextClauseId) + ' - ' + safeText(payload.auditSummary.nextClauseTitle || '') + '.');
  }

  if (payload && payload.project) {
    if (payload.project.name) lines.push('Proyecto: ' + safeText(payload.project.name) + '.');
    if (payload.project.auditor) lines.push('Auditor: ' + safeText(payload.project.auditor) + '.');
    if (payload.project.site) lines.push('Sitio: ' + safeText(payload.project.site) + '.');
    if (payload.project.scope) lines.push('Alcance: ' + safeText(payload.project.scope) + '.');
  }

  return lines.join(' ');
}

function extractGeminiText(data) {
  if (!data) return '';
  if (typeof data.text === 'string') return data.text.trim();

  if (Array.isArray(data.candidates)) {
    var i;
    for (i = 0; i < data.candidates.length; i += 1) {
      var candidate = data.candidates[i] || {};
      var content = candidate.content || {};
      var parts = Array.isArray(content.parts) ? content.parts : [];
      var text = parts.map(function (part) {
        return part && typeof part.text === 'string' ? part.text : '';
      }).join('').trim();
      if (text) return text;
    }
  }

  return '';
}

function extractGeminiError(data) {
  if (!data) return 'Gemini respondió con un error desconocido.';
  if (data.error && data.error.message) return String(data.error.message);
  if (typeof data.error === 'string') return data.error;
  if (data.promptFeedback && data.promptFeedback.blockReason) {
    return 'La solicitud fue bloqueada por seguridad: ' + String(data.promptFeedback.blockReason);
  }
  return 'Gemini respondió con un error desconocido.';
}

function normalizeText(value) {
  return String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
}

function safeText(value) {
  return normalizeText(value);
}

function clientIp(req) {
  var forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length) return forwarded.split(',')[0].trim();
  return (req.socket && req.socket.remoteAddress) || 'unknown';
}

async function resolveNoraIdentity(req) {
  var token = String((req.headers && req.headers.authorization) || '').replace(/^Bearer\s+/i, '');
  if (token) {
    try {
      var userResponse = await fetch(SUPABASE_URL + '/auth/v1/user', {
        headers: { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: 'Bearer ' + token }
      });
      if (userResponse.ok) {
        var user = await userResponse.json();
        if (user && user.id) return 'user:' + user.id;
      }
    } catch (error) {
      // Si falla la validación de sesión, se usa la IP como respaldo.
    }
  }
  return 'ip:' + clientIp(req);
}

async function registerNoraUsage(identity, max) {
  var response = await fetch(SUPABASE_URL + '/rest/v1/rpc/nora_register_usage', {
    method: 'POST',
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: 'Bearer ' + SUPABASE_SERVICE_ROLE_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ p_identity: identity, p_max: max })
  });
  if (!response.ok) return null;
  var data = await response.json();
  return Array.isArray(data) ? data[0] : data;
}

// Límite antiabuso: si Supabase no está configurado o la comprobación falla,
// se deja pasar la solicitud (el gasto ya está acotado por maxOutputTokens y
// el modelo económico por defecto); esto solo añade un tope diario extra.
async function checkNoraQuota(req) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;

  try {
    var globalResult = await registerNoraUsage('__global__', NORA_DAILY_LIMIT_GLOBAL);
    if (globalResult && globalResult.allowed === false) {
      return {
        allowed: false,
        message: 'NORA alcanzó su límite diario de uso en toda la plataforma. Vuelve a intentarlo mañana.'
      };
    }

    var identity = await resolveNoraIdentity(req);
    var identityResult = await registerNoraUsage(identity, NORA_DAILY_LIMIT_PER_USER);
    if (identityResult && identityResult.allowed === false) {
      return {
        allowed: false,
        message: 'Alcanzaste tu límite diario de ' + NORA_DAILY_LIMIT_PER_USER + ' consultas a NORA. Vuelve a intentarlo mañana.'
      };
    }

    return { allowed: true };
  } catch (error) {
    return null;
  }
}
