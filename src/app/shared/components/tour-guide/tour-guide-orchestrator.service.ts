import { Injectable, inject, signal, computed } from '@angular/core';
import { TourRequest, TourStep } from './tour-guide.types';
import { TourGuideService } from './tour-guide.service';
import { StorageService } from './../../../home/components/home/services/storage.service';

@Injectable({
  providedIn: 'root'
})
export class TourOrchestratorService {
  private readonly storageService = inject(StorageService);
  private readonly tourService = inject(TourGuideService);

  // Fila interna de tours aguardando execução
  private tourQueue: TourRequest[] = [];

  // Signal que indica se existe algum tour rodando ativamente na tela neste momento
  public isAnyTourRunning = signal<boolean>(false);

  /**
   * Checa se o usuário específico já concluiu com êxito este bloco de tour.
   */
  public isTourCompleted(tourId: string, userId: string): boolean {
    const key = `tour_${tourId}_user_${userId}`;
    return this.storageService.getItem(key) === 'true';
  }

  /**
   * Grava o status definitivo de conclusão.
   */
  public saveTourCompletion(tourId: string, userId: string): void {
    const key = `tour_${tourId}_user_${userId}`;
    this.storageService.setItem(key, 'true');
    console.log(`[Tour Orchestrator] Status gravado no LocalStorage para a chave: ${key}`);
  }

  /**
   * Componentes chamam este método para entrar na fila do Tour
   */
  public requestTour(request: TourRequest): void {
    // Evita duplicidade do mesmo tour inserido na fila
    if (this.tourQueue.some(t => t.id === request.id)) return;

    const mockUserId = 'JCS1234'; // Alinhado com o ID real gravado no navegador
    const tourViewed = this.isTourCompleted(request.id, mockUserId);

    if (tourViewed) {
      console.log(`[Tour Orchestrator] Bloco ${request.id} já foi concluído pelo usuário ${mockUserId}. Ignorando agendamento.`);
      return; // <--- Bloqueia o tour antes mesmo de ele entrar na fila!
    }

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
    this.tourService.initialize(nextTour.id, nextTour.steps);

    // Aguarda o usuário concluir ou fechar o tour atual antes de avançar o código
    const resultTour = await this.tourService.start();

    console.log(`[Tour Orchestrator] Tour ${nextTour.id} finalizado com resultado: ${resultTour}`);

     // Só grava no LocalStorage se o clique veio estritamente do botão Concluir!
    if (resultTour === 'COMPLETED') {
      const mockUserId = 'JCS1234'; // garanta a captura do ID real do usuário aqui
      this.saveTourCompletion(nextTour.id, mockUserId);
    }

    // Chamada recursiva: Executa o próximo tour da fila de forma sequencial
    this.processNextTour();
  }
}
