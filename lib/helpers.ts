export function appEmailFromUsername(username: string) {
  return `${username.toLowerCase()}@egecarservice.local`;
}

export function money(value: number) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 2,
  }).format(value || 0);
}

export function nowIso() {
  return new Date().toISOString();
}
