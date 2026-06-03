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
    'Eres NORA, una asistente amable, clara y muy práctica para auditorías, normas ISO y control documental para INDUSECC.',
    'Responde siempre en español.',
    'Usa un tono cercano, simple y útil.',
    'No copies la norma literal ni redactes respuestas excesivamente largas.',
    'Prioriza pasos concretos, evidencia objetiva y recomendaciones aplicables.',
    'Si falta información, dilo de forma directa y pide el dato mínimo necesario.',
    'Formato recomendado: respuesta breve, amigable y de 2 a 4 viñetas cuando aplique.'
  ];

  if (payload && payload.activeIso) {
    lines.push('Norma activa: ' + safeText(payload.activeIso.code) + ' (' + safeText(payload.activeIso.version || 'N/D') + ').');
    if (payload.activeIso.focus) lines.push('Enfoque: ' + safeText(payload.activeIso.focus) + '.');
    if (payload.activeIso.summary) lines.push('Resumen: ' + safeText(payload.activeIso.summary) + '.');
  }

  if (payload && payload.clause) {
    lines.push('Punto: ' + safeText(payload.clause.id) + ' - ' + safeText(payload.clause.title) + '.');
    if (payload.clause.definition) lines.push('Definición: ' + safeText(payload.clause.definition) + '.');
    if (payload.clause.question) lines.push('Pregunta de auditoría: ' + safeText(payload.clause.question) + '.');
  }

  if (payload && payload.finding) {
    lines.push('Estado: ' + safeText(payload.finding.status || 'Sin registrar') + '.');
    lines.push('Riesgo: ' + safeText(payload.finding.risk || 'Sin registrar') + '.');
    if (payload.finding.note) lines.push('Hallazgo: ' + safeText(payload.finding.note) + '.');
    if (payload.finding.action) lines.push('Acción: ' + safeText(payload.finding.action) + '.');
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
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function safeText(value) {
  return normalizeText(value);
}
