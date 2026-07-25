import { AppLanguage } from './language.model';

export class BootstrapApplication {
  static readonly type = '[Language] Bootstrap Application Orchestration';
}

export class UserRequestedLanguageChange {
  static readonly type = '[Language] User Manually Triggered Change';
  constructor(public readonly requestedLanguage: AppLanguage) {}
}

export class ForceFetchTranslatedData {
  static readonly type = '[Language] Internal Force Fetch API Trigger';
}
