import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { environment } from '../../../../../environments/environment';
import { FeatureFlags, HarnessFFEvaluation } from '../interfaces/home-item.interface';
import { firstValueFrom } from 'rxjs';
import { isValueInList, normalizeString } from '../../../../shared/utils/string.utils';

@Injectable({ providedIn: 'root' })
export class FeatureFlagService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/apiFFHarness`;
  private readonly OFF_VARIATION_VALUE = 'off';

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
    // Busca a flag apenas pela chave (sem filtrar o kind ainda)
    const evaluation = this.flagsSignal().find(f => f.flag === flagKey);

    console.log(':: FF getStringFlag - flagKey:', flagKey, '| evaluation:', evaluation);

    // Se a flag existe, mas o contrato veio errado da esteira (ex: veio kind 'boolean' ou 'json')
    if (evaluation && evaluation.kind !== 'string') {
      console.error(`:: FF [ERRO DE CONTRATO] A flag "${flagKey}" foi encontrada, mas o tipo configurado na esteira é "${evaluation.kind}" em vez de "string".`);
      return defaultValue;
    }

    // Se passou pela validação e o valor é uma string válida, retorna o texto bruto
    return evaluation && typeof evaluation.value === 'string' ? evaluation.value : defaultValue;
  }

  // Verifica se o usuário atual está na lista de logons separados por vírgula.
  isLogonEnabled(flagKey: string, currentLogon: string): boolean {
    console.log(':: FF isLogonEnabled com flagKey:', flagKey, ', e currentLogon:', currentLogon);

    const rawListLogons = this.getStringFlag(flagKey);
    console.log(':: FF isLogonEnabled com rawLogonList:', rawListLogons);


    // Se a flag não existir, for vazia ou estiver configurada como 'off', bloqueia direto.
    // O uso do '?.' garante que se rawListLogons for nula, o código não quebra.
    if (!rawListLogons || normalizeString(rawListLogons) === this.OFF_VARIATION_VALUE) {
      console.log(":: FF isLogonEnabled com verify = false (Flag desativada ou vazia)");
      return false;
    }

    // Transforma a string do Harness "Cida, João, UBS1234" num array de strings
    const logonsArray = rawListLogons.split(',');
    console.log(":: FF isLogonEnabled com logonsArray = ", logonsArray);

    // isValueInList normaliza (trim + lowercase) cada item antes de comparar
    const verify = isValueInList(logonsArray, currentLogon);
    console.log(":: FF isLogonEnabled com verify = ", verify);
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
