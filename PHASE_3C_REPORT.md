# Phase 3C Report — Billing & Subscription Platform

## Overview

Phase 3C transforms the multi-tenant SaaS platform into a commercial SaaS platform with subscription plans, billing lifecycle management, usage tracking, invoice generation, and revenue analytics. This is a billing foundation — no external payment gateways are integrated yet.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                       Billing & Subscription Layer                  │
│                                                                     │
│  PlanManager ──→ SubscriptionManager ──→ InvoiceManager            │
│       │                  │                       │                  │
│       ▼                  ▼                       ▼                  │
│  plans.json      subscriptions.json        invoices.json            │
│                                                                     │
│  UsageTracker ──→ periodic aggregation + limit checking             │
│       │                                                             │
│       ▼                                                             │
│  usage_metrics.json   payment_events.json (future)                  │
└─────────────────────────────────────────────────────────────────────┘
```

## New Modules

### Plan Manager (`modules/billing/plan-manager.js`)
- 3 default plans seeded on startup:

| Plan | Price | Editors | Articles/mo | Storage | API calls/day |
|------|-------|---------|-------------|---------|---------------|
| Starter | $0 | 3 | 500 | 100 MB | 1,000 |
| Professional | $49 | 10 | 5,000 | 1 GB | 10,000 |
| Enterprise | $199 | Unlimited | Unlimited | 50 GB | Unlimited |

- Plans have: id, name, price, limits (JSON object), active flag, description
- CRUD with activate/deactivate for super_admin

### Subscription Manager (`modules/billing/subscription-manager.js`)
- **Statuses:** `trial` → `active` → `suspended` → `expired` → `cancelled`
- **14-day trial:** Automatically created for all tenants on startup
- **Activation:** Manual by super_admin (future: automatic on payment)
- **Suspension:** Admin can suspend for non-payment or policy violations
- **Renewal:** Extends current period by one month
- **Cancellation:** Irreversible; stopped subscriptions cannot be renewed
- **Plan change:** Upgrade/downgrade at any time

### Invoice Manager (`modules/billing/invoice-manager.js`)
- **Auto-generated invoice numbers:** `INV-YYYYMM-XXXX` (e.g., `INV-202606-0001`)
- **Statuses:** `pending` → `paid` / `overdue` / `cancelled`
- **Revenue metrics:**
  - Total revenue (sum of all paid invoices)
  - Pending revenue (sum of all unpaid invoices)
  - MRR (Monthly Recurring Revenue) — last month's paid revenue
  - ARR (Annual Recurring Revenue) — MRR × 12
  - Monthly revenue breakdown by calendar month
- Free plans (Starter, $0) cannot generate invoices

### Usage Tracker (`modules/billing/usage-tracker.js`)
- **Per-tenant aggregation** computed from existing data:
  - `articles_count` — count of processed_content records
  - `editors_count` — count of tenant_users with editor/reviewer/tenant_admin roles
  - `api_requests` — tracked via `recordApiRequest()` which persists to usage_metrics
  - `storage_bytes` — estimated from total content character count × 2
- **Period-based:** Aligned to calendar months
- **Limit checking:** Compares current usage against plan limits, returns violations
- **Limit violations reported when:** articles > plan cap, editors > max, API calls > daily, storage > MB

### Trial System
- Every tenant gets a 14-day free trial on the Starter plan
- Trial seeded at tenant creation (run via `seedTrialSubscriptions()` on startup)
- Trial subscription includes `trial_start`, `trial_end`, and `current_period_end` dates
- Super admin can activate trial subscriptions to convert them to active status

## New Database Tables

| Table | Description | Key Fields |
|-------|-------------|------------|
| `plans` | Subscription plans with pricing and limits | name, price, limits (JSON), active |
| `subscriptions` | Per-tenant subscription lifecycle | tenant_id, plan_id, status, trial_start, trial_end, current_period_start, current_period_end |
| `invoices` | Billing invoices per tenant | tenant_id, invoice_number, amount, status, period_start, period_end, paid_at |
| `usage_metrics` | Usage records per tenant per period | tenant_id, metric_name, metric_value, period_start, period_end |
| `payment_events` | Future payment gateway events | tenant_id, invoice_id, event_type, amount, status |

## API Endpoints

### Plans
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/billing/plans` | Public | Get active plans |
| GET | `/api/billing/plans/all` | adminAuth | Get all plans |
| POST | `/api/billing/plan/create` | adminAuth | Create plan |
| PUT | `/api/billing/plan/:id` | adminAuth | Update plan |
| POST | `/api/billing/plan/:id/deactivate` | adminAuth | Deactivate plan |
| POST | `/api/billing/plan/:id/activate` | adminAuth | Activate plan |

### Subscriptions
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/billing/subscriptions` | adminAuth | All subscriptions |
| GET | `/api/billing/subscription/tenant/:tenantId` | JWT+tenant | Own subscription |
| POST | `/api/billing/subscription/create` | JWT+role | Create subscription |
| POST | `/api/billing/subscription/:id/activate` | adminAuth | Activate |
| POST | `/api/billing/subscription/:id/suspend` | adminAuth | Suspend |
| POST | `/api/billing/subscription/:id/renew` | adminAuth | Renew |
| POST | `/api/billing/subscription/:id/cancel` | adminAuth | Cancel |
| PUT | `/api/billing/subscription/:id/plan` | adminAuth | Change plan |

### Invoices
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/billing/invoices` | adminAuth | All invoices |
| GET | `/api/billing/invoices/tenant/:tenantId` | JWT+tenant | Own invoices |
| POST | `/api/billing/invoice/generate` | adminAuth | Generate invoice |
| POST | `/api/billing/invoice/:id/paid` | adminAuth | Mark paid |
| POST | `/api/billing/invoice/:id/overdue` | adminAuth | Mark overdue |
| POST | `/api/billing/invoice/:id/cancel` | adminAuth | Cancel invoice |

### Usage & Revenue
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/billing/usage` | adminAuth | All tenants' usage |
| GET | `/api/billing/usage/tenant/:tenantId` | JWT+tenant | Own usage |
| GET | `/api/billing/revenue` | adminAuth | Revenue analytics |

## Dashboards

### Billing Center (`/admin/billing-center.html`)

| Tab | Features |
|-----|----------|
| 📋 الخطط | Plan CRUD, activate/deactivate, limits display |
| 🔗 الاشتراكات | Subscription list, activate/suspend/renew/cancel actions |
| 🧾 الفواتير | Invoice list, generate/manage statuses |
| 📊 الإيرادات | MRR, ARR, total revenue cards, monthly breakdown table |
| 📈 الاستخدام | Per-tenant usage with within-limits indicators |

### Tenant Billing (`/admin/tenant-billing.html`)

| Section | Features |
|---------|----------|
| الخطة الحالية | Plan name, status badge, renewal date |
| استخدام المنصة | Articles, editors, API requests, storage usage counters |
| حدود الخطة | Visual progress bars per limit with warning/danger thresholds |
| الفواتير | Invoice history with status and payment dates |

## Security

- **super_admin** can manage all plans, subscriptions, invoices, and view all tenants' usage/revenue
- **tenant_admin** can only view their own subscription, invoices, and usage via `requireTenantAccess`
- Cross-tenant access is blocked by `authenticateToken` + `requireTenantAccess` middleware chain
- Admin billing routes use `adminAuth` (admin JWT via `ADMIN_USERNAME`/`ADMIN_PASSWORD`)
- Tenant billing routes use `authenticateToken` (tenant JWT via `tenant_users` table)
- Free plan (Starter, $0) cannot generate invoices — prevents unnecessary billing records

## Files Created

| File | Description |
|------|-------------|
| `modules/billing/plan-manager.js` | Plan CRUD with 3 default plans |
| `modules/billing/subscription-manager.js` | Subscription lifecycle with 5 statuses |
| `modules/billing/invoice-manager.js` | Invoice generation, revenue analytics (MRR/ARR) |
| `modules/billing/usage-tracker.js` | Per-tenant usage tracking with limit checking |
| `modules/billing/migrate.js` | 5-table verification + seeding |
| `routes/billing.js` | 18 billing API endpoints |
| `admin/billing-center.html` | Super admin billing dashboard (5 tabs) |
| `admin/tenant-billing.html` | Tenant billing view (plan, usage, invoices) |
| `PHASE_3C_REPORT.md` | This report |

## Files Modified

| File | Change |
|------|--------|
| `lib/dal/json-adapter.js` | Added 5 new tables to init() |
| `server.js` | Mounted `/api/billing` routes, calls `ensureBillingTables()` and `seedTrialSubscriptions()` |
| `.gitignore` | Added billing JSON files |
| `ARCHITECTURE.md` | Added Phase 3C section (section 10) |
| `PROJECT_MAP.md` | Updated version to v3.2.0, added billing module tree |
| `ROADMAP.md` | Added Phase 3C table, updated Phase 4 priorities |
| `CHANGELOG.md` | Added v3.2.0 entry |
| `NEXT_SESSION.md` | Added Phase 3C completion, updated next session |

## Verification Checklist

- [ ] Server boots with "Billing JSON tables ready" message
- [ ] 3 default plans (Starter, Professional, Enterprise) seeded
- [ ] 6 trial subscriptions created (one per tenant)
- [ ] GET `/api/billing/plans` returns 3 active plans (public, no auth)
- [ ] POST `/api/billing/plan/create` creates new plan (adminAuth)
- [ ] GET `/api/billing/subscription/tenant/1` returns trial subscription for tiaret
- [ ] POST `/api/billing/subscription/1/activate` converts trial→active
- [ ] POST `/api/billing/invoice/generate` with tenant on paid plan creates invoice
- [ ] GET `/api/billing/revenue` returns MRR, ARR, monthly breakdown
- [ ] GET `/api/billing/usage` returns per-tenant usage with limit checks
- [ ] Tenant token cannot access another tenant's subscription/invoices/usage
- [ ] `/admin/billing-center.html` loads all 5 tabs correctly
- [ ] `/admin/tenant-billing.html` shows plan, usage bars, invoices
- [ ] Free plan invoice generation returns error (Starter is $0)
