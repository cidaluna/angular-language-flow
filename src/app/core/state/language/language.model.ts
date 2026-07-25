import { HomeItem } from '../../../features/home/models/home-item.model';

export type AppLanguage = 'pt-BR' | 'en-US';

export interface LanguageStateModel {
  activeLanguage: AppLanguage;
  apiData: HomeItem[];
  hasError: boolean;
  isReady: boolean;
}
