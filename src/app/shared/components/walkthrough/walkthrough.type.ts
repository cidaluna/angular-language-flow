/**
 * Representa uma etapa do tour guiado.
 *
 * O Walkthrough não conhece a regra de negócio da tela.
 * Ele recebe apenas as informações necessárias para encontrar
 * o elemento e apresentar a explicação ao usuário.
 */
export interface WalkthroughStep {
  id: string;
  title: string;
  description: string;
  target: string;
  position?: WalkthroughPosition;
}

export type WalkthroughPosition =
  | 'top'
  | 'right'
  | 'bottom'
  | 'left';
