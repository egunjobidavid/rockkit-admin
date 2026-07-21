import { useState } from 'react';
import {
  BookOpen, Shield, Building2, Users, HeartPulse, Ticket, Tag,
  DollarSign, LayoutDashboard, Monitor, Smartphone, Globe, Settings,
  Activity, ChevronDown, ChevronRight, Server, Key, RefreshCcw,
  AlertTriangle, CheckCircle2, Database, Wifi, Zap, BarChart3,
  Clock, Search, FileText, ArrowRight,
} from 'lucide-react';

interface Section {
  id: string;
  icon: any;
  title: string;
  content: string[];
}

const sections: Section[] = [
  {
    id: 'overview',
    icon: BookOpen,
    title: 'Platform Overview',
    content: [
      'CopiaOS is a full-stack ERP SaaS platform built for African SMBs (1-100 employees).',
      'This admin panel manages all tenants, users, pricing, app maintenance, sessions, remote config, and analytics across the platform.',
      'Backend: NestJS + Drizzle ORM + PostgreSQL (Supabase). Frontend: React + Vite + Tailwind + Zustand.',
      'Three client apps share the same backend: Desktop (Electron), Mobile (Flutter), and this Admin panel (React).',
      'All admin endpoints require a valid JWT with adminRole (superadmin / admin / viewer).',
      'Base API URL: https://copiaos-backend.onrender.com/api/v1',
    ],
  },
  {
    id: 'roles',
    icon: Shield,
    title: 'Role-Based Access Control (RBAC)',
    content: [
      'Three-tier admin role hierarchy: superadmin (3) > admin (2) > viewer (1).',
      'Superadmin: Full access — manage users, pricing, sessions, config, versions, maintenance, suspend/impersonate tenants.',
      'Admin: Manage tenants, view revenue, manage tickets, view sessions/analytics. No pricing or config access.',
      'Viewer: Read-only dashboard access only.',
      'Roles are stored in core.users.admin_role column and included in the JWT payload.',
      'AdminRoleGuard enforces role checks per-endpoint group. JwtStrategy re-validates role from DB on each request.',
      'The main CopiaOS app has a separate role system: MD(100), Director(80), Manager(60), Accountant(40), Sales Rep(30), Staff(10).',
    ],
  },
  {
    id: 'dashboard',
    icon: LayoutDashboard,
    title: 'Dashboard',
    content: [
      'Overview of the entire platform at a glance.',
      'Stat cards: Total tenants, Active subscriptions, Monthly revenue, Open tickets.',
      'Revenue chart (BarChart via Recharts): MRR breakdown by plan — lazy loaded (373KB chunk).',
      'Recent tenants table and quick links to other sections.',
      'Available to all admin roles (viewer+).',
    ],
  },
  {
    id: 'tenants',
    icon: Building2,
    title: 'Tenants Management',
    content: [
      'List, search, and manage all tenant organizations.',
      'Tenant detail: name, plan, status (active/suspended/trialing/inactive), user count, created date.',
      'Actions: Update plan, Suspend tenant (blocks all logins), Reactivate tenant, Impersonate (login as tenant MD).',
      'Suspend: Sets tenant status to "suspended" — all users of that tenant get 403 on next request.',
      'Impersonate: Generates a JWT as the tenant MD — opens the tenant app in a new tab.',
      'Search: Filters by tenant name or subdomain.',
      'CSV export available via download button.',
      'Requires admin+ role.',
    ],
  },
  {
    id: 'users',
    icon: Users,
    title: 'Users Management',
    content: [
      'List all users across all tenants with search and role filtering.',
      'User detail: email, name, role (MD/Staff/etc), tenant, admin role, status.',
      'Actions: Deactivate user (sets is_active=false), Reactivate, Promote/Demote admin role.',
      'Promote to admin: Sets admin_role on core.users — grants access to this admin panel.',
      'Demote: Removes admin_role (sets to null) — user loses admin panel access.',
      'Tab filtering: All users, Admin users only.',
      'CSV export available.',
      'Requires admin+ role.',
    ],
  },
  {
    id: 'apps',
    icon: Globe,
    title: 'App Management (Maintenance + Versions)',
    content: [
      'Two tabs: Maintenance Mode and Version Control.',
      '',
      '─── MAINTENANCE MODE ───',
      'Toggle maintenance on/off for desktop, mobile, or both platforms.',
      'Custom message shown to users when maintenance is active.',
      'Platform targeting: Select which platforms are affected (desktop/mobile/both).',
      'Scheduled maintenance: Set start/end times for future maintenance windows.',
      'When enabled: Clients see a full-screen maintenance screen and cannot access the app.',
      'Clients poll GET /system/maintenance every 5 minutes.',
      'Database table: core.maintenance_mode (single-row config).',
      'Requires superadmin role.',
      '',
      '─── VERSION CONTROL ───',
      'Register new app versions per platform (desktop/mobile).',
      'Fields: version, min_version, force_update, changelog, download_url.',
      'Force update: When enabled, clients see a blocking dialog and must update before using the app.',
      'Min version: Soft enforcement — warns users but allows them to continue.',
      'Changelog: Displayed to users in the force update dialog.',
      'Download URL: Direct link to the new version download.',
      'Clients check GET /system/version/:platform on startup.',
      'Database table: core.app_versions.',
      'Requires superadmin role.',
      '',
      '─── HOW CLIENTS RESPOND ───',
      'Desktop (Electron): Checks on startup + every 5 min. Shows MaintenanceScreen or ForceUpdateDialog.',
      'Mobile (Flutter): Checked via router redirect before rendering. Shows MaintenanceScreen or ForceUpdateScreen.',
      'Both clients report active sessions and fetch remote config during the same check cycle.',
    ],
  },
  {
    id: 'sessions',
    icon: Activity,
    title: 'Session Tracking',
    content: [
      'View all active user sessions across desktop and mobile platforms.',
      'Session info: User email, tenant, platform (desktop/mobile), device info, IP address, last active time.',
      'Platform filter: Filter by desktop, mobile, or all.',
      'Revoke session: Forcefully log out a specific user session (superadmin only).',
      'Cleanup stale: Remove sessions inactive for 30+ minutes (superadmin only).',
      '',
      '─── HOW SESSIONS WORK ───',
      'Clients report sessions via POST /system/session on startup + every 5 minutes.',
      'Server upserts: Updates last_active if session exists, creates new if not.',
      'Session validation: Clients call POST /system/session/validate to check if their session is still active.',
      'If admin revokes a session, the client detects it on next check and force-logs-out the user.',
      '',
      '─── FORCE LOGOUT FLOW ───',
      '1. Admin clicks "Revoke" on a session.',
      '2. Backend deletes the session row from core.active_sessions.',
      '3. On next client check (up to 5 min), POST /system/session/validate returns { valid: false }.',
      '4. Client clears auth state and redirects to login.',
      '',
      'Database table: core.active_sessions.',
      'Requires admin+ to view, superadmin to revoke/cleanup.',
    ],
  },
  {
    id: 'config',
    icon: Settings,
    title: 'Remote Config (Feature Flags)',
    content: [
      'Manage feature flags and app settings remotely without deploying code.',
      'Key-value store with JSONB values, descriptions, and enable/disable toggle.',
      '',
      '─── HOW IT WORKS ───',
      'Admin creates/updates config entries (e.g., feature_pos, app_announcement).',
      'Clients fetch GET /system/config on startup — returns only enabled entries.',
      'ConfigService caches results in memory for 5 minutes to reduce DB load.',
      '',
      '─── PRE-SEEDED KEYS ───',
      'feature_pos, feature_projects, feature_crm, feature_hr, feature_production, feature_procurement, feature_analytics — all enabled by default.',
      'app_announcement — app-wide banner (disabled by default).',
      'app_maintenance_window — scheduled maintenance (disabled by default).',
      '',
      '─── USAGE ───',
      'Toggle enabled/disabled to turn features on/off for all clients.',
      'Edit JSON value to change feature settings (e.g., {"enabled": true, "percent": 50} for gradual rollout).',
      'Delete to remove a config entry entirely.',
      '',
      'Database table: core.remote_config.',
      'Requires superadmin role.',
    ],
  },
  {
    id: 'analytics',
    icon: BarChart3,
    title: 'Usage Analytics',
    content: [
      'Track user activity across all client apps.',
      '',
      '─── SUMMARY VIEW ───',
      'Total events, Unique users, Events by platform (desktop/mobile).',
      'Bar chart: Events by day (last 30 days) — lazy loaded via Recharts.',
      'Top events: Most common event types with counts.',
      '',
      '─── EVENT LOG ───',
      'Paginated table of all analytics events.',
      'Columns: Timestamp, Platform, Event type, User, Tenant.',
      'Event types: screen_view (route changes), api_error, session_start, etc.',
      '',
      '─── DATA RETENTION ───',
      'Analytics older than 30 days can be cleaned up via "Cleanup Old" button.',
      'Cleanup uses DELETE with created_at < (now - 30 days).',
      '',
      '─── HOW CLIENTS TRACK ───',
      'Desktop: RouteTracker component sends screen_view on every route change.',
      'Mobile: GoRouter observer sends screen_view on every navigation push.',
      'Both fire-and-forget: Non-blocking, errors silently ignored.',
      '',
      'Database table: core.app_analytics.',
      'Requires admin+ to view, superadmin to cleanup.',
    ],
  },
  {
    id: 'revenue',
    icon: DollarSign,
    title: 'Revenue Analytics',
    content: [
      'Platform-wide revenue metrics and breakdowns.',
      '',
      '─── SUMMARY ───',
      'Total tenants by plan, Monthly Recurring Revenue (MRR), Revenue growth.',
      '',
      '─── BY PLAN ───',
      'Bar chart: Revenue breakdown by plan (starter, business, professional, enterprise).',
      '',
      '─── HISTORY ───',
      'Line chart: Revenue trends over the last 12 months.',
      '',
      'Requires admin+ role.',
    ],
  },
  {
    id: 'pricing',
    icon: Tag,
    title: 'Pricing Configuration',
    content: [
      'Manage subscription plans, module add-ons, bundles, and currencies.',
      '',
      '─── PLANS ───',
      'Core platform plans: Starter, Business, Professional, Enterprise.',
      'Each plan defines: monthly/annual price, feature list, user limit, location limit.',
      'Plans are stored in core.pricing_config (JSONB) with 5-min in-memory cache.',
      '',
      '─── MODULE ADD-ONS ───',
      'Individual modules can be purchased as add-ons: accounting, hr, projects, crm, production, procurement, multi_location, analytics.',
      'Module pricing is independent of plan tier.',
      '',
      '─── BUNDLES ───',
      'Bundle discounts: Combine multiple modules at a reduced price.',
      'Bundle pricing stored alongside plans in core.pricing_config.',
      '',
      '─── CURRENCIES ───',
      'Supported: NGN (₦), USD ($), GBP (£), EUR (€), KES (KSh), GHS (GH₵), ZAR (R), EGP (E£).',
      '',
      'Database table: core.pricing_config.',
      'Requires superadmin role.',
    ],
  },
  {
    id: 'health',
    icon: HeartPulse,
    title: 'System Health',
    content: [
      'Real-time system health monitoring.',
      '',
      '─── CHECKS ───',
      'Database connectivity: Tests raw SQL query against PostgreSQL.',
      'Memory usage: Process.memoryUsage() — heapUsed, heapTotal, rss.',
      'Active subscriptions: Count of non-cancelled subscriptions.',
      'Open tickets: Count of open/in_progress support tickets.',
      'Uptime: Process uptime in seconds.',
      '',
      '─── STATUS ───',
      'Healthy: All checks pass.',
      'Warning: Issues detected (e.g., high memory, open DLQ items).',
      'Unhealthy: Database connection failure.',
      '',
      'Requires admin+ role.',
    ],
  },
  {
    id: 'tickets',
    icon: Ticket,
    title: 'Support Tickets',
    content: [
      'Manage user-submitted support tickets.',
      '',
      '─── TICKET LIST ───',
      'Searchable by subject, description, user email.',
      'Filter by status: Open, In Progress, Closed.',
      'Columns: Subject, User, Tenant, Status, Priority, Created.',
      '',
      '─── TICKET DETAIL ───',
      'View full ticket conversation.',
      'Update status (open → in_progress → closed).',
      'View tenant and user info.',
      '',
      '─── PRIORITIES ───',
      'High (red), Medium (yellow), Low (gray).',
      '',
      'CSV export available.',
      'Requires admin+ role.',
    ],
  },
  {
    id: 'audit',
    icon: FileText,
    title: 'Audit Logs',
    content: [
      'All mutating admin actions are logged to core.admin_audit_logs.',
      '',
      '─── LOGGED ACTIONS ───',
      'Tenant: update, suspend, reactivate, impersonate.',
      'User: deactivate, reactivate, set_admin_role.',
      'Pricing: update, reset.',
      'Maintenance: update.',
      'Versions: create, update, delete.',
      'Sessions: revoke, cleanup.',
      'Config: create, update, delete.',
      'Analytics: cleanup.',
      '',
      '─── LOG ENTRY ───',
      'Each entry records: admin user ID, tenant ID, action, entity type, entity ID, timestamp.',
      '',
      'Audit logs are append-only and cannot be modified or deleted via the admin panel.',
    ],
  },
  {
    id: 'database',
    icon: Database,
    title: 'Database Schema',
    content: [
      'Core tables in the "core" schema on Supabase PostgreSQL:',
      '',
      '─── TENANT & USER TABLES ───',
      'core.tenants — All tenant organizations (id, name, subdomain, plan, status).',
      'core.users — All users (id, email, role, admin_role, is_superadmin, is_active).',
      'core.subscriptions — Tenant subscription details (plan, modules JSONB, status).',
      '',
      '─── APP MANAGEMENT TABLES ───',
      'core.maintenance_mode — Single-row config for maintenance mode (enabled, message, platforms).',
      'core.app_versions — Version registry per platform (version, min_version, force_update).',
      'core.active_sessions — Active user sessions (user_id, platform, device_info, last_active).',
      'core.remote_config — Feature flags and app settings (key, value JSONB, enabled).',
      'core.app_analytics — Usage events (event_type, event_data JSONB, platform).',
      'core.admin_audit_logs — Admin action audit trail (action, entity_type, entity_id).',
      '',
      '─── BUSINESS TABLES ───',
      'core.products, core.customers, core.vendors — Core business entities.',
      'core.sales_orders, core.invoices, core.quotes — Sales documents.',
      'core.expenses, core.purchase_orders — Procurement.',
      'core.journal_entries, core.journal_lines — Double-entry accounting.',
      'core.projects, core.tasks, core.milestones — Project management.',
      'core.crm_deals, core.crm_activities, core.crm_notes — CRM pipeline.',
      'core.employees, core.attendance, core.payroll_runs — HR module.',
      'core.inventory_balances, core.stock_movements — Inventory management.',
      '',
      '─── MIGRATION HISTORY ───',
      'Migrations 001–014: Run via SQL in Supabase SQL Editor.',
      '013: maintenance_mode + app_versions tables.',
      '014: active_sessions + remote_config + app_analytics tables.',
    ],
  },
  {
    id: 'client-integration',
    icon: Wifi,
    title: 'Client App Integration',
    content: [
      'All three client apps (Desktop, Mobile, Admin) share the same backend.',
      '',
      '─── DESKTOP (Electron + React) ───',
      'URL: https://copia-desktop.vercel.app',
      'Auth: JWT with auto-refresh on 401.',
      'Startup checks: Maintenance mode, version, session report, config sync, analytics.',
      'Polling: Every 5 minutes for maintenance/version/session/config.',
      'Screen tracking: RouteTracker sends screen_view on route changes.',
      '',
      '─── MOBILE (Flutter) ───',
      'URL: Served via Flutter web build on port 8080.',
      'Auth: JWT with Dio interceptor.',
      'Startup checks: Same as desktop — maintenance, version, session, config.',
      'Polling: Every 5 minutes via MaintenanceProvider.',
      'Screen tracking: GoRouter observer sends screen_view on navigation.',
      '',
      '─── ADMIN (React + Vite) ───',
      'URL: https://rockkit-admin.vercel.app',
      'Auth: JWT with adminRole claim.',
      'No polling — admin is a management interface, not a client app.',
      '',
      '─── SHARED API ENDPOINTS ───',
      'GET /system/maintenance — Maintenance mode status.',
      'GET /system/version/:platform — Latest version check.',
      'GET /system/config — Remote config (enabled entries).',
      'POST /system/session — Report/update active session.',
      'POST /system/session/validate — Check if session is still active.',
      'POST /system/analytics — Track usage event.',
    ],
  },
  {
    id: 'deployment',
    icon: Server,
    title: 'Deployment & Infrastructure',
    content: [
      '─── BACKEND ───',
      'Hosted on Render (Docker, Node 20 Alpine).',
      'Auto-deploy from GitHub main branch (may need manual trigger).',
      'Database: Supabase PostgreSQL (managed).',
      'Dockerfile: npm ci → npm run build → npm start.',
      '',
      '─── DESKTOP FRONTEND ───',
      'Deployed on Vercel (auto-deploy from GitHub).',
      'Electron app built with Vite.',
      '',
      '─── MOBILE APP ───',
      'Flutter 3.44.2 web build served on port 8080.',
      'Build: flutter build web --release --no-tree-shake-icons.',
      '',
      '─── ADMIN PANEL ───',
      'Deployed on Vercel (auto-deploy from GitHub).',
      'React + Vite + Tailwind. Build ~262KB main chunk + lazy-loaded Recharts.',
      '',
      '─── KEY ENV VARS ───',
      'DATABASE_URL — Supabase PostgreSQL connection string.',
      'JWT_SECRET — Token signing secret.',
      'SENDGRID_API_KEY — Email sending (optional, falls back to console).',
      'PAYSTACK_SECRET_KEY — Payment processing.',
    ],
  },
  {
    id: 'api-reference',
    icon: Key,
    title: 'API Reference',
    content: [
      'All endpoints are under /api/v1/ prefix.',
      '',
      '─── SYSTEM ENDPOINTS (JWT required) ───',
      'GET  /system/maintenance              — Maintenance status.',
      'GET  /system/version/:platform         — Version check (desktop/mobile).',
      'GET  /system/config                    — Remote config (enabled only).',
      'POST /system/session                   — Report active session.',
      'POST /system/session/validate          — Validate session exists.',
      'POST /system/analytics                 — Track analytics event.',
      '',
      '─── ADMIN ENDPOINTS (adminRole required) ───',
      'GET    /admin/tenants                  — List tenants.',
      'GET    /admin/tenants/:id              — Tenant detail.',
      'PATCH  /admin/tenants/:id              — Update tenant plan/status.',
      'POST   /admin/tenants/:id/suspend      — Suspend tenant.',
      'POST   /admin/tenants/:id/reactivate   — Reactivate tenant.',
      'POST   /admin/tenants/:id/impersonate  — Impersonate as tenant MD.',
      'GET    /admin/users                    — List users.',
      'PATCH  /admin/users/:id/admin-role     — Set admin role.',
      'POST   /admin/users/:id/reactivate     — Reactivate user.',
      'GET    /admin/revenue/summary          — Revenue summary.',
      'GET    /admin/revenue/by-plan          — Revenue by plan.',
      'GET    /admin/revenue/history          — Revenue history.',
      'GET    /admin/health                   — System health.',
      'GET    /admin/tickets                  — List tickets.',
      'GET    /admin/sessions                 — List active sessions.',
      'DELETE /admin/sessions/:id             — Revoke session.',
      'POST   /admin/sessions/cleanup         — Cleanup stale sessions.',
      'GET    /admin/config                   — List remote config.',
      'POST   /admin/config                   — Create config entry.',
      'PATCH  /admin/config/:key              — Update config entry.',
      'DELETE /admin/config/:key              — Delete config entry.',
      'GET    /admin/analytics/summary        — Analytics summary.',
      'GET    /admin/analytics/events         — Analytics event log.',
      'POST   /admin/analytics/cleanup        — Cleanup old events.',
      'GET    /admin/maintenance              — Get maintenance config.',
      'PATCH  /admin/maintenance              — Update maintenance config.',
      'GET    /admin/versions                 — List app versions.',
      'POST   /admin/versions                 — Register new version.',
      'PATCH  /admin/versions/:id             — Update version.',
      'DELETE /admin/versions/:id             — Delete version.',
      'POST   /admin/pricing/reset            — Reset pricing to defaults.',
    ],
  },
  {
    id: 'troubleshooting',
    icon: AlertTriangle,
    title: 'Troubleshooting',
    content: [
      '─── COMMON ISSUES ───',
      '404 on new endpoints: Render hasn\'t deployed latest code. Trigger Manual Deploy.',
      'Migration failed: Check for IMMUTABLE function errors in indexes. Use service-level cleanup instead.',
      'Session not detected: Client polls every 5 min. Wait up to 5 min for force logout to take effect.',
      'Config not updating: ConfigService caches for 5 min. Wait or restart client.',
      'Build failed (TS error): Check for null vs undefined in TypeScript strict mode.',
      '',
      '─── USEFUL COMMANDS ───',
      'Test admin suite: node test-admin.js (from admin project root).',
      'Test API endpoints: node test-api.js (from MVP Folder).',
      'Build admin: npm run build (from admin project root).',
      'Type-check: npx tsc --noEmit.',
      '',
      '─── LOGINS ───',
      'Admin panel: manager1783102798@copiaos.com / Manager123! (superadmin).',
      'Test tenant: Same credentials work for the desktop/mobile apps.',
    ],
  },
];

export default function HelpPage() {
  const [openSection, setOpenSection] = useState<string | null>('overview');
  const [search, setSearch] = useState('');

  const filtered = sections.filter(
    (s) =>
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.content.some((c) => c.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <BookOpen className="w-8 h-8 text-primary-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel Help</h1>
          <p className="text-sm text-gray-500">Complete documentation for all features and endpoints</p>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search documentation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>

      <div className="space-y-2">
        {filtered.map((section) => {
          const isOpen = openSection === section.id;
          const Icon = section.icon;
          return (
            <div key={section.id} className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setOpenSection(isOpen ? null : section.id)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 transition-colors text-left"
              >
                <Icon className="w-5 h-5 text-primary-600 flex-shrink-0" />
                <span className="font-medium text-gray-900 flex-1">{section.title}</span>
                {isOpen ? (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                )}
              </button>
              {isOpen && (
                <div className="px-4 pb-4 pt-1 bg-gray-50 border-t border-gray-100">
                  <div className="space-y-1.5">
                    {section.content.map((line, i) => {
                      if (line === '') return <div key={i} className="h-2" />;
                      if (line.startsWith('───')) {
                        return (
                          <h3 key={i} className="text-xs font-bold text-primary-700 uppercase tracking-wider mt-3 mb-1">
                            {line.replace(/───/g, '').trim()}
                          </h3>
                        );
                      }
                      return (
                        <p key={i} className="text-sm text-gray-700 leading-relaxed">
                          {line}
                        </p>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Search className="w-8 h-8 mx-auto mb-3 text-gray-300" />
          <p className="text-sm">No results for "{search}"</p>
        </div>
      )}
    </div>
  );
}
