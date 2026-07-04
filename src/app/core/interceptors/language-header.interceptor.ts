import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { LanguageService } from '../services/language.service';

/**
 * Fallback: se algum request futuro não definir o header Accept-Language
 * manualmente (como o HomeDataService.load faz de propósito), este
 * interceptor garante que o idioma commitado atual seja enviado mesmo assim.
 * Isso evita repetir esse detalhe em todo novo service que a aplicação vier
 * a ganhar.
 */
export const languageHeaderInterceptor: HttpInterceptorFn = (req, next) => {
  const languageService = inject(LanguageService);

  if (req.headers.has('Accept-Language')) {
    return next(req);
  }

  const cloned = req.clone({
    setHeaders: { 'Accept-Language': languageService.activeLang() },
  });
  return next(cloned);
};
