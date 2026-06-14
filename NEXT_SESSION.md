# NEXT_SESSION.md — تعليمات الجلسة القادمة

## ✅ Phase 2B Complete — Real Content Acquisition Layer

### المنجز:
- [x] **`lib/scraper/`** — إطار جمع محتوى بـ 4 جالبين (Facebook, RSS, Web, Manual)
- [x] **`modules/dedup.js`** — كشف التكرار بـ 3 طرق (hash, URL, تشابه عناوين)
- [x] **`modules/normalizer.js`** — تطبيع المحتوى (تنظيف HTML، تاريخ، تصنيف تلقائي)
- [x] **`modules/scorer.js`** — تسجيل ثقة المصادر (ثقة + حداثة + نجاح)
- [x] **`modules/monitor.js`** — لوحة مراقبة مع API (status, logs, health)
- [x] **`modules/collector.js`** — إعادة هيكلة كاملة مع الحفاظ على التوافقية العكسية
- [x] **`routes/admin.js`** — 3 نقاط نهاية جديدة للمراقبة
- [x] **`config.js`** — إعدادات Facebook API
- [x] **إضافة تبعيات**: axios, cheerio, rss-parser

---

## المهمة التالية: Phase 3 — Neo Vintage Newspaper Refinements & AI Pipeline

### الأولوية: 🔴 عالية

### الملفات المستهدفة:
| الملف | التعديل المطلوب |
|-------|-----------------|
| `modules/analyzer.js` | AI classification حقيقي (AraBERT أو API خارجي) |
| `modules/writer.js` | LLM integration (GPT/Gemini) مع أسلوب كل قسم |
| `modules/publisher.js` | تحسينات النشر الآلي |
| `public/` | تحسينات SEO + JSON-LD + sitemap.xml |
| `config.js` | API keys للذكاء الاصطناعي |

### خطوات التنفيذ المقترحة:
1. تفعيل SQLite: إضافة `DB_TYPE=sqlite` إلى `.env` (اختياري — لاحظ الأداء)
2. ربط Facebook Graph API الحقيقي: إضافة `FACEBOOK_ACCESS_TOKEN` إلى `.env`
3. إضافة RSS feeds حقيقية (وزارة التربية، مديرية التربية لولاية تيارت، إلخ)
4. استبدال محلل التصنيف الحالي (rule-based) بـ ML classifier حقيقي
5. ربط LLM لكتابة المقالات بأسلوب الصحافة الورقية
6. تحسين محرّكات البحث (SEO): JSON-LD, sitemap.xml, meta tags
7. إعدادات النشر الآلي مع جدولة زمنية (cron expressions متقدمة)

### إعدادات البيئة الجديدة:
```env
FACEBOOK_ACCESS_TOKEN=your_token_here
FACEBOOK_PAGE_ID=Mujahid56khallil.Mohammed26SecondarySchool.2023
```

### ملاحظات:
- JSON adapter يبقى الافتراضي لصغر حجم البيانات
- SQLite متاح عبر `DB_TYPE=sqlite` في `.env` (أداء أبطأ في هذا النطاق)
- جميع واجهات API للإدارة متاحة الآن تحت `/admin/collector/*`
- لا تمس هوية "الصوت المحلي" أو هيكل الأقسام التحريرية الـ 12
