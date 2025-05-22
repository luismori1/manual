import express from 'express';
import fetch from 'node-fetch';

const app = express();
app.use(express.json());

const SHEET_URL = 'https://sheets.googleapis.com/v4/spreadsheets/1-c0extZRAaB-JkxbemIvYJuOpg0YMk8SbyGUkP0Pghk/values/estado_bot!A:B?key=AIzaSyBux9xap8a3tEBlLalO9xJLTe2_F-8IKr4';
const ASSISTANT_URL = 'https://builderbot-openai-assistants-production-3a78.up.railway.app/v1/messages';

app.post('/udilab-filter', async (req, res) => {
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
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});
