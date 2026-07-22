module.exports = {
  // O segredo corporativo: adicione './' para forçar o Node do terminal a achar a pasta raiz
  rootTranslationsPath: './public/i18n/',
  langs: ['pt-BR', 'en-US'],
  keysManager: {
    input: ['src/app/'],
    output: './public/i18n/',
    sort: true,
  }
};
