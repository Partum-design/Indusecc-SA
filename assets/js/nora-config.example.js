/*
  Plantilla opcional para conectar NORA a Gemini sin quemar la clave
  dentro de assets/js/app.js.

  Uso recomendado:
  1. Duplica este archivo fuera del control de versiones o en tu pipeline seguro.
  2. Define window.NORA_CONFIG.request(payload) para transformar el contexto local
     del sistema en la llamada real a Gemini, idealmente desde un endpoint
     servidor como /api/nora.
  3. Devuelve una cadena o un objeto con text, answer, reply o message.

  Nota:
  - No guardes la API key real en archivos que sí se van a commitear.
  - Este proyecto ya funciona sin adaptador externo usando la base normativa local.
*/

window.NORA_CONFIG = {
  request: async function requestNora(payload) {
    /*
    Ejemplo orientativo:

    var response = await fetch('/api/nora', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error('NORA no respondió correctamente');
    }

    var data = await response.json();
    return data.reply || data.answer || data.text || '';
    */

    return '';
  }
};
