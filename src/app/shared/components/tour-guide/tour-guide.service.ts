import { Injectable, signal, computed } from '@angular/core';
import { TourStep, TourTelemetry, TourAction } from './tour-guide.types';

@Injectable({ providedIn: 'root' })
export class TourGuideService {
  private mockUserId = 'user_98765';

  readonly steps = signal<TourStep[]>([]);
  readonly currentStepIndex = signal<number>(-1);
  readonly isLoaded = signal<boolean>(false);
  readonly historyLog = signal<TourTelemetry[]>([]);
  readonly isActive = computed(() => this.currentStepIndex() !== -1 && this.isLoaded());
  readonly currentStep = computed(() => {
    const idx = this.currentStepIndex();
    return idx >= 0 && idx < this.steps().length ? this.steps()[idx] : null;
  });

  // Configura os passos iniciais do tour no estado da aplicação.
  initialize(steps: TourStep[]): void {
    this.steps.set(steps);
  }

  // Notifica o serviço que a página terminou de carregar os elementos ou loadings pendentes.
  setPageLoaded(loaded: boolean): void {
    this.isLoaded.set(loaded);
  }

  // Inicia o tour a partir do primeiro passo caso o carregamento geral esteja concluído.
  start(): void {
    if (this.steps().length === 0 || !this.isLoaded()) return;
    this.currentStepIndex.set(0);
    this.executeBeforeShow();
    this.saveTelemetry('start');
  }

  // Avança para o próximo passo executando hooks assíncronos de fechamento de elementos se houver.
  async next(): Promise<void> {
    const current = this.currentStep();
    if (!current) return;

    if (current.afterHide) await current.afterHide();

    const nextIdx = this.currentStepIndex() + 1;
    if (nextIdx < this.steps().length) {
      this.currentStepIndex.set(nextIdx);
      this.executeBeforeShow();
      this.saveTelemetry('next');
    } else {
      this.complete();
    }
  }

  // Retrocede para o passo anterior gerenciando a abertura ou fechamento de dropdowns via ciclo de vida.
  async previous(): Promise<void> {
    const current = this.currentStep();
    if (!current || this.currentStepIndex() === 0) return;

    if (current.afterHide) await current.afterHide();

    this.currentStepIndex.update(idx => idx - 1);
    this.executeBeforeShow();
    this.saveTelemetry('previous');
  }

  // Interrompe o fluxo registrando a ação de desistência voluntária do usuário.
  skip(): void {
    this.saveTelemetry('skip');
    this.reset();
  }

  // Fecha o balão abruptamente ao clicar no botão X ou interagir via atalho ESC.
  close(): void {
    this.saveTelemetry('close');
    this.reset();
  }

  // Conclui com êxito o fluxo completo salvando os logs e persistindo o encerramento permanente.
  complete(): void {
    this.saveTelemetry('complete');
    // TODO: Enviar o barramento completo de telemetry para API de gravação permanente
    this.reset();
  }

  // Reseta o indexador forçando a ocultação de todos os elementos visuais do tour.
  private reset(): void {
    this.currentStepIndex.set(-1);
  }

  // Dispara a função preparatória programada antes de expor o passo atual na tela.
  private async executeBeforeShow(): Promise<void> {
    const current = this.currentStep();
    if (current?.beforeShow) {
      await current.beforeShow();
    }
  }

  // Estrutura a telemetria do clique atual do usuário armazenando internamente para futura integração de Analytics.
  private saveTelemetry(action: TourAction): void {
    const entry: TourTelemetry = {
      userId: this.mockUserId,
      action,
      stepId: this.currentStep()?.id,
      stepIndex: this.currentStepIndex(),
      timestamp: Date.now()
    };
    this.historyLog.update(logs => [...logs, entry]);
    console.log('[Tour Telemetry Logged Local]:', entry);
  }
}
