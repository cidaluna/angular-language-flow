import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-error-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <main class="error-container" aria-labelledby="error-title">
      <div class="error-card">
        <h1 id="error-title" class="error-code">404 / 500</h1>
        <h2 class="error-message">Ops! Ocorreu um problema no servidor</h2>
        <p class="error-description">
          Não conseguimos processar sua solicitação no momento. Por favor, tente acessar mais tarde.
        </p>
        <button routerLink="/" class="error-btn" aria-label="Voltar para a página inicial">
          Voltar para a Home
        </button>
      </div>
    </main>
  `,
  styleUrl: './error-page.scss',
})
export class ErrorPage {}
