import { Injectable, signal, computed } from '@angular/core';
import { TourStep, TourTelemetry, TourAction } from './tour-guide.types';

@Injectable({ providedIn: 'root' })
export class TourGuideService {
  private mockUserId = 'user_98765';
  private tourPromiseResolver?: () => void;

  readonly steps = signal<TourStep[]>([]);
  readonly currentStepIndex = signal<number>(-1);
  readonly historyLog = signal<TourTelemetry[]>([]);
  readonly isActive = computed(() => this.currentStepIndex() !== -1);
  readonly currentStep = computed(() => {
    const idx = this.currentStepIndex();
    return idx >= 0 && idx < this.steps().length ? this.steps()[idx] : null;
  });

  // Configura os passos iniciais do tour no estado da aplicação.
  initialize(steps: TourStep[]): void {
    this.steps.set(steps);
    console.log(':: Entrou no initialize do tour sevice com :', this.steps.length);
  }

  // Inicia o tour a partir do primeiro passo caso o carregamento geral esteja concluído.
  start(): Promise<void> {
    console.log(':: Entrou no start do tour service');

    return new Promise<void>((resolve) => {
      if (this.steps().length === 0) {
        resolve(); // Se não tiver passos, destrava a fila imediatamente
        return;
      }

      // Salvamos a função de resolução na nossa propriedade de classe
      this.tourPromiseResolver = resolve;

      this.currentStepIndex.set(0);
      this.executeBeforeShow();
      this.saveTelemetry('start');
    });
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
      await this.complete();
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

  // Interrompe o fluxo registrando a ação de desistência voluntária e limpando hooks pendentes.
  async skip(): Promise<void> {
    this.saveTelemetry('skip');
    const current = this.currentStep();
    if (current?.afterHide) await current.afterHide();
    this.reset();
    // GATILHO ESSENCIAL ADICIONADO: Impede o travamento da fila ao pular o tour
    this.liberarOrquestrador();
  }

  // Fecha o balão abruptamente ao clicar no botão X ou ESC, executando a limpeza do step atual.
  async close(): Promise<void> {
    this.saveTelemetry('close');
    const current = this.currentStep();
    if (current?.afterHide) await current.afterHide();
    this.reset();
    // GATILHO: Avisa o orquestrador que este bloco fechou
    this.liberarOrquestrador();
  }

  // Conclui com êxito o fluxo completo executando o afterHide do último passo e salvando os logs definitivos.
  async complete(): Promise<void> {
    this.saveTelemetry('complete');
    const current = this.currentStep();
    if (current?.afterHide) await current.afterHide();
    this.reset();
    // GATILHO: Avisa o orquestrador que este bloco fechou
    this.liberarOrquestrador();
  }

 // Reseta o indexador forçando a ocultação de todos os elementos visuais do tour.
  private reset(): void {
    this.currentStepIndex.set(-1);
    this.steps.set([]); // Higienização de estado para evitar vazamentos de memória (residual)
  }

  // NOVA FUNÇÃO AUXILIAR: Executa o resolve e limpa a memória
  private liberarOrquestrador(): void {
    if (this.tourPromiseResolver) {
      this.tourPromiseResolver(); // <--- Destrava o 'await' do Orquestrador!
      this.tourPromiseResolver = undefined; // Limpa a referência para o próximo bloco da fila
    }
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
