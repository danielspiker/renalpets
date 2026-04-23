export const APP_TZ = "America/Sao_Paulo";

export function todayBRT(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: APP_TZ }).format(new Date());
}

export function formatBRT(
  date: Date | string,
  opts: Intl.DateTimeFormatOptions = {}
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("pt-BR", { timeZone: APP_TZ, ...opts }).format(d);
}

// Returns [startISO, endISO) covering the BRT day as UTC instants.
// BRT is UTC-3 year-round (no DST).
export function brtDayBounds(day: string): { start: string; end: string } {
  const start = new Date(`${day}T00:00:00-03:00`).toISOString();
  const next = new Date(`${day}T00:00:00-03:00`);
  next.setUTCDate(next.getUTCDate() + 1);
  return { start, end: next.toISOString() };
}
