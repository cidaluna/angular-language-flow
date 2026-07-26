import { Injectable, inject, signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private translocoService = inject(TranslocoService);

  // Idioma inicial de boot padrão do sistema
  public activeLang = signal<string>('pt-BR');

  /**
   * Modifica o idioma ativo da aplicação de forma centralizada e reativa
   */
  changeLanguage(langCode: string): void {
    if (!langCode) return;
    console.log("::[Language Service] método changeLanguage com: ", langCode);
    const sanitizedLang = langCode.trim();

    // Atualiza o Transloco e o Signal do Dropdown
    this.translocoService.setActiveLang(sanitizedLang);
    this.activeLang.set(sanitizedLang);
  }
}
