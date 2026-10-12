import { Injectable, signal, computed } from '@angular/core';
import { TourRequest, TourStep } from './tour-guide.types';
import { TourGuideService } from './tour-guide.service';

@Injectable({
  providedIn: 'root'
})
export class TourOrchestratorService {
  // Fila interna de tours aguardando execução
  private tourQueue: TourRequest[] = [];

  // Signal que indica se existe algum tour rodando ativamente na tela neste momento
  public isAnyTourRunning = signal<boolean>(false);

  constructor(private tourService: TourGuideService) {}

  /**
   * Componentes chamam este método para entrar na fila do Tour
   */
  public requestTour(request: TourRequest): void {
    // Evita duplicidade do mesmo tour inserido na fila
    if (this.tourQueue.some(t => t.id === request.id)) return;

    this.tourQueue.push(request);

    // Reordena a fila pela prioridade: menor número (1) vem primeiro
    this.tourQueue.sort((a, b) => a.priority - b.priority);

    // Se não houver nenhum tour rodando, processa a fila imediatamente
    if (!this.isAnyTourRunning()) {
      this.processNextTour();
    }
  }

  private async processNextTour(): Promise<void> {
    if (this.tourQueue.length === 0) {
      this.isAnyTourRunning.set(false);
      return;
    }

    this.isAnyTourRunning.set(true);

    // Remove e captura o tour de maior prioridade (o primeiro da fila)
    const nextTour = this.tourQueue.shift()!;
    console.log(`[Tour Orchestrator] Iniciando o tour de ID: ${nextTour.id} (Prioridade: ${nextTour.priority})`);

    // Injeta os passos no serviço visual do Tour
    this.tourService.initialize(nextTour.steps);

    // Aguarda o usuário concluir ou fechar o tour atual antes de avançar o código
    await this.tourService.start();

    console.log(`[Tour Orchestrator] Tour ${nextTour.id} finalizado com sucesso!`);

    // Chamada recursiva: Executa o próximo tour da fila de forma sequencial
    this.processNextTour();
  }
}
