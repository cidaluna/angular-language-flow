import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { environment } from '../../../../../environments/environment';
import { FeatureFlags, HarnessFFEvaluation } from '../interfaces/home-item.interface';
import { firstValueFrom } from 'rxjs';
import { isValueInList } from '../../../../shared/utils/string.utils';

@Injectable({ providedIn: 'root' })
export class FeatureFlagService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/apiFFHarness`;

  // Signal que armazena a lista de flags vindas do db.json
  private readonly flagsSignal = signal<HarnessFFEvaluation[]>([]);

  constructor() {}

  // Carrega as feature flags antes que a aplicação comece a consultá-las
  async initialize(): Promise<void> {
    console.log(":: FF Entrou em initialize");
    try {
      const data = await firstValueFrom(this.http.get<HarnessFFEvaluation[]>(this.baseUrl));
      console.log(":: FF Entrou em initialize com data = ", data);
      this.flagsSignal.set(data ?? []);
    } catch (error) {
      this.flagsSignal.set([]);
      console.log(':: FF Erro ao carregar Feature Flags do Harness:', error);
    }
  }

  // Retorna o valor bruto de uma feature flag string solicitada
  getStringFlag(flagKey: string, defaultValue: string = ''): string {
    const evaluation = this.flagsSignal().find(f => f.flag === flagKey && f.kind === 'string');
    console.log(':: FF getStringFlag - flagKey:', flagKey, '| evaluation:', evaluation);

    return evaluation && typeof evaluation.value === 'string' ? evaluation.value : defaultValue;
  }

  // Verifica se o usuário atual está na lista de logons separados por vírgula.
  isUserAllowed(flagKey: string, currentLogon: string): boolean {
    console.log(':: FF isLogonEnabled - flagKey:', flagKey, '| currentLogon:', currentLogon);

    const stringList = this.getStringFlag(flagKey);
    if (!stringList) return false;

    // Transforma a string do Harness "Cida, João, UBS1234" num array de strings
    const logonsArray = stringList.split(',');

    // isValueInList normaliza (trim + lowercase) cada item antes de comparar
    const verify = isValueInList(logonsArray, currentLogon);
    console.log(":: FF verify = ", verify);
    return verify;
  }

}
