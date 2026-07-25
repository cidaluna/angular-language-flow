import { Routes } from '@angular/router';
import { Home } from './home/components/home/home';

export const routes: Routes = [
  {
    path: '', component: Home
  },
  {
    path: 'error',
    loadComponent: () => import('./core/error/error-page/error-page').then(m => m.ErrorPage)
  },
  // Rota de fallback genérica: se o usuário digitar uma URL que não existe, também vai para a página de erro
  {
    path: '**',
    redirectTo: 'error'
  }
];
