import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly platformId = inject(PLATFORM_ID);

  /**
   * Lê uma chave do localStorage apenas se estiver rodando no navegador.
   */
  public getItem(key: string): string | null {
    const noNavegador = isPlatformBrowser(this.platformId);

    console.log(`:: [DEBUG STORAGE] Lendo chave: ${key} | Está rodando no navegador? ${noNavegador}`);

    if (noNavegador) {
      const valorReal = localStorage.getItem(key);
      console.log(`:: [DEBUG STORAGE] Valor físico capturado no LocalStorage para a chave [${key}]:`, valorReal);
      return valorReal;
    }
    return null;
  }

  /**
   * Grava uma chave no localStorage de forma segura.
   */
  public setItem(key: string, value: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(key, value);
    }
  }

  /**
   * Remove um item do localStorage.
   */
  public removeItem(key: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(key);
    }
  }
}
