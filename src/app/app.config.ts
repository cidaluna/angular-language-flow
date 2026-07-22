import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideTransloco } from '@jsverse/transloco';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { languageHeaderInterceptor } from './core/interceptors/language-header.interceptor';
import { TranslocoHttpLoader } from './core/i18n/transloco-loader';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([languageHeaderInterceptor])),
    provideTransloco({
      config: {
        availableLangs: ['pt-BR', 'en-US'],
        defaultLang: 'pt-BR',
        fallbackLang: 'pt-BR',
        reRenderOnLangChange: true,
        prodMode: false,
        missingHandler: {
          logMissingKey: true,
          useFallbackTranslation: true,
          allowEmpty: false,
        }
      },
      loader: TranslocoHttpLoader,
    }),
  ],
};
