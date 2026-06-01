/*
  Plantilla opcional para conectar NORA a un servicio externo sin quemar la clave
  dentro de assets/js/app.js.

  Uso recomendado:
  1. Duplica este archivo fuera del control de versiones o en tu pipeline seguro.
  2. Define window.NORA_CONFIG.request(payload) para transformar el contexto local
     del sistema en la llamada real a tu proveedor.
  3. Devuelve una cadena o un objeto con text, answer, reply o message.

  Nota:
  - No guardes la API key real en archivos que sí se van a commitear.
  - Este proyecto ya funciona sin adaptador externo usando la base normativa local.
*/

window.NORA_CONFIG = {
  request: async function requestNora(payload) {
    /*
    Ejemplo orientativo:

    var response = await fetch('https://tu-endpoint-seguro.example/nora', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer TU_API_KEY_SEGURA'
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
