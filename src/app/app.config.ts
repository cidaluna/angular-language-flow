import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideTransloco } from '@jsverse/transloco';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { TranslocoHttpLoader } from './core/i18n/transloco-loader';
import { environment } from '../environments/environment';
import { LoaderState } from './core/loader/loader.state';
import { provideStore } from '@ngxs/store';
import { loaderInterceptor } from './core/loader/loader.interceptor';
import { errorInterceptor } from './core/error/error.interceptor';
import { HomeLanguageState } from './home/components/home/state/home-language.state';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),

    provideHttpClient(withInterceptors([
      loaderInterceptor,
      errorInterceptor,
      ])
    ),

    provideStore([HomeLanguageState, LoaderState]),

    // Configurações gerais de comportamento do Transloco
    provideTransloco({
      config: {
        availableLangs: ['pt-BR', 'en-US', 'es-ES'],
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
