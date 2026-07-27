import { Component, inject } from '@angular/core';
import { LanguageService } from '../../core/services/language.service';
import { TranslocoModule } from '@jsverse/transloco';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  imports: [CommonModule, TranslocoModule],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  // Tornamos público para o HTML conseguir ler: [value]="languageService.activeLang()"
  public languageService = inject(LanguageService);

  // Lista de idiomas disponíveis para o @for do seu HTML
  protected languages = [
    { code: 'pt-BR', label: 'Português' },
    { code: 'en-US', label: 'English' },
    { code: 'es-ES', label: 'Español' }
  ];

  onLanguageChange(event: Event): void {
    console.log(":: [Header] método onLanguageChange com o event: ", event);
    const selectElement = event.target as HTMLSelectElement;
    if (selectElement) {
      // Altera o idioma globalmente através do serviço
      this.languageService.changeLanguage(selectElement.value);
    }
  }
}
