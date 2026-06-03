/*
  Conector seguro de NORA.

  Este archivo vive en el cliente, pero no expone la API key. En producción
  llama al endpoint /api/nora, que a su vez usa la clave en el servidor.
*/

(function () {
  'use strict';

  window.NORA_CONFIG = {
    provider: 'OpenAI',
    model: 'gpt-5.5',
    async request(payload) {
      var response = await fetch('/api/nora', {
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
