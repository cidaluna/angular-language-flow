import { inject } from "@angular/core";
import { HttpInterceptorFn } from '@angular/common/http';
import { Router } from "@angular/router";
import { catchError, throwError } from "rxjs";

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  // Injeta o serviço de rotas no angular
  const router = inject(Router);

  return next(req).pipe(
    catchError((error) => {
      // Verifica se o erro veio realmente de uma resposta http api
      if (error.status === 404 || error.status === 500 || error.status === 0) {
        console.error(`[Http Error ${error.status}]: Redirecionando para página de contingência.`);

        // Redireciona o usuário de forma automática e limpa para a tela 404
        router.navigate(['/error']);
      }
      // Repassa o erro adiante caso algum serviço específico ainda precise ler os detalhes
      return throwError(() => error);
    })
  );
};
