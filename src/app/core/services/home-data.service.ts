import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';

import { LanguageService } from './language.service';
import { HomeItem } from '../../home/interfaces/home-item.interface';
import { AppLanguage } from '../../home/interfaces/language.type';

/**
 * Orquestra o ciclo: chama a fake API já com o idioma pretendido no header
 * e só "comita" esse idioma (via LanguageService) se a chamada der certo.
 * Em caso de erro, idioma e dados anteriores são mantidos intactos.
 */
@Injectable({ providedIn: 'root' })
export class HomeDataService {
  private readonly http = inject(HttpClient);
  private readonly languageService = inject(LanguageService);
  private readonly baseUrl = 'http://localhost:3000';

  readonly items = signal<HomeItem[]>([]);
  readonly loading = signal(false);
  readonly error = signal(false);

  /** Toggle de teste/demo: liga o parâmetro que força erro na fake API. */
  readonly simulateError = signal(false);

  /**
   * @param lang idioma a ser solicitado. Se omitido, usa o idioma já
   * commitado (útil para o carregamento inicial da Home).
   */
  load(lang: AppLanguage = this.languageService.activeLang()): void {
    this.loading.set(true);
    this.error.set(false);

    const headers = new HttpHeaders({ 'Accept-Language': lang });
    let params = new HttpParams();
    if (this.simulateError()) {
      params = params.set('simulateError', 'true');
    }

    this.http.get<HomeItem[]>(`${this.baseUrl}/home-items`, { headers, params }).subscribe({
      next: (items) => {
        this.items.set(items);
        this.languageService.commit(lang);
        this.loading.set(false);
      },
      error: () => {
        // Não commitamos nada: idioma ativo e itens anteriores continuam
        // exatamente como estavam, evitando a tela bilíngue.
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  toggleSimulateError(value: boolean): void {
    this.simulateError.set(value);
  }
}
