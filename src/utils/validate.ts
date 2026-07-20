// ─── Email ──────────────────────────────────────────────────────────────────

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ─── UUID ───────────────────────────────────────────────────────────────────

export function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

// ─── Plan Names ─────────────────────────────────────────────────────────────

const VALID_PLANS = ['starter', 'business', 'professional', 'enterprise', 'free', 'growth'];
export function isValidPlan(plan: string): boolean {
  return VALID_PLANS.includes(plan.toLowerCase());
}

// ─── Admin Roles ────────────────────────────────────────────────────────────

const VALID_ADMIN_ROLES = ['superadmin', 'admin', 'viewer'];
export function isValidAdminRole(role: string | null): boolean {
  return role === null || VALID_ADMIN_ROLES.includes(role);
}

// ─── Pricing Config Keys ────────────────────────────────────────────────────

const VALID_PRICING_KEYS = ['currencies', 'plans', 'modules', 'bundles', 'legacy_aliases'];
export function isValidPricingKey(key: string): boolean {
  return VALID_PRICING_KEYS.includes(key);
}

// ─── Currency Codes ─────────────────────────────────────────────────────────

export function isValidCurrencyCode(code: string): boolean {
  return /^[A-Z]{3}$/.test(code);
}

// ─── Number Range ───────────────────────────────────────────────────────────

export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

// ─── Required Field ─────────────────────────────────────────────────────────

export function isRequired(value: any): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  return true;
}

// ─── Validate Pricing Config ────────────────────────────────────────────────

export interface ValidationError {
  field: string;
  message: string;
}

export function validatePlanPricing(planKey: string, plan: any): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!plan.name?.trim()) errors.push({ field: 'name', message: 'Plan name is required' });
  if (!plan.features?.length) errors.push({ field: 'features', message: 'At least one feature is required' });
  if (!plan.limits || typeof plan.limits !== 'object') errors.push({ field: 'limits', message: 'Limits are required' });
  if (!plan.pricing || typeof plan.pricing !== 'object') errors.push({ field: 'pricing', message: 'Pricing is required' });
  return errors;
}

export function validateModulePricing(moduleId: string, mod: any): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!mod.name?.trim()) errors.push({ field: 'name', message: 'Module name is required' });
  if (!mod.features?.length) errors.push({ field: 'features', message: 'At least one feature is required' });
  return errors;
}
