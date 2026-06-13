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
**Current:** v1.0.0  
**Last updated:** 2026-06-13

## SYSTEM_FLOW
```
[Boot] → server.js → mount routes → init modules → start cron
                          ↓
               JSON DB ← collector (30min) → [Facebook API / Web Scraping / Manual Entry]
                          ↓
               analyzer (15min) → classification + fact-check + duplicate detection
                          ↓
               writer → AI article generation (templates per category)
                          ↓
               publisher (10min) → quality check → auto-publish / pending review / reject
                          ↓
               archiver (6hrs) → timeline + stats + JSON export
                          ↓
               public/ ← static HTML + client-side JS
               admin/  ← dashboard + review + logs + settings
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

## CURRENT SECTIONS
| القسم | الحالة |
|-------|--------|
| أخبار (news) | ✅ يعمل |
| نشاطات (activity) | ✅ يعمل |
| إعلانات (announcement) | ✅ يعمل |
| غير مصنف (uncategorized) | ✅ يعمل |

## REQUIRED SECTIONS (Not Yet Implemented)
| القسم | الحالة |
|-------|--------|
| الافتتاحية | ❌ غير موجود |
| حدث | ❌ غير موجود |
| وطني | ❌ غير موجود |
| أخبار المنطقة | ❌ غير موجود |
| مجتمع | ❌ غير موجود |
| ثقافة | ❌ غير موجود |
| رياضة | ❌ غير موجود |
| التنمية | ❌ غير موجود |
| وجوه وعبر | ❌ غير موجود |
| إعلانات (مستقل) | ❌ غير موجود |
| الأرشفة الزمنية | موجود جزئياً |
| الأرشيف | موجود جزئياً |

## COMPLETED MILESTONES
- [x] Express server + JSON DB
- [x] AI pipeline: collector → analyzer → writer → publisher → archiver
- [x] Public SPA-like frontend (8 HTML pages + CSS + JS)
- [x] Admin panel (dashboard, review, logs, settings)
- [x] Cron scheduler (auto collect/analyze/publish)
- [x] Security: helmet + CORS + admin auth
- [x] Image upload as files instead of Base64
- [x] Error display inside modal
- [x] Request timeout (30s AbortController)
- [x] Database error propagation (no swallowing)

## ORPHANS & PENDING
| البند | الحالة | الأولوية |
|-------|--------|----------|
| قاعدة بيانات SQLite جاهزة (غير مستعملة) | قائمة | عالية |
| اختبارات (unit/integration) | غير موجودة | متوسطة |
| i18n (فرنسية/إنجليزية) | غير موجودة | منخفضة |
| HTTPS/SSL | غير مضبوط | عالية |
| Facebook Graph API (حقيقي) | غير متصل | عالية |
| Web Scraping (حقيقي) | غير متصل | عالية |
| CSRF protection | غير موجود | عالية |
| Rate Limiting | غير موجود | متوسطة |
| Multi-tenancy | غير موجود | منخفضة |
| Neo Vintage Newspaper Design | غير مطبق | عالية |
| Real AI/ML pipeline | غير مطبق | عالية |
