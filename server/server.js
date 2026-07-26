/**
 * Fake API simples (Express) para o teste de i18n + HTTP.
 * Adaptado para servir a estrutura unificada de "homeItems".
 *
 * Rodar com: npm run server (via script criado no package.json)
 * Requer:    npm install express cors
 */
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());

const DB_PATH = path.join(__dirname, 'db.json');

// CORREÇÃO: Alinhando a rota com a chave do seu db.json e a chamada do Angular
app.get('/apiHomeItems', (req, res) => {

  // Mantém o seu Toggle de teste para o checkbox "Simular erro" do Angular
  if (req.query.simulateError === 'true') {
    return res.status(500).json({ message: 'Erro simulado para fins de teste.' });
  }

  try {
    // Lê o seu arquivo db.json atualizado
    const dbData = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));

    // Captura o array de dentro da chave "apiHomeItems"
    const homeItemsResponse = dbData.apiHomeItems || [];

    // Pequeno atraso para simular latência real de rede e ver o Loader piscando
    setTimeout(() => {
      res.status(200).json(homeItemsResponse);
    }, 3000);

  } catch (error) {
    console.error(':: [Server Error] Falha ao ler o arquivo db.json:', error);
    res.status(500).json({ message: 'Erro interno ao processar o banco de dados fake.' });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  // Atualizado o log para refletir a nova rota padrão do ecossistema do seu app
  console.log(`:: [Server] Fake API ativa rodando em http://localhost:${PORT}/apiHomeItems`);
});
