import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
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
      // Única leitura que DEVE ser dependência do effect — é o gatilho intencional
      const currentLanguage = this.languageService.activeLang();

      // Tudo que loadAndSynchronizeData ler (viewState, switchError) fica de fora
      // do rastreamento do effect, mesmo estando dentro da cadeia de chamada - teste removi pt-BR json
      untracked(() => this.loadAndSynchronizeData(currentLanguage));
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
