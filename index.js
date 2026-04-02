require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Groq = require('groq-sdk');

const app = express();
const PORT = process.env.PORT || 8089;

app.use(cors());
app.use(express.json());

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Системный промпт — контекст умного дома iQuat
const SYSTEM_PROMPT = `Ты — AI-ассистент умного дома iQuat.
Ты помогаешь анализировать качество воздуха и климат в офисных помещениях 133-a и 133-b.
Отвечай кратко и по делу. Давай конкретные рекомендации на основе данных сенсоров.
Используй русский язык. Не используй markdown — только простой текст.
Упоминай конкретные значения из данных которые тебе передают.`;

// ── Эндпоинт конфига ──
app.get('/api/config', (req, res) => {
  res.json({
    ha_url: process.env.HA_URL,
    ha_token: process.env.HA_TOKEN,
  });
});

// ── Вариант A: короткий инсайт по текущим данным ──
app.post('/api/ai/insight', async (req, res) => {
  const { sensors } = req.body;

  if (!sensors) {
    return res.status(400).json({ error: 'sensors required' });
  }

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 150,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Текущие показатели воздуха:\n${JSON.stringify(sensors, null, 2)}\n\nДай краткий инсайт (1-2 предложения): как сейчас воздух и что рекомендуешь?` },
      ],
    });

    res.json({ insight: response.choices[0].message.content });
  } catch (err) {
    console.error('[AI Insight Error]', err.message);
    res.status(500).json({ error: 'AI недоступен', detail: err.message });
  }
});

// ── Вариант B: чат с историей сообщений ──
app.post('/api/ai/chat', async (req, res) => {
  const { messages, sensors } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages required' });
  }

  try {
    const systemWithContext = sensors
      ? `${SYSTEM_PROMPT}\n\nТекущее состояние дома:\n${JSON.stringify(sensors, null, 2)}`
      : SYSTEM_PROMPT;

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 400,
      messages: [
        { role: 'system', content: systemWithContext },
        ...messages,
      ],
    });

    res.json({ reply: response.choices[0].message.content });
  } catch (err) {
    console.error('[AI Chat Error]', err.message);
    res.status(500).json({ error: 'AI недоступен', detail: err.message });
  }
});

app.listen(PORT, '0.0.0.0',() => {
  console.log(`Сервер iQuat запущен на порту ${PORT}`);
});
