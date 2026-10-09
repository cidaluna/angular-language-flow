import { ChangeDetectionStrategy, Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { CommonModule } from '@angular/common';
import { Store } from '@ngxs/store';
import { ChangeLanguage } from '../../home/components/home/state/home-language.actions';
import { toSignal } from '@angular/core/rxjs-interop';
import { HomeLanguageState } from '../../home/components/home/state/home-language.state';
import { TourGuide } from '../../shared/components/tour-guide/tour-guide';
import { TourGuideService } from '../../shared/components/tour-guide/tour-guide.service';

@Component({
  selector: 'app-header',
  imports: [CommonModule, TranslocoModule, TourGuide],
  templateUrl: './header.html',
  styleUrl: './header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Header implements OnInit {
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

  private tourService = inject(TourGuideService);

  readonly isLoading = signal<boolean>(true);
  readonly isDropdownOpen = signal<boolean>(false);

  // Altera programaticamente o estado aberto/fechado da lista de idiomas.
  toggleDropdown(state?: boolean): void {
    this.isDropdownOpen.set(state !== undefined ? state : !this.isDropdownOpen());
  }

  ngOnInit(): void {
    // Configura os 4 passos solicitados pelo roteiro
    this.tourService.initialize([
      { id: 'step1', targetId: 'btn-sobre', title: 'Conheça nossa Empresa', description: 'Clique aqui para saber mais sobre a nossa jornada.', position: 'bottom' },
      { id: 'step2', targetId: 'btn-contato', title: 'Fale Conosco', description: 'Canal direto com nossa equipe de suporte.', position: 'bottom' },
      {
        id: 'step3',
        targetId: 'drop-idioma',
        title: 'Selecione seu Idioma',
        description: 'Aqui você pode gerenciar a localização.',
        position: 'left',
        beforeShow: () => this.toggleDropdown(false) // Fecha o dropdown se o usuário voltar do step 4
      },
      {
        id: 'step4',
        targetId: 'drop-aberto',
        title: 'Escolha uma Opção',
        description: 'Selecione a linguagem nativa para tradução completa.',
        position: 'bottom',
        beforeShow: () => this.toggleDropdown(true),
        afterHide: () => this.toggleDropdown(false)
      }
    ]);

    // Simulação de carregamento de APIs da tela. Quando finaliza, o tour é liberado e iniciado.
    setTimeout(() => {
      this.isLoading.set(false);
      this.tourService.setPageLoaded(true);
      this.tourService.start();
    }, 1500);
  }



}
