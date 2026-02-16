// iquat-backend/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors()); // Чтобы мобильное приложение могло достучаться до сервера
app.use(express.json());

// Эндпоинт для получения настроек
app.get('/api/config', (req, res) => {
  // В будущем сюда можно добавить проверку ключа API в заголовках
  res.json({
    ha_url: process.env.HA_URL,
    ha_token: process.env.HA_TOKEN
  });
});

app.listen(PORT, () => {
  console.log(`Сервер iQuat запущен на порту ${PORT}`);
});