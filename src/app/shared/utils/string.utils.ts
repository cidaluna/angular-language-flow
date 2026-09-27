/**
 * Normaliza uma string removendo espaços nas extremidades e
 * convertendo para minúsculas.
 *
 * Usado pra comparações "tolerantes" — ex: logons que podem vir
 * com espaço acidental ou capitalização inconsistente de fontes
 * diferentes (Harness FF, header HTTP, input do usuário).
 */
export function normalizeString(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Verifica se um valor está presente numa lista de strings,
 * usando comparação normalizada (trim + lowercase) em cada item.
 */
export function isValueInList(list: string[], value: string): boolean {
  if (!list || !value) return false;
  console.log(":: FF Entrou no isValueInList com list = ", list, " e value = " , value);

  const searchValue = normalizeString(value);
  return list.some((item) => normalizeString(item) === searchValue);
}


/**
 * Converte uma string separada por vírgula (formato comum de flags
 * "kind: string" no Harness FF) num array de strings limpas.
 *
 * Remove espaços de cada item e descarta itens vazios (protege
 * contra vírgula sobrando no fim, ex: "Cida, João,").
 */
export function toStringList(value: string): string[] {
  if (!value) return [];

  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  /*
  *Por que um filter no final? Porque se alguém salvar "Cida, João," (vírgula sobrando no fim,
  erro humano comum ao editar na esteira), o split gera um último item "" vazio — sem o filter,
  isso entraria na lista como um "usuário vazio" válido.
  */
}
