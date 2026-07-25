import { APP_INITIALIZER, ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideTransloco } from '@jsverse/transloco';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { languageHeaderInterceptor } from './core/interceptors/language-header.interceptor';
import { TranslocoHttpLoader } from './core/i18n/transloco-loader';
import { environment } from '../environments/environment';
import { LoaderState } from './core/loader/loader.state';
import { provideStore } from '@ngxs/store';
import { loaderInterceptor } from './core/loader/loader.interceptor';
import { errorInterceptor } from './core/error/error.interceptor';
import { LanguageService } from './core/services/language.service';
import { HomeApiService } from './home/components/home/services/home-api.service';
import { firstValueFrom } from 'rxjs';

// Função que roda ANTES da aplicação desenhar qualquer coisa na tela
export function appLangInitializer(homeService: HomeApiService, languageService: LanguageService) {
  console.log(":: [AppConfig] função appLangInitializer");
  return () =>
    // Transforma o Observable da API em uma Promise para o Angular conseguir aguardar o retorno
    firstValueFrom(homeService.getHomeItems())
      .then((response) => {
        // A API respondeu e o nosso Service já fez a filtragem inteligente.
        // O LanguageService atualiza o Transloco e o Dropdown na mesma hora com base no response.
        languageService.initializeApplicationLanguage(response?.lang);
      })
      .catch((error) => {
        // Se a API fake estiver desligada ou der erro crítico, aplica o fallback de segurança pt-BR
        console.error(':: [AppConfig] Falha crítica na API de inicialização. Aplicando fallback pt-BR. Erro:', error);
        languageService.initializeApplicationLanguage('pt-BR');
      });
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),

    // Configura o HttpClient para executar o loader primeiro, e depois monitora os erros!
    provideHttpClient(withInterceptors([
      loaderInterceptor,
      errorInterceptor
      ])
    ),

    // Registra o NGXS global com o estado do loader
    provideStore([LoaderState]),

    // REGISTRO DO INICIALIZADOR DE IDIOMA
    {
      provide: APP_INITIALIZER,
      useFactory: appLangInitializer,
      deps: [HomeApiService, LanguageService],
      multi: true
    },

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
