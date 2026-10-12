import {
  Component,
  inject,
  effect,
  signal,
  HostListener,
  viewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TourGuideService } from './tour-guide.service';
import { SpotlightMetrics } from './tour-guide.types';

@Component({
  selector: 'app-tour-guide',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tour-guide.html',
  styleUrls: ['./tour-guide.scss'],
})
export class TourGuide {
  readonly tourService = inject(TourGuideService);
  private containerRef = viewChild<ElementRef<HTMLElement>>('tourContainer');

  readonly bubbleTop = signal<number>(0);
  readonly bubbleLeft = signal<number>(0);
  readonly spotlight = signal<SpotlightMetrics>({ top: 0, left: 0, width: 0, height: 0 });
  readonly isMobileLayout = signal<boolean>(false);
  readonly isTopCollided = signal<boolean>(false); // Novo sinal para controlar classes de safe-zone no CSS

  // NOVO SIGNAL: Controla a exibição síncrona do balão
  readonly isPositionReady = signal<boolean>(false);

  constructor() {
    // Escuta mudanças de step e aguarda a pintura completa do DOM do Angular 19 para medir com precisão.
    effect((onCleanup) => {
      const step = this.tourService.currentStep();
      if (!step) {
        this.isPositionReady.set(false);
        return;
      }

      // 1. Esconde o balão imediatamente quando o passo muda
      this.isPositionReady.set(false);

      let frameId: number;

      const timerId = setTimeout(() => {
        frameId = requestAnimationFrame(() => {
          this.recalculateLayout();
          this.focusContainer();
          // 3. Após recalcular o layout físico, tornamos o balão visível!
          this.isPositionReady.set(true);
        });
      }, 0);

      onCleanup(() => {
        clearTimeout(timerId);
        if (frameId) cancelAnimationFrame(frameId);
      });
    });
  }

  // Recalcula as dimensões em caso de alteração no tamanho da janela do navegador.
  @HostListener('window:resize')
  onResize(): void {
    if (this.tourService.isActive()) {
      this.recalculateLayout();
    }
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
    if (!target) return;

    const rect = target.getBoundingClientRect();
    // Proteção adicional: Se as dimensões forem zeroed, pula o cálculo para evitar divisões por zero ou posições que quebram o DOM.
    if (rect.width === 0 && rect.height === 0) return;

    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    const windowWidth = window.innerWidth;

    const isMobile = windowWidth <= 768;
    this.isMobileLayout.set(isMobile);

    const padding = 8;
    this.spotlight.set({
      top: rect.top + scrollY - padding,
      left: rect.left + scrollX - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
    });

    const baseGap = isMobile ? 10 : 16;
    const lateralGap = 4;
    let top = 0;
    let left = 0;

    // Converte posições horizontais para vertical se a largura do dispositivo for pequena (Mobile)
    const computedPosition = isMobile ? 'bottom' : step.position;

    // 1. Cálculos de Geometria de Posicionamento Padrão
    switch (computedPosition) {
      case 'bottom':
        top = rect.bottom + scrollY + baseGap;
        left = isMobile ? windowWidth / 2 : rect.left + scrollX + rect.width / 2;
        break;
      case 'top':
        top = rect.top + scrollY - baseGap;
        left = isMobile ? windowWidth / 2 : rect.left + scrollX + rect.width / 2;
        break;
      case 'left':
        top = rect.top + scrollY + rect.height / 2;
        left = rect.left + scrollX - padding - lateralGap;
        break;
      case 'right':
        top = rect.top + scrollY + rect.height / 2;
        left = rect.right + scrollX + padding + lateralGap;
        break;
    }

    // Reset padrão do sinal de colisão superior
    this.isTopCollided.set(false);

    // 2. Sistema Avançado de Zona de Segurança (Anti-Collision Guard)
    if (!isMobile) {
      const bubbleWidth = 325;
      const bubbleHeightEstimated = 180; // Altura média do corpo do balão do tour
      const safetyPadding = 12; // Distância mínima obrigatória do teto da janela do navegador

      if (step.position === 'left' || step.position === 'right') {
        // Estima se a translação vertical padrão de -50% do CSS vai jogar o balão para fora do topo do browser
        const estimatedRealTop = rect.top - bubbleHeightEstimated / 2;

        if (estimatedRealTop < safetyPadding) {
          // Força o topo do balão a começar exatamente na linha segura abaixo do teto do navegador
          top = scrollY + safetyPadding;
          this.isTopCollided.set(true); // Alerta o SCSS para remover a translação vertical de -50%
        }

        // Proteção contra estouro das quinas laterais esquerdas e direitas da janela
        if (left - bubbleWidth < safetyPadding) {
          left = rect.left + scrollX + rect.width / 2;
          top = rect.bottom + scrollY + baseGap;
          this.isTopCollided.set(false);
        } else if (left + bubbleWidth > windowWidth - safetyPadding) {
          // Se estourar a quina direita, recua o balão com segurança baseado no tamanho fixo do card
          left = rect.left + scrollX - bubbleWidth - baseGap;
        }
      } else if (step.position === 'bottom' || step.position === 'top') {
        if (left - bubbleWidth / 2 < safetyPadding) {
          left = safetyPadding + bubbleWidth / 2;
        } else if (left + bubbleWidth / 2 > windowWidth - safetyPadding) {
          left = windowWidth - safetyPadding - bubbleWidth / 2;
        }
      }
    }

    this.bubbleTop.set(top);
    this.bubbleLeft.set(left);
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}
