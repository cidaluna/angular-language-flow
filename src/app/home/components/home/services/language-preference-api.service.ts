import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { LanguagePreferenceResponse } from '../interfaces/home-item.interface';

@Injectable({ providedIn: 'root' })
export class LanguagePreferenceApiService {
  private readonly baseUrl = `${environment.apiBaseUrl}/apiLanguagePreference`;

  constructor(private http: HttpClient) {}

    /**
   * Recupera a última preferência de idioma persistida pela API.
   *
   * Quando não existe preferência, a API responde:
   *
   * {
   *   "lang": null
   * }
   *
   * Isso não é considerado erro.
   */
  getLanguagePreference(): Observable<LanguagePreferenceResponse> {
    console.log('[LanguagePreferenceApiService] GET', this.baseUrl);
    return this.http.get<LanguagePreferenceResponse>(this.baseUrl);
  }

  /**
   * Persiste uma nova preferência de idioma.
   *
   * A regra do backend determina que o idioma seja enviado
   * exclusivamente através do header Accept-Language.
   */
  saveLanguagePreference(lang: string): Observable<LanguagePreferenceResponse> {

    const headers = new HttpHeaders({
      'Accept-Language': lang,
    });

    console.log('[LanguagePreferenceApiService] POST', this.baseUrl, 'Accept-Language:', lang);

    return this.http.post<LanguagePreferenceResponse>(this.baseUrl, null, { headers });
  }
}

/**
 * Ponto de atenção no json-server: filtro por header não existe nativamente

O json-server filtra por query params, não por headers — então, mesmo mandando Accept-Language certinho,
ele não vai te devolver só o bloco daquele idioma. Duas saídas, ambas simples:

1. Filtrar no próprio service, no map do Observable: você busca a coleção inteira (o array com os 3 blocos pt-BR/en-US/es-ES)
e filtra client-side por lang. Mais rápido de montar.
2. Middleware customizado no json-server (middlewares.js) que lê o header e filtra a resposta antes de devolver — mais fiel
ao comportamento real de um backend corporativo, já que você mencionou querer simular esse ambiente.
 */
