# NEXT_SESSION.md — تعليمات الجلسة القادمة

## ✅ Phase 2C Complete — Editorial Intelligence Layer

### المنجز:
- [x] **`modules/classifier.js`** — مصنف تحريري بـ 9 فئات مع حساب الثقة
  - الفئات: فعاليات، أخبار وطنية، أخبار جهوية، مجتمع، ثقافة وفن، رياضة، تنمية وتطوير، شخصيات وقصص، إعلانات
  - تصنيف بالكلمات المفتاحية (strong/medium/context) بوزن 0.25/0.15/0.10
  - حساب الثقة بهامش الفوز (margin-of-victory) + دعم الأسماء المستعارة
- [x] **`modules/fact-validator.js`** — تدقيق الحقائق مع سمعة المصدر
  - سمعة المصدر من Source Registry، فلترة حكومية، تحقق تاريخ، جودة محتوى
  - كشف التكرار عبر المصادر (cross-source duplicate comparison)
- [x] **`modules/analyzer.js`** — إعادة هيكلة لاستخدام Classifier + FactValidator الجديدين
- [x] **`modules/writer.js`** — إعادة هيكلة مع SEO (meta description, tags, slug) + قوالب لكل فئة
- [x] **`modules/publisher.js`** — سير عمل المراجعة + طابور الأولويات + سجل الحوكمة
- [x] **`admin/governance.html`** — لوحة حوكمة AI (سلسلة القرارات، الثقة، التصفية)
- [x] **Admin API** — نقاط نهاية الحوكمة (governance, governance/summary, pipeline/queue, pipeline/stats)
- [x] **Source Registry** — إضافة `findByName()` و `findByUrl()`
- [x] **API client** — دوال جديدة للحوكمة

---

## المهمة التالية: Phase 3 — AI Pipeline متقدم وتحسينات

### الأولوية: 🔴 عالية

### الملفات المستهدفة:
| الملف | التعديل المطلوب |
|-------|-----------------|
| `modules/classifier.js` | استبدال التصنيف النصي بـ ML classifier (AraBERT أو API) |
| `modules/writer.js` | LLM integration (GPT/Gemini) مع أسلوب كل قسم |
| `modules/fact-validator.js` | التحقق الخارجي من الحقائق (APIs) |
| `public/` | تحسينات SEO: JSON-LD, sitemap.xml, meta tags |
| `config.js` | API keys للذكاء الاصطناعي |

### خطوات التنفيذ المقترحة:
1. تفعيل SQLite: إضافة `DB_TYPE=sqlite` إلى `.env`
2. ربط Facebook Graph API الحقيقي: إضافة `FACEBOOK_ACCESS_TOKEN` إلى `.env`
3. استبدال محلل التصنيف الحالي (rule-based 9 فئات) بـ ML classifier حقيقي
4. ربط LLM لكتابة المقالات بأسلوب الصحافة الورقية الحقيقي
5. تحسين محرّكات البحث (SEO): JSON-LD, sitemap.xml, meta tags
6. إعدادات النشر الآلي المتقدمة (جدولة زمنية، نشر متعدد القنوات)

### إعدادات البيئة:
```env
FACEBOOK_ACCESS_TOKEN=your_token_here
DB_TYPE=sqlite
```

### ملاحظات هامة:
- **`DESIGN_GOVERNANCE.md`** — وثيقة ملزمة، لا تُغيّر الألوان/الخطوط/التخطيط
- **Source Registry** — كل مصدر جديد يجب أن يُسجل عبر `POST /admin/sources/register`
- **JSON adapter** يبقى الافتراضي؛ SQLite متاح عبر `DB_TYPE=sqlite`
- **المصنف 9 فئات** جاهز ومتوافق مع الأسماء القديمة (news→national, activity→event, announcement→advertisements)
- **حوكمة AI** متاحة عبر `/admin/governance.html` — تعرض سلسلة القرارات الكاملة ودرجات الثقة
- لا تمس هوية "الصوت المحلي" أو هيكل الأقسام التحريرية الـ 12
