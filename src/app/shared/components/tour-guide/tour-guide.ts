import { Component, inject, effect, signal, HostListener, viewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TourGuideService } from './tour-guide.service';
import { SpotlightMetrics } from './tour-guide.types';

@Component({
  selector: 'app-tour-guide',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tour-guide.html',
  styleUrls: ['./tour-guide.scss']
})
export class TourGuide {
  readonly tourService = inject(TourGuideService);
  private containerRef = viewChild<ElementRef<HTMLElement>>('tourContainer');

  readonly bubbleTop = signal<number>(0);
  readonly bubbleLeft = signal<number>(0);
  readonly spotlight = signal<SpotlightMetrics>({ top: 0, left: 0, width: 0, height: 0 });
  readonly isMobileLayout = signal<boolean>(false);
  readonly isTopCollided = signal<boolean>(false); // Novo sinal para controlar classes de safe-zone no CSS

  constructor() {
    // Escuta mudanças de step e aguarda o ciclo de pintura do DOM do Angular 19 para medir.
    effect(() => {
      const step = this.tourService.currentStep();
      if (step) {
        requestAnimationFrame(() => {
          setTimeout(() => {
            this.recalculateLayout();
            this.focusContainer();
          }, 40);
        });
      }
    });
  }

  // Recalcula as dimensões em caso de alteração no tamanho da janela do navegador.
  @HostListener('window:resize')
  onResize(): void {
    if (this.tourService.isActive()) this.recalculateLayout();
  }

  // Captura os comandos de atalhos e gerencia a navegação focada por teclado (Focus Trap).
  @HostListener('window:keydown', ['$event'])
  handleKeyboard(event: KeyboardEvent): void {
    if (!this.tourService.isActive()) return;

    if (event.key === 'Escape') {
      this.tourService.close();
    } else if (event.key === 'Enter') {
      const activeEl = document.activeElement;
      if (activeEl?.tagName !== 'BUTTON') {
        event.preventDefault();
        const isLast = this.tourService.currentStepIndex() === this.tourService.steps().length - 1;
        isLast ? this.tourService.complete() : this.tourService.next();
      }
    } else if (event.key === 'Tab') {
      this.processFocusTrap(event);
    }
  }

  // Altera programaticamente o foco para dentro da caixa do diálogo do tour ativo.
  private focusContainer(): void {
    const el = this.containerRef()?.nativeElement;
    if (el) el.focus();
  }

  // Mantém o foco de navegação do TAB estritamente confinado nos botões do balão atual.
  private processFocusTrap(event: KeyboardEvent): void {
    const el = this.containerRef()?.nativeElement;
    if (!el) return;

    const focusables = el.querySelectorAll<HTMLElement>('button, [tabindex="0"]');
    if (focusables.length === 0) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      last.focus();
      event.preventDefault();
    } else if (!event.shiftKey && document.activeElement === last) {
      first.focus();
      event.preventDefault();
    }
  }

  // Mede as coordenadas físicas reais no documento e corrige distorções de renderização de elementos assíncronos.
  private recalculateLayout(): void {
    const step = this.tourService.currentStep();
    if (!step) return;

    const target = document.getElementById(step.targetId);
    if (!target || target.getBoundingClientRect().height === 0) {
      requestAnimationFrame(() => this.recalculateLayout());
      return;
    }

    const rect = target.getBoundingClientRect();
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    const windowWidth = window.innerWidth;

    const isMobile = windowWidth <= 768;
    this.isMobileLayout.set(isMobile);

    const padding = 8;

    this.spotlight.set({
      top: rect.top + scrollY - padding,
      left: rect.left + scrollX - padding,
      width: rect.width + (padding * 2),
      height: rect.height + (padding * 2)
    });

    const gap = isMobile ? 10 : 20;
    let top = 0;
    let left = 0;

    const computedPosition = isMobile ? 'bottom' : step.position;

    // 1. Cálculos de Posição Inicial Baseados na Geometria Padrão
    switch (computedPosition) {
      case 'bottom':
        top = rect.bottom + scrollY + gap;
        left = isMobile ? windowWidth / 2 : rect.left + scrollX + rect.width / 2;
        break;
      case 'top':
        top = rect.top + scrollY - gap;
        left = isMobile ? windowWidth / 2 : rect.left + scrollX + rect.width / 2;
        break;
      case 'left':
        top = rect.top + scrollY + rect.height / 2;
        left = rect.left + scrollX - gap;
        break;
      case 'right':
        top = rect.top + scrollY + rect.height / 2;
        left = rect.right + scrollX + gap;
        break;
    }

    // Reset padrão do estado de colisão do topo antes de reavaliar as restrições
    this.isTopCollided.set(false);

    // 2. Proteções e Ajustes de Viewport Avançados (Apenas Desktop/Telas Médias)
    if (!isMobile) {
      const bubbleWidth = 325;
      const bubbleHeightEstimated = 180; // Altura aproximada do card com header, content e footer
      const paddingScreen = 16;

      // Validação Crítica: Proteção contra colisão com o topo do navegador (Previne sumir metade para cima)
      if (step.position === 'left' || step.position === 'right') {
        const estimatedTopPivot = top - scrollY - (bubbleHeightEstimated / 2);

        if (estimatedTopPivot < paddingScreen) {
          // Ajusta a coordenada top para alinhar perfeitamente com a quina superior do elemento alvo
          top = rect.top + scrollY;
          this.isTopCollided.set(true); // Ativa classe que zera a translação de y no SCSS (-50% para 0)
        }

        // Validação das laterais (Eixo X) para left/right
        if (left - bubbleWidth < paddingScreen) {
          left = rect.left + scrollX + rect.width / 2;
          top = rect.bottom + scrollY + gap;
          this.isTopCollided.set(false);
        } else if (left + bubbleWidth > windowWidth - paddingScreen) {
          left = rect.left + scrollX - bubbleWidth - gap;
        }
      } else if (step.position === 'bottom' || step.position === 'top') {
        if (left - (bubbleWidth / 2) < paddingScreen) {
          left = paddingScreen + (bubbleWidth / 2);
        } else if (left + (bubbleWidth / 2) > windowWidth - paddingScreen) {
          left = windowWidth - paddingScreen - (bubbleWidth / 2);
        }
      }
    }

    this.bubbleTop.set(top);
    this.bubbleLeft.set(left);
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}
