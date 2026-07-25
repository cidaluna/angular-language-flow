import { Component, inject } from '@angular/core';
import { LanguageFacade } from '../../facade/language.facade';

@Component({
  selector: 'app-global-loader',
  standalone: true,
  template: `
    @if (isLoading()) {
      <div class="loader-overlay" aria-busy="true" aria-live="assertive">
        <div class="loader-box">
          <div class="spinner" aria-hidden="true"></div>
          <p class="loader-text">Sincronizando Dicionários e Dados Corporativos...</p>
        </div>
      </div>
    }
  `,
  styles: [`
    .loader-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background-color: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(8px);
      z-index: 9999;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .loader-box {
      text-align: center;
      color: #f8fafc;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .spinner {
      width: 56px;
      height: 56px;
      border: 5px solid #334155;
      border-top-color: #38bdf8;
      border-radius: 50%;
      margin: 0 auto 20px;
      animation: spin 1s linear infinite;
    }
    .loader-text {
      font-size: 1.1rem;
      font-weight: 500;
      letter-spacing: 0.025em;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class GlobalLoaderComponent {
  // Consome a facade injetando o sinal que escuta o estado isolado de Loadings globais
  readonly isLoading = inject(LanguageFacade).isGlobalLoading;
}
