/**
 * Formato de cada item retornado pela fake API, já no idioma solicitado
 * via header Accept-Language. Diferente dos textos fixos da tela (que
 * vêm do Transloco), este conteúdo é "dinâmico" e localizado no backend.
 */
export interface HomeItem {
  id: number;
  titulo: string;
  descricao: string;
}

export interface HomeItemsResponse {
  id: number;
  lang: 'pt-BR' | 'en-US' | 'es-ES'; // Preferência de idioma salva na api fake
  items: Array<{
    id: number;
    titulo: string;
    descricao: string;
  }>;
}

/**
 * A separação currentLang vs pendingLang é o ponto-chave: ela existe pra que a view nunca leia um estado intermediário.
 * Enquanto pendingLang estiver preenchido, a UI mostra loader; só quando a troca é bem-sucedida, pendingLang vira currentLang.
 */

export interface HomeItemsResponse {
  id: number;
  lang: 'pt-BR' | 'en-US' | 'es-ES'; // Preferência de idioma salva na api fake
  items: HomeItem[];
}

export interface HomeLanguageStateModel {
  currentLang: string;
  pendingLang: string | null;
  lastAttemptedLang: string | null;
  items: HomeItem[];
  loading: boolean;
  error: string | null;
}

export const HOME_LANGUAGE_STATE_DEFAULTS: HomeLanguageStateModel = {
  currentLang: 'pt-BR',
  pendingLang: null,
  lastAttemptedLang: 'pt-BR',
  items: [],
  loading: false,
  error: null,
};

export interface LanguagePreferenceResponse {
  lang: string | null;
  updatedAt?: string;
}

export interface FeatureFlags {
  newDash: boolean;
  allowedUsers: string;
}

