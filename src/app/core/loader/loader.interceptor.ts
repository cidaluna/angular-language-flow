import { HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { Store } from "@ngxs/store";
import { ShowLoader, HideLoader } from './loader.state';
import { finalize } from "rxjs";

/*
  Interceptará todas as requisições HTTP da sua aplicação: liga o loader quando a
  requisição começa e desliga (via finalize) quando ela termina.
*/
export const loaderInterceptor: HttpInterceptorFn = (req, next) => {
  const store = inject(Store);

  // Dispara a ação para exibir o loader global
  store.dispatch(new ShowLoader());

  return next(req).pipe(
    finalize(() => {
      console.log(":: [Loader Interceptor] método loaderInterceptor finalize vai chamar Action HideLoader");
      // Dispara a ação para ocultar qdo a requisição terminar (sucesso ou erro)
      store.dispatch(new HideLoader());
    })
  );
}
