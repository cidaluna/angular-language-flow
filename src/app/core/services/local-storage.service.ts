import { Injectable } from '@angular/core';

/**
 * Wrapper genérico sobre o localStorage. Não sabe nada sobre "idioma",
 * "tema" ou qualquer regra de negócio — só serializa/deserializa e
 * concentra o acesso à Web API num único ponto (fica fácil trocar por
 * outra estratégia de storage no futuro, ou mockar em teste).
 */
@Injectable({ providedIn: 'root' })
export class LocalStorageService {
  get<T>(key: string): T | null {
    const raw = localStorage.getItem(key);
    if (raw === null) {
      return null;
    }
    try {
      return JSON.parse(raw) as T;
    } catch {
      // valor salvo como string "crua" (não-JSON), ex.: 'pt-BR'
      return raw as unknown as T;
    }
  }

  set<T>(key: string, value: T): void {
    const raw = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(key, raw);
  }

  remove(key: string): void {
    localStorage.removeItem(key);
  }
}
