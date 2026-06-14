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

---

## المهمة التالية: Phase 3 — تحسينات متقدمة

### الأولوية: 🔴 عالية

### الملفات المستهدفة:
| الملف | التعديل المطلوب |
|-------|-----------------|
| `modules/classifier.js` | استبدال التصنيف النصي بـ ML classifier (AraBERT أو API) |
| `modules/writer.js` | LLM integration (GPT/Gemini) |
| `modules/fact-validator.js` | التحقق الخارجي من الحقائق (APIs) |
| `public/` | تحسينات SEO متقدمة: sitemap.xml |
| `config.js` | API keys للذكاء الاصطناعي |

### أولويات للجلسة القادمة:
1. اختبار شامل للصفحة الرئيسية المعاد تصميمها — تحقق من جميع الأقسام الـ 9
2. تفعيل SQLite: إضافة `DB_TYPE=sqlite` إلى `.env`
3. ربط Facebook Graph API الحقيقي: إضافة `FACEBOOK_ACCESS_TOKEN` إلى `.env`
4. إنشاء sitemap.xml لتحسين SEO
5. تحسين أداء HomepageSelector مع caching

### ملاحظات هامة:
- **`DESIGN_GOVERNANCE.md`** — وثيقة ملزمة، لا تُغيّر الألوان/الخطوط/التخطيط
- **Header الجديد** يحافظ على شعار "الصوت المحلي" كما هو — بدون تغيير
- **الصفحة الرئيسية** تستخدم `GET /api/homepage` الآن — نقطة نهاية واحدة لكل البيانات
- **المناطق الإعلانية** مخفية تلقائياً عند عدم وجود محتوى إعلاني
