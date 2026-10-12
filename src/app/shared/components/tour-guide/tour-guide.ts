import {
  Component,
  input,
  output,
  computed,
  effect,
  signal,
  HostListener,
  viewChild,
  ElementRef,
  untracked,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TourStep, SpotlightMetrics } from './tour-guide.types';

@Component({
  selector: 'app-tour-guide',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tour-guide.html',
  styleUrls: ['./tour-guide.scss'],
})
export class TourGuide {
  private readonly containerRef = viewChild<ElementRef<HTMLElement>>('tourContainer');

  // ---------------------------------------------------------------------------
  // INPUTS MODERNOS (Angular 19 Signals Inputs)
  // ---------------------------------------------------------------------------
  readonly steps = input.required<TourStep[]>();
  readonly currentStepIndex = input.required<number>();
  readonly isActive = input.required<boolean>();

  // ---------------------------------------------------------------------------
  // OUTPUTS (Emissão de eventos nativos - Angular 19 Syntax)
  // ---------------------------------------------------------------------------
  readonly nextClick = output<void>();
  readonly previousClick = output<void>();
  readonly skipClick = output<void>();
  readonly closeClick = output<void>();
  readonly completeClick = output<void>();

  // ---------------------------------------------------------------------------
  // SIGNALS LOCAIS DE GEOMETRIA (Recuperando seu controle de tela original)
  // ---------------------------------------------------------------------------
  readonly bubbleTop = signal<number>(0);
  readonly bubbleLeft = signal<number>(0);
  readonly spotlight = signal<SpotlightMetrics>({ top: 0, left: 0, width: 0, height: 0 });
  readonly isMobileLayout = signal<boolean>(false);
  readonly isTopCollided = signal<boolean>(false);
  readonly isPositionReady = signal<boolean>(false);

  // ---------------------------------------------------------------------------
  // COMPUTEDS Computeds derivados dos inputs locais
  // ---------------------------------------------------------------------------
  //
  readonly currentStep = computed(() => {
    const idx = this.currentStepIndex();
    const list = this.steps();
    return idx >= 0 && idx < list.length ? list[idx] : null;
  });

  readonly isLastStep = computed(() => {
    return this.currentStepIndex() === this.steps().length - 1;
  });

  constructor() {
    /**
     * Toda vez que o passo mudar de verdade, nós recalculamos o layout
     * com base no elemento físico real da tela e controlamos a opacidade anti-piscar.
     */
    effect((onCleanup) => {
      const step = this.currentStep();
      if (!step || !this.isActive()) {
        this.isPositionReady.set(false);
        return;
      }

      this.isPositionReady.set(false);
      let frameId: number;

      const timerId = setTimeout(() => {
        frameId = requestAnimationFrame(() => {
          // O untracked impede loops infinitos causados pela reavaliação de escrita nos signals locais
          untracked(() => {
            this.recalculateLayout();
            this.focusContainer();
            this.isPositionReady.set(true);
          });
        });
      }, 0);

      onCleanup(() => {
        clearTimeout(timerId);
        if (frameId) cancelAnimationFrame(frameId);
      });
    });
  }

 @HostListener('window:resize')
  onResize(): void {
    if (this.isActive()) {
      this.recalculateLayout();
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboard(event: KeyboardEvent): void {
    if (!this.isActive()) return;

    if (event.key === 'Escape') {
      this.closeClick.emit();
    } else if (event.key === 'Enter') {
      const activeEl = document.activeElement;
      if (activeEl?.tagName !== 'BUTTON') {
        event.preventDefault();
        this.isLastStep() ? this.completeClick.emit() : this.nextClick.emit();
      }
    } else if (event.key === 'Tab') {
      this.processFocusTrap(event);
    }
  }

  private focusContainer(): void {
    this.containerRef()?.nativeElement.focus();
  }

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

  private recalculateLayout(): void {
    const step = this.currentStep();
    if (!step) return;

    const target = document.getElementById(step.targetId);
    if (!target) return;

    const rect = target.getBoundingClientRect();
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

    const computedPosition = isMobile ? 'bottom' : step.position;

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

    this.isTopCollided.set(false);

    if (!isMobile) {
      const bubbleWidth = 325;
      const bubbleHeightEstimated = 180;
      const safetyPadding = 12;

      if (step.position === 'left' || step.position === 'right') {
        const estimatedRealTop = rect.top - bubbleHeightEstimated / 2;

        if (estimatedRealTop < safetyPadding) {
          top = scrollY + safetyPadding;
          this.isTopCollided.set(true);
        }

        if (left - bubbleWidth < safetyPadding) {
          left = rect.left + scrollX + rect.width / 2;
          top = rect.bottom + scrollY + baseGap;
          this.isTopCollided.set(false);
        } else if (left + bubbleWidth > windowWidth - safetyPadding) {
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
