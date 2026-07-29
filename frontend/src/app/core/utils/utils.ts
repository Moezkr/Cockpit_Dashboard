import { RefreshInterval } from '@core/models/types';

export function uid(prefix = 'id'): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const currency = new Intl.NumberFormat('fr-TN', {
  style: 'decimal',
  maximumFractionDigits: 0
});

export function formatAmount(v: number): string {
  return `${currency.format(v)} TND`;
}

export function formatNumber(v: number): string {
  return new Intl.NumberFormat('fr-TN').format(v);
}

export function formatPercent(v: number): string {
  return `${v.toLocaleString('fr-TN', { maximumFractionDigits: 1 })} %`;
}

export function formatDate(iso: string): string {
  let dateString = iso;
  if (!dateString.endsWith('Z') && !dateString.match(/[+-]\d{2}:\d{2}$/)) {
    dateString += 'Z';
  }
  const d = new Date(dateString);
  return d.toLocaleDateString('fr-TN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

export function relativeDate(iso: string, createdAt?: string): string {
  if (!iso) return '';
  let dateString = iso;
  if (!dateString.endsWith('Z') && !dateString.match(/[+-]\d{2}:\d{2}$/)) {
    dateString += 'Z';
  }
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.max(0, Math.floor(diff / 60000));

  let prefix = '';
  if (createdAt) {
    let createdDateStr = createdAt;
    if (!createdDateStr.endsWith('Z') && !createdDateStr.match(/[+-]\d{2}:\d{2}$/)) {
      createdDateStr += 'Z';
    }
    const createdTime = new Date(createdDateStr).getTime();
    const updatedTime = new Date(dateString).getTime();
    if (Math.abs(updatedTime - createdTime) >= 2000) {
      prefix = 'Mis à jour ';
    } else {
      prefix = 'Créé ';
    }
  }

  if (mins < 1) return prefix + "à l'instant";
  if (mins < 60) return prefix + `il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return prefix + `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  return prefix + `il y a ${days} j`;
}

export const REFRESH_OPTIONS: { value: RefreshInterval; label: string }[] = [
  { value: 'off', label: 'Désactivé' },
  { value: '5s', label: '5 secondes' },
  { value: '10s', label: '10 secondes' },
  { value: '30s', label: '30 secondes' },
  { value: '1min', label: '1 minute' },
  { value: '5min', label: '5 minutes' },
  { value: '15min', label: '15 minutes' },
  { value: '30min', label: '30 minutes' },
  { value: '1h', label: '1 heure' }
];

export function normalizeRefreshInterval(interval?: string): RefreshInterval {
  if (!interval) return 'off';
  const val = String(interval).toLowerCase().trim();
  if (val === 's5' || val === '5s') return '5s';
  if (val === 's10' || val === '10s') return '10s';
  if (val === 's30' || val === '30s') return '30s';
  if (val === 'm1' || val === '1min') return '1min';
  if (val === 'm5' || val === '5min') return '5min';
  if (val === 'm15' || val === '15min') return '15min';
  if (val === 'm30' || val === '30min') return '30min';
  if (val === 'h1' || val === '1h') return '1h';
  return 'off';
}

export function refreshToMs(interval: RefreshInterval | string): number {
  const norm = normalizeRefreshInterval(interval);
  const map: Record<string, number> = {
    off: 0,
    '5s': 5000,
    '10s': 10000,
    '30s': 30000,
    '1min': 60000,
    '5min': 300000,
    '15min': 900000,
    '30min': 1800000,
    '1h': 3600000
  };
  return map[norm] ?? 0;
}

export function refreshLabel(interval: RefreshInterval | string): string {
  const norm = normalizeRefreshInterval(interval);
  return REFRESH_OPTIONS.find((o) => o.value === norm)?.label ?? 'Désactivé';
}

