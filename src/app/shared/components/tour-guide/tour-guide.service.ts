import { Injectable, inject, signal, computed } from '@angular/core';
import { TourStep, TourTelemetry, TourAction } from './tour-guide.types';

@Injectable({ providedIn: 'root' })
export class TourGuideService {
  private mockUserId = 'JCS1234';
  private tourPromiseResolver?: (value: 'COMPLETED' | 'SKIPPED' | 'CLOSED' | PromiseLike<'COMPLETED' | 'SKIPPED' | 'CLOSED'>) => void;

   // NOVO SIGNAL: Guarda o ID do bloco ativo
  readonly activeTourId = signal<string>('');

  readonly steps = signal<TourStep[]>([]);
  readonly currentStepIndex = signal<number>(-1);
  readonly historyLog = signal<TourTelemetry[]>([]);
  readonly isActive = computed(() => this.currentStepIndex() !== -1);
  readonly currentStep = computed(() => {
    const idx = this.currentStepIndex();
    return idx >= 0 && idx < this.steps().length ? this.steps()[idx] : null;
  });

  // Configura os passos iniciais do tour e atualiza o método initialize para receber o ID do bloco:
  initialize(tourId: string, steps: TourStep[]): void {
    this.activeTourId.set(tourId);
    this.steps.set(steps);
    console.log(':: Entrou no initialize do tour sevice com :', this.steps.length);
  }

  // Inicia o tour a partir do primeiro passo caso o carregamento geral esteja concluído.
  // Ajuste o tipo do start para devolver o tipo correto na Promise
  start(): Promise<'COMPLETED' | 'SKIPPED' | 'CLOSED'> {
    console.log(':: Entrou no start do tour service');

    return new Promise<'COMPLETED' | 'SKIPPED' | 'CLOSED'>((resolve) => {
      if (this.steps().length === 0) {
        resolve('CLOSED'); // Se não tiver passos, destrava a fila imediatamente
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
      await this.complete();  // Se chegou no fim, chama o complete
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
    this.resetAndResolve('SKIPPED');
  }

  // Se fechar no X ou ESC, apenas fecha, sem salvar no Storage.
  async close(): Promise<void> {
    this.saveTelemetry('close');
    const current = this.currentStep();
    if (current?.afterHide) await current.afterHide();
    this.resetAndResolve('CLOSED');
  }

  // Conclui com êxito o fluxo completo executando o afterHide do último passo e salvando os logs definitivos.
  async complete(): Promise<void> {
    this.saveTelemetry('complete');
    const current = this.currentStep();
    if (current?.afterHide) await current.afterHide();

    // O serviço do guia APENAS avisa a Promise de fechamento com uma string de sucesso
    this.resetAndResolve('COMPLETED');
  }

 // Reseta o indexador forçando a ocultação de todos os elementos visuais do tour.
  private resetAndResolve(reason: 'COMPLETED' | 'SKIPPED' | 'CLOSED'): void {
    this.currentStepIndex.set(-1);
    this.steps.set([]);

    if (this.tourPromiseResolver) {
      this.tourPromiseResolver(reason); // Destrava o 'await' do Orquestrador perfeitamente
      this.tourPromiseResolver = undefined; // Limpa o ponteiro da memória
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
