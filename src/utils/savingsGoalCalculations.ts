export function parseSavingsAmount(value: string): number {
  const normalized = value.trim().replace(/\./g, '').replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return NaN;
  return Number(normalized);
}

export function calculateMonthlySavings(target: number, initialSaved: number, months: number): number {
  if (!Number.isFinite(target) || !Number.isFinite(initialSaved) || !Number.isInteger(months) || months <= 0) return 0;
  return Math.round((Math.max(0, target - initialSaved) / months + Number.EPSILON) * 100) / 100;
}

interface SavingsDeposit {
  amount: number;
  status?: string;
  reference_month?: string;
}

function isSaved(contribution: SavingsDeposit) {
  return contribution.status === undefined || contribution.status === 'completed' || contribution.status === 'late';
}

function monthIndex(value: string): number {
  const [year, month] = value.split('-').map(Number);
  return year * 12 + month - 1;
}

export function calculateRemainingSavingsPlan(target: number, initialSaved: number, months: number, startDate: string, contributions: SavingsDeposit[]) {
  const savedContributions = contributions.filter(isSaved);
  const progress = calculateSavingsProgress(target, initialSaved, savedContributions);
  const startMonth = monthIndex(startDate);
  const elapsedMonths = savedContributions.reduce((elapsed, contribution) => {
    if (!contribution.reference_month) return elapsed;
    const referenceMonth = monthIndex(contribution.reference_month);
    return Number.isFinite(referenceMonth) ? Math.max(elapsed, referenceMonth - startMonth + 1) : elapsed;
  }, 0);
  const remainingMonths = Math.max(0, months - elapsedMonths);
  return {
    ...progress,
    remainingMonths,
    monthlyAmount: calculateMonthlySavings(target, progress.totalSaved, Math.max(1, remainingMonths)),
  };
}

export function calculateSavingsProgress(target: number, initialSaved: number, contributions: SavingsDeposit[]) {
  const totalSaved = Number(initialSaved || 0) + contributions.filter(isSaved).reduce((sum, contribution) => sum + Number(contribution.amount), 0);
  return {
    totalSaved,
    remaining: Math.max(0, target - totalSaved),
    progressPercentage: target > 0 ? Math.min(100, totalSaved / target * 100) : 0,
  };
}