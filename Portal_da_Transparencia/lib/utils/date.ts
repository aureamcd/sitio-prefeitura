/**
 * ========================================================
 * UTILITÁRIOS DE DATA
 * ========================================================
 *
 * Funções de formatação de datas para exibição no padrão
 * brasileiro (DD/MM/YYYY), robustas para os diversos
 * formatos que chegam do banco:
 *
 *   - "DD/MM/YYYY"            (já formatado — retorna como está)
 *   - "YYYY-MM-DD"            (ISO)
 *   - "YYYY-MM-DDTHH:mm:ss"   (ISO com hora — separador T)
 *   - "YYYY-MM-DD HH:mm:ss"   (ISO com hora — separador espaço)
 *   - "DD/MM/YYYY HH:mm:ss"   (brasileiro com hora)
 *
 * O objetivo é impedir a inversão de dia/mês causada pelo
 * padrão americano (MM/DD/YYYY) do navegador e garantir que
 * a data sempre apareça de forma legível para o cidadão,
 * conforme exige a cartilha do PNTP.
 */

/**
 * Returns today's date in YYYY-MM-DD format (for server components or non-hook use).
 */
export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Converte qualquer formato conhecido de data para DD/MM/YYYY.
 * Se a data já estiver no padrão brasileiro, retorna como está.
 * Se não conseguir interpretar, retorna '-' (ou o valor original com `fallback`).
 */
export function formatDateBR(
  dateStr: string | null | undefined,
  fallback: string = '-'
): string {
  if (!dateStr) return fallback;

  const raw = dateStr.trim();

  // 1. Já está em DD/MM/YYYY (com ou sem hora)
  const brMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (brMatch) {
    const [, d, m, y] = brMatch;
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }

  // 2. ISO: YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ss ou YYYY-MM-DD HH:mm:ss
  const isoMatch = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    const day = Number(d);
    const month = Number(m);
    const year = Number(y);
    if (day > 0 && day <= 31 && month > 0 && month <= 12 && year > 1900) {
      return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
    }
  }

  // 3. Rejeita valores que não são datas completas (ex: apenas ano "2026")
  if (/^\d{1,4}$/.test(raw)) return fallback;

  // 4. Tenta interpretar via Date (último recurso, com timezone UTC p/ evitar inversão)
  try {
    const date = new Date(raw);
    if (!isNaN(date.getTime())) {
      const y = date.getUTCFullYear();
      const m = String(date.getUTCMonth() + 1).padStart(2, '0');
      const d = String(date.getUTCDate()).padStart(2, '0');
      return `${d}/${m}/${y}`;
    }
  } catch {
    // fall through
  }

  return fallback;
}

/**
 * Normaliza uma data para o formato ISO (YYYY-MM-DD), usado no atributo
 * HTML `datetime` de <time> (que exige padrão ISO, não DD/MM/YYYY).
 */
export function toISODateBR(
  dateStr: string | null | undefined
): string {
  if (!dateStr) return '';
  const raw = dateStr.trim();
  const brMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (brMatch) {
    const [, d, m, y] = brMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  const isoMatch = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return raw;
}

/**
 * Formata a data para o padrão brasileiro por extenso, ex:
 * "11 de agosto de 2026". Usado no rodapé de "Última atualização".
 */
export function formatDateLongBR(
  dateStr: string | null | undefined,
  fallback: string = '-'
): string {
  const br = formatDateBR(dateStr, '');
  if (!br) return fallback;

  const [d, m, y] = br.split('/').map(Number);
  const MESES = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
  ];
  const mes = MESES[m - 1];
  if (!mes) return br;
  return `${d} de ${mes} de ${y}`;
}
