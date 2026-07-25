import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideTransloco } from '@jsverse/transloco';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { TranslocoHttpLoader } from './core/i18n/transloco-loader';
import { environment } from '../environments/environment';
import { languageInterceptor } from './core/interceptors/language.interceptor';
import { provideStore } from '@ngxs/store';
import { LanguageState } from './core/state/language/language.state';
import { LoadingState } from './core/state/loading/loading.state';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // Otimização de performance nativa do Angular 18 reduzindo ciclos desnecessários de Change Detection
    provideZoneChangeDetection({ eventCoalescing: true }),

    // Configura o HttpClient acoplando o interceptor funcional de cabeçalhos de internacionalização
    provideHttpClient(
      withInterceptors([languageInterceptor])
    ),

    // Inicializa o NGXS injetando os estados globais do ecossistema de dados da aplicação
    provideStore(
      [LanguageState, LoadingState]
    ),
    // Configurações gerais de comportamento do Transloco
    provideTransloco({
      config: {
        availableLangs: ['pt-BR', 'en-US'],
        defaultLang: 'pt-BR',
        fallbackLang: 'pt-BR',
        reRenderOnLangChange: true,
        prodMode: environment.i18n.prodMode, //Consome a flag do ambiente ativo
        missingHandler: {
          logMissingKey: true,          // Exibe erro no console do navegador
          useFallbackTranslation: true, // Busca no idioma padrão antes de acusar erro
          allowEmpty: false,            // Não aceita chaves vazias ("") como tradução válida
        }
      },
      loader: TranslocoHttpLoader,
    }),
  ],
};
