import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, untracked } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { Store } from '@ngxs/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { HomeLanguageState } from './state/home-language.state';
import { ClearSwitchError, LoadInitialHomeItems } from './state/home-language.actions';
import { FeatureFlagService } from './services/feature-flag.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, TranslocoModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private store = inject(Store);
  private readonly ffService = inject(FeatureFlagService);

  protected items = toSignal(this.store.select(HomeLanguageState.items), { initialValue: [] });
  protected loading = toSignal(this.store.select(HomeLanguageState.loading), {
    initialValue: false,
  });
  protected error = toSignal(this.store.select(HomeLanguageState.error), { initialValue: null });
  protected currentLang = toSignal(this.store.select(HomeLanguageState.currentLang), {
    initialValue: 'pt-BR',
  });

  protected userName: string = 'Cida Luna';
  protected messageCount: number = 5;

   /**
   * A Home considera que existe conteúdo válido somente quando existem items.
   */
  protected readonly successData = computed(() =>
    this.items().length > 0
      ? {
          lang: this.currentLang(),
          items: this.items(),
        }
      : null,
  );

  /**
   * Erro de carga inicial.
   *
   * Se ainda não temos conteúdo válido, o erro ocupa a tela.
   */
  protected readonly errorMessage = computed(() =>
    this.error() &&
    this.items().length === 0
      ? this.error()
      : null,
  );

  /**
   * Erro durante troca de idioma.
   *
   * Como já existe conteúdo válido, mantemos a tela e exibimos
   * somente o feedback não bloqueante.
   */
  protected readonly switchError = computed(() =>
    this.error() &&
    this.items().length > 0
      ? this.error()
      : null,
  );


  // ---------------------------------------------------------------------------
  // Inicialização
  // ---------------------------------------------------------------------------

   constructor() {
    /**
     * A aplicação sempre nasce solicitando pt-BR.
     *
     * IMPORTANTE:
     *
     * pt-BR é apenas o idioma inicial solicitado.
     *
     * O idioma oficial será determinado depois pelo response.lang
     * retornado pela apiHomeItems.
     *
     * Não usamos LanguageService aqui.
     * Não usamos Transloco para decidir o idioma.
     * Não usamos localStorage.
     * Não precisa usar o effect aqui
     * O NGXS será a fonte oficial depois do sucesso.
     */
        console.log('[Home] iniciando carga inicial com idioma:', 'pt-BR');

        this.store.dispatch(new LoadInitialHomeItems('pt-BR'));
    }

  // ---------------------------------------------------------------------------
  // Retry
  // ---------------------------------------------------------------------------

  protected retry(): void {
    /**
     * O retry utiliza o idioma atualmente oficial no NGXS.
     */
    this.store.dispatch(new LoadInitialHomeItems(this.currentLang()),
    );
  }


  // ---------------------------------------------------------------------------
  // Dismiss do erro de troca
  // ---------------------------------------------------------------------------

  protected dismissSwitchError(): void {
    this.store.dispatch(new ClearSwitchError());
  }

  protected readonly canShowCards = computed(() =>
    this.ffService.isUserAllowed('Cida')
  );
}
