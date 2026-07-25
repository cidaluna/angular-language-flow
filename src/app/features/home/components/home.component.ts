import { Component, inject, OnInit } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { LanguageFacade } from '../../../../../shared/facade/language.facade';
import { HomeApiService } from '../data-access/home-api.service';
import { AppLanguage } from '../../../../../core/state/language/language.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [TranslocoModule],
  template: `
    <div *transloco="let t; read: 'home'" class="page-container">

      <!-- EXIBIÇÃO SEGURA: Só renderiza se a aplicação passou pelo ciclo de bootstrap com sucesso -->
      @if (isReady()) {
        <header class="app-header">
          <div class="brand">
            <h1>{{ t('app_title') }}</h1>
          </div>

          <div class="controls">
            <label for="langSelector" class="sr-only">Selecione o Idioma / Select Language</label>
            <select
              id="langSelector"
              [value]="activeLang()"
              (change)="onLanguageChanged($event)"
              class="styled-select">
              <option value="pt-BR">Português (pt-BR)</option>
              <option value="en-US">English (en-US)</option>
            </select>
          </div>
        </header>

        <main class="content-area">
          <div class="welcome-box">
            <h2>{{ t('welcome_message') }}</h2>
          </div>

          <section class="grid-layout">
            @for (item of dataItems(); track item.id) {
              <article class="data-card">
                <h3>{{ item.title }}</h3>
                <p>{{ item.description }}</p>
              </article>
            } @empty {
              <div class="empty-state">
                <p>Nenhum registro retornado pelo servidor local.</p>
              </div>
            }
          </section>
        </main>
      }

      <!-- CONTAINER DE INTERCEPÇÃO DE CRASHES (FLUXO RETRY) -->
      @if (hasError()) {
        <div class="error-wrapper">
          <div class="error-card">
            <div class="error-icon">⚠️</div>
            <h2>Erro de Sincronização</h2>
            <p>Não foi possível carregar os dicionários ou dados da API no idioma selecionado.</p>
            <button (click)="onRetryExecuted()" class="btn-retry">Tentar Novamente</button>
          </div>
        </div>
      }

      <!-- PAINEL DE ENGENHARIA DE INFRAESTRUTURA (DEBUGGER) -->
      <footer class="debug-panel">
        <label class="switch-container">
          <input
            type="checkbox"
            [checked]="apiService.simulateErrorFlag()"
            (change)="onToggleDebugMode($event)">
          <span class="switch-label">Simular Falha de Conexão no BFF Java</span>
        </label>
      </footer>

    </div>
  `,
  styles: [`
    .page-container {
      font-family: system-ui, -apple-system, sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px;
      color: #1e293b;
    }
    .app-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    h1 { font-size: 1.75rem; color: #0f172a; margin: 0; }
    .styled-select {
      padding: 8px 16px;
      font-size: 1rem;
      border: 2px solid #cbd5e1;
      border-radius: 6px;
      background-color: white;
      cursor: pointer;
      outline: none;
      transition: border-color 0.2s;
    }
    .styled-select:focus { border-color: #38bdf8; }
    .welcome-box {
      background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 24px;
      border-left: 5px solid #3b82f6;
    }
    .welcome-box h2 { margin: 0; font-size: 1.3rem; color: #1e40af; }
    .grid-layout {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
    }
    .data-card {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 20px;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .data-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    .data-card h3 { margin-top: 0; color: #0f172a; }
    .error-wrapper {
      position: fixed;
      top: 0; left: 0; width: 100vw; height: 100vh;
      background-color: rgba(255, 255, 255, 0.95);
      display: flex; justify-content: center; align-items: center;
      z-index: 999;
    }
    .error-card {
      text-align: center; max-width: 450px; padding: 40px;
      background: white; border: 1px solid #fca5a5; border-radius: 12px;
      box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05);
    }
    .error-icon { font-size: 3rem; margin-bottom: 16px; }
    .btn-retry {
      background-color: #ef4444; color: white; border: none;
      padding: 12px 28px; font-size: 1rem; font-weight: 600;
      border-radius: 6px; cursor: pointer; transition: background 0.2s;
    }
    .btn-retry:hover { background-color: #dc2626; }
    .debug-panel {
      margin-top: 60px; padding: 16px; background-color: #f1f5f9;
      border-radius: 6px; border: 1px dashed #cbd5e1;
    }
    .switch-container { display: flex; align-items: center; cursor: pointer; }
    .switch-label { margin-left: 10px; font-weight: 500; color: #475569; }
  `]
})
export class HomeComponent implements OnInit {
  // Injeções limpas baseadas na API funcional inject do Angular 18
  private readonly facade = inject(LanguageFacade);
  readonly apiService = inject(HomeApiService);

  // Mapeamento direto de propriedades reativas via Signals para consumo imediato no Template HTML
  readonly activeLang = this.facade.activeLanguage;
  readonly dataItems = this.facade.apiData;
  readonly hasError = this.facade.hasError;
  readonly isReady = this.facade.isReady;

  ngOnInit(): void {
    // Inicializa a esteira de dados caso seja a primeira carga de renderização do componente
    if (!this.isReady()) {
      this.facade.initBootstrapper();
    }
  }

  onLanguageChanged(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.facade.changeLanguage(select.value as AppLanguage);
  }

  onRetryExecuted(): void {
    this.facade.retryLastFetch();
  }

  onToggleDebugMode(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    this.apiService.setSimulateError(checkbox.checked);
  }
}
