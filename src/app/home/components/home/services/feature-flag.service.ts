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
    console.log(":: Entrou em initialize");
    try {
      this.flags = await firstValueFrom(this.http.get<FeatureFlags>(this.baseUrl));
    } finally {
      this.ready.set(true);
    }
  }

  // Retorna o valor de uma feature flag booleana.
  getBoolean(flag: keyof FeatureFlags): boolean {
    console.log(":: Entrou em getBoolean com flag = ", flag);
    return this.flags?.[flag] === true;
  }

  // Retorna o valor bruto de uma feature flag string
  getString(flag: keyof FeatureFlags): string {
    console.log(":: Entrou em getString com flag = ", flag);
    const value = this.flags?.[flag];
    return typeof value === 'string' ? value : '';
  }

  // Converte uma feature flag string contendo um JSON em uma lista segura de strings.
  getStringArray(flag: keyof FeatureFlags): string[] {
    const value = this.getString(flag);

    if (!value){
      return [];
    }
    console.log(":: Entou no getStringArray com value = ", value);

    try {
      const parsed: unknown = JSON.parse(value);
      console.log(":: Entou no getStringArray e aplicou o parse = ", parsed);
      return Array.isArray(parsed) && parsed.every(item => typeof item === 'string') ? parsed : [];
    } catch {
      return [];
    }
  }

}
