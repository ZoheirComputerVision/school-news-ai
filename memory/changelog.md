# CHANGELOG.md — سجل التغييرات

## [v3.2.0] — 2026-06-14 — Phase 3C: Billing & Subscription Platform

### Added
- **Plan Manager** — 3 plans (Starter $0, Professional $49, Enterprise $199) with limits
- **Subscription Manager** — lifecycle (trial→active→suspended→expired→cancelled)
- **Invoice Manager** — auto invoice numbers, MRR/ARR, monthly revenue
- **Usage Tracker** — per-tenant articles, editors, API, storage tracking
- **5 JSON tables** — plans, subscriptions, invoices, usage_metrics, payment_events
- **18 billing API endpoints** under `/api/billing/`
- **Billing Center** — `/admin/billing-center.html` (5 tabs)
- **Tenant Billing** — `/admin/tenant-billing.html` (plan, usage bars, invoices)
- **14-day trial system** — automatic trial for all tenants on startup

### Changed
- `lib/dal/json-adapter.js` — 5 new tables in init()
- `server.js` — mount billing routes, call ensureBillingTables() + seedTrialSubscriptions()

### Security
- super_admin only for plan/invoice/revenue management
- Tenant isolation: each tenant sees only their own subscription/invoices/usage

---

*للتغييرات السابقة، راجع `CHANGELOG.md` في جذر المشروع.*
