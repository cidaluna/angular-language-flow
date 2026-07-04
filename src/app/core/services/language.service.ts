import { Injectable, inject, signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { AppLanguage, DEFAULT_LANGUAGE } from '../../home/interfaces/language.type';

const STORAGE_KEY = 'app-language';

/**
 * Adapter sobre o TranslocoService (mesmo padrão que você já usa em outros
 * projetos): nenhum componente importa o Transloco diretamente, todos
 * conversam com este service.
 *
 * O ponto importante aqui é que `commit()` é o ÚNICO lugar que muda o
 * idioma "de verdade" (localStorage + Transloco + signal). Ele só deve ser
 * chamado depois que a chamada HTTP relacionada já teve sucesso — é isso
 * que impede a tela de ficar bilíngue.
 */
@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly translocoService = inject(TranslocoService);

  /** Idioma efetivamente aplicado (persistido + refletido no Transloco). */
  readonly activeLang = signal<AppLanguage>(this.readFromStorage());

  constructor() {
    // garante que o Transloco nasce alinhado com o valor salvo (ou o padrão)
    this.translocoService.setActiveLang(this.activeLang());
  }

  commit(lang: AppLanguage): void {
    localStorage.setItem(STORAGE_KEY, lang);
    this.translocoService.setActiveLang(lang);
    this.activeLang.set(lang);
  }

  private readFromStorage(): AppLanguage {
    const stored = localStorage.getItem(STORAGE_KEY) as AppLanguage | null;
    return stored ?? DEFAULT_LANGUAGE;
  }
}
