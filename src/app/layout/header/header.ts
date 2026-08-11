import { Component, inject } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { CommonModule } from '@angular/common';
import { Store } from '@ngxs/store';
import { ChangeLanguage } from '../../home/components/home/state/home-language.actions';
import { toSignal } from '@angular/core/rxjs-interop';
import { HomeLanguageState } from '../../home/components/home/state/home-language.state';

@Component({
  selector: 'app-header',
  imports: [CommonModule, TranslocoModule],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  private store = inject(Store);
  protected currentLang = toSignal(this.store.select(HomeLanguageState.currentLang), { initialValue: 'pt-BR' });

  // Lista de idiomas disponíveis para o @for do seu HTML
  protected readonly languages = [
    { code: 'pt-BR', label: 'Português' },
    { code: 'en-US', label: 'English' },
    { code: 'es-ES', label: 'Español' }
  ];

  /**
   * O Header não salva preferência diretamente.
   * Ele apenas comunica a intenção do usuário ao NGXS.
   * O State decide:
   * POST preferência ->  GET Home -> Transloco -> commit
   */
  protected onLanguageChange(event: Event): void {
    console.log(":: [Header] método onLanguageChange com o event: ", event);
    const selectElement = event.target as HTMLSelectElement;
    if (!selectElement) {
      return;
    }
    const selectedLanguage = selectElement.value;
    this.store.dispatch(new ChangeLanguage(selectedLanguage));
  }
}
