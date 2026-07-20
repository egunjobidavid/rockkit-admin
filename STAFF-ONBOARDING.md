# CopiaOS Platform Admin — Staff Onboarding Guide

Welcome to the CopiaOS Platform Admin panel. This guide walks you through everything you need to know to manage tenants, users, pricing, and system health.

---

## 1. Accessing the Admin Panel

**URL:** https://rockkit-admin.vercel.app

**Login:** Use your company email and password (same credentials as the main CopiaOS app).

> Only users with an admin role (Superadmin, Admin, or Viewer) can access the admin panel. If you get "Not an admin account", ask a Superadmin to promote you.

---

## 2. Understanding Your Role

When you log in, your role is shown in the sidebar under your email. Your role determines what you can see and do.

### Role Hierarchy

| Role | What You Can Do |
|------|-----------------|
| **Superadmin** | Everything — manage users, pricing, suspend tenants, impersonate, all settings |
| **Admin** | View and manage tenants, users, revenue, health, tickets. Cannot change pricing or promote users |
| **Viewer** | Dashboard only — read-only view of system status |

### How to Check Your Role

Look at the sidebar (left panel). Under your email address, you'll see a colored badge:

- Red = Superadmin
- Blue = Admin
- Gray = Viewer

---

## 3. Dashboard

The **Dashboard** is the first thing you see. It shows:

- **Total Tenants** — Number of registered businesses
- **Active Subscriptions** — Tenants on a paid plan
- **Total Users** — All registered users across all tenants
- **Open Tickets** — Unresolved support tickets
- **System Status** — Database health, memory usage

> If any card shows unusual data, investigate in the relevant tab.

---

## 4. Managing Tenants

**Navigate to:** Sidebar → Tenants

### Viewing Tenants

- The table shows all tenants with name, plan, user count, status, and creation date
- Use the **search bar** to find a tenant by name or slug
- Click **pagination** at the bottom to navigate pages

### Tenant Actions

| Action | Who Can Do It | What It Does |
|--------|---------------|--------------|
| **View** (eye icon) | Admin+ | Shows tenant details: plan, subscription, user count |
| **Edit Plan** (pencil icon) | Superadmin | Changes the tenant's subscription plan |
| **Impersonate** (login icon) | Superadmin | Shows MD credentials for debugging |
| **Suspend** (ban icon) | Superadmin | Suspends the tenant — they lose access |
| **Reactivate** (check icon) | Superadmin | Reactivates a suspended tenant |

### Changing a Tenant's Plan

1. Click the **pencil icon** on the tenant row
2. Select the new plan from the dropdown (Free, Growth, Professional, Enterprise)
3. Click **Save**

> This changes the features and limits available to that tenant.

### Suspending a Tenant

1. Click the **ban icon** on the tenant row
2. Confirm the suspension
3. The tenant's status changes to "Suspended" and they lose access to their account

> **Warning:** This is immediate. Only do this for policy violations or non-payment.

---

## 5. Managing Users

**Navigate to:** Sidebar → Users

### Viewing Users

- The table shows all users with email, name, admin role, tenant role, and status
- Use **search** to find users by email or name

### User Actions

| Action | Who Can Do It | What It Does |
|--------|---------------|--------------|
| **View** (eye icon) | Admin+ | Shows user details and tenant memberships |
| **Set Admin Role** (shield icon) | Superadmin | Promotes or demotes a user's admin access |
| **Deactivate** (user-x icon) | Superadmin | Disables the user account |
| **Reactivate** (user-check icon) | Superadmin | Re-enables a deactivated user |

### Promoting a User to Admin

1. Find the user in the Users table
2. Click the **shield icon** next to their name
3. Select a role:
   - **Superadmin** — Full access to everything
   - **Admin** — Can manage tenants and users, but not pricing
   - **Viewer** — Read-only dashboard access
   - **No Admin Access** — Removes admin panel access entirely
4. Click **Save**

> The user will need to log out and log back in for the role change to take effect.

### Deactivating a User

1. Click the **user-x icon** on the user row
2. Confirm the deactivation
3. The user can no longer log in

> You cannot deactivate another Superadmin.

### Audit Log

**Navigate to:** Users → Audit Log tab

The audit log tracks every action taken by admin users:

- Who performed the action
- What action was taken
- Which tenant or user was affected
- When it happened
- Any additional details

> Use this to investigate suspicious activity or mistakes.

---

## 6. Revenue Analytics

**Navigate to:** Sidebar → Revenue

This page shows:

- **Total Tenants** — All registered businesses
- **Active Subscriptions** — Tenants on a paid plan
- **Paid Tenants** — Tenants generating revenue
- **Est. MRR** — Estimated Monthly Recurring Revenue

Plus:

- **Plan Breakdown** — Revenue per plan tier
- **Monthly History** — Subscription growth over the last 12 months

---

## 7. Pricing Configuration

**Navigate to:** Sidebar → Pricing

> Only Superadmins can access this page.

This is where you configure all pricing for the platform. Changes take effect immediately.

### Plans Tab

Each plan (Starter, Business, Professional, Enterprise) has:

- **Name & Description** — Customer-facing labels
- **Visibility** — Toggle whether the plan appears on the billing page
- **Pricing** — Set monthly and annual prices per currency (NGN, USD, etc.)
- **Limits** — Max users, products, transactions, locations, storage, etc.
- **Features** — Comma-separated feature flags

### Modules Tab

Each add-on module (Accounting, HR, Projects, CRM, etc.) has:

- **Name & Description** — What the module does
- **Icon** — Lucide icon name
- **Visibility** — Toggle on/off
- **Pricing** — Per-currency monthly/annual prices
- **Features** — What's included

### Bundles Tab

Bundles group multiple modules at a discount:

- **Module Selection** — Check/uncheck which modules are included
- **Pricing** — Bundle price per currency
- **Savings** — Automatically calculated from individual module prices

### Currencies Tab

Manage supported currencies:

- **Add Currency** — Click "Add Currency" and enter code, name, symbol
- **Toggle Active** — Show/hide a currency from the billing page
- **Set Default** — The default currency for new tenants
- **Remove** — Delete a currency (cannot remove the default)

### Saving Changes

1. Make your changes on any tab
2. An "unsaved changes" banner appears at the top
3. Click **Save Changes** to apply
4. Changes take effect immediately for new signups

### Reset to Defaults

Click **Reset Defaults** to restore all pricing to the original hardcoded values. This cannot be undone.

---

## 8. System Health

**Navigate to:** Sidebar → Health

Shows real-time system status:

- **Database** — Connection status (Healthy/Unhealthy)
- **Uptime** — How long the server has been running
- **Total Tenants** — Count of all businesses
- **Total Users** — Count of all users

Plus a raw JSON view of all health data for debugging.

---

## 9. Support Tickets

**Navigate to:** Sidebar → Tickets

### Viewing Tickets

- The table shows all open support tickets
- Use **search** to find tickets by subject, user email, or tenant name
- Filter by status: **All**, **Open**, **In Progress**, **Closed**

### Ticket Information

Each ticket shows:

- **Subject** — The issue title
- **Tenant** — Which business reported it
- **User** — Who submitted it
- **Status** — Open, In Progress, or Closed
- **Priority** — High, Medium, or Low
- **Created** — When it was submitted

---

## 10. Common Tasks

### "A tenant says they can't access a feature"

1. Go to **Tenants** → Find the tenant → **View**
2. Check their subscription plan and active modules
3. If needed, **Edit Plan** to upgrade them

### "I need to give a colleague admin access"

1. Go to **Users** → Find the colleague → Click **shield icon**
2. Select **Admin** or **Viewer** role
3. Click **Save**
4. Tell them to log out and log back in

### "A tenant is violating terms of service"

1. Go to **Tenants** → Find the tenant → Click **ban icon**
2. Confirm the suspension
3. Their account is immediately disabled

### "I need to debug a tenant's account"

1. Go to **Tenants** → Find the tenant → Click **login icon** (Impersonate)
2. You'll see the MD's email and full name
3. Use those credentials to log in as them (via the main app, not admin panel)

### "Something looks wrong on the dashboard"

1. Go to **Health** → Check database status and memory
2. Go to **Users → Audit Log** → Check for recent changes
3. If the issue persists, contact the engineering team

---

## 11. Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Escape` | Close any open modal |
| `Enter` | Submit search forms |

---

## 12. Getting Help

- **Bug reports:** https://github.com/anomalyco/opencode/issues
- **Internal Slack:** #copiaos-admin-support
- **Emergency:** Contact the CTO directly

---

## Quick Reference Card

| Task | Where | Who |
|------|-------|-----|
| View tenants | Tenants tab | Admin+ |
| Suspend a tenant | Tenants → ban icon | Superadmin |
| Change a plan | Tenants → pencil icon | Superadmin |
| View users | Users tab | Admin+ |
| Promote a user | Users → shield icon | Superadmin |
| Change pricing | Pricing tab | Superadmin |
| View audit log | Users → Audit Log tab | Admin+ |
| Check health | Health tab | Admin+ |
| View tickets | Tickets tab | Admin+ |
| Impersonate tenant | Tenants → login icon | Superadmin |
