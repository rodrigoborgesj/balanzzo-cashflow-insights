export function parseSavingsAmount(value: string): number {
  const normalized = value.trim().replace(/\./g, '').replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return NaN;
  return Number(normalized);
}

export function calculateMonthlySavings(target: number, initialSaved: number, months: number): number {
  if (!Number.isFinite(target) || !Number.isFinite(initialSaved) || !Number.isInteger(months) || months <= 0) return 0;
  return Math.round((Math.max(0, target - initialSaved) / months + Number.EPSILON) * 100) / 100;
}

export function calculateSavingsProgress(target: number, initialSaved: number, contributions: { amount: number }[]) {
  const totalSaved = Number(initialSaved || 0) + contributions.reduce((sum, contribution) => sum + Number(contribution.amount), 0);
  return {
    totalSaved,
    remaining: Math.max(0, target - totalSaved),
    progressPercentage: target > 0 ? Math.min(100, totalSaved / target * 100) : 0,
  };
}