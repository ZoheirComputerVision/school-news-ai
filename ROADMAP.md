# ROADMAP.md — خارطة طريق التطوير

## Legend
| رمز | المعنى |
|-----|--------|
| [✓] | Completed |
| [~] | In Progress |
| [ ] | Pending |

---

## Phase 1: 🔴 الإصلاحات العاجلة (الأيام 1-3)

| # | المهمة | الحالة | ملاحظات |
|--|--------|--------|---------|
| 1 | [✓] Commit + Push pending fixes | ✅ تم | Image upload, error handling, timeout |
| 2 | [✓] Migrate JSON DB → SQLite | ✅ تم | Sprint 1C: 62/62 records migrated, 9/9 tables consistent |
| 3 | [✓] Add rate limiting + CSRF | ✅ تم | express-rate-limit + custom CSRF |
| 4 | [✓] Fix `_nextId()` spread overflow | ✅ تم | Replaced with reduce/loop |
| 5 | [✓] JWT + bcrypt auth middleware | ✅ تم | Credentials moved to .env |
| 6 | [✓] Security headers audit | ✅ تم | Referrer policy, Helmet config, CSP |
| _Sprint 1A_ | _Security Hardening_ | _✅ Complete_ | _JWT, bcrypt, rate-limit, CSRF, validation_ |
| _Sprint 1B_ | _Data Layer Refactor_ | _✅ Complete_ | _DAL + Repositories + Backup + Adapters_ |
| _Sprint 1C_ | _SQLite Migration_ | _✅ Complete_ | _Full migration + fallback + cutover_ |

## Phase 2: 🔵 مصادر حقيقية ونظام تحريري (الأيام 4-7)

| # | المهمة | الحالة |
|---|--------|--------|
| 1 | [✓] Facebook Graph API (real token + demo fallback) | ✅ تم |
| 2 | [✓] Web scraper (cheerio/axios) + RSS parser | ✅ تم |
| 3 | [✓] Multi-source deduplication (hash/URL/title) & trust scoring | ✅ تم |
| 4 | [✓] Collector monitoring dashboard (status/logs/health) | ✅ تم |
| 5 | [✓] Source Registry (centralized metadata + SQLite schema) | ✅ تم |
| 6 | [✓] **Phase 2C: Editorial Intelligence Layer** | ✅ تم |
|   | - 9-category classifier (Event, National, Regional, Society, Culture, Sports, Development, Faces & Stories, Advertisements) | ✅ |
|   | - Fact validation with source reputation + cross-source comparison | ✅ |
|   | - AI Writer with SEO metadata (meta description, tags, slug) | ✅ |
|   | - Editorial review workflow + priority publishing queue | ✅ |
|   | - AI Governance dashboard (decision chain viewer + confidence scores) | ✅ |
| 7 | [✓] Editorial Homepage Redesign (Phase 2C.1) | ✅ تم |
|   | - 3-layer header (Utility Bar + Masthead + Sticky Nav) | ✅ |
|   | - 9 editorial sections (Breaking, Hero, Latest, Regional, Trending, Dev, Culture+Society, Sports, Ads) | ✅ |
|   | - AI-powered content selection via HomepageSelector | ✅ |
|   | - Stats bar removed, empty ads hidden, SEO JSON-LD | ✅ |
| 8 | [✓] **Phase 2D: Advertising & Revenue Layer** | ✅ تم |
|   | - 6 ad zones (728×90, 300×250, 468×60) with random selection | ✅ |
|   | - Campaign management (draft→active→paused→completed) | ✅ |
|   | - Advertiser management (CRUD) | ✅ |
|   | - Impression/click tracking with event log | ✅ |
|   | - Advertising dashboard (summary, zones, campaigns, reports) | ✅ |
|   | - Homepage ad integration (auto-hide, lazy load, beacon tracking) | ✅ |
|   | - Daily/weekly/monthly reports with top campaigns | ✅ |
| 9 | [ ] Caching layer (Redis or LRU) | ⏳ |
| 10 | [✓] Navigation & Information Architecture Enhancement | ✅ تم |

## Phase 3: ⚫ Neo Vintage Newspaper Design (الأيام 8-14)

| # | المهمة | الحالة |
|---|--------|--------|
| 1 | [✓] B&W high contrast CSS overhaul | ✅ تم |
| 2 | [✓] Newspaper columns layout (2-3 columns) | ✅ تم |
| 3 | [✓] Massive historical headlines typography | ✅ تم |
| 4 | [✓] Central dominant hero image (vintage) | ✅ تم |
| 5 | [✓] 12-section navigation system | ✅ تم |
| 6 | [✓] Mobile-first responsive newspaper | ✅ تم |
| 7 | [ ] SEO: JSON-LD, sitemap.xml, meta tags | ⏳ |
| 8 | [✓] Print-friendly CSS | ✅ تم |

## Phase 4: 🤖 AI Pipeline حقيقي (الأيام 15-21)

| # | المهمة | الحالة |
|---|--------|--------|
| 1 | [ ] ML classifier (AraBERT or API) | ⏳ |
| 2 | [ ] 12-section classification model | ⏳ |
| 3 | [ ] Real fact-checker (external verification) | ⏳ |
| 4 | [ ] LLM writer per section style | ⏳ |
| 5 | [ ] Auto image selection + caption | ⏳ |

## Phase 3: 🏢 Multi-Tenant SaaS Foundation (Phase 3A)

| # | المهمة | الحالة |
|---|--------|--------|
| 1 | [✓] Tenant Registry (CRUD, 6 default tenants) | ✅ تم |
| 2 | [✓] Tenant Configuration (per-tenant title, slogan, social, colors) | ✅ تم |
| 3 | [✓] Tenant-aware URL routing (/:slug/article/:id) | ✅ تم |
| 4 | [✓] Tenant content isolation (tenant_id on all tables) | ✅ تم |
| 5 | [✓] Tenant-aware Editorial Intelligence (classifier, validator, writer, governance) | ✅ تم |
| 6 | [✓] Tenant ad isolation (campaigns, advertisers scoped to tenant) | ✅ تم |
| 7 | [✓] Data migration (existing content → tiaret tenant) | ✅ تم |
| 8 | [✓] SaaS Control Center admin UI | ✅ تم |
| 9 | [✓] Tenant API endpoints (10 endpoints) | ✅ تم |

## Phase 3B: 🏢 Tenant Administration & White Label Platform

| # | المهمة | الحالة |
|---|--------|--------|
| 1 | [✓] Branding Manager (logo, favicon, homepage title, footer, about, social) | ✅ تم |
| 2 | [✓] Theme Settings (structured fields, no arbitrary CSS) | ✅ تم |
| 3 | [✓] Tenant Public Pages (about, contact, editorial-policy, privacy-policy) | ✅ تم |
| 4 | [✓] Tenant Administrator Roles (super_admin, tenant_admin, editor, reviewer) | ✅ تم |
| 5 | [✓] Tenant-scoped JWT authentication | ✅ تم |
| 6 | [✓] Per-tenant role authorization middleware | ✅ تم |
| 7 | [✓] Tenant Dashboard (extended SaaS Control Center: branding, users, analytics) | ✅ تم |
| 8 | [✓] Tenant Analytics (content, ads, editorial, engagement) | ✅ تم |
| 9 | [✓] New DB tables: tenant_settings, tenant_users, tenant_pages | ✅ تم |
| 10 | [✓] 14 new tenant admin API endpoints | ✅ تم |

## Phase 3C: 💰 Billing & Subscription Platform

| # | المهمة | الحالة |
|---|--------|--------|
| 1 | [✓] Plan Manager (Starter, Professional, Enterprise with limits) | ✅ تم |
| 2 | [✓] Subscription Manager (trial, activate, suspend, renew, cancel) | ✅ تم |
| 3 | [✓] Invoice Manager (generate, mark paid, overdue, cancel, revenue) | ✅ تم |
| 4 | [✓] Usage Tracker (articles, editors, API, storage per tenant) | ✅ تم |
| 5 | [✓] 14-day trial system for new tenants | ✅ تم |
| 6 | [✓] Revenue analytics (MRR, ARR, monthly revenue) | ✅ تم |
| 7 | [✓] Billing admin dashboard (Plans, Subscriptions, Invoices, Revenue, Usage) | ✅ تم |
| 8 | [✓] Tenant billing dashboard (plan, usage bars, invoices) | ✅ تم |
| 9 | [✓] 5 new DB tables: plans, subscriptions, invoices, usage_metrics, payment_events | ✅ تم |
| 10 | [✓] 18 billing API endpoints | ✅ تم |

## Phase 4: 📈 تحسينات متقدمة (الأيام القادمة)

| # | المهمة | الحالة |
|---|--------|--------|
| 1 | [ ] ML classifier (AraBERT or API) | ⏳ |
| 2 | [ ] 12-section classification model | ⏳ |
| 3 | [ ] Real fact-checker (external verification) | ⏳ |
| 4 | [ ] LLM writer per section style | ⏳ |
| 5 | [ ] Auto image selection + caption | ⏳ |
| 6 | [ ] Custom domain support | ⏳ |
| 7 | [ ] API marketplace | ⏳ |
| 8 | [ ] Caching layer (Redis or LRU) | ⏳ |
| 9 | [ ] Payment gateway integration | ⏳ |

## Phase 5: ✨ تحسينات واستدامة (الأيام 31+)

| # | المهمة | الحالة |
|---|--------|--------|
| 1 | [ ] Full test suite (unit + integration + E2E) | ⏳ |
| 2 | [ ] Performance optimization | ⏳ |
| 3 | [ ] CDN setup | ⏳ |
| 4 | [ ] Monitoring & alerting | ⏳ |
| 5 | [ ] Documentation portal | ⏳ |
| 6 | [ ] Accessibility (WCAG) | ⏳ |

## Legend
Status indicators will be updated at each session checkpoint.
