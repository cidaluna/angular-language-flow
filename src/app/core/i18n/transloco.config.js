module.exports = {
  // O segredo corporativo: adicione './' para forçar o Node do terminal a achar a pasta raiz
  rootTranslationsPath: './public/i18n/',
  langs: ['pt-BR', 'en-US', 'es-ES'],
  keysManager: {
    input: ['src/app/'],
    output: './public/i18n/',
    unflat: true, // Garante objetos estruturados / aninhados no JSON
    sort: true    // Organiza as chaves em ordem alfabética automaticamente
  }
};
