import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';

import { HomeItem } from '../../home/interfaces/home-item.interface';
import { AppLanguage } from '../../home/interfaces/language.type';
import { LanguageService } from '../../../../core/services/language.service';
import { firstValueFrom } from 'rxjs';

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

    /**
   * Só vira `true` na primeira resposta com sucesso e nunca mais volta a
   * `false` (nem num erro futuro): nesse caso os dados/idioma anteriores
   * continuam válidos e consistentes entre si, então não há motivo para
   * esconder os textos fixos de novo. O que ele impede é o h5 (ou qualquer
   * texto fixo do front amarrado a este dado) aparecer ANTES de sabermos,
   * com certeza, que dado e idioma já estão sincronizados.
   */
  readonly ready = signal(false);

  /** Toggle de teste/demo: liga o parâmetro que força erro na fake API. */
  readonly simulateError = signal(false);

  /**
   * @param lang idioma a ser solicitado. Se omitido, usa o idioma já
   * commitado (útil para o carregamento inicial da Home).
   */
  async load(lang: AppLanguage = this.languageService.activeLang()): Promise<void> {
    this.loading.set(true);
    this.error.set(false);

    const headers = new HttpHeaders({ 'Accept-Language': lang });
    let params = new HttpParams();
    if (this.simulateError()) {
      params = params.set('simulateError', 'true');
    }

    // this.http.get<HomeItem[]>(`${this.baseUrl}/home-items`, { headers, params }).subscribe({
    //   next: (items) => {
    //     this.items.set(items);
    //     this.languageService.commit(lang);
    //     this.ready.set(true);
    //     this.loading.set(false);
    //   },
    //   error: () => {
    //     // Não commitamos nada: idioma ativo e itens anteriores continuam
    //     // exatamente como estavam, evitando a tela bilíngue.
    //     this.error.set(true);
    //     this.loading.set(false);
    //   },
    // });

    try {
      // 🚀 SOLUÇÃO: Converte o Observable em Promise assíncrona.
      // O firstValueFrom garante a captura da primeira emissão e encerra a conexão na hora.
      const items = await firstValueFrom(
        this.http.get<HomeItem[]>(`${this.baseUrl}/home-items`, { headers, params })
      );

      // Bloco executado apenas em caso de sucesso (equivalente ao next)
      this.items.set(items);
      this.languageService.commit(lang);
      this.ready.set(true);
    } catch {
      // Bloco executado em caso de falha do BFF Java (equivalente ao error)
      this.error.set(true);
    } finally {
      // O bloco finally roda independente de dar certo ou errado, centralizando o loader
      this.loading.set(false);
    }
  }

  toggleSimulateError(value: boolean): void {
    this.simulateError.set(value);
  }
}
