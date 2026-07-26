import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { HomeItemsResponse } from '../../home/interfaces/home-item.interface';
import { LanguageService } from '../../../../core/services/language.service';
import { map, Observable } from 'rxjs';

/**
 * Orquestra o ciclo: chama a fake API já com o idioma pretendido no header
 * e só "comita" esse idioma (via LanguageService) se a chamada der certo.
 * Em caso de erro, idioma e dados anteriores são mantidos intactos.
 */
@Injectable({ providedIn: 'root' })
export class HomeApiService {
  private readonly http = inject(HttpClient);
  private readonly languageService = inject(LanguageService);
  private readonly baseUrl = 'http://localhost:3000/apiHomeItems';

  getHomeItems(): Observable<HomeItemsResponse> {
    const currentLang = this.languageService.activeLang(); // Começa como pt-BR

    // Injeta o idioma ativo diretamente no header da requisição HTTP
    const headers = new HttpHeaders({
      'Accept-Language': currentLang
    });

    console.log(":: [Home Api Service] método getHomeItems API com o currentLang/activeLang: ", currentLang)

    // Faz o GET na lista inteira de apiHomeItems e filtra no Frontend
    return this.http.get<HomeItemsResponse[]>(this.baseUrl, { headers }).pipe(
      map((allHomeItems: HomeItemsResponse[]) => {
        // Validação de segurança: se a resposta do banco vier vazia
        if (!allHomeItems || allHomeItems.length === 0) {
          console.log(":: [Home Api Service] método getHomeItems API retornou erro com status 0 ou 404")
          throw new HttpErrorResponse({ status: 404, statusText: 'Not Found' });
        }

        // Tenta buscar no array o bloco correspondente ao idioma enviado no header
        let matchedData = allHomeItems.find(item => item.lang === currentLang);

        // REQUISITO: Se não encontrar o idioma ou o campo 'lang' estiver omitido, aplica o fallback para pt-BR
        if (!matchedData) {
          matchedData = allHomeItems.find(item => item.lang === 'pt-BR');
        }

        // Se houver uma falha cadastral grave no db.json e nem o pt-BR existir, lança erro 500
        if (!matchedData) {
          console.log(":: [Home Api Service] método getHomeItems API com falha no db.json e o pt-BR não existe");
          throw new HttpErrorResponse({ status: 500, statusText: 'Missing Default Template' });
        }

        // Garante que se o campo 'lang' interno vier nulo ou omitido, ele assume o fallback de cabeçalho
        if (!matchedData.lang) {
          matchedData.lang = 'pt-BR';
        }

        console.log(":: [Home Api Service] método getHomeItems API com idioma = ", matchedData);
        return matchedData;
      })
    );
  }
}
