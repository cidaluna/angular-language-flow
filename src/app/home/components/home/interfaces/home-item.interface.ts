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
