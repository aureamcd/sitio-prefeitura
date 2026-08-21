/**
 * Deduplica servidores de forma inteligente:
 * Agrupa por (nome_normalizado, cargo_normalizado).
 * Caso a prefeitura envie o mesmo servidor com matrículas com zeros à esquerda
 * (ex: '45' e '000045') ou códigos de lotação diferentes para o mesmo cargo,
 * mantém apenas um registro único e limpo.
 */
export function deduplicateServidores<T extends { nome?: string | null; matricula?: string | null; cargo?: string | null }>(data: T[]): T[] {
  const seen = new Map<string, T>();

  for (const record of data) {
    const nomeNorm = (record.nome || '')
      .normalize('NFC')
      .replace(/\s+/g, ' ')
      .trim()
      .toUpperCase();
      
    const cargoNorm = (record.cargo || '')
      .normalize('NFC')
      .replace(/\s+/g, ' ')
      .trim()
      .toUpperCase();

    const key = `${nomeNorm}|${cargoNorm}`;

    if (!seen.has(key)) {
      seen.set(key, record);
    }
  }

  return Array.from(seen.values()).sort((a, b) =>
    (a.nome ?? '').localeCompare(b.nome ?? '', 'pt-BR'),
  );
}
