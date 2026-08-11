import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HomeItemsResponse } from '../interfaces/home-item.interface';
import { environment } from '../../../../../environments/environment';

/**
 * Orquestra o ciclo: chama a fake API já com o idioma pretendido no header
 * e só "comita" esse idioma (via LanguageService) se a chamada der certo.
 * Em caso de erro, idioma e dados anteriores são mantidos intactos.
 */
@Injectable({ providedIn: 'root' })
export class HomeApiService {
  private readonly baseUrl = `${environment.apiBaseUrl}/apiHomeItems`;

  constructor(private http: HttpClient) {}

  /**
   * Busca os dados da Home para um idioma específico.
   *
   * A decisão de qual idioma utilizar NÃO pertence a este service.
   *
   * O HomeLanguageState resolve a regra de negócio e informa
   * explicitamente o idioma que deverá ser enviado.
   */
  getHomeItems(lang: string): Observable<HomeItemsResponse> {

    const headers = new HttpHeaders({
      'Accept-Language': lang,
    });

    console.log('[HomeApiService] GET', this.baseUrl, 'Accept-Language:', lang);

    return this.http.get<HomeItemsResponse>(this.baseUrl, { headers });
  }
}
