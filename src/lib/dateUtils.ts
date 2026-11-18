// Helpers para exibição amigável de datas relativas em pt-BR

export function parseLocalDateStr(dateStr?: string | null): Date | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const clean = dateStr.slice(0, 10);
  const parts = clean.split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
  const [year, month, day] = parts;
  return new Date(year, month - 1, day, 12, 0, 0);
}

export function daysDiffFromToday(dateStr?: string | null): number | null {
  const target = parseLocalDateStr(dateStr);
  if (!target) return null;
  const now = new Date();
  const todayNoon = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
  const diffMs = target.getTime() - todayNoon.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export function formatShortDatePtBr(dateStr?: string | null): string {
  const parsed = parseLocalDateStr(dateStr);
  if (!parsed) return dateStr || '';
  return new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'short',
  }).format(parsed);
}

export function formatFullDatePtBr(dateStr?: string | null): string {
  const parsed = parseLocalDateStr(dateStr);
  if (!parsed) return dateStr || '';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(parsed);
}

export function formatRelativeDatePtBr(
  dateStr?: string | null,
  options?: { capitalize?: boolean; includeDateForFar?: boolean }
): string {
  const diff = daysDiffFromToday(dateStr);
  if (diff === null) return dateStr || '';

  const capitalize = options?.capitalize ?? true;
  const includeDateForFar = options?.includeDateForFar ?? true;

  if (diff === 0) return capitalize ? 'Hoje' : 'hoje';
  if (diff === 1) return capitalize ? 'Amanhã' : 'amanhã';
  if (diff === -1) return capitalize ? 'Ontem' : 'ontem';

  if (diff > 1 && diff <= 30) {
    return `${capitalize ? 'Em' : 'em'} ${diff} dias`;
  }

  if (diff < -1 && diff >= -30) {
    return `${capitalize ? 'Há' : 'há'} ${Math.abs(diff)} dias`;
  }

  if (includeDateForFar) {
    return `${capitalize ? 'Em ' : ''}${formatShortDatePtBr(dateStr)}`;
  }

  return formatShortDatePtBr(dateStr);
}
