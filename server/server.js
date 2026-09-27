/**
 * Fake API simples (Express) para teste de i18n + HTTP.
 *
 * Endpoints:
 *
 * GET  /apiFF
 *      - Recebe
 *      - Retorna
 *
 *
 * * GET  /apiFFHarness
 *      - Retorna o array de evaluations de feature flags no formato
 *        do Harness FF (flag, identifier, kind, value)
 *
 *
 * GET  /apiHomeItems
 *      - Recebe Accept-Language
 *      - Retorna somente o bloco correspondente ao idioma
 *
 * GET  /apiLanguagePreference
 *      - Recupera a última preferência salva
 *      - Quando não existe preferência, retorna { lang: null }
 *
 * POST /apiLanguagePreference
 *      - Recebe Accept-Language
 *      - Persiste a preferência
 *
 * Rodar com:
 * npm run server
 *
 * Requer:
 * npm install express cors
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();

app.use(cors());

const DB_PATH = path.join(__dirname, 'db.json');
const LANGUAGE_HEADER = 'accept-language';


// -----------------------------------------------------------------------------
// Helpers de leitura/escrita do db.json
// -----------------------------------------------------------------------------

function readDb() {
  const raw = fs.readFileSync(DB_PATH, 'utf-8');
  return JSON.parse(raw);
}

function writeDb(db) {
  fs.writeFileSync(
    DB_PATH,
    JSON.stringify(db, null, 2),
    'utf-8'
  );
}


// -----------------------------------------------------------------------------
// Resolve o primeiro idioma de um Accept-Language.
//
// Exemplos:
//
// "pt-BR"
// "en-US,en;q=0.9"
// "pt-BR,pt;q=0.9,en-US;q=0.8"
// -----------------------------------------------------------------------------

function parsePrimaryLanguage(headerValue) {
  if (!headerValue) {
    return null;
  }

  return headerValue
    .split(',')[0]
    .split(';')[0]
    .trim();
}


// -----------------------------------------------------------------------------
// GET /apiLanguagePreference
//
// Recupera a última preferência salva.
//
// Importante:
// Quando não existe preferência, NÃO retornamos 404.
// Retornamos 200 com:
//
// {
//   "lang": null
// }
//
// Isso permite que o frontend trate "não existe preferência" como uma
// situação de negócio normal, e não como erro HTTP.
// -----------------------------------------------------------------------------

app.get('/apiLanguagePreference', (req, res) => {
  console.log(
    ':: [Server] GET /apiLanguagePreference'
  );

  try {
    const dbData = readDb();

    const preferences = Array.isArray(dbData.languagePreference)
      ? dbData.languagePreference
      : [];

    const lastPreference = preferences.length > 0
      ? preferences[preferences.length - 1]
      : null;

    if (!lastPreference?.lang) {
      console.log(
        ':: [Server] nenhuma preferência de idioma encontrada → lang: null'
      );

      return res.status(200).json({
        lang: null
      });
    }

    console.log(
      ':: [Server] preferência encontrada:',
      lastPreference
    );

    return res.status(200).json({
      lang: lastPreference.lang,
      updatedAt: lastPreference.updatedAt
    });

  } catch (error) {
    console.error(
      ':: [Server Error] Falha ao ler preferência:',
      error
    );

    return res.status(500).json({
      message: 'Erro interno ao consultar a preferência de idioma.'
    });
  }
});


// -----------------------------------------------------------------------------
// GET /apiFF
//
// Retorna o bloco de feature flags mockadas do db.json.
//
// Hoje existem 2 formatos de flag:
//   - boolean → ex: "newDash": true
//   - string  → ex: "allowedUsers": "[\"Cida\",\"João\",\"Bernadete123\"]"
//
// Importante:
// O valor de flags do tipo string é retornado exatamente como está
// persistido no db.json (uma string, não um array). Isso simula o
// comportamento real do Harness FF, onde flags "string" chegam como
// texto puro — o parsing (se necessário) é responsabilidade de quem
// consome a flag no frontend.
// -----------------------------------------------------------------------------

app.get('/apiFF', (req, res) => {
  console.log(
    ':: [Server] GET /apiFF'
  );

  try {
    const dbData = readDb();

    const featureFlags = dbData.apiFF || {};

    console.log(
      ':: [Server] feature flags retornadas:',
      featureFlags
    );

    return res.status(200).json(featureFlags);

  } catch (error) {
    console.error(
      ':: [Server Error] Falha ao ler feature flags:',
      error
    );

    return res.status(500).json({
      message: 'Erro interno ao consultar as feature flags.'
    });
  }
});



// -----------------------------------------------------------------------------
// GET /apiFFHarness
//
// Retorna o array de evaluations de feature flags no formato do Harness FF
// (o mesmo shape que o SDK real devolve numa bulk evaluation).
//
// Cada item segue:
//   {
//     flag: string,                 // identificador da flag
//     identifier: string,           // identificador da variação retornada
//     kind: 'boolean' | 'string',   // tipo declarado da flag
//     value: boolean | string       // valor da variação
//   }
//
// Diferente do /apiFF (objeto único, formato antigo), aqui devolvemos a
// lista como o Harness devolveria numa consulta de bulk evaluation contra
// um target — é esse formato que a interface deve passar a consumir daqui
// pra frente.
// -----------------------------------------------------------------------------

app.get('/apiFFHarness', (req, res) => {
  console.log(
    ':: [Server] GET /apiFFHarness'
  );

  try {
    const dbData = readDb();

    const featureFlags = Array.isArray(dbData.apiFFHarness)
      ? dbData.apiFFHarness
      : [];

    console.log(
      ':: [Server] evaluations retornadas:',
      featureFlags
    );

    return res.status(200).json(featureFlags);

  } catch (error) {
    console.error(
      ':: [Server Error] Falha ao ler evaluations de feature flags:',
      error
    );

    return res.status(500).json({
      message: 'Erro interno ao consultar as feature flags do Harness.'
    });
  }
});


// -----------------------------------------------------------------------------
// GET /apiHomeItems
//
// Recebe o idioma exclusivamente pelo Accept-Language.
// -----------------------------------------------------------------------------

app.get('/apiHomeItems', (req, res) => {

  // Toggle utilizado para testes de erro.
  if (req.query.simulateError === 'true') {
    return res.status(500).json({
      message: 'Erro simulado para fins de teste.'
    });
  }

  const rawHeader = req.headers[LANGUAGE_HEADER];
  const requestedLang = parsePrimaryLanguage(rawHeader);

  console.log(
    ':: [Server] GET /apiHomeItems',
    '— Accept-Language recebido:',
    rawHeader,
    '→ resolvido para:',
    requestedLang
  );

  if (!requestedLang) {
    console.warn(
      ':: [Server] requisição sem header Accept-Language — 400'
    );

    return res.status(400).json({
      message: 'Header Accept-Language é obrigatório.'
    });
  }

  try {
    const dbData = readDb();

    const block = (dbData.apiHomeItems || [])
      .find((entry) => entry.lang === requestedLang);

    if (!block) {
      console.warn(
        ':: [Server] nenhum bloco encontrado para o idioma:',
        requestedLang
      );

      return res.status(404).json({
        message: `Nenhum conteúdo para o idioma "${requestedLang}".`
      });
    }

    // Simula latência de rede.
    setTimeout(() => {

      console.log(
        ':: [Server] conteúdo retornado para:',
        requestedLang
      );

      res.status(200).json(block);

    }, 3000);

  } catch (error) {

    console.error(
      ':: [Server Error] Falha ao ler o arquivo db.json:',
      error
    );

    res.status(500).json({
      message: 'Erro interno ao processar o banco de dados fake.'
    });
  }
});


// -----------------------------------------------------------------------------
// POST /apiLanguagePreference
//
// Persiste a preferência enviada pelo frontend.
//
// O idioma vem exclusivamente no:
//
// Accept-Language
// -----------------------------------------------------------------------------

app.post('/apiLanguagePreference', (req, res) => {

  // Toggle utilizado para simular falha no POST.
  if (req.query.simulateError === 'true') {
    return res.status(500).json({
      message: 'Erro simulado para fins de teste.'
    });
  }

  const rawHeader = req.headers[LANGUAGE_HEADER];
  const requestedLang = parsePrimaryLanguage(rawHeader);

  console.log(
    ':: [Server] POST /apiLanguagePreference',
    '— Accept-Language recebido:',
    rawHeader,
    '→ resolvido para:',
    requestedLang
  );

  if (!requestedLang) {
    console.warn(
      ':: [Server] POST sem header Accept-Language — 400'
    );

    return res.status(400).json({
      message: 'Header Accept-Language é obrigatório.'
    });
  }

  try {

    const dbData = readDb();

    if (!Array.isArray(dbData.languagePreference)) {
      dbData.languagePreference = [];
    }

    // Mantém somente a preferência mais recente.
    const entry = {
      lang: requestedLang,
      updatedAt: new Date().toISOString()
    };

    dbData.languagePreference = [entry];

    writeDb(dbData);

    // Simula latência de rede.
    setTimeout(() => {

      console.log(
        ':: [Server] preferência salva com sucesso:',
        entry
      );

      res.status(200).json(entry);

    }, 3000);

  } catch (error) {

    console.error(
      ':: [Server Error] Falha ao gravar no db.json:',
      error
    );

    res.status(500).json({
      message: 'Erro interno ao processar o banco de dados fake.'
    });
  }
});


// -----------------------------------------------------------------------------
// Inicialização
// -----------------------------------------------------------------------------

const PORT = 3000;

app.listen(PORT, () => {

  console.log(
    `:: [Server] Fake API ativa em http://localhost:${PORT}`
  );

  console.log(
    `:: [Server] GET  /apiFF`
  );

  console.log(
    `:: [Server] GET  /apiFFHarness`
  );

  console.log(
    `:: [Server] GET  /apiHomeItems`
  );

  console.log(
    `:: [Server] GET  /apiLanguagePreference`
  );

  console.log(
    `:: [Server] POST /apiLanguagePreference`
  );
});
