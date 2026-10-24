export function money(n: number): string {
  const sign = n < 0 ? '-' : '';
  const a = Math.abs(n);
  if (a >= 1e9) return `${sign}$${(a / 1e9).toFixed(2)}B`;
  if (a >= 1e6) return `${sign}$${(a / 1e6).toFixed(2)}M`;
  if (a >= 1e4) return `${sign}$${(a / 1e3).toFixed(1)}k`;
  return `${sign}$${Math.round(a).toLocaleString('en-US')}`;
}

export function moneyExact(n: number): string {
  return `${n < 0 ? '-' : ''}$${Math.round(Math.abs(n)).toLocaleString('en-US')}`;
}

export function int(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

export function pct(x: number): string {
  return `${Math.round(x * 100)}%`;
}
