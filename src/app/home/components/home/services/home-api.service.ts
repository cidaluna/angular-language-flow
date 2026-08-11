import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HomeItemsResponse } from '../interfaces/home-item.interface';
import { environment } from '../../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class HomeApiService {
  private readonly baseUrl = `${environment.apiBaseUrl}/apiHomeItems`;

  constructor(private http: HttpClient) {}

  /**
   * Carrega os dados da Home.
   *
   * Contrato com o backend:
   * GET /apiHomeItems
   * Header obrigatório:
   * Accept-Language
   * Não existe body.
   *
   * IMPORTANTE:
   * O idioma enviado representa o idioma solicitado/inicial.
   * O backend pode devolver response.lang diferente caso exista
   * uma preferência previamente persistida.
   */
  getHomeItems(lang: string): Observable<HomeItemsResponse> {

    const headers = new HttpHeaders({
      'Accept-Language': lang,
    });

    console.log('[HomeApiService] GET', this.baseUrl, 'Accept-Language:', lang);

    return this.http.get<HomeItemsResponse>(this.baseUrl, { headers });
  }
}
