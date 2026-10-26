export const BUSINESS_TIMEZONE = 'America/Bogota';
export const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Jornada (YYYY-MM-DD) de un instante en hora de Bogota, sin depender de la zona del navegador. */
export function businessDateOf(instant: string | null | undefined): string | null {
  if (!instant) return null;
  const value = new Date(instant);
  if (Number.isNaN(value.getTime())) return null;
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(value);
  const part = (type: string) => parts.find((item) => item.type === type)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function settlementLink(date: string | null): string {
  return date ? `/admin/liquidacion?date=${encodeURIComponent(date)}` : '/admin/liquidacion';
}
