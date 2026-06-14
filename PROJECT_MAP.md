# school-news-ai — نظام جريدة مدرسية ذكية

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
**Current:** v2.1.0  
**Last updated:** 2026-06-14

## SYSTEM_FLOW
```
[Boot] → server.js → mount routes → init modules → start cron
                          ↓
                JSON DB ← collector (30min) → ScraperFactory
                          ↓                         ├── Facebook Graph API
                analyzer (15min) → classification   ├── RSS/Atom
                          ↓        + fact-check     ├── Web Scraping
                writer → AI article generation      └── Manual Entry
                          ↓                (lib/scraper/ + modules/dedup.js
                publisher (10min) → quality check    + modules/normalizer.js
                          ↓         + scorer)       + modules/scorer.js
                archiver (6hrs) → timeline + stats   + modules/monitor.js
                          ↓
                public/ ← static HTML + newspaper.css (navy+gold identity)
                admin/  ← dashboard + review + logs + settings + collector monitor
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
| الأخبار | `news` | `news.html` | ✅ |
| النشاطات | `activity` | `activities.html` | ✅ |
| الإعلانات | `announcement` | `announcements.html` | ✅ |
| الرياضة | `sports` | `section.html?s=sports` | ✅ |
| الثقافة | `culture` | `section.html?s=culture` | ✅ |
| العلوم | `science` | `section.html?s=science` | ✅ |
| الأدب | `literature` | `section.html?s=literature` | ✅ |
| الرأي | `opinion` | `section.html?s=opinion` | ✅ |
| التوجيه | `guidance` | `section.html?s=guidance` | ✅ |
| الطلبة | `students` | `section.html?s=students` | ✅ |
| التربية | `education` | `section.html?s=education` | ✅ |
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
| `logs.html` | سجلات AI |
| `settings.html` | إعدادات النظام |

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

## ORPHANS & PENDING
| البند | الحالة | الأولوية |
|-------|--------|----------|
| قاعدة بيانات SQLite جاهزة (غير مستعملة) | قائمة | متوسطة |
| اختبارات (unit/integration) | غير موجودة | عالية |
| i18n (فرنسية/إنجليزية) | غير موجودة | منخفضة |
| HTTPS/SSL | غير مضبوط | عالية |
| Facebook Graph API (token حقيقي) | غير متصل | متوسطة |
| Real AI/ML classifier | غير مطبق | عالية |
| LLM writer (GPT/Gemini) | غير مطبق | عالية |
| SEO (JSON-LD, sitemap.xml, meta) | غير مطبق | متوسطة |
| Caching layer (Redis/LRU) | غير مطبق | منخفضة |
| Multi-tenancy | غير موجود | منخفضة |
