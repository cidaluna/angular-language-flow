import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { LanguageService } from '../../../core/services/language.service';
import { HomeApiService } from './services/home-api.service';
import { catchError, map, of, switchMap, timeout } from 'rxjs';
import { HomeItemsResponse } from './interfaces/home-item.interface';

type HomeViewState =
  | { status: 'idle' }
  | { status: 'success'; data: HomeItemsResponse }
  | { status: 'error'; reason: string };

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, TranslocoModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private homeService = inject(HomeApiService);
  private languageService = inject(LanguageService);
  private translocoService = inject(TranslocoService);

   // Signal para guardar os 4 mini cards vindos da API fake
  // protected apiData = signal<HomeItemsResponse | null>(null);

  // // Exemplo de variáveis para passar para os parâmetros do Transloco (greeting)
  // protected userName: string = 'Cida Luna';
  // protected messageCount: number = 5;

  // constructor() {
  //   // O efeito monitora o dropdown em tempo real!
  //   effect(() => {
  //     // 1. Ao ler o Signal activeLang(), o Angular registra essa dependência automaticamente.
  //     // Toda vez que o usuário mudar o idioma no dropdown, este bloco inteiro roda novamente!
  //     const currentLanguage = this.languageService.activeLang();

  //     // 2. Dispara o fluxo bloqueante: API primeiro, Transloco depois!
  //     this.loadAndSynchronizeData(currentLanguage);
  //   });
  // }


  // private loadAndSynchronizeData(langCode: string): void {
  //   console.log(":: [Home] método loadAndSynchronizeData início");
  //   this.homeService.getHomeItems().pipe(
  //     // Encadeia o response da API com o download do JSON de tradução
  //     switchMap((response: HomeItemsResponse) => {
  //       // 1. Salvamos os dados da API na tela quando ela responder com sucesso 200
  //       this.apiData.set(response);

  //       // 2. Força a esteira do RxJS a aguardar o download do JSON do Transloco (ex: es-ES.json).
  //       // Como o loaderInterceptor monitora a chamada HTTP, o spinner global fica cravado na tela
  //       // travando os cliques até que o arquivo de tradução do front termine de baixar!
  //       return this.translocoService.selectTranslation(response.lang);
  //     })
  //   ).subscribe({
  //     next: () => {
  //       // O Loader Global some EXATAMENTE NESTE MILISSEGUNDO, porque a API e o Transloco
  //       // terminaram de baixar juntos. Tela 100% atualizada sem conteúdo bilíngue!
  //       console.log(`:: [Home] método loadAndSynchronizeData - Sucesso com idioma [${langCode}]`);
  //     },
  //     error: (err) => {
  //       // Se a requisição der erro (ou lançarmos o 404 simulado), a esteira falha,
  //       // o loader se fecha e o seu ErrorInterceptor global joga o usuário para a tela 404.
  //       console.log(":: [Home] método loadAndSynchronizeData. Error: ", err);
  //     }
  //   });
  // }

   // Sem Store, sem ShowLoader/HideLoader manual — o interceptor já cuida do overlay
  protected viewState = signal<HomeViewState>({ status: 'idle' });

  // Isola o dado renderizável — o template não precisa mais narrowar a union inteira,
  // só checar "existe ou não", que é o caso que o Angular resolve sem ambiguidade
  protected successData = computed(() => {
    const state = this.viewState();
    return state.status === 'success' ? state.data : null;
  });

  protected errorMessage = computed(() => {
    const state = this.viewState();
    return state.status === 'error' ? state.reason : null;
  });

  protected userName: string = 'Cida Luna';
  protected messageCount: number = 5;

  private lastLangAttempted = '';
  protected switchError = signal<string | null>(null);

  constructor() {
    effect(() => {
      const currentLanguage = this.languageService.activeLang();
      this.loadAndSynchronizeData(currentLanguage);
    });
  }

  protected retry(): void {
    this.loadAndSynchronizeData(this.lastLangAttempted);
  }

  private loadAndSynchronizeData(langCode: string): void {
    this.lastLangAttempted = langCode;

    const current = this.viewState();
    if (current.status === 'success' && current.data.lang === langCode) {
      return;
    }

   this.switchError.set(null);


    this.homeService.getHomeItems().pipe(
      timeout({
        each: 5000,
        with: () => { throw new Error('TIMEOUT_HOME_ITEMS'); },
      }),
      map((response: HomeItemsResponse) => {
        if (!response.lang?.trim()) {
          throw new Error('PAYLOAD_INVALIDO_LANG_AUSENTE');
        }
        // NOVO: a API precisa devolver o MESMO idioma que foi solicitado.
        // Se divergir, é sinal de que o idioma pedido não existe no backend —
        // e isso não pode virar sucesso silencioso.
        if (response.lang !== langCode) {
          throw new Error('PAYLOAD_LANG_DIVERGENTE_DO_SOLICITADO');
        }
        return response;
      }),
      switchMap((response: HomeItemsResponse) =>
        this.translocoService.selectTranslation(response.lang).pipe(
          timeout({
            each: 6000,
            with: () => { throw new Error('TIMEOUT_TRANSLOCO'); },
          }),
          map(() => response),
        ),
      ),
      catchError((err) => {
        console.error(':: [Home] loadAndSynchronizeData falhou:', err);
        const reason = err?.message ?? 'ERRO_DESCONHECIDO';

        // 1. Antes de decidir o que fazer, pergunte: já existe uma tela válida?
        const estadoAtual = this.viewState();

        if (estadoAtual.status === 'success') {
          // 2. SIM existe — preserva a tela, avisa via toast, e É AQUI
          //    que revertTo é chamado, com o idioma que estava confirmado
          this.switchError.set(reason);
          this.languageService.revertTo(estadoAtual.data.lang);
        } else {
          // 3. NÃO existe (falha na carga inicial) — não há o que reverter,
          //    porque o dropdown nunca teve um idioma "confirmado" antes
          this.viewState.set({ status: 'error', reason });
        }

        return of(null);
      }),
    ).subscribe((response) => {
      if (response) {
        // AQUI, e só aqui, o idioma é efetivamente aplicado na tela —
        // depois que API + Transloco já confirmaram os dois, juntos.
        this.translocoService.setActiveLang(response.lang);
        this.viewState.set({ status: 'success', data: response });
      }
    });
  }

  // RASTREADOR 1: Dispara a cada ciclo de verificação do Angular
  ngDoCheck(): void {
    console.log(':: [Ciclo de Vida] Home Component verificado pelo Change Detection!');
  }

  protected dismissSwitchError(): void {
    this.switchError.set(null);
  }
}
