import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideTransloco, provideTranslocoMissingHandler, TranslocoMissingHandler, TranslocoMissingHandlerData } from '@jsverse/transloco';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { languageHeaderInterceptor } from './core/interceptors/language-header.interceptor';
import { TranslocoHttpLoader } from './core/i18n/transloco-loader';
import { environment } from '../environments/environment'; // Importação estática padrão

/**
 * CLASSE DE PROTEÇÃO CONTRA VAZAMENTO DE CÓDIGO
 * Se a chave falhar em todos os arquivos JSON, ela barra a string crua.
 */
export class StrictMissingTranslationHandler implements TranslocoMissingHandler {
  handle(key: string, data: TranslocoMissingHandlerData): string {
    console.error(`🚨 CRÍTICO [i18n]: A chave "${key}" não foi localizada em nenhum dicionário.`);

    // Retorna três pontos ou string vazia. O usuário NUNCA verá "home.greeting" na tela.
    // Apenas para exemplificar, garantir com produto que essa configuração não entra. Foi só teste.
    return '...';
  }
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([languageHeaderInterceptor])),
    // 1. Configurações gerais de comportamento do Transloco
    provideTransloco({
      config: {
        availableLangs: ['pt-BR', 'en-US'],
        defaultLang: 'pt-BR',
        fallbackLang: 'pt-BR',
        reRenderOnLangChange: true,
        prodMode: true, // environment.i18n.prodMode, Consome a flag do ambiente ativo
        missingHandler: {
          logMissingKey: true,
          useFallbackTranslation: true, // Busca no pt-BR antes de desistir
          allowEmpty: false, // Não aceita chaves vazias ("") como tradução válida
        }
      },
      loader: TranslocoHttpLoader,
    }),
    // 2. INJEÇÃO DO PROVEDOR CUSTOMIZADO (Forma tipada correta para o Angular 21). Só teste, não usar.
    provideTranslocoMissingHandler(StrictMissingTranslationHandler)
  ],
};
