import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { environment } from '../../../../../environments/environment';
import { FeatureFlags, HarnessFFEvaluation } from '../interfaces/home-item.interface';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FeatureFlagService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/apiFFHarness`;

  // Signal que armazena a lista de flags vindas do db.json
  private flagsSignal = signal<HarnessFFEvaluation[]>([]);

  constructor() {}

  // Carrega as feature flags antes que a aplicação comece a consultá-las
  async initialize(): Promise<void> {
    console.log(":: FF Entrou em initialize");
    try {
      const data = await firstValueFrom(this.http.get<HarnessFFEvaluation[]>(this.baseUrl));
      console.log(":: FF Entrou em initialize com data = ", data);
      this.flagsSignal.set(data);
    } catch (error) {
      this.flagsSignal.set([]);
      console.log(':: FF Erro ao carregar Feature Flags do Harness:', error);
    }
  }

  // Retorna o valor bruto de uma feature flag string
  getStringFlag(flagKey: string, defaultValue: string = ''): string {
    const found = this.flagsSignal().find(f => f.flag === flagKey && f.kind === 'string');
    console.log(":: FF Entrou em getStringFlag com flagKey = ", flagKey +" e found = ", found);
    return found && typeof found.value === 'string' ? found.value : defaultValue;
  }

  // Verifica se o usuario informado/logado está no array de logons vinda da feature flag string.
  isLogonEnabled(flagKey: string, currentLogon: string): boolean {
    console.log(":: FF Entrou em isLogonEnabled com flagKey = ", flagKey +" e currentLogon = ", currentLogon);
    const found = this.flagsSignal().find(f => f.flag === flagKey && f.kind === 'string');

    if (!found || typeof found.value !== 'string'){
      return false;
    }

    try {
      // Como o valor da string no db.json é um array em formato string "['Item']", fazemos o parse
      const allowedUsers: string [] = JSON.parse(found.value);
      console.log(":: FF Entrou no try isLogonEnabled com allowedUsers = ", allowedUsers);

      if (Array.isArray(allowedUsers)) {
        return allowedUsers
          .map(user => user.trim().toLowerCase())
          .includes(currentLogon.trim().toLowerCase());
      }
    } catch (error) {
      // Fallback caso a string não seja um JSON válido, tenta quebrar por vírgula básica
      const allowedUsers = found.value.split(',').map(user => user.trim().toLowerCase());
      return allowedUsers.includes(currentLogon.trim().toLocaleLowerCase());
    }
    return false;
  }

}
