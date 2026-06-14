# NEXT_SESSION.md — تعليمات الجلسة القادمة

## ✅ Phase 2B.2 Complete — Navigation & Information Architecture Enhancement

### المنجز:
- [x] **`config/navigation.js`** — نظام تنقل config-driven بـ 11 عنصراً
- [x] **شريط التنقل الثابت (Sticky Navigation)** — قوائم منسدلة، هامبرغر للجوال، ثبات عند التمرير
- [x] **الشريط الإخباري (News Ticker)** — عناوين أفقية متحركة
- [x] **فتات الخبز (Breadcrumbs)** — مع JSON-LD structured data
- [x] **البحث الشامل (Global Search)** — تصفية حسب النوع
- [x] **القائمة الفرعية الجهوية** — 5 بلديات
- [x] **صفحات الأقسام المحسّنة** — مميز + أحدث + الأكثر مشاهدة
- [x] **الأرشيف المحسّن** — سنة/شهر/تصنيف
- [x] **API endpoints** — `/api/nav`, `/api/latest-news`, `/api/section/:category`, `/api/archive-data`

## ✅ Phase 2C Complete — Editorial Intelligence Layer

### المنجز:
- [x] **`modules/classifier.js`** — مصنف 9 فئات مع حساب الثقة
- [x] **`modules/fact-validator.js`** — تدقيق الحقائق مع سمعة المصدر
- [x] **`modules/analyzer.js`** — إعادة هيكلة لاستخدام Classifier + FactValidator
- [x] **`modules/writer.js`** — إعادة هيكلة مع SEO + قوالب لكل فئة
- [x] **`modules/publisher.js`** — سير عمل المراجعة + طابور الأولويات + حوكمة
- [x] **`admin/governance.html`** — لوحة حوكمة AI

## ✅ Phase 2C.1 Complete — Editorial Homepage Redesign

### المنجز:
- [x] **`modules/editorial/homepage-selector.js`** — AI content selection (hero, trending, regional)
- [x] **Header ثلاثي الطبقات**: Utility Bar + Masthead + Sticky Nav
- [x] **9 أقسام تحريرية**: Breaking, Hero, Latest, Regional, Trending, Dev, Culture+Society, Sports, Ads
- [x] **إزالة شريط الإحصائيات** — 0 0 0 0 0 0
- [x] **إخفاء الإعلانات الفارغة** تلقائياً
- [x] **SEO**: JSON-LD structured data
- [x] **تحميل كسول** + Auto-refresh
- [x] **`GET /api/homepage`** — نقطة نهاية API واحدة للصفحة الرئيسية
- [x] **`HOMEPAGE_REDESIGN_REPORT.md`** — تقرير كامل

## ✅ Phase 2D Complete — Advertising & Revenue Layer

### المنجز:
- [x] **`modules/ads/`** — 4 موديولات: AdInventory, CampaignManager, Tracker, Migrate
- [x] **6 مناطق إعلانية**: homepage-top, homepage-middle, homepage-bottom, article-sidebar, article-inline, archive-page
- [x] **API 12 نقطة نهاية**: إدارة الحملات والمعلنين والمناطق والتتبع والتقارير
- [x] **`admin/ads-center.html`** — لوحة تحكم الإعلانات كاملة
- [x] **`public/js/newspaper.js`** — دمج الإعلانات في الصفحة الرئيسية (3 مناطق)
- [x] **إخفاء تلقائي**: المناطق الفارغة لا تظهر
- [x] **تتبع الأحداث**: Impression + click beacons
- [x] **تقارير**: يومية/أسبوعية/شهرية مع أفضل الحملات

## ✅ Phase 3A Complete — Multi-Tenant SaaS Foundation

### المنجز:
- [x] **`modules/tenant/tenant-registry.js`** — سجل المنصات (CRUD, 6 منصات, إحصائيات)
- [x] **`modules/tenant/config-manager.js`** — إعدادات لكل منصة (عنوان, شعار, تواصل, ألوان)
- [x] **`modules/tenant/migrate.js`** — تهيئة الجداول + ترحيل البيانات الحالية
- [x] **`middleware/tenant.js`** — حل المنصة من URL أو header مع إعادة كتابة المسار
- [x] **`routes/tenants.js`** — 10 نقاط نهاية API
- [x] **`admin/saas-control-center.html`** — لوحة تحكم SaaS
- [x] **عزل المحتوى**: tenant_id على جميع الجداول (articles, editorial, ads)
- [x] **فلترة**: جميع نقاط API تفلتر حسب tenant_id
- [x] **ترحيل**: 11 مقالة → منصة تيارت

---

## المهمة التالية: Phase 3B — تحسينات متقدمة

### الأولوية: 🔴 عالية

### الملفات المستهدفة:
| الملف | التعديل المطلوب |
|-------|-----------------|
| `modules/classifier.js` | استبدال التصنيف النصي بـ ML classifier (AraBERT أو API) |
| `modules/writer.js` | LLM integration (GPT/Gemini) |
| `modules/fact-validator.js` | التحقق الخارجي من الحقائق (APIs) |
| `public/` | تحسينات SEO متقدمة: sitemap.xml |
| `middleware/auth.js` | صلاحيات لكل منصة (per-tenant JWT) |
| `config.js` | API keys للذكاء الاصطناعي |

### أولويات للجلسة القادمة:
1. **صلاحيات المنصات**: JWT لكل منصة (admin/tiaret, admin/oran, ...)
2. تفعيل SQLite: إضافة `DB_TYPE=sqlite` إلى `.env`
3. ربط Facebook Graph API الحقيقي: إضافة `FACEBOOK_ACCESS_TOKEN` إلى `.env`
4. إنشاء sitemap.xml لتحسين SEO
5. تحسين أداء HomepageSelector مع caching

### ملاحظات هامة:
- **`DESIGN_GOVERNANCE.md`** — وثيقة ملزمة، لا تُغيّر الألوان/الخطوط/التخطيط
- **Header الجديد** يحافظ على شعار "الصوت المحلي" كما هو — بدون تغيير
- **المنصات** تدعم المسارات: `/tiaret/article/123`, `/oran/article/456`
- **بدون مسار منصة**: يعمل كالمعتاد مع منصة تيارت الافتراضية
- **مركز التحكم SaaS** متاح في `/admin/saas-control-center.html`
