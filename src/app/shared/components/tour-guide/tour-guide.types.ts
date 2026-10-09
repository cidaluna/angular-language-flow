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
