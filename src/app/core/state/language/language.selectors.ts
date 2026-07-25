import { Selector } from '@ngxs/store';
import { LanguageState, LanguageStateModel } from './language.state';
import { AppLanguage } from './language.model';
import { HomeItem } from '../../../features/home/models/home-item.model';

export class LanguageSelectors {
  @Selector([LanguageState])
  static activeLanguage(state: LanguageStateModel): AppLanguage {
    return state.activeLanguage;
  }

  @Selector([LanguageState])
  static apiData(state: LanguageStateModel): HomeItem[] {
    return state.apiData;
  }

  @Selector([LanguageState])
  static hasError(state: LanguageStateModel): boolean {
    return state.hasError;
  }

  @Selector([LanguageState])
  static isReady(state: LanguageStateModel): boolean {
    return state.isReady;
  }
}
