import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, ViewChild } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { CommonModule } from '@angular/common';
import { Store } from '@ngxs/store';
import { ChangeLanguage } from '../../home/components/home/state/home-language.actions';
import { toSignal } from '@angular/core/rxjs-interop';
import { HomeLanguageState } from '../../home/components/home/state/home-language.state';
import { TourGuideService } from '../../shared/components/tour-guide/tour-guide.service';
import { TourStep } from '../../shared/components/tour-guide/tour-guide.types';

@Component({
  selector: 'app-header',
  imports: [CommonModule, TranslocoModule],
  templateUrl: './header.html',
  styleUrl: './header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Header {
  private store = inject(Store);
  private tourService = inject(TourGuideService);
  readonly isDropdownOpen = signal<boolean>(false);
  protected currentLang = toSignal(this.store.select(HomeLanguageState.currentLang), { initialValue: 'pt-BR' });

  // Lista de idiomas disponíveis para o @for do seu HTML
  protected readonly languages = [
    { code: 'pt-BR', label: 'Português' },
    { code: 'en-US', label: 'English' },
    { code: 'es-ES', label: 'Español' }
  ];

  // Computa reativamente o label amigável correspondente ao código do idioma selecionado no State.
  protected currentLangLabel = computed(() => {
    const code = this.currentLang();
    return this.languages.find(lang => lang.code === code)?.label || code;
  });

  // Dispara a intenção de alteração de idioma diretamente para o State do NGXS usando a string do código.
  protected onLanguageChange(selectedLanguage: string): void {
    console.log(":: [Header] método onLanguageChange com o código: ", selectedLanguage);
    if (!selectedLanguage) return;
    this.store.dispatch(new ChangeLanguage(selectedLanguage));
  }

  constructor() {
    /**
     * O Header monitora reativamente o passo atual do Tour.
     * Quando o Tour chegar no passo do dropdown, o Header abre o DOM sozinho!
     */
    effect(() => {
      const activeStep = this.tourService.currentStepIndex(); // certifique-se de expor o index como Signal no serviço

      // Armazena o estado que o dropdown DEVERIA ter neste passo
      const shouldOpen = (activeStep === 2);

      // Trava de segurança contra o piscar:
      // SÓ altera o signal se o estado atual do dropdown for DIFERENTE do que ele precisa ser.
      if (this.isDropdownOpen() !== shouldOpen) {
        this.toggleDropdown(shouldOpen);
      }
    });
  }

  // Altera programaticamente o estado aberto/fechado da lista de idiomas.
  toggleDropdown(state?: boolean): void {
    const newState = state !== undefined ? state : !this.isDropdownOpen();
    this.isDropdownOpen.set(newState);
  }
}
