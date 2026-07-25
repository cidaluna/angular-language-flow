import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';

import { HomeItem, HomeItemsResponse } from '../../home/interfaces/home-item.interface';
import { AppLanguage } from '../../home/interfaces/language.type';
import { LanguageService } from '../../../../core/services/language.service';
import { firstValueFrom, map, Observable } from 'rxjs';

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
    // Captura o idioma que está ativo no momento (vindo do dropdown ou do estado inicial)
    const currentLang = this.languageService.activeLang();

    // Injeta o idioma ativo diretamente no header da requisição HTTP
    const headers = new HttpHeaders({
      'Accept-Language': currentLang
    });

    console.log(":: [Home Api Service] método getHomeItems com o currentLang/activeLang: ", currentLang)

    // Faz o GET na lista inteira de apiHomeItems e filtra no Frontend
    return this.http.get<HomeItemsResponse[]>(this.baseUrl, { headers }).pipe(
      map((allHomeItems: HomeItemsResponse[]) => {
        // 1. Tenta encontrar o objeto que possui o idioma ativo no momento
        let matchedData = allHomeItems.find(item => item.lang === currentLang);

        // 2. REGRA DE NEGÓCIO / FALLBACK: Se não achar o idioma atual ou o campo 'lang' estiver omitido,
        // força o sistema a buscar e adotar o objeto correspondente ao 'pt-BR'
        if (!matchedData) {
          console.warn(`:: [Home Api Service][Language Fallback]: Idioma '${currentLang}' não encontrado ou omitido na API. Aplicando 'pt-BR'.`);
          matchedData = allHomeItems.find(item => item.lang === 'pt-BR');
        }

        // 3. Segurança extrema: Se nem o pt-BR existir por algum erro no db.json, evita que o app quebre
        if (!matchedData) {
          return {
            id: 0,
            lang: 'pt-BR',
            items: []
          };
        }

        // Retorna apenas o objeto do idioma correto (ou o pt-BR) para o componente ler
        return matchedData;
      })
    );
  }
}
