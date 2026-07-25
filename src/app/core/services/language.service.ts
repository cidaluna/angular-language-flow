import { Injectable, inject, signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private translocoService = inject(TranslocoService);

  // Signal público que guarda o idioma ativo na tela (Começa com o padrão do Transloco)
  //public activeLang = signal<string>(this.translocoService.getActiveLang());


  // O Signal começa sem valor fixo, pois ele aguardará estritamente a API responder
  public activeLang = signal<string>('pt-BR');


  /**
   * Força a aplicação inteira a adotar o idioma determinado pela API
   */
  initializeApplicationLanguage(apiLang: string | null | undefined): void {
    console.log(":: [Language Service] método initializeApplicationLanguage");
    // REGRA DE NEGÓCIO: Se a API falhar, retornar null ou undefined, o fallback rígido é pt-BR
    const definitiveLang = apiLang ? apiLang.trim() : 'pt-BR';

    // Atualiza o Transloco e o Signal do Dropdown no mesmo milissegundo
    this.translocoService.setActiveLang(definitiveLang);
    this.activeLang.set(definitiveLang);
  }



  /**
   * Método usado caso o usuário mude manualmente o idioma no Dropdown do Header
   */
  changeLanguage(langCode: string): void {
    console.log("::[Language Service] método changeLanguage com: ", langCode);
    this.translocoService.setActiveLang(langCode);
    this.activeLang.set(langCode);
  }
}
