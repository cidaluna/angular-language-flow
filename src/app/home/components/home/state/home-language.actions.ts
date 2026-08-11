import { HomeItem } from "../interfaces/home-item.interface";

/**
 * Disparada quando a Home precisa carregar seus dados pela primeira vez.
 *
 * IMPORTANTE:
 * O lang aqui representa o idioma inicial solicitado ao backend.
 *
 * Na inicialização da aplicação utilizamos pt-BR como idioma inicial.
 * O backend poderá retornar outro idioma em response.lang caso exista
 * uma preferência previamente persistida para aquele usuário.
 */
export class LoadInitialHomeItems {
  static readonly type = '[App] Load Initial Home Items';
  constructor(public readonly lang: string) {}
}

export class ChangeLanguage {
  static readonly type = '[Header] Change Language';
  constructor(public readonly lang: string) {}
}

// Estas duas continuam iguais — são o "commit" atômico, compartilhado pelos 2 fluxos
export class SyncLanguageSuccess {
  static readonly type = '[HomeLanguage] Sync Success';
  constructor(public readonly lang: string, public readonly items: HomeItem[]) {}
}

export class SyncLanguageFailure {
  static readonly type = '[HomeLanguage] Sync Failure';
  constructor(public readonly error: string) {}
}

export class ClearSwitchError {
  static readonly type = '[HomeLanguage] Clear Switch Error';
}
