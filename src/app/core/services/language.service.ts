import { inject, Injectable, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngxs/store';
import { HomeLanguageState } from '../../home/components/home/state/home-language.state';

@Injectable({ providedIn: 'root' })
export class LanguageService {

  private readonly store = inject(Store);

  /**
   * O idioma não é mais armazenado neste service.
   * O NGXS é a fonte de verdade.
   */
  readonly activeLang = toSignal(this.store.select(HomeLanguageState.currentLang),
    {
      initialValue: 'pt-BR',
    }
  );
}
