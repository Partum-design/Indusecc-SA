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
      var response = await fetch(this.endpoint, {
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
    }
  };
}());
