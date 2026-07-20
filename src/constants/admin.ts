import type { AdminRole } from '../types/admin';

// ─── Admin Role Hierarchy ───────────────────────────────────────────────────

export const ROLE_HIERARCHY: Record<AdminRole, number> = {
  superadmin: 3,
  admin: 2,
  viewer: 1,
};

export const ADMIN_ROLE_CONFIG: Record<AdminRole, { label: string; description: string; color: string }> = {
  superadmin: {
    label: 'Superadmin',
    description: 'Full access — manage users, pricing, suspend tenants, impersonate',
    color: 'bg-red-50 text-red-700',
  },
  admin: {
    label: 'Admin',
    description: 'Manage tenants, view revenue, no pricing access',
    color: 'bg-blue-50 text-blue-700',
  },
  viewer: {
    label: 'Viewer',
    description: 'Read-only dashboard access',
    color: 'bg-gray-100 text-gray-600',
  },
};

export function hasMinAdminRole(userRole: AdminRole | null | undefined, required: AdminRole): boolean {
  if (!userRole) return false;
  return (ROLE_HIERARCHY[userRole] ?? 0) >= (ROLE_HIERARCHY[required] ?? 0);
}

// ─── Tenant Status ──────────────────────────────────────────────────────────

export const TENANT_STATUS: Record<string, { label: string; color: string }> = {
  active: { label: 'Active', color: 'badge-green' },
  suspended: { label: 'Suspended', color: 'badge-red' },
  trialing: { label: 'Trialing', color: 'badge-yellow' },
  inactive: { label: 'Inactive', color: 'badge-gray' },
};

// ─── User Status ────────────────────────────────────────────────────────────

export const USER_STATUS: Record<string, { label: string; color: string }> = {
  active: { label: 'Active', color: 'badge-green' },
  inactive: { label: 'Inactive', color: 'badge-red' },
};

// ─── Ticket Priority ────────────────────────────────────────────────────────

export const TICKET_PRIORITY: Record<string, { label: string; color: string }> = {
  high: { label: 'High', color: 'badge-red' },
  medium: { label: 'Medium', color: 'badge-yellow' },
  low: { label: 'Low', color: 'badge-gray' },
};

// ─── Ticket Status ──────────────────────────────────────────────────────────

export const TICKET_STATUS: Record<string, { label: string; color: string }> = {
  open: { label: 'Open', color: 'badge-green' },
  in_progress: { label: 'In Progress', color: 'badge-yellow' },
  closed: { label: 'Closed', color: 'badge-gray' },
};

// ─── Pricing Plans ──────────────────────────────────────────────────────────

export const PLAN_COLORS: Record<string, string> = {
  starter: 'bg-gray-100 text-gray-700',
  business: 'bg-blue-50 text-blue-700',
  professional: 'bg-purple-50 text-purple-700',
  enterprise: 'bg-amber-50 text-amber-700',
  free: 'bg-gray-100 text-gray-700',
  growth: 'bg-blue-50 text-blue-700',
};

// ─── Audit Actions ──────────────────────────────────────────────────────────

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  update_tenant: 'Updated tenant',
  suspend_tenant: 'Suspended tenant',
  reactivate_tenant: 'Reactivated tenant',
  deactivate_user: 'Deactivated user',
  reactivate_user: 'Reactivated user',
  impersonate_tenant: 'Impersonated tenant',
  set_admin_role: 'Changed admin role',
  update_pricing: 'Updated pricing',
  reset_pricing: 'Reset pricing to defaults',
};

// ─── Navigation ─────────────────────────────────────────────────────────────

export const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', minRole: 'viewer' as AdminRole },
  { to: '/tenants', label: 'Tenants', minRole: 'admin' as AdminRole },
  { to: '/users', label: 'Users', minRole: 'admin' as AdminRole },
  { to: '/revenue', label: 'Revenue', minRole: 'admin' as AdminRole },
  { to: '/pricing', label: 'Pricing', minRole: 'superadmin' as AdminRole },
  { to: '/health', label: 'Health', minRole: 'admin' as AdminRole },
  { to: '/tickets', label: 'Tickets', minRole: 'admin' as AdminRole },
];

// ─── Currency Symbols ───────────────────────────────────────────────────────

export const CURRENCY_SYMBOLS: Record<string, string> = {
  NGN: '₦',
  USD: '$',
  GBP: '£',
  EUR: '€',
  KES: 'KSh',
  GHS: 'GH₵',
  ZAR: 'R',
  EGP: 'E£',
};
