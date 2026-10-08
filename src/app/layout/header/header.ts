import { ChangeDetectionStrategy, Component, inject, ViewChild } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { CommonModule } from '@angular/common';
import { Store } from '@ngxs/store';
import { ChangeLanguage } from '../../home/components/home/state/home-language.actions';
import { toSignal } from '@angular/core/rxjs-interop';
import { HomeLanguageState } from '../../home/components/home/state/home-language.state';
import { WalkthroughStep } from '../../shared/components/walkthrough/walkthrough.type';
import { Walkthrough } from '../../shared/components/walkthrough/walkthrough';

@Component({
  selector: 'app-header',
  imports: [CommonModule, TranslocoModule, Walkthrough],
  templateUrl: './header.html',
  styleUrl: './header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
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


  /**
   * Referência para o componente genérico de walkthrough.
   *
   * A Home controla quando o tour deve começar.
   */
  @ViewChild(Walkthrough)
  private walkthrough?: Walkthrough;

  /**
   * Define os steps específicos desta tela.
   *
   * O componente Walkthrough apenas recebe esses dados
   * e não conhece nenhuma regra de negócio relacionada
   * à Home.
   */
  readonly walkthroughSteps: WalkthroughStep[] = [

    {
      id: 'header-about',
      title: 'Sobre',
      description: 'Aqui você encontra os dados sobre a nossa empresa',
      target: '[data-walkthrough="about"]',
      position: 'bottom'
    },

    {
      id: 'header-contact',
      title: 'Contato',
      description: 'Nesta área você pode encontrar as opções de entrar em contato conosco.',
      target: '[data-walkthrough="contact"]',
      position: 'bottom'
    },

    {
      id: 'header-language',
      title: 'Troca de idioma',
      description: 'Use este botão sempre que precisar alterar o idioma do seu relatório.',
      target: '[data-walkthrough="language"]',
      position: 'left'
    },

    {
      id: 'header-language-open',
      title: 'Escolha o idioma',
      description: 'Use uma das opções para experimentar o seu relatório no idioma selecionado.',
      target: '[data-walkthrough="language-open"]',
      position: 'bottom'
    }

  ];

  /**
   * Inicia o walkthrough da Home.
   *
   * A regra específica para decidir SE o walkthrough
   * deve ser aberto poderia futuramente ficar em um
   * serviço de negócio.
   */
  startWalkthrough(): void {
    this.walkthrough?.open();
  }
}
