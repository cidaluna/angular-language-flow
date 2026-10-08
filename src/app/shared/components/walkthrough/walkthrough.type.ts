/**
 * Representa uma etapa do tour guiado.
 *
 * O Walkthrough não conhece a regra de negócio da tela.
 * Ele recebe apenas as informações necessárias para encontrar
 * o elemento e apresentar a explicação ao usuário.
 */
export interface WalkthroughStep {
  id?: string;
  title: string;
  description: string;
  target: string;
  position?: WalkthroughPosition;
  /** Executado antes de exibir o step. Ex.: abrir um dropdown. */
  onEnter?: () => void | Promise<void>;

  /** Executado ao sair do step (próximo, voltar, pular, concluir, fechar). */
  onExit?: () => void | Promise<void>;
}

export type WalkthroughPosition =
  | 'top'
  | 'right'
  | 'bottom'
  | 'left';


export type WalkthroughEventName = 'started' | 'step_viewed' | 'skipped' | 'completed';
export type WalkthroughStepTrigger = 'start' | 'next' | 'previous';
export type WalkthroughSkipReason = 'button' | 'escape';

/** Contrato do evento emitido para métricas. O componente não conhece a ferramenta. */
export interface WalkthroughEvent {
  name: WalkthroughEventName;
  tourKey: string;
  totalSteps: number;
  /** Começa em 1, como o analista lê no relatório. */
  stepNumber: number;
  stepId: string | null;
  trigger?: WalkthroughStepTrigger;
  skipReason?: WalkthroughSkipReason;
}
