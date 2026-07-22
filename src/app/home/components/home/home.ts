import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { HomeDataService } from './services/home-data.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, TranslocoModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home implements OnInit {
  readonly homeDataService = inject(HomeDataService);

  // DECLARAÇÃO E INICIALIZAÇÃO IMEDIATA (Padrão Angular 18)
  readonly nomeA = signal<string>('Cida');
  readonly qtdA = signal<number>(5);

  ngOnInit(): void {
    // Carrega já no idioma commitado (o que veio do localStorage, ou pt-BR).
    this.homeDataService.load();
  }

  abrirModalConfirmacao() {
    // teste
  }
}
