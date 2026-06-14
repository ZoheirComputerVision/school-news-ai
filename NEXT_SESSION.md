# NEXT_SESSION.md — تعليمات الجلسة القادمة

## ✅ Phase 2B Complete — Real Content Acquisition Layer + Source Registry

### المنجز:
- [x] **`modules/source-registry.js`** — سجل مركزي للمصادر في SQLite (source_id, region, municipality, category, reliability_score, sync_frequency)
- [x] **SQLite schema v2** — ترحيل تلقائي للأعمدة الجديدة
- [x] **`modules/collector.js`** — يستخدم Source Registry حصراً (لا hardcoded sources)
- [x] **Admin API** — CRUD للمصادر + لوحة مراقبة محسّنة
- [x] **Pipeline كامل**: Registry → Collector → Normalizer → Dedup → Scorer → Storage
- [x] **`lib/scraper/`** — 4 جالبين (Facebook, RSS, Web, Manual)
- [x] **`modules/dedup.js`** — كشف التكرار (hash/URL/تشابه عناوين)
- [x] **`modules/normalizer.js`** — تطبيع المحتوى (HTML→text, تاريخ, تصنيف)
- [x] **`modules/scorer.js`** — تسجيل ثقة المصادر
- [x] **`modules/monitor.js`** — لوحة مراقبة + 3 Admin APIs
- [x] **`DESIGN_GOVERNANCE.md`** — دستور التصميم الملزم
- [x] **Visual Reconciliation** — أزرق ملكي + ذهبي في كل الصفحات

---

## المهمة التالية: Phase 3 — AI Pipeline & Refinements

### الأولوية: 🔴 عالية

### الملفات المستهدفة:
| الملف | التعديل المطلوب |
|-------|-----------------|
| `modules/analyzer.js` | استبدال التصنيف النصي بـ AraBERT أو API خارجي |
| `modules/writer.js` | LLM integration (GPT/Gemini) مع أسلوب كل قسم |
| `modules/publisher.js` | تحسينات النشر الآلي + الجدولة |
| `public/` | تحسينات SEO: JSON-LD, sitemap.xml, meta tags |
| `config.js` | API keys للذكاء الاصطناعي |

### خطوات التنفيذ المقترحة:
1. تفعيل SQLite: إضافة `DB_TYPE=sqlite` إلى `.env`
2. ربط Facebook Graph API الحقيقي: إضافة `FACEBOOK_ACCESS_TOKEN` إلى `.env`
3. استبدال محلل التصنيف الحالي (rule-based) بـ ML classifier حقيقي
4. ربط LLM لكتابة المقالات بأسلوب الصحافة الورقية
5. تحسين محرّكات البحث (SEO): JSON-LD, sitemap.xml, meta tags
6. إعدادات النشر الآلي المتقدمة

### إعدادات البيئة:
```env
FACEBOOK_ACCESS_TOKEN=your_token_here
DB_TYPE=sqlite
```

### ملاحظات هامة:
- **`DESIGN_GOVERNANCE.md`** — وثيقة ملزمة، لا تُغيّر الألوان/الخطوط/التخطيط
- **Source Registry** — كل مصدر جديد يجب أن يُسجل عبر `POST /admin/sources/register`
- **JSON adapter** يبقى الافتراضي؛ SQLite متاح عبر `DB_TYPE=sqlite`
- لا تمس هوية "الصوت المحلي" أو هيكل الأقسام التحريرية الـ 12
