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
    try {
      const data = await firstValueFrom(this.http.get<HarnessFFEvaluation[]>(this.baseUrl));
      console.log(":: FF Entrou em initialize recupera todas as FF com data = ", data);
      this.flagsSignal.set(data ?? []);
    } catch (error) {
      this.flagsSignal.set([]);
      console.log(':: FF Erro ao carregar Feature Flags initialize', error);
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
    console.log(':: FF isUserAllowed com flagKey:', flagKey, ', e currentLogon:', currentLogon);

    const stringList = this.getStringFlag(flagKey);
    if (!stringList) return false;

    // Transforma a string do Harness "Cida, João, UBS1234" num array de strings
    const logonsArray = stringList.split(',');

    // isValueInList normaliza (trim + lowercase) cada item antes de comparar
    const verify = isValueInList(logonsArray, currentLogon);
    console.log(":: FF isUserAllowed com verify = ", verify);
    return verify;
  }

  // Retorna o valor bruto de uma feature flag booleana. Começa como false
  // por padrão; passa a ser controlada via esteira quando a flag for
  // cadastrada no Harness com kind: "boolean".
  getBooleanFlag(flagKey: string, defaultValue: boolean = false): boolean {
    const evaluation = this.flagsSignal().find(f => f.flag === flagKey && f.kind === 'boolean');
    console.log(':: FF BOOLEAN - getBooleanFlag - flagKey:', flagKey, ' | evaluation:', evaluation);

    return evaluation && typeof evaluation.value === 'boolean' ? evaluation.value : defaultValue;
  }

  // Simula a esteira DevSecOps atualizando o valor de uma flag booleana
  // em runtime — sem precisar de novo deploy.
  setBooleanFlag(flagKey: string, newValue: boolean): void {
    console.log(':: FF BOOLEAN - setBooleanFlag - flagKey:', flagKey, ' | newValue:', newValue);

    this.flagsSignal.update((currentFlags) =>
      currentFlags.map((flag) =>
        flag.flag === flagKey && flag.kind === 'boolean'
          ? { ...flag, value: newValue }
          : flag
      )
    );
  }
}
