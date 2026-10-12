export type TourPosition = 'top' | 'bottom' | 'left' | 'right';

export type TourAction = 'start' | 'next' | 'previous' | 'skip' | 'complete' | 'close';

export interface TourStep {
  id: string;
  targetId: string;
  title: string;
  description: string;
  position: TourPosition;
  beforeShow?: () => void | Promise<void>;
  afterHide?: () => void | Promise<void>;
}

export interface TourTelemetry {
  userId: string;
  action: TourAction;
  stepId?: string;
  stepIndex?: number;
  timestamp: number;
}

export interface SpotlightMetrics {
  top: number;
  left: number;
  width: number;
  height: number;
}

export type TourPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface TourRequest {
  id: string;          // Identificador único do tour (ex: 'tour-header', 'tour-cards')
  priority: number;    // Peso de prioridade: 1 (máxima), 2, 3, 4...
  steps: TourStep[];   // Os passos criados pelo componente
}
