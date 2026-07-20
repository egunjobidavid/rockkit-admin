// ─── Auth ────────────────────────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  email: string;
  fullName?: string;
  isSuperadmin?: boolean;
  adminRole?: AdminRole | null;
}

export type AdminRole = 'superadmin' | 'admin' | 'viewer';

// ─── Paginated Response ─────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Tenants ────────────────────────────────────────────────────────────────

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
  currency?: string;
  created_at: string;
  updated_at?: string;
  user_count?: number;
  has_subscription?: number;
}

export interface TenantDetail extends Tenant {
  subscription: {
    plan: string;
    status: string;
    features: string[];
    modules: string[];
    updated_at: string;
  } | null;
  userCount: number;
}

export interface ImpersonateResult {
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  tenantPlan: string;
  mdEmail: string;
  mdFullName: string;
  message: string;
}

// ─── Users ──────────────────────────────────────────────────────────────────

export interface AdminUserRecord {
  id: string;
  email: string;
  full_name: string;
  status: string;
  is_superadmin: boolean;
  admin_role: AdminRole | null;
  created_at: string;
  memberships: TenantMembership[];
}

export interface TenantMembership {
  tenant_id: string;
  role: string;
  tenant_name?: string;
  tenant_slug?: string;
  joined_at?: string;
}

export interface UserDetail extends AdminUserRecord {
  memberships: TenantMembership[];
}

// ─── Revenue ────────────────────────────────────────────────────────────────

export interface RevenueSummary {
  summary: {
    total_tenants: number;
    active_subscriptions: number;
    paid_tenants: number;
    conversion_rate: number;
  };
  plans: { plan: string; count: number }[];
}

export interface RevenueByPlan {
  plan: string;
  count: number;
  estimated_mrr: number;
}

export interface RevenueHistory {
  month: string;
  new_subscriptions: number;
  active_count: number;
}

// ─── Health ─────────────────────────────────────────────────────────────────

export interface SystemHealth {
  database: 'healthy' | 'unhealthy';
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  activeSubscriptions: number;
  openTickets: number;
  uptime: number;
  memory: {
    heapUsedMB: number;
    heapTotalMB: number;
    rssMB: number;
  };
  timestamp: string;
}

// ─── Tickets ────────────────────────────────────────────────────────────────

export interface Ticket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  created_at: string;
  user_email: string;
  tenant_name: string;
}

// ─── Pricing ────────────────────────────────────────────────────────────────

export interface CurrencyConfig {
  code: string;
  name: string;
  symbol: string;
  active: boolean;
  isDefault: boolean;
}

export interface PlanPricing {
  monthly: number;
  annual: number;
}

export interface PlanConfig {
  name: string;
  description: string;
  visible: boolean;
  features: string[];
  limits: Record<string, number | string>;
  pricing: Record<string, PlanPricing>;
}

export interface ModuleConfig {
  name: string;
  description: string;
  icon: string;
  visible: boolean;
  features: string[];
  pricing: Record<string, PlanPricing>;
}

export interface BundleConfig {
  name: string;
  description: string;
  moduleIds: string[];
  icon: string;
  visible: boolean;
  pricing: Record<string, PlanPricing>;
}

export interface PricingData {
  currencies: CurrencyConfig[];
  plans: Record<string, PlanConfig>;
  modules: Record<string, ModuleConfig>;
  bundles: Record<string, BundleConfig>;
  legacyAliases: Record<string, { mapsTo: string }>;
}

// ─── Audit Log ──────────────────────────────────────────────────────────────

export interface AuditLog {
  id: string;
  user_id: string;
  user_email: string;
  admin_role: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  details: Record<string, any>;
  ip_address: string | null;
  created_at: string;
}

// ─── API ────────────────────────────────────────────────────────────────────

export interface ApiError {
  message: string;
  status: number;
}
