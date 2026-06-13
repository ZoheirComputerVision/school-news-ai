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

## Phase 2: 🔵 بنية بيانات ومصادر حقيقية (الأيام 4-7)

| # | المهمة | الحالة |
|---|--------|--------|
| 1 | [ ] Facebook Graph API (real token + pagination) | ⏳ |
| 2 | [ ] Web scraper (cheerio/axios) | ⏳ |
| 3 | [ ] Multi-source deduplication & trust scoring | ⏳ |
| 4 | [ ] Data quality dashboard | ⏳ |
| 5 | [ ] Caching layer (Redis or LRU) | ⏳ |

## Phase 3: ⚫ Neo Vintage Newspaper Design (الأيام 8-14)

| # | المهمة | الحالة |
|---|--------|--------|
| 1 | [ ] B&W high contrast CSS overhaul | ⏳ |
| 2 | [ ] Newspaper columns layout (2-3 columns) | ⏳ |
| 3 | [ ] Massive historical headlines typography | ⏳ |
| 4 | [ ] Central dominant hero image (vintage) | ⏳ |
| 5 | [ ] 12-section navigation system | ⏳ |
| 6 | [ ] Mobile-first responsive newspaper | ⏳ |
| 7 | [ ] SEO: JSON-LD, sitemap.xml, meta tags | ⏳ |
| 8 | [ ] Print-friendly CSS | ⏳ |

## Phase 4: 🤖 AI Pipeline حقيقي (الأيام 15-21)

| # | المهمة | الحالة |
|---|--------|--------|
| 1 | [ ] ML classifier (AraBERT or API) | ⏳ |
| 2 | [ ] 12-section classification model | ⏳ |
| 3 | [ ] Real fact-checker (external verification) | ⏳ |
| 4 | [ ] LLM writer per section style | ⏳ |
| 5 | [ ] Auto image selection + caption | ⏳ |

## Phase 5: 🏢 SaaS Platform (الأيام 22-30)

| # | المهمة | الحالة |
|---|--------|--------|
| 1 | [ ] Multi-tenancy (schools collection) | ⏳ |
| 2 | [ ] User management (admin/editor/viewer) | ⏳ |
| 3 | [ ] School onboarding flow | ⏳ |
| 4 | [ ] Analytics dashboard per school | ⏳ |
| 5 | [ ] API marketplace | ⏳ |
| 6 | [ ] Billing integration | ⏳ |

## Phase 6: ✨ تحسينات واستدامة (الأيام 31+)

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
