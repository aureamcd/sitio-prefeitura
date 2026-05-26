/**
 * Returns today's date in YYYY-MM-DD format (for server components or non-hook use).
 */
export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}
