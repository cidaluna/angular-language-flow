import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Translation, TranslocoLoader } from '@jsverse/transloco';
import { Observable } from 'rxjs';

/**
 * Carrega os textos fixos da tela a partir de /assets/i18n/{lang}.json.
 * Isso é totalmente independente da fake API: aqui é só o "dicionário"
 * de rótulos da UI (títulos, labels, mensagens de erro etc).
 */
@Injectable({ providedIn: 'root' })
export class TranslocoHttpLoader implements TranslocoLoader {
  private readonly http = inject(HttpClient);

  /**
   * Executa a busca assíncrona do arquivo JSON contendo os dicionários locais de tradução.
   * Isolado nesta classe para permitir estratégias alternativas de carregamento (ex: S3, CDN ou Local Storage).
   */
  getTranslation(lang: string): Observable<Translation> {
    return this.http.get<Translation>(`/i18n/${lang}.json`);
  }
}
