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

  constructor() {
    // Efeito reativo que atualiza posição do balão e do spotlight ao trocar de passo.
    effect(() => {
      const step = this.tourService.currentStep();
      if (step) {
        setTimeout(() => {
          this.recalculateLayout();
          this.focusContainer();
        }, 60);
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

  // Mede e posiciona as coordenadas do balão e do destaque sob o elemento alvo correspondente.
  private recalculateLayout(): void {
    const step = this.tourService.currentStep();
    if (!step) return;

    const target = document.getElementById(step.targetId);
    if (!target) return;

    const rect = target.getBoundingClientRect();
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    const padding = 8;

    this.spotlight.set({
      top: rect.top + scrollY - padding,
      left: rect.left + scrollX - padding,
      width: rect.width + (padding * 2),
      height: rect.height + (padding * 2)
    });

    const gap = 20;
    let top = 0;
    let left = 0;

    switch (step.position) {
      case 'bottom':
        top = rect.bottom + scrollY + gap;
        left = rect.left + scrollX + rect.width / 2;
        break;
      case 'left':
        top = rect.top + scrollY + rect.height / 2;
        left = rect.left + scrollX - gap;
        break;
      case 'right':
        top = rect.top + scrollY + rect.height / 2;
        left = rect.right + scrollX + gap;
        break;
      case 'top':
        top = rect.top + scrollY - gap;
        left = rect.left + scrollX + rect.width / 2;
        break;
    }

    this.bubbleTop.set(top);
    this.bubbleLeft.set(left);
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}
