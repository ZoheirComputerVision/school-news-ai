# school-news-ai — الصوت المحلي — منصة جهوية للإعلام العام

## TECH_STACK
| الطبقة | التقنية | الإصدار |
|--------|---------|---------|
| Framework | Express.js | 4.18.2 |
| Database | JSON-based (custom JsonDB) + SQLite (جاهز غير مستعمل) | — |
| Security | helmet + cors | 7.1.0 / 2.8.5 |
| Logging | morgan | 1.10.0 |
| Cron | node-cron | 3.0.3 |
| UUID | uuid | 9.0.0 |

## VERSION
**Current:** v3.2.0
**Last updated:** 2026-06-14

## SYSTEM_FLOW (Phase 2C)
```
[Boot] → server.js → mount routes → init modules → start cron
                          ↓
                JSON DB ← Source Registry (SQLite) ← collector (per-source)
                          ↓           ↑              ├── Facebook Graph API
                EditorialClassifier (15min)          ├── RSS/Atom
                          ↓        + 9 categories   ├── Web Scraping
                FactValidator (source rep)           └── Manual Entry
                          ↓        + cross-dup           (via Source Registry → ScraperFactory)
                Writer → SEO + per-category template
                          ↓         + scorer + dedup + normalizer
                Publisher → Queue → Review Workflow
                          ↓         + governance logging
                Archiver (6hrs) → timeline + stats
                          ↓
                public/ ← static HTML + newspaper.css (navy+gold identity)
                admin/  ← dashboard + review + logs + settings + governance
```

## ROUTES
| المسار | الوظيفة |
|--------|---------|
| `GET /` | الصفحة الرئيسية |
| `GET /news.html` | الأخبار |
| `GET /activities.html` | النشاطات |
| `GET /announcements.html` | الإعلانات |
| `GET /article/:id` | عرض مقال |
| `GET /media.html` | المكتبة |
| `GET /archive.html` | الأرشيف الكامل |
| `GET /timeline.html` | الأرشفة الزمنية |
| `GET /admin` | لوحة التحكم (تسجيل الدخول) |
| `GET /admin/*` | صفحات الإدارة |
| `GET /api/content` | محتوى (JSON) |
| `GET /api/stats` | إحصائيات النظام |
| `GET /api/search` | بحث في المحتوى |
| `POST /api/admin/auth` | مصادقة المدير |

## CURRENT SECTIONS (12 قسم تحريري)
| القسم | المعرف | الصفحة | الحالة |
|-------|--------|--------|--------|
| فعاليات | `event` | `events.html` | ✅ |
| أخبار وطنية | `national` | `news.html` | ✅ |
| أخبار جهوية | `regional-news` | `regional.html` | ✅ |
| مجتمع | `society` | `section.html?s=society` | ✅ |
| ثقافة وفن | `culture` | `section.html?s=culture` | ✅ |
| رياضة | `sports` | `section.html?s=sports` | ✅ |
| تنمية وتطوير | `development` | `section.html?s=development` | ✅ |
| شخصيات وقصص | `faces-stories` | `section.html?s=faces` | ✅ |
| إعلانات | `advertisements` | `announcements.html` | ✅ |
| العلوم | `science` | `section.html?s=science` | ✅ |
| الأدب | `literature` | `section.html?s=literature` | ✅ |
| التوجيه | `guidance` | `section.html?s=guidance` | ✅ |
| غير مصنف | `uncategorized` | — | ✅ |

## STATIC PAGES
| الصفحة | الوظيفة |
|--------|---------|
| `index.html` | الصفحة الرئيسية (ماستهيد + قصة مميزة + شبكة تحريرية + أرشيف + إعلانات) |
| `article.html` | عرض المقال بتصميم الصحيفة |
| `section.html` | صفحة أقسام ديناميكية |
| `news.html` | الأخبار |
| `activities.html` | النشاطات المدرسية |
| `announcements.html` | الإعلانات |
| `timeline.html` | الأرشفة الزمنية |
| `archive.html` | الأرشيف والإحصائيات |
| `media.html` | معرض الوسائط (يستخدم style.css) |

## ADMIN PAGES
| الصفحة | الوظيفة |
|--------|---------|
| `index.html` | تسجيل الدخول |
| `dashboard.html` | لوحة التحكم + إدارة المحتوى |
| `review.html` | مراجعة المحتوى والموافقة |
| `governance.html` | حوكمة AI — سلسلة القرارات والثقة |
| `logs.html` | سجلات AI |
| `settings.html` | إعدادات النظام |

## HOMEPAGE REDESIGN (Phase 2C.1)
```
LAYER 1: UTILITY BAR        → date, weather, lang, quick links
LAYER 2: MASTHEAD           → logo "الصوت المحلي" + taglines + date
LAYER 3: STICKY NAV         → 11 items (config-driven, dropdowns)
────────────────────────────────────────────
1. BREAKING NEWS BAR        → red bar, latest event items
2. HERO ZONE                → 1 featured (AI-selected) + 2 secondary
3. LATEST GRID              → 6-12 cards, 3 columns
4. REGIONAL NEWS            → 2 columns, regional-content
5. MOST READ                → 2 columns, view-count sorted
6. DEVELOPMENT              → vertical list
7. CULTURE + SOCIETY        → 2-column layout
8. SPORTS                   → 3 columns
9. ADVERTISEMENTS           → auto-hidden if empty
────────────────────────────────────────────
AI SELECTION: HomepageSelector (modules/editorial/)
  - Hero: 40% score + 30% priority + 20% confidence + 0.1% views
  - Trending: by view_count
  - Regional: by regional-news category
```

## COMPLETED MILESTONES
- [x] Express server + JSON DB
- [x] AI pipeline: collector → analyzer → writer → publisher → archiver
- [x] Public SPA-like frontend (9 HTML pages + CSS + JS)
- [x] Admin panel (dashboard, review, logs, settings)
- [x] Cron scheduler (auto collect/analyze/publish)
- [x] Security: helmet + CORS + admin auth
- [x] Image upload as files instead of Base64
- [x] Error display inside modal
- [x] Request timeout (30s AbortController)
- [x] Database error propagation (no swallowing)
- [x] DAL + Repository layer (BaseRepository, ArticleRepository, SettingsRepository, ArchiveRepository)
- [x] SQLite migration + cutover (62/62 records, 9/9 tables)
- [x] Local Voice rebranding → "الصوت المحلي"
- [x] Neo Vintage UI → newspaper.css + newspaper.js
- [x] 12 editorial sections (news, activity, announcement, sports, culture, science, literature, opinion, guidance, students, education)
- [x] Real Content Acquisition Layer (ScraperFactory: Facebook, RSS, Web)
- [x] Duplicate detection engine (hash/URL/title similarity)
- [x] Content normalization pipeline
- [x] Source scoring system
- [x] Collector monitoring dashboard (3 admin API endpoints)
- [x] Visual reconciliation: navy+gold identity unified across all pages
- [x] DESIGN_GOVERNANCE.md — design freeze document
- [x] Source Registry (modules/source-registry.js) — centralized metadata in SQLite
  - Fields: source_id, name, type, region, municipality, category, status, reliability_score, sync_frequency
  - API: register, getActive, getByType, getByRegion, getByCategory, markSync, markError
  - Collectors register through Source Registry only — no hardcoded sources
- [x] **Phase 2B.2: Navigation & IA Enhancement**
  - 11-section config-driven navigation
  - Regional submenu for أخبار المنطقة
  - Sticky nav (mobile + desktop)
  - News ticker (live headlines)
  - Breadcrumb trail with JSON-LD
  - Global search with filters
  - Enhanced section pages (featured/latest/most viewed)
  - Enhanced archive (year/month/category)
- [x] **Phase 2C.1: Editorial Homepage Redesign**
  - [x] `modules/editorial/homepage-selector.js` — AI content selection
  - [x] `routes/api.js` — GET /api/homepage endpoint
  - [x] `public/index.html` — 3-layer header + 9 editorial sections
  - [x] `public/js/newspaper.js` — Dynamic homepage rendering
  - [x] `public/css/newspaper.css` — ~400 lines new homepage styles
  - [x] Stats bar removed, ad zones auto-hidden
  - [x] SEO JSON-LD structured data
  - [x] Lazy loading + auto-refresh
- [x] **Phase 2C: Editorial Intelligence Layer**
  - [x] `modules/classifier.js` — 9-category editorial classifier with confidence scoring
  - [x] `modules/fact-validator.js` — Source reputation + cross-source + date validation
  - [x] `modules/analyzer.js` — Rewritten pipeline using new Classifier + FactValidator
  - [x] `modules/writer.js` — Rewritten with SEO metadata generation, per-category templates
  - [x] `modules/publisher.js` — Review workflow state machine + priority queue + governance logging
  - [x] `routes/admin.js` — Governance API endpoints
  - [x] `admin/governance.html` — Governance dashboard with decision chain viewer
  - [x] `public/js/api.js` — Governance API client methods

## ORPHANS & PENDING
| البند | الحالة | الأولوية |
|-------|--------|----------|
| قاعدة بيانات SQLite جاهزة (غير مستعملة) | قائمة | متوسطة |
| اختبارات (unit/integration) | غير موجودة | عالية |
| i18n (فرنسية/إنجليزية) | غير موجودة | منخفضة |
| HTTPS/SSL | غير مضبوط | عالية |
| Facebook Graph API (token حقيقي) | غير متصل | متوسطة |
| ML classifier (AraBERT or API) | غير مطبق | عالية |
| LLM writer (GPT/Gemini) | غير مطبق | عالية |
| SEO (JSON-LD, sitemap.xml, meta) | غير مطبق | متوسطة |
| Caching layer (Redis/LRU) | غير مطبق | منخفضة |
| Multi-tenancy | غير موجود | منخفضة |
