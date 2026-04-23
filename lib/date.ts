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
