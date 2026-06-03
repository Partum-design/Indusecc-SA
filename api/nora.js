module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  var apiKey = process.env.OPENAI_API_KEY;
  var model = process.env.OPENAI_MODEL || 'gpt-5.5';

  if (!apiKey) {
    return res.status(500).json({
      error: 'OPENAI_API_KEY no está configurada en el servidor.'
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

  var conversation = Array.isArray(payload.conversation) ? payload.conversation.slice(-12) : [];
  var contextLines = [];

  if (payload.activeIso) {
    contextLines.push('Norma activa: ' + safeText(payload.activeIso.code) + ' (' + safeText(payload.activeIso.version || 'N/D') + ').');
    if (payload.activeIso.focus) contextLines.push('Enfoque: ' + safeText(payload.activeIso.focus) + '.');
    if (payload.activeIso.summary) contextLines.push('Resumen: ' + safeText(payload.activeIso.summary) + '.');
  }

  if (payload.clause) {
    contextLines.push('Punto actual: ' + safeText(payload.clause.id) + ' - ' + safeText(payload.clause.title) + '.');
    if (payload.clause.definition) contextLines.push('Definición: ' + safeText(payload.clause.definition) + '.');
    if (payload.clause.question) contextLines.push('Pregunta de auditoría: ' + safeText(payload.clause.question) + '.');
  }

  if (payload.finding) {
    contextLines.push('Estado del punto: ' + safeText(payload.finding.status || 'Sin registrar') + '.');
    contextLines.push('Riesgo: ' + safeText(payload.finding.risk || 'Sin registrar') + '.');
    if (payload.finding.note) contextLines.push('Hallazgo: ' + safeText(payload.finding.note) + '.');
    if (payload.finding.action) contextLines.push('Acción: ' + safeText(payload.finding.action) + '.');
  }

  if (payload.project) {
    if (payload.project.name) contextLines.push('Proyecto: ' + safeText(payload.project.name) + '.');
    if (payload.project.auditor) contextLines.push('Auditor: ' + safeText(payload.project.auditor) + '.');
    if (payload.project.site) contextLines.push('Sitio: ' + safeText(payload.project.site) + '.');
    if (payload.project.scope) contextLines.push('Alcance: ' + safeText(payload.project.scope) + '.');
  }

  var systemPrompt = [
    'Eres NORA, una asistente experta en auditorías, normas ISO y control documental para INDUSECC.',
    'Responde SIEMPRE en español.',
    'Sé clara, práctica y profesional.',
    'No copies la norma literal ni redactes respuestas excesivamente largas.',
    'Prioriza pasos concretos, evidencia objetiva y recomendaciones aplicables.',
    'Si falta información, dilo de forma directa y pide el dato mínimo necesario.',
    'Cuando expliques un requisito, incluye ejemplos de evidencia o de llenado cuando sea útil.',
    'Formato recomendado: respuesta breve con viñetas o párrafos cortos.'
  ].join(' ');

  if (contextLines.length) {
    systemPrompt += '\n\nContexto operativo:\n' + contextLines.join('\n');
  }

  var messages = [
    { role: 'system', content: systemPrompt }
  ];

  for (var i = 0; i < conversation.length; i += 1) {
    var item = conversation[i] || {};
    if (!item.text) continue;
    messages.push({
      role: item.role === 'user' ? 'user' : 'assistant',
      content: String(item.text)
    });
  }

  messages.push({
    role: 'user',
    content: String(payload.question || '').trim() || 'Ayúdame con la auditoría.'
  });

  try {
    var response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: 0.3,
        max_tokens: 800
      })
    });

    var data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: extractOpenAiError(data)
      });
    }

    var text = extractAssistantText(data);
    if (!text) {
      return res.status(502).json({
        error: 'OpenAI respondió sin texto utilizable.'
      });
    }

    return res.status(200).json({
      text: text,
      model: model
    });
  } catch (error) {
    return res.status(500).json({
      error: error && error.message ? error.message : 'Error inesperado en NORA.'
    });
  }
};

function safeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function extractOpenAiError(data) {
  if (!data) return 'OpenAI respondió con un error desconocido.';
  if (data.error && data.error.message) return String(data.error.message);
  if (typeof data.error === 'string') return data.error;
  return 'OpenAI respondió con un error desconocido.';
}

function extractAssistantText(data) {
  if (!data || !data.choices || !data.choices.length) return '';
  var message = data.choices[0].message || {};
  if (typeof message.content === 'string') return message.content.trim();
  return '';
}
