import { Component, inject } from '@angular/core';
import { LanguageService } from '../../core/services/language.service';
import { TranslocoModule } from '@jsverse/transloco';
import { CommonModule } from '@angular/common';
import { HomeDataService } from '../../home/components/home/services/home-data.service';
import { AppLanguage, AVAILABLE_LANGUAGES } from '../../home/components/home/interfaces/language.type';

@Component({
  selector: 'app-header',
  imports: [CommonModule, TranslocoModule],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
    readonly languageService = inject(LanguageService);
  readonly homeDataService = inject(HomeDataService);
  readonly languages = AVAILABLE_LANGUAGES;

  onLanguageChange(event: Event): void {
    const lang = (event.target as HTMLSelectElement).value as AppLanguage;
    // Dispara o ciclo completo: chama a API com o novo idioma e só troca
    // o Transloco/localStorage se a resposta vier com sucesso.
    this.homeDataService.load(lang);
  }

  onSimulateErrorToggle(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.homeDataService.toggleSimulateError(checked);
  }
}
