import { inject, Injectable, Signal } from '@angular/core';
import { Store } from '@ngxs/store';
import { LanguageSelectors } from '../../core/state/language/language.selectors';
import { LoadingSelectors } from '../../core/state/loading/loading.selectors';
import { BootstrapApplication, UserRequestedLanguageChange } from '../../core/state/language/language.actions';
import { AppLanguage } from '../../core/state/language/language.model';
import { HomeItem } from '../../features/home/models/home-item.model';

@Injectable({ providedIn: 'root' })
export class LanguageFacade {
  private readonly store = inject(Store);

  // Exposição nativa de fatias de dados convertidas de seletores para Signals puros do Angular 18
  readonly activeLanguage: Signal<AppLanguage> = this.store.selectSignal(LanguageSelectors.activeLanguage);
  readonly apiData: Signal<HomeItem[]> = this.store.selectSignal(LanguageSelectors.apiData);
  readonly hasError: Signal<boolean> = this.store.selectSignal(LanguageSelectors.hasError);
  readonly isReady: Signal<boolean> = this.store.selectSignal(LanguageSelectors.isReady);
  readonly isGlobalLoading: Signal<boolean> = this.store.selectSignal(LoadingSelectors.isGlobalLoading);

  /**
   * Dispara a ação de inicialização da esteira reativa do ecossistema de internacionalização.
   */
  initBootstrapper(): void {
    this.store.dispatch(new BootstrapApplication());
  }

  /**
   * Encaminha a intenção do usuário de troca manual de idioma para o Store.
   */
  changeLanguage(lang: AppLanguage): void {
    this.store.dispatch(new UserRequestedLanguageChange(lang));
  }

  /**
   * Redispara o fluxo de processamento de dados em caso de falhas de infraestrutura.
   */
  retryLastFetch(): void {
    this.store.dispatch(new BootstrapApplication());
  }
}
