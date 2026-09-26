import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { environment } from '../../../../../environments/environment';
import { FeatureFlags } from '../interfaces/home-item.interface';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FeatureFlagService {
  private readonly baseUrl = `${environment.apiBaseUrl}/apiFF`;
  private flags: FeatureFlags | null = null;
  readonly ready = signal(false);

  constructor(private http: HttpClient) {}

  // Carrega as feature flags antes que a aplicação comece a consulta-las
  async initialize(): Promise<void> {
    console.log(":: FF Entrou em initialize");
    try {
      this.flags = await firstValueFrom(this.http.get<FeatureFlags>(this.baseUrl));
      this.ready.set(true);
    } catch {
      this.flags = null;
      this.ready.set(false);
    }
  }

  // Retorna o valor de uma feature flag booleana.
  getBoolean(flag: keyof FeatureFlags): boolean {
    console.log(":: FF Entrou em getBoolean com flag = ", flag);
    return this.flags?.[flag] === true;
  }

  // Retorna o valor bruto de uma feature flag string
  getString(flag: keyof FeatureFlags): string {
    console.log(":: FF Entrou em getString com flag = ", flag);
    const value = this.flags?.[flag];
    return typeof value === 'string' ? value : '';
  }

  // Converte uma feature flag string contendo um JSON em uma lista segura de strings.
  getStringArray(flag: keyof FeatureFlags): string[] {
    const value = this.getString(flag);

    if (!value){
      return [];
    }
    console.log(":: FF Entou no getStringArray com value = ", value);

    try {
      const parsed: unknown = JSON.parse(value);
      console.log(":: FF Entou no getStringArray e aplicou o parse = ", parsed);
      return Array.isArray(parsed) && parsed.every(item => typeof item === 'string') ? parsed : [];
    } catch {
      return [];
    }
  }

  // Verifica se o usuario informado/logado está autorizado na lista de logons vinda da feature flag string em allowedUsers.
  isUserAllowed(logon: string): boolean {
    console.log(":: FF Entrou no isUserAllowed com logon = ", logon);
    const allowedUsers = this.getStringArray('allowedUsers'); // nome do campo que vem da api
    console.log(":: FF Entrou no isUserAllowed com a lista allowedUsers = ", allowedUsers);

    return allowedUsers.some(
      user => user.trim().toLocaleLowerCase() === logon.trim().toLocaleLowerCase()
    );
  }

}
