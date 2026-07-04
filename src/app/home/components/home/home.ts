import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { HomeDataService } from '../../../core/services/home-data.service';

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

  ngOnInit(): void {
    // Carrega já no idioma commitado (o que veio do localStorage, ou pt-BR).
    this.homeDataService.load();
  }
}
