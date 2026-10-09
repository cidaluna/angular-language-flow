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
    // Escuta mudanças de step e aguarda o ciclo completo de pintura do DOM do Angular 19 antes de medir.
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

     // 2. Sistema Inteligente de Validação Anti-Colisão (Margens da Janela/Viewport)
    const bubbleWidth = 325;
    const bubbleHeight = 180; // Altura aproximada estimada do card do tour
    const windowWidth = window.innerWidth;
    const paddingScreen = 16; // Margem mínima de segurança para o balão nunca encostar na quina do browser

    // Correção para o eixo X (Laterais Esquerda / Direita)
    if (step.position === 'left' || step.position === 'right') {
      if (left - bubbleWidth < paddingScreen) {
        // Se estourar a esquerda, força o balão a se posicionar para a direita ou centralizado abaixo
        left = rect.left + scrollX + rect.width / 2;
        top = rect.bottom + scrollY + gap;
        step.position = 'bottom'; // Altera temporariamente a semântica de renderização visual do SCSS
      } else if (left + bubbleWidth > windowWidth - paddingScreen) {
        // Se estourar a borda direita (comum no último elemento do menu), empurra ele para a esquerda com segurança
        left = rect.left + scrollX - bubbleWidth - gap;
      }
    } else if (step.position === 'bottom' || step.position === 'top') {
      // Ajuste de centralização para posições de topo/base que estão muito perto das quinas laterais da tela
      if (left - (bubbleWidth / 2) < paddingScreen) {
        left = paddingScreen + (bubbleWidth / 2);
      } else if (left + (bubbleWidth / 2) > windowWidth - paddingScreen) {
        left = windowWidth - paddingScreen - (bubbleWidth / 2);
      }
    }

    // Correção para o eixo Y (Topo / Abaixo da barra de ferramentas do navegador)
    if (top - scrollY < paddingScreen) {
      // Se o topo der negativo ou ficar escondido sob o topo do browser, empurra para a base (bottom)
      top = rect.bottom + scrollY + gap;
    }

    this.bubbleTop.set(top);
    this.bubbleLeft.set(left);
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}
