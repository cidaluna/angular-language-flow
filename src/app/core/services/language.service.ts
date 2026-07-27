import { Injectable, inject, signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

@Injectable({ providedIn: 'root' })
export class LanguageService {

  private activeLangSignal = signal<string>('pt-BR');

  activeLang = this.activeLangSignal.asReadonly();

  // Chamado pelo dropdown — registra a INTENÇÃO do usuário
  changeLanguage(langCode: string): void {
    if (!langCode) return;
    const sanitizedLang = langCode.trim();

    // NÃO chama translocoService.setActiveLang aqui.
    // Isso só registra a intenção — quem aplica de fato é o home.ts,
    // depois que a API confirmar que o idioma é válido.
    this.activeLangSignal.set(sanitizedLang);
    console.log("::[Language Service] método changeLanguage com activeLang: ", sanitizedLang);
  }

  // Chamado pela Home quando uma troca falha — devolve o signal
  // para o idioma que estava realmente confirmado na tela
  revertTo(lang: string): void {
    this.activeLangSignal.set(lang);
  }
}
