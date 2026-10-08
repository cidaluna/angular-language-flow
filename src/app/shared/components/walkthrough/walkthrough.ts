import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  model,
  output,
  signal,
  viewChild
} from '@angular/core';
import { WalkthroughEvent, WalkthroughPosition, WalkthroughStep } from './walkthrough.type';

  const WALKTHROUGH_WIDTH = 360;
  const WALKTHROUGH_HEIGHT = 180;
  const SPOTLIGHT_PADDING = 8;
  const DEFAULT_STEP_POSITION: WalkthroughPosition = 'bottom';
  const WALKTHROUGH_STORAGE_PREFIX = 'walkthrough';
@Component({
  selector: 'app-walkthrough',
  imports: [],
  templateUrl: './walkthrough.html',
  styleUrl: './walkthrough.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Walkthrough {

  private readonly elementRef = inject(ElementRef);
  onCardKeydown(event: Event){
    console.log('Clicou ');
  }

  /** Emite eventos tipados para o componente pai enviar às métricas. */
  readonly walkthroughEvent = output<WalkthroughEvent>();

  /** Referência ao balão, usada para mover o foco e prender o TAB. */
  private readonly card = viewChild<ElementRef<HTMLElement>>('card');

  /** Elemento que tinha o foco antes do tour abrir, para devolvê-lo ao fechar. */
  private previouslyFocused: HTMLElement | null = null;

  /** Evita cliques rápidos disparando duas trocas de step ao mesmo tempo. */
  private isChangingStep = false;

  /** Ids únicos para ligar o balão ao título/descrição (aria-labelledby/describedby). */
  private static instanceCounter = 0;
  private readonly instanceId = Walkthrough.instanceCounter++;
  protected readonly titleId = `walkthrough-title-${this.instanceId}`;
  protected readonly descriptionId = `walkthrough-description-${this.instanceId}`;

  /**
   * Controla se o walkthrough está aberto ou fechado.
   *
   * O componente inicia fechado.
   *
   * Como é um model signal, o componente pai também pode
   * controlar esse estado.
   */
  readonly show = model(false);

  /**
   * Índice do step atualmente apresentado.
   *
   * O primeiro step sempre começa no índice 0.
   */
  readonly stepIndex = signal(0);

  /**
   * Elemento HTML atualmente destacado pelo spotlight.
   *
   * Começa como null porque nenhum elemento foi encontrado
   * antes do walkthrough ser iniciado.
   */
  readonly highlighted = signal<HTMLElement | null>(null);

  /**
   * Define os estilos utilizados para posicionar
   * a caixa de conteúdo do walkthrough.
   */
  readonly stepStyle = signal<Record<string, string>>({});

  /**
   * Define os estilos utilizados para posicionar
   * o spotlight sobre o elemento da página.
   */
  readonly spotlightStyle = signal<Record<string, string>>({});

  /**
   * Indica se o elemento alvo do step está atualmente
   * disponível e visível na tela.
   */
  readonly targetVisible = signal(false);

  /**
   * Lista de steps fornecida pelo componente pai.
   *
   * O Walkthrough não conhece quais são esses steps.
   */
  readonly steps = input.required<WalkthroughStep[]>();

  /**
   * Chave utilizada para persistir no navegador que
   * o usuário já visualizou esse walkthrough.
   *
   * Cada funcionalidade deve possuir sua própria chave.
   */
  readonly storageKey = input.required<string>();

    /**
   * Indica se estamos no primeiro passo.
   * Resolve: o template decidir entre "Voltar" e "Pular tour" sem repetir
   * a comparação `stepIndex() === 0` em vários lugares.
   */
  readonly firstStep = computed(() => this.stepIndex() === 0);

  /**
   * Define se pular o tour conta como "já viu".
   *
   * Por padrão, pular registra no navegador que o usuário já
   * visualizou o walkthrough, respeitando a decisão dele de não ver.
   * O componente pai pode desligar isso se quiser que o tour volte
   * até ser concluído.
   */
  readonly markSeenOnSkip = input(true);

  /**
   * Define se o componente deve fechar automaticamente
   * quando o usuário chegar ao último step.
   *
   * Por padrão, permanece aberto até o usuário clicar
   * em "Concluir".
   */
  readonly closeOnLastStep = input(false);

  /**
   * Retorna o step atualmente selecionado.
   *
   * O componente não precisa trabalhar diretamente com
   * steps[index] no template.
   */
  readonly currentStep = computed<WalkthroughStep | null>(() => {
    const steps = this.steps();
    const index = this.stepIndex();

    return steps[index] ?? null;
  });

  /**
   * Indica se o step atual é o último step do walkthrough.
   */
  readonly lastStep = computed(() => {
    const steps = this.steps();

    if (steps.length === 0) {
      return false;
    }

    return this.stepIndex() === steps.length - 1;
  });

  /**
   * Retorna o número total de steps.
   *
   * Esse valor facilita a apresentação de algo como:
   * "1 de 3".
   */
  readonly totalSteps = computed(() => this.steps().length);

  /**
   * Retorna o índice atual para apresentação amigável
   * ao usuário, iniciando em 1.
   */
  readonly displayedStepIndex = computed(() => {
    return this.stepIndex() + 1;
  });

  /**
   * Abre o walkthrough iniciando sempre pelo primeiro step.
   *
   * A regra de negócio sobre QUANDO chamar esse método
   * pertence ao componente pai.
   */
  open(force = false): void {
    if (!force && this.hasAlreadySeen()) {
      console.log('::[Walkthrough] já visualizado');
      return;
    }
    console.log('🚨🚨🚨 WALKTHROUGH OPEN FOI CHAMADO 🚨🚨🚨');

    if (this.hasAlreadySeen()) {
      console.log('::[Walkthrough] já visualizado');
      return;
    }

    this.stepIndex.set(0);
    this.show.set(true);

    this.updateCurrentTarget();
  }

  /**
   * Fecha o walkthrough sem alterar os steps.
   *
   * Esse método é utilizado quando o usuário fecha o tour
   * manualmente.
   */
  close(): void {
    this.show.set(false);
    this.clearTarget();
  }

  /**
   * Avança para o próximo step.
   *
   * Se o usuário estiver no último step, o walkthrough
   * é finalizado.
   */
  next(): void {
    console.log(
      '::[Walkthrough] stepIndex antes:',
      this.stepIndex()
    );

    console.log(
      '::[Walkthrough] currentStep antes:',
      this.currentStep()
    );

    console.log(
      '::[Walkthrough] lastStep:',
      this.lastStep()
    );

    if (this.lastStep()) {
      this.finish();
      return;
    }

    this.stepIndex.update(index => index + 1);

    this.updateCurrentTarget();
  }

  /**
   * Retorna para o step anterior.
   *
   * O índice nunca fica menor que zero.
   */
  previous(): void {
    console.log(
      '::[Walkthrough] entrou no previous - stepIndex antes:',
      this.stepIndex()
    );

    console.log(
      '::[Walkthrough] entrou no previous - currentStep antes:',
      this.currentStep()
    );

    this.stepIndex.update(index => Math.max(index - 1, 0));

    this.updateCurrentTarget();
  }

  /**
   * Usuário desistiu do tour (botão "Pular", "Pular tour" ou ESC).
   *
   * Resolve: fechar o walkthrough e, conforme a regra definida pelo
   * componente pai em markSeenOnSkip, lembrar que ele não quer vê-lo
   * de novo. Todo caminho de desistência passa por aqui, então a regra
   * do storage fica em um único lugar.
   */
  skip(): void {
    console.log('::[Walkthrough] skip', {
      stepIndex: this.stepIndex(),
      persisted: this.markSeenOnSkip()
    });

    if (this.markSeenOnSkip()) {
      this.markAsSeen();
    }

    this.close();
  }

  /**
   * Finaliza o walkthrough.
   *
   * Registra no navegador que o usuário já visualizou
   * esse tour para que ele não seja apresentado novamente.
   */
  finish(): void {
    this.markAsSeen();
    this.close();
  }

  /**
   * Verifica se o walkthrough já foi visualizado anteriormente.
   *
   * A chave é prefixada para evitar colisões com outras
   * informações armazenadas pela aplicação.
   */
  private hasAlreadySeen(): boolean {
    const key = this.getStorageKey();

    return localStorage.getItem(key) === 'true';
  }

  /**
   * Registra no navegador que o usuário concluiu
   * o walkthrough.
   */
  private markAsSeen(): void {
    const key = this.getStorageKey();

    localStorage.setItem(key, 'true');
  }

  /**
   * Monta a chave final utilizada no localStorage.
   *
   * Exemplo:
   *
   * walkthrough:home-report
   */
  private getStorageKey(): string {
    return `${WALKTHROUGH_STORAGE_PREFIX}:${this.storageKey()}`;
  }

  /**
   * Localiza o elemento correspondente ao step atual
   * e calcula as posições do spotlight e da caixa.
   */
  private updateCurrentTarget(): void {
    requestAnimationFrame(() => {
      const step = this.currentStep();

      if (!step) {
        this.clearTarget();
        return;
      }

      const target = this.findTarget(step.target);

      if (!target) {
        this.clearTarget();
        return;
      }

      this.highlighted.set(target);

      this.scrollTargetIntoView(target);

      requestAnimationFrame(() => {
        this.calculateTargetStyles(target);
        this.calculateStepStyles(target, step);
      });
    });
  }

  /**
   * Procura no DOM o elemento definido pelo selector
   * do step atual.
   */
  private findTarget(selector: string): HTMLElement | null {
    const target = document.querySelector(selector);

    console.log(
      '::[Walkthrough] selector:',
      selector
    );

    console.log(
      '::[Walkthrough] target encontrado:',
      target
    );

    if (!(target instanceof HTMLElement)) {
      return null;
    }

    return target;
  }

  /**
   * Faz o elemento alvo entrar na área visível da tela
   * antes de calcular as posições do spotlight.
   */
  private scrollTargetIntoView(target: HTMLElement): void {
    const rect = target.getBoundingClientRect();

    const isOutsideViewport =
      rect.top < 0 ||
      rect.bottom > window.innerHeight;

    if (!isOutsideViewport) {
      return;
    }

    target.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest'
    });
  }

  /**
   * Calcula a posição e o tamanho do spotlight
   * utilizando o boundingClientRect do elemento.
   */
  private calculateTargetStyles(target: HTMLElement): void {
    const rect = target.getBoundingClientRect();

    const top = Math.max(
      rect.top - SPOTLIGHT_PADDING,
      0
    );

    const left = Math.max(
      rect.left - SPOTLIGHT_PADDING,
      0
    );

    const width = rect.width + SPOTLIGHT_PADDING * 2;
    const height = rect.height + SPOTLIGHT_PADDING * 2;

    this.targetVisible.set(
      width > 0 && height > 0
    );

    this.spotlightStyle.set({
      top: `${top}px`,
      left: `${left}px`,
      width: `${width}px`,
      height: `${height}px`
    });
  }

  /**
   * Calcula onde a caixa explicativa do walkthrough
   * deve aparecer em relação ao elemento destacado.
   */
  private calculateStepStyles(
    target: HTMLElement,
    step: WalkthroughStep
  ): void {
    const rect = target.getBoundingClientRect();

    const position =
      step.position ?? DEFAULT_STEP_POSITION;

    const style = this.calculatePosition(
      rect,
      position
    );

    this.stepStyle.set(style);
  }

  /**
   * Calcula a posição final da caixa de conteúdo
   * considerando a posição desejada pelo step.
   */
  private calculatePosition(
    rect: DOMRect,
    position: WalkthroughPosition
  ): Record<string, string> {

    const gap = 16;

    switch (position) {
      case 'top':
        return {
          top: `${Math.max(
            rect.top - WALKTHROUGH_HEIGHT - gap,
            gap
          )}px`,
          left: `${this.calculateHorizontalPosition(rect)}px`,
          width: `${WALKTHROUGH_WIDTH}px`
        };

      case 'right':
        return {
          top: `${this.calculateVerticalPosition(rect)}px`,
          left: `${rect.right + gap}px`,
          width: `${WALKTHROUGH_WIDTH}px`
        };

      case 'left':
        return {
          top: `${this.calculateVerticalPosition(rect)}px`,
          left: `${Math.max(
            rect.left - WALKTHROUGH_WIDTH - gap,
            gap
          )}px`,
          width: `${WALKTHROUGH_WIDTH}px`
        };

      case 'bottom':
      default:
        return {
          top: `${rect.bottom + gap}px`,
          left: `${this.calculateHorizontalPosition(rect)}px`,
          width: `${WALKTHROUGH_WIDTH}px`
        };
    }
  }

  /**
   * Calcula uma posição horizontal que mantém
   * a caixa do walkthrough dentro da viewport.
   */
  private calculateHorizontalPosition(
    rect: DOMRect
  ): number {

    const centeredPosition =
      rect.left +
      (rect.width / 2) -
      (WALKTHROUGH_WIDTH / 2);

    const maximumLeft =
      window.innerWidth -
      WALKTHROUGH_WIDTH -
      16;

    return Math.min(
      Math.max(centeredPosition, 16),
      maximumLeft
    );
  }

  /**
   * Calcula uma posição vertical que mantém
   * a caixa do walkthrough dentro da viewport.
   */
  private calculateVerticalPosition(
    rect: DOMRect
  ): number {

    const centeredPosition =
      rect.top +
      (rect.height / 2) -
      (WALKTHROUGH_HEIGHT / 2);

    const maximumTop =
      window.innerHeight -
      WALKTHROUGH_HEIGHT -
      16;

    return Math.min(
      Math.max(centeredPosition, 16),
      maximumTop
    );
  }

  /**
   * Limpa o elemento destacado e os estilos calculados
   * quando não existe um target válido.
   */
  private clearTarget(): void {
    this.highlighted.set(null);
    this.targetVisible.set(false);
    this.spotlightStyle.set({});
    this.stepStyle.set({});
  }

  /**
   * Permite fechar o walkthrough através do teclado
   * utilizando a tecla Escape.
   */
  onEscape(): void {
    this.close();
  }

    /**
   * Lista de índices [0, 1, 2...] com um item por step.
   * Resolve: dar ao template algo para iterar e desenhar uma bolinha por passo,
   * sem criar array dentro do HTML (que seria recriado a cada checagem).
   */
  readonly stepDots = computed(() =>
    Array.from({ length: this.totalSteps() }, (_, index) => index),
  );
}
