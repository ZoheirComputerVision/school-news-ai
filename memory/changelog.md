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

## [v0.7.0] — 2026-06-21 — Next.js Rewrite Begins (Sprints 1.1–1.5)

### Added (Next.js rewrite at C:\elsawt-elmahalli-2)
- **Database Recovery** — PostgreSQL + Prisma ORM + user/audit/news models
- **Footer Optimization** — 6 columns, RTL, clean layout
- **Header & Editorial TopBar** — NewspaperMasthead, QuickServices, SmartInfoBar, TrendingBar
- **Premium Editorial Homepage** — 60/40 Hero, LiveNewsRibbon, WeatherModule, LocalServiceDashboard, RegionalCoverageMap, EditorialTrustLayer
- **Auth.js + RBAC** — NextAuth v5 (Credentials provider, JWT, bcrypt), login page, admin layout, role-based access, seed admin

### Fixed
- Edge Runtime Prisma conflict — replaced middleware with admin layout auth check
- `useSearchParams()` Suspense boundary — wrapped LoginForm in `<Suspense>`
- `next-auth/jwt` type augmentation — cast to `any`

### Documentation (this repo)
- `memory/` — session_log, project_state, changelog, decisions
- `reports/` — session_closure_report, git_foundation_report
- Git foundation — .gitignore, v0.7.0 tag, push to origin

---

*للتغييرات السابقة، راجع `CHANGELOG.md` في جذر المشروع.*
