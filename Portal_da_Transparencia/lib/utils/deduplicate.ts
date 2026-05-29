/**
 * Deduplica servidores: agrupa por (matrícula, cargo).
 * Se a mesma matrícula/cargo aparece mais de uma vez,
 * mantém apenas o primeiro registro (mais recente da importação).
 * Se a matrícula mudou de cargo, ambos os registros são mantidos.
 *
 * Para registros sem matrícula, usa (nome, cargo) como fallback.
 */
export function deduplicateServidores<T extends { nome?: string | null; matricula?: string | null; cargo?: string | null }>(data: T[]): T[] {
  const seen = new Map<string, T>();

  for (const record of data) {
    const key = record.matricula
      ? `${record.matricula}|${record.cargo ?? ''}`
      : `${record.nome ?? ''}|${record.cargo ?? ''}`;

    if (!seen.has(key)) {
      seen.set(key, record);
    }
  }

  return Array.from(seen.values()).sort((a, b) =>
    (a.nome ?? '').localeCompare(b.nome ?? '', 'pt-BR'),
  );
}
