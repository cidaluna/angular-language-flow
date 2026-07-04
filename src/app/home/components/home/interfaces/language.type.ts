/**
 * União fechada de idiomas suportados. Usar um type (em vez de string solta)
 * evita passar um idioma inválido para o Transloco ou para o header HTTP.
 */
export type AppLanguage = 'pt-BR' | 'en-US';

export const AVAILABLE_LANGUAGES: { code: AppLanguage; label: string }[] = [
  { code: 'pt-BR', label: 'Português (Brasil)' },
  { code: 'en-US', label: 'English (US)' },
];

export const DEFAULT_LANGUAGE: AppLanguage = 'pt-BR';
