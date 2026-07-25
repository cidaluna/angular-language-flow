import { HttpInterceptorFn, HttpContextToken } from '@angular/common/http';
import { inject } from '@angular/core';
import { Store } from '@ngxs/store';
import { LanguageSelectors } from '../state/language/language.selectors';

/**
 * Token de contexto para ignorar a injeção automática do cabeçalho de idioma.
 * Utilizado em chamadas externas ou APIs de terceiros onde o header 'Accept-Language' pode quebrar o CORS.
 */
export const BYPASS_LANGUAGE_HEADER = new HttpContextToken<boolean>(() => false);

export const languageInterceptor: HttpInterceptorFn = (req, next) => {
  const store = inject(Store);

  // Ignora se o token de bypass estiver marcado como verdadeiro no contexto da requisição HTTP
  if (req.context.get(BYPASS_LANGUAGE_HEADER)) {
    return next(req);
  }

  // Consulta o estado do NGXS sincronamente via seletor para capturar o idioma atual da aplicação
  const activeLang = store.selectSignal(LanguageSelectors.activeLanguage)();

  // Aplica o cabeçalho padronizado da W3C para negociação de conteúdo internacional
  const modifiedReq = req.clone({
    setHeaders: {
      'Accept-Language': activeLang
    }
  });

  return next(modifiedReq);
};
