/*
  Conector de NORA para Gemini.

  Este archivo no debe contener la API key. En producción usa el endpoint
  /api/nora, que ejecuta la llamada a Gemini del lado del servidor.
*/

(function () {
  'use strict';

  window.NORA_CONFIG = {
    provider: 'Google Gemini',
    model: 'gemini-2.5-flash-lite',
    endpoint: '/api/nora',
    async request(payload) {
      var headers = { 'Content-Type': 'application/json' };
      if (window.NORA_AUTH_TOKEN) {
        headers.Authorization = 'Bearer ' + window.NORA_AUTH_TOKEN;
      }

      var response = await fetch(this.endpoint, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload)
      });

      var data = {};
      try {
        data = await response.json();
      } catch (error) {
        data = {};
      }

      if (!response.ok) {
        var error = new Error(data && data.error ? String(data.error) : 'NORA no respondió correctamente.');
        if (response.status === 429) error.code = 'RATE_LIMIT';
        throw error;
      }

      return data;
    }
  };
}());
