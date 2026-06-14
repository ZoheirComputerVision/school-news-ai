# Phase 2C.1 — Editorial Homepage Redesign Report

## Overview
تحويل الصفحة الرئيسية إلى واجهة صحفية احترافية بتصميم بوابة أخبارية عصرية مع الحفاظ الكامل على هوية "الصوت المحلي".

## Header Redesign

### Layer 1 — Utility Bar (شريط الخدمات)
- **التاريخ**: عرض تاريخ اليوم بتنسيق عربي (أيام الأسبوع + التاريخ)
- **الطقس**: عنصر واجهة للطقس مع أيقونة (قابل للتوسيع لاحقاً)
- **عدد الإصدار**: عرض رقم الإصدار الحالي
- **روابط الوصول السريع**: الأرشيف، البحث، لوحة الإدارة
- **محدد اللغة**: العربية (نشط) — جاهز للتوسيع إلى لغات أخرى
- **تصغير المسافات**: ارتفاع صغير (3px padding) مع لون خلفية داكن

### Layer 2 — Newspaper Masthead (رأسية الجريدة)
- **الشعار**: "الصوت المحلي" كعنصر بصري مهيمن — محفوظ كما هو، بدون تغيير أو إعادة تصميم
- **الشعار الفرعي**: "إهتمام محلي ... إلتزام وطني" بلون ذهبي
- **الوصف**: "منصة جهوية للإعلام العام والتنمية المحلية"
- **التاريخ والموقع**: عرض في الجانب الأيسر مع موقع المنصة
- **فاصل سفلي**: خط مزدوج عريض لفصل الرأسية عن المحتوى

### Layer 3 — Main Navigation (التنقل الرئيسي)
- محفوظ بالكامل من Phase 2B.2 — 11 عنصراً، ثابت، مع قوائم منسدلة
- 11 عنصراً: الرئيسية، حدث، وطني، أخبار المنطقة، مجتمع، ثقافة، رياضة، التنمية، وجوه وعبر، إعلانات، الأرشيف

## Homepage Layout Changes

### Section 1 — Breaking News Bar (شريط الأخبار العاجلة)
- **المصدر**: أحدث المحتوى المنشور من فئة `event`
- **التصميم**: شريط أحمر (#c0392b) مع تسمية "عاجل" والروابط تمرير أفقياً
- **احتواء تلقائي**: يختفي إذا لم تتوفر أخبار عاجلة

### Section 2 — Hero Zone (منطقة البطل)
- **1 قصة مميزة**: أكبر عنصر في الصفحة — صورة كبيرة + عنوان رئيسي + ملخص + تصنيف
- **2 قصص ثانوية**: جانبية مع حد ذهبي يميني
- **اختيار AI**: عبر `homepage-selector.js` — وزن: 40% ثقة + 30% أولوية المحرر + 20% ثقة التصنيف + 0.1% المشاهدات

### Section 3 — Latest News Grid (شبكة آخر الأخبار)
- **6–12 بطاقة**: شبكة (3 أعمدة) مع صورة، عنوان، تصنيف، تاريخ
- **تأثير hover**: تكبير الصورة + ظل محسّن
- **بطاقات قابلة للتوسيع**: تعبئة تلقائية حسب المحتوى المتاح

### Section 4 — Regional News (أخبار المنطقة)
- **مصدر**: المحتوى المصنف كـ `regional-news`
- **شبكة عمودين**: بطاقات مع حد ذهبي يميني، عنوان، ملخص، تاريخ

### Section 5 — Most Read / Trending (الأكثر قراءة)
- **اختيار AI**: حسب عداد المشاهدات (view_count)
- **ترقيم ذهبي**: أرقام 01–06 بلون ذهبي لترتيب العناصر
- **شبكة عمودين**: مع عرض التصنيف والتاريخ وعداد المشاهدات

### Section 6 — Development (التنمية)
- **مصدر**: المحتوى المصنف كـ `development`
- **قائمة رأسية**: بطاقات بحد أزرق يميني

### Section 7 — Culture + Society (ثقافة + مجتمع)
- **عمودين جنباً إلى جنب**: اليمين للتنمية، اليسار للثقافة (فوق) والمجتمع (تحت)
- **قوائم رأسية**: لكل قسم عناوينه الخاصة مع تواريخها

### Section 8 — Sports (رياضة)
- **شبكة 3 أعمدة**: بطاقات رياضية مع صور متدرجة (تدرج أزرق كخلفية)

### Section 9 — Advertisements (الإعلانات)
- **إخفاء تلقائي**: المناطق الإعلانية مخفية (`display:none`) ما لم يُضف محتوى إعلاني
- **لا مساحات فارغة عرض**: لا تظهر قوالب الإعلانات الفارغة

### Removed — Statistics Section
- تم إزالة شريط الإحصائيات (0 0 0 0 0 0) بالكامل

## AI Integration

### `modules/editorial/homepage-selector.js`
- **الوظيفة**: اختيار المحتوى الذكي للصفحة الرئيسية
- **المخرجات**: `buildHomepage()` → { breaking, hero, latest, regional, trending, development, culture, society, sports, nav, generated_at }
- **معايير الاختيار**:
  - الثقة (overall_score) — 40%
  - أولوية المحرر (editor_priority) — 30%
  - ثقة التصنيف (confidence_score) — 20%
  - المشاهدات (view_count) — 0.1%
- **وقت التوليد**: timestamp `generated_at` لكل استجابة

### API Endpoint
- `GET /api/homepage` — بيانات الصفحة الرئيسية الكاملة (مجموعة JSON واحدة)

## SEO Improvements

### JSON-LD Structured Data
- **نوع المخطط**: `NewsArticle` مع publisher و url و description
- **ربط الموقع**: URL المنصة الحية

### Meta Tags
- `og:title`, `og:description`, `og:type`, `og:site_name`
- وصف محسّن للصفحة الرئيسية

## Performance Impact

### Lazy Loading
- جميع الصور تستخدم `loading="lazy"`
- IntersectionObserver متاح عبر `NP.lazyLoad()` للمحتوى الديناميكي
- هامش تحميل 200px قبل الظهور

### Homepage Caching
- البيانات تُحمل عبر API واحد (`GET /api/homepage`)
- تستخدم `NP._data` للتخزين المؤقت في الجلسة الواحدة
- Auto-refresh كل 3 دقائق (180000ms) عبر `meta[data-auto-refresh]`

### Optimized Queries
- `homepage-selector.js` يستخدم `adapter.findAll()` المباشر مع تصفية في الذاكرة
- جميع البيانات في استدعاء API واحد بدلاً من 8 استدعاءات منفصلة

## Files Changed

| File | Change |
|------|--------|
| `modules/editorial/homepage-selector.js` | **جديد** — AI content selection module |
| `public/index.html` | **إعادة كتابة** — هيكل الصفحة الرئيسية الجديد (3 طبقات، 9 أقسام) |
| `public/js/newspaper.js` | **إعادة كتابة** — عرض ديناميكي لجميع أقسام الصفحة الرئيسية |
| `public/css/newspaper.css` | **إضافة** — +400 سطر CSS للأقسام الجديدة |
| `routes/api.js` | **تعديل** — endpoint جديد `/api/homepage` |
| `public/js/api.js` | **تعديل** — دالة `getHomepage()` جديدة |

## Design Constraints Met
- ✅ **DESIGN_GOVERNANCE.md preserved** — No logo, color, typography, or layout changes
- ✅ **Logo preserved** — "الصوت المحلي" masthead text unchanged, no stretching/cropping/redesign
- ✅ **Navigation preserved** — Existing 11-item nav from Phase 2B.2 unchanged
- ✅ **No automatic publication** — Content selection is read-only from published items
- ✅ **Statistics removed** — Stats bar showing 0 values eliminated
- ✅ **Ad zones hidden when empty** — Sections use `display:none` when no ads
