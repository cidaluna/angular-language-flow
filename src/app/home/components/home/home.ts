import { CommonModule } from '@angular/common';
import { Component, effect, inject, signal } from '@angular/core';
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
export class Home {
  private homeService = inject(HomeApiService);
  private languageService = inject(LanguageService);
  private translocoService = inject(TranslocoService);

   // Signal para guardar os 4 mini cards vindos da API fake
  protected apiData = signal<HomeItemsResponse | null>(null);

  // Exemplo de variáveis para passar para os parâmetros do Transloco (greeting)
  protected userName: string = 'Cida Luna';
  protected messageCount: number = 5;

  constructor() {
    // O efeito monitora o dropdown em tempo real!
    effect(() => {
      // 1. Ao ler o Signal activeLang(), o Angular registra essa dependência automaticamente.
      // Toda vez que o usuário mudar o idioma no dropdown, este bloco inteiro roda novamente!
      const currentLanguage = this.languageService.activeLang();

      // 2. Dispara o fluxo bloqueante: API primeiro, Transloco depois!
      this.loadAndSynchronizeData(currentLanguage);
    });
  }


  private loadAndSynchronizeData(langCode: string): void {
    console.log(":: [Home] método loadAndSynchronizeData início");
    this.homeService.getHomeItems().pipe(
      // Encadeia o response da API com o download do JSON de tradução
      switchMap((response: HomeItemsResponse) => {
        // 1. Salvamos os dados da API na tela quando ela responder com sucesso 200
        this.apiData.set(response);

        // 2. Força a esteira do RxJS a aguardar o download do JSON do Transloco (ex: es-ES.json).
        // Como o loaderInterceptor monitora a chamada HTTP, o spinner global fica cravado na tela
        // travando os cliques até que o arquivo de tradução do front termine de baixar!
        return this.translocoService.selectTranslation(response.lang);
      })
    ).subscribe({
      next: () => {
        // O Loader Global some EXATAMENTE NESTE MILISSEGUNDO, porque a API e o Transloco
        // terminaram de baixar juntos. Tela 100% atualizada sem conteúdo bilíngue!
        console.log(`:: [Home] método loadAndSynchronizeData - Sucesso com idioma [${langCode}]`);
      },
      error: (err) => {
        // Se a requisição der erro (ou lançarmos o 404 simulado), a esteira falha,
        // o loader se fecha e o seu ErrorInterceptor global joga o usuário para a tela 404.
        console.log(":: [Home] método loadAndSynchronizeData. Error: ", err);
      }
    });
  }

  // RASTREADOR 1: Dispara a cada ciclo de verificação do Angular
  ngDoCheck(): void {
    console.log(':: [Ciclo de Vida] Home Component verificado pelo Change Detection!');
  }

}
