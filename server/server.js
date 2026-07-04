/**
 * Fake API simples (Express) para o teste de i18n + HTTP.
 * Não usamos o json-server "puro" porque ele não sabe ler o header
 * Accept-Language, e é exatamente esse comportamento que precisamos simular.
 *
 * Rodar com: node server/server.js
 * Requer:    npm install express cors
 */
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());

const DB_PATH = path.join(__dirname, 'db.json');
const DEFAULT_LANG = 'pt-BR';

app.get('/home-items', (req, res) => {
  // Toggle de teste: chamando /home-items?simulateError=true força um 500.
  // É isso que o checkbox "Simular erro" do header do Angular usa.
  if (req.query.simulateError === 'true') {
    return res.status(500).json({ message: 'Erro simulado para fins de teste.' });
  }

  const lang = req.header('Accept-Language') || DEFAULT_LANG;
  const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
  const items = db[lang] ?? db[DEFAULT_LANG];

  // pequeno atraso para simular latência real de rede
  setTimeout(() => res.status(200).json(items), 400);
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Fake API rodando em http://localhost:${PORT}/home-items`);
});
