/**
 * Converte datas "YYYY-MM-DD" (sem horário) em Date no fuso LOCAL.
 * `new Date("2026-10-01")` é interpretado como UTC e, no Brasil (UTC-3),
 * vira 30/09 — por isso toda data de extrato deve passar por aqui.
 */
export function parseLocalDate(value: string | Date | null | undefined): Date {
  if (value instanceof Date) return value;
  if (!value) return new Date(NaN);
  const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})(?:$|[T ]00:00:00(?:\.0+)?(?:Z|[+-]00(?::?00)?)?$)/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return new Date(value);
}

/** Formata Date local como YYYY-MM-DD sem passar por UTC. */
export function toLocalISODate(d: Date): string {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${da}`;
}
