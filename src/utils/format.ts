import { CURRENCY_SYMBOLS } from '../constants/admin';

// ─── Currency ───────────────────────────────────────────────────────────────

export function formatCurrency(amount: number, currency = 'NGN'): string {
  const symbol = CURRENCY_SYMBOLS[currency] || currency + ' ';
  return `${symbol}${amount.toLocaleString()}`;
}

export function formatCompact(amount: number, currency = 'NGN'): string {
  if (amount >= 1_000_000) {
    return `${formatCurrency(amount / 1_000_000, currency)}M`;
  }
  if (amount >= 1_000) {
    return `${formatCurrency(amount / 1_000, currency)}K`;
  }
  return formatCurrency(amount, currency);
}

// ─── Date ───────────────────────────────────────────────────────────────────

export function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(dateStr: string): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelativeTime(dateStr: string): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return formatDate(dateStr);
}

// ─── Uptime ─────────────────────────────────────────────────────────────────

export function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hrs = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hrs}h`;
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
}

// ─── Numbers ────────────────────────────────────────────────────────────────

export function formatNumber(n: number): string {
  return n.toLocaleString();
}

export function formatPercent(n: number): string {
  return `${Math.round(n * 100)}%`;
}

// ─── Strings ────────────────────────────────────────────────────────────────

export function truncate(str: string, max = 50): string {
  if (!str || str.length <= max) return str || '';
  return str.slice(0, max) + '...';
}

export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function planLabel(plan: string): string {
  return capitalize(plan || 'free');
}

// ─── Pagination ─────────────────────────────────────────────────────────────

export function getVisiblePages(page: number, totalPages: number, maxVisible = 5): (number | '...')[] {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages: (number | '...')[] = [];
  const half = Math.floor(maxVisible / 2);
  const start = Math.max(1, page - half);
  const end = Math.min(totalPages, start + maxVisible - 1);

  if (start > 1) pages.push(1);
  if (start > 2) pages.push('...');
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < totalPages - 1) pages.push('...');
  if (end < totalPages) pages.push(totalPages);
  return pages;
}
