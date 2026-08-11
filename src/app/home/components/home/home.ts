import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, untracked } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { LanguageService } from '../../../core/services/language.service';
import { Store } from '@ngxs/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { HomeLanguageState } from './state/home-language.state';
import { ClearSwitchError, LoadInitialHomeItems } from './state/home-language.actions';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, TranslocoModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private store = inject(Store);

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

  // ---------------------------------------------------------------------------
  // Dados exibidos quando a Home possui conteúdo válido
  // ---------------------------------------------------------------------------

  protected readonly successData = computed(() => {
    const items = this.items();

    if (items.length === 0) {
      return null;
    }

    return {
      lang: this.currentLang(),
      items,
    };
  });

  // ---------------------------------------------------------------------------
  // Erro da carga inicial
  //
  // Se não existem cards, o erro ocupa a página.
  // ---------------------------------------------------------------------------

  protected readonly errorMessage = computed(() => {
    const error = this.error();

    if (error && this.items().length === 0) {
      return error;
    }

    return null;
  });

  // ---------------------------------------------------------------------------
  // Erro durante troca de idioma
  //
  // Se já existe conteúdo válido, mantemos a tela e exibimos somente
  // um aviso não bloqueante.
  // ---------------------------------------------------------------------------

  protected readonly switchError = computed(() => {
    const error = this.error();

    if (error && this.items().length > 0) {
      return error;
    }

    return null;
  });


  // ---------------------------------------------------------------------------
  // Inicialização
  // ---------------------------------------------------------------------------

  constructor() {
    //A intenção é simplesmente executar uma ação uma vez.
  console.log(':: [Home] solicitando carga inicial da Home');

  this.store.dispatch(
    new LoadInitialHomeItems()
  );
}

  // ---------------------------------------------------------------------------
  // Retry
  // ---------------------------------------------------------------------------

  protected retry(): void {
    console.log(':: [Home] tentando novamente a carga inicial');

    this.store.dispatch(new LoadInitialHomeItems());
  }

  // ---------------------------------------------------------------------------
  // Dismiss do erro de troca
  // ---------------------------------------------------------------------------

  protected dismissSwitchError(): void {
    this.store.dispatch(new ClearSwitchError());
  }
}
