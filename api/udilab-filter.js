// api/udilab-filter.js
const fetch = require('node-fetch');

const SHEET_URL = 'https://sheets.googleapis.com/v4/spreadsheets/1-c0extZRAaB-JkxbemIvYJuOpg0YMk8SbyGUkP0Pghk/values/estado_bot!A:B?key=AIzaSyBux9xap8a3tEBlLalO9xJLTe2_F-8IKr4';
const ASSISTANT_URL = 'https://builderbot-openai-assistants-production-3a78.up.railway.app/v1/messages';

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { from, message } = req.body;

  try {
    const sheetResp = await fetch(SHEET_URL);
    const sheetJson = await sheetResp.json();
    const rows = sheetJson.values || [];

    const headers = rows[0];
    const data = rows.slice(1);

    const numeroIndex = headers.indexOf('numero');
    const manualIndex = headers.indexOf('manual_override');

    const row = data.find((r) => r[numeroIndex] === from);
    const silenciado = row && row[manualIndex] === 'TRUE';

    if (silenciado) {
      console.log(`[SILENCIADO] ${from} — Ignorado.`);
      return res.status(200).json({ status: 'silenciado' });
    }

    // Reenviar al Assistant
    const assistantResp = await fetch(ASSISTANT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, message })
    });

    const assistantText = await assistantResp.text();

    console.log(`[REENVIADO] ${from} — OK`);
    return res.status(200).json({ status: 'reenviado', assistantResponse: assistantText });

  } catch (err) {
    console.error('Error en proxy:', err);
    return res.status(500).json({ error: 'Error interno en proxy' });
  }
};
