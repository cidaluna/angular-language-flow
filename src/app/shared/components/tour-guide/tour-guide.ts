import {
  Component,
  input,
  output,
  computed,
  effect,
  HostListener,
  viewChild,
  ElementRef,
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
  readonly spotlight = input.required<SpotlightMetrics>();
  readonly bubbleTop = input.required<number>();
  readonly bubbleLeft = input.required<number>();
  readonly isMobileLayout = input.required<boolean>();
  readonly isTopCollided = input.required<boolean>();
  readonly isPositionReady = input.required<boolean>();
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
  // COMPUTEDS LOCAIS (Reatividade derivada puramente dos inputs)
  // ---------------------------------------------------------------------------
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
     * O efeito monitora a prontidão do layout. Assim que o serviço reposicionar
     * os elementos e ligar o 'isPositionReady', o foco é transferido síncronamente.
     */
    effect(() => {
      if (this.isPositionReady() && this.isActive()) {
        this.focusContainer();
      }
    });
  }

  // Captura os comandos de atalhos e gerencia a navegação focada por teclado (Focus Trap).
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

  // Altera programaticamente o foco para dentro da caixa do diálogo do tour ativo.
  private focusContainer(): void {
    this.containerRef()?.nativeElement.focus();
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
}
