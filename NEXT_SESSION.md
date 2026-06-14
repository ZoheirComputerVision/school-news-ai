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

## ✅ Phase 3B Complete — Tenant Administration & White Label Platform

### المنجز:
- [x] **`modules/tenant/branding-manager.js`** — Branding Manager (logo, favicon, homepage, footer, about, social)
- [x] **`modules/tenant/user-manager.js`** — User Manager (4 roles, bcrypt, per-tenant JWT)
- [x] **`modules/tenant/pages-manager.js`** — Pages Manager (about, contact, editorial-policy, privacy-policy)
- [x] **`modules/tenant/analytics.js`** — Analytics (content, ads, editorial, engagement)
- [x] **`middleware/authorize.js`** — Role & tenant access middleware
- [x] **`routes/tenant-admin.js`** — 14 endpoints under `/api/tenant/`
- [x] **`modules/tenant/migrate.js`** — Updated for 3 new tables + default super_admin seed
- [x] **`admin/saas-control-center.html`** — 3 new tabs (Branding, Users, Analytics)
- [x] **جداول جديدة**: tenant_settings, tenant_users, tenant_pages
- [x] **صلاحيات**: per-tenant JWT with role-based access (super_admin, tenant_admin, editor, reviewer)

## ✅ Phase 3C Complete — Billing & Subscription Platform

### المنجز:
- [x] **`modules/billing/plan-manager.js`** — 3 plans (Starter, Professional, Enterprise) with limits
- [x] **`modules/billing/subscription-manager.js`** — trial→active→suspended→expired→cancelled
- [x] **`modules/billing/invoice-manager.js`** — auto invoice numbers, revenue (MRR/ARR)
- [x] **`modules/billing/usage-tracker.js`** — articles, editors, API, storage + limit checking
- [x] **`modules/billing/migrate.js`** — table verification + plan seeding + trial subscriptions
- [x] **`routes/billing.js`** — 18 endpoints under `/api/billing/`
- [x] **`admin/billing-center.html`** — 5 tabs (Plans, Subscriptions, Invoices, Revenue, Usage)
- [x] **`admin/tenant-billing.html`** — plan info, usage bars, invoice history
- [x] **5 جداول جديدة**: plans, subscriptions, invoices, usage_metrics, payment_events
- [x] **نظام تجربة 14 يوم**: اشتراك تجريبي تلقائي لجميع المنصات الجديدة

---

## المهمة التالية: Phase 4 — تحسينات متقدمة

### الأولوية: 🔴 عالية

### الملفات المستهدفة:
| الملف | التعديل المطلوب |
|-------|-----------------|
| `modules/classifier.js` | استبدال التصنيف النصي بـ ML classifier (AraBERT أو API) |
| `modules/writer.js` | LLM integration (GPT/Gemini) |
| `modules/fact-validator.js` | التحقق الخارجي من الحقائق (APIs) |
| `public/` | تحسينات SEO متقدمة: sitemap.xml |
| `config.js` | API keys للذكاء الاصطناعي |
| | Payment gateway integration (Stripe/PayPal) |
| | Custom domain support per tenant |

### أولويات للجلسة القادمة:
1. **ML Classifier**: استبدال التصنيف النصي بـ AraBERT أو API خارجي
2. **LLM Writer**: دمج GPT/Gemini للكتابة التلقائية
3. **Fact Validator خارجي**: التحقق من الحقائق عبر APIs
4. إنشاء sitemap.xml لتحسين SEO
5. تحسين أداء HomepageSelector مع caching
6. **نطاقات مخصصة**: دعم نطاق لكل منصة
7. **دمج بوابة الدفع**: Stripe/PayPal للفوترة الحقيقية

### ملاحظات هامة:
- **`DESIGN_GOVERNANCE.md`** — وثيقة ملزمة، لا تُغيّر الألوان/الخطوط/التخطيط
- **المنصات** تدعم المسارات: `/tiaret/article/123`, `/oran/article/456`
- **بدون مسار منصة**: يعمل كالمعتاد مع منصة تيارت الافتراضية
- **مركز التحكم SaaS** متاح في `/admin/saas-control-center.html`
- **مركز الفوترة**: `/admin/billing-center.html` (للمشرف العام)
- **فوترة المنصة**: `/admin/tenant-billing.html` (لمدير المنصة)
- **API الفوترة**: `/api/billing/*` (جميع نقاط الفوترة)
- **تسجيل الدخول للمنصات**: POST `/api/tenant/auth` مع `{ tenant_id, username, password }`
