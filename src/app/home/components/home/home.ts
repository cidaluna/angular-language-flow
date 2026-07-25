import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { LanguageService } from '../../../core/services/language.service';
import { HomeApiService } from './services/home-api.service';
import { switchMap } from 'rxjs';
import { HomeItemsResponse } from './interfaces/home-item.interface';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, TranslocoModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
  private homeService = inject(HomeApiService);

   // Signal para guardar os 4 mini cards vindos da API fake
  protected apiData = signal<HomeItemsResponse | null>(null);

  // Exemplo de variáveis para passar para os parâmetros do Transloco (greeting)
  protected userName: string = 'Cida Luna';
  protected messageCount: number = 5;

  ngOnInit(): void {
    this.loadScreenData();
  }


  private loadScreenData(): void {
    console.log(":: [Home] método loadScreenData");
    this.homeService.getHomeItems().subscribe({
      next: (response) => {
        this.apiData.set(response);
        console.log(':: [Home] next com sucesso');
      },
      error: (err) => {
        console.error(':: [Home] error com:', err);
      }
    });
  }

  // RASTREADOR 1: Dispara a cada ciclo de verificação do Angular
  ngDoCheck(): void {
    console.log(':: [Ciclo de Vida] Home Component verificado pelo Change Detection!');
  }

}
