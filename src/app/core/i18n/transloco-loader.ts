import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Translation, TranslocoLoader } from '@jsverse/transloco';

/**
 * Carrega os textos fixos da tela a partir de /assets/i18n/{lang}.json.
 * Isso é totalmente independente da fake API: aqui é só o "dicionário"
 * de rótulos da UI (títulos, labels, mensagens de erro etc).
 */
@Injectable({ providedIn: 'root' })
export class TranslocoHttpLoader implements TranslocoLoader {
  private readonly http = inject(HttpClient);

  getTranslation(lang: string) {
    return this.http.get<Translation>(`/i18n/${lang}.json`);
  }
}
