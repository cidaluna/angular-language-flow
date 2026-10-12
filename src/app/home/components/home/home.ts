import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { Store } from '@ngxs/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { HomeLanguageState } from './state/home-language.state';
import { ClearSwitchError, LoadInitialHomeItems } from './state/home-language.actions';
import { FeatureFlagService } from './services/feature-flag.service';
import { TourGuideService } from '../../../shared/components/tour-guide/tour-guide.service';
import { TourStep } from '../../../shared/components/tour-guide/tour-guide.types';
import { TourOrchestratorService } from '../../../shared/components/tour-guide/tour-guide-orchestrator.service';


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
  private tourService = inject(TourGuideService);
  private tourOrchestratorService = inject(TourOrchestratorService);

  protected currentUser = signal('JCS1234');
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

        /**
     * O SEGREDO DO TIMING CORRETO:
     * Criamos um efeito reativo no Angular 19. Ele monitora o successData e o loading.
     * Quando successData tiver dados E o loading do NGXS virar false (HideLoader),
     * significa que o DOM acabou de ser montado com os dados reais!
     */
    effect(() => {
      const completeData = this.successData();
      const uncompleteData = this.loading();
      const completeFlagCards = this.canShowCards();

      // Condição perfeita: Tem dados na tela E o loader global sumiu!
      if (completeData && !uncompleteData && completeFlagCards) {
        // O untracked impede que o effect entre em loop caso o tourService altere algum signal interno
        untracked(() => {
          // Um micro-timeout de 0ms apenas para garantir o ciclo de pintura do navegador (Paint)
          setTimeout(() => {
            this.configTour();
          }, 0);
        });
      }
    });
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

  // Computed atualiza automaticamente quando as flags terminarem de carregar ou o usuário mudar
  protected readonly canShowCards = computed(() => {
    return this.ffService.isLogonEnabled('FF_0202_SHOW_CARDS', this.currentUser())
  });

  // Computed: só LÊ o estado atual da flag — reage automaticamente
  // quando flagsSignal mudar (por causa do setBooleanFlag em outro lugar)
  protected readonly canShowText = computed(() => {
    return this.ffService.getBooleanFlag('FF_0101_SHOW_NEW_TEXT');
  });

  // Simula a esteira ligando a flag — chamado por um evento, não pelo computed
  ativarFlag(): void {
    this.ffService.setBooleanFlag('FF_0101_SHOW_NEW_TEXT', true);
  }

  // Simulando usuários permitidos e não permitidos
  // protected changeUser(event: Event): void {
  //   const element = event.target as HTMLSelectElement;
  //   this.currentUser.set(element.value);
  // }

  // Controle do tour
  configTour() {
    const customStepsPme: TourStep[] = [
       {
        id: 'pme-step1',
        targetId: 'custom-brand',
        title: 'Logo da aplicação',
        description: 'Aqui você tem o logo da aplicação.',
        position: 'bottom'
      },
      {
        id: 'pme-step2',
        targetId: 'btn-sobre',
        title: 'Conheça nossa Empresa',
        description: 'Clique aqui para saber mais sobre a nossa jornada.',
        position: 'right'
      },
    ];
    //this.tourService.initialize(customSteps); // Passo os dados
    //this.tourService.start(); // Inicia o tour

    // Em vez de inicializar direto, nós solicitamos a entrada na fila do orquestrador.
    // Se este for o primeiro tour da tela, o orquestrador dará a largada imediatamente!
    this.tourOrchestratorService.requestTour({
      id: 'tour-home-first',      // Identificador único deste bloco de passos
      priority: 1,                // Define a ordem: 1 executa primeiro, 2 entra em espera, etc.
      steps: customStepsPme          // O seu array de passos configurado acima
    });

    const customStepsI18n: TourStep[] = [
      {
        id: 'i18n-step1',
        targetId: 'btn-contato',
        title: 'Fale Conosco',
        description: 'Canal direto com nossa equipe de suporte.',
        position: 'bottom'
      },
      {
        id: 'i18n-step2',
        targetId: 'gatilho-idioma',
        title: 'Veja aqui o idioma',
        description: 'Aqui você pode visualizar o idioma ativo.',
        position: 'left'
      },
      {
        id: 'i18n-step3',
        targetId: 'drop-aberto',
        title: 'Escolha uma Opção',
        description: 'Selecione a linguagem nativa para tradução completa.',
        position: 'left'
      },
    ];

    this.tourOrchestratorService.requestTour({
      id: 'tour-home-second',      // Identificador único deste bloco de passos
      priority: 2,                // Define a ordem: 1 executa primeiro, 2 entra em espera, etc.
      steps: customStepsI18n          // O seu array de passos configurado acima
    });
  }
}
