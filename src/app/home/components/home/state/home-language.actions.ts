import { HomeItem } from "../interfaces/home-item.interface";

export class LoadInitialHomeItems {
  static readonly type = '[App] Load Initial Home Items';
  constructor() {}
}

export class ChangeLanguage {
  static readonly type = '[Header] Change Language';
  constructor(public lang: string) {}
}

// Estas duas continuam iguais — são o "commit" atômico, compartilhado pelos 2 fluxos
export class SyncLanguageSuccess {
  static readonly type = '[HomeLanguage] Sync Success';
  constructor(public lang: string, public items: HomeItem[]) {}
}

export class SyncLanguageFailure {
  static readonly type = '[HomeLanguage] Sync Failure';
  constructor(public error: string) {}
}

export class ClearSwitchError {
  static readonly type = '[HomeLanguage] Clear Switch Error';
  constructor() {}
}
