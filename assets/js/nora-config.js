/*
  Conector seguro de NORA.

  Este archivo vive en el cliente, pero no expone la API key. En producción
  llama al endpoint /api/nora, que a su vez usa la clave en el servidor.
  Si necesitas probar una key localmente, define window.NORA_OPENAI_API_KEY
  en un archivo privado que no se suba al repo.
*/

(function () {
  'use strict';

  window.NORA_CONFIG = {
    provider: 'OpenAI',
    model: 'gpt-5.5',
    endpoint: '/api/nora',
    apiKey: '',
    openaiApiKey: '',
    async request(payload) {
      var endpointError = null;

      if (this.endpoint) {
        try {
          return await this.requestViaEndpoint(this.endpoint, payload);
        } catch (error) {
          endpointError = error;
        }
      }

      if (this.getBrowserApiKey()) {
        return this.requestDirect(payload);
      }

      if (endpointError) {
        throw endpointError;
      }

      throw new Error('NORA no respondió correctamente.');
    },

    getBrowserApiKey() {
      return String(this.apiKey || this.openaiApiKey || window.NORA_OPENAI_API_KEY || '').trim();
    },

    async requestViaEndpoint(endpoint, payload) {
      var response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      var data = {};
      try {
        data = await response.json();
      } catch (error) {
        data = {};
      }

      if (!response.ok) {
        throw new Error(data && data.error ? String(data.error) : 'NORA no respondió correctamente.');
      }

      return data;
    },

    async requestDirect(payload) {
      var apiKey = this.getBrowserApiKey();
      if (!apiKey) {
        throw new Error('Falta la API key para la conexión directa de NORA.');
      }

      var messages = buildMessagesForDirectRequest(payload);
      var response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + apiKey
        },
        body: JSON.stringify({
          model: this.model,
          messages: messages,
          temperature: 0.3,
          max_tokens: 800
        })
      });

      var data = {};
      try {
        data = await response.json();
      } catch (error) {
        data = {};
      }

      if (!response.ok) {
        throw new Error(extractDirectError(data));
      }

      var text = extractAssistantText(data);
      if (!text) {
        throw new Error('OpenAI respondió sin texto utilizable.');
      }

      return { text: text, model: this.model };
    }
  };

  function buildMessagesForDirectRequest(payload) {
    var messages = [
      { role: 'system', content: buildSystemPrompt(payload) }
    ];
    var conversation = Array.isArray(payload && payload.conversation) ? payload.conversation : [];
    var i;

    for (i = 0; i < conversation.length; i += 1) {
      var item = conversation[i] || {};
      if (!item.text) continue;
      messages.push({
        role: item.role === 'user' ? 'user' : 'assistant',
        content: String(item.text)
      });
    }

    messages.push({
      role: 'user',
      content: String(payload && payload.question ? payload.question : '').trim() || 'Ayúdame con la auditoría.'
    });

    return messages;
  }

  function buildSystemPrompt(payload) {
    var lines = [
      'Eres NORA, una asistente amable, clara y muy práctica para auditorías y normas ISO de INDUSECC.',
      'Responde siempre en español.',
      'Usa un tono cercano, sencillo y útil.',
      'Evita respuestas largas; prioriza frases cortas y, cuando aplique, 2 a 4 viñetas.',
      'No repitas la norma de forma literal.',
      'Da ejemplos concretos de evidencia, llenado o acción cuando ayuden.',
      'Si falta información, pide solo lo mínimo necesario.'
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

  function safeText(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function extractDirectError(data) {
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
}());
