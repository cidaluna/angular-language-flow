import { inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, delay, throwError, switchMap, of } from 'rxjs';
import { HomeApiResponse } from '../models/home-item.model';

@Injectable({ providedIn: 'root' })
export class HomeApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api/home';

  // Controle em memória para simulação controlada de Exceptions em ambiente de Homologação/Testes
  readonly simulateErrorFlag = signal<boolean>(false);

  /**
   * Realiza a busca de informações da Home.
   * Utiliza operadores reativos para forçar comportamentos controlados (lentidão e falhas simuladas).
   */
  getHomeData(): Observable<HomeApiResponse> {
    let params = new HttpParams();

    // Injeta query param se o simulador de erro do desenvolvedor estiver ativo em tela
    if (this.simulateErrorFlag()) {
      params = params.set('force_error', 'true');
    }

    return this.http.get<HomeApiResponse>(this.apiUrl, { params }).pipe(
      // ⏳ SIMULAÇÃO DE CHAMADA LENTA OBRIGATÓRIA:
      // O operador delay suspende a emissão do fluxo sem travar a main-thread do JavaScript por 2 segundos.
      delay(2000),

      // Avalia de forma reativa a intenção de simular erros
      switchMap((response) => {
        if (this.simulateErrorFlag()) {
          return throwError(() => new Error('BFF Java - Falha Crítica Simulada pelo Desenvolvedor'));
        }
        return of(response);
      })
    );
  }

  /**
   * Chaveia o estado do simulador de erros no ambiente gráfico da aplicação.
   */
  setSimulateError(value: boolean): void {
    this.simulateErrorFlag.set(value);
  }
}
