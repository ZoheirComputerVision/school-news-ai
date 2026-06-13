# NEXT_SESSION.md — تعليمات الجلسة القادمة

## ✅ Phase 2A Complete — Local Voice Rebranding & Neo Vintage UI

### المنجز:
- [x] **هوية "الصوت المحلي"** — إعادة تسمية النظام بالكامل
- [x] **`public/css/newspaper.css`** — نظام تصميم Neo Vintage (3 أعمدة، طباعة، مساحات إعلانية)
- [x] **`public/js/newspaper.js`** — محرك عرض جديد مع Featured Story + Editorial Grid + Timeline
- [x] **`public/index.html`** — صفحة رئيسية جديدة (Masthead، Hero، 3 أعمدة، أرشيف، إعلانات)
- [x] **`public/section.html`** — 8 أقسام تحريرية جديدة (رياضة، ثقافة، علوم، أدب، رأي، توجيه، طلبة، تربية)
- [x] **تحديث جميع الصفحات (8 صفحات)** — article، news، activities، announcements، timeline، archive
- [x] **`config.js`** — إضافة `VOICE_NAME`
- [x] **`server.js`** — شعار 🎙️ الصوت المحلي
- [x] **اختبار 11 صفحة** — جميعها تعمل (200 OK)

---

## المهمة التالية: Phase 2B — Real Data Sources & AI Pipeline

### الأولوية: 🔴 عالية

### الملفات المستهدفة:
| الملف | التعديل المطلوب |
|-------|-----------------|
| `modules/collector.js` | Facebook Graph API + Web scraper |
| `modules/analyzer.js` | AI classification (AraBERT أو API) |
| `modules/writer.js` | LLM integration (GPT/Gemini) |
| `modules/publisher.js` | تحسينات النشر |
| `config.js` | API keys للمصادر |
| `package.json` | إضافة axios, cheerio |

### خطوات التنفيذ المقترحة:
1. تفعيل SQLite: إضافة `DB_TYPE=sqlite` إلى `.env` (اختياري)
2. ربط Facebook Graph API (token + pagination)
3. Web scraper باستخدام axios + cheerio
4. تحسين trust scoring متعدد المصادر
5. لوحة بيانات جودة المحتوى

### ملاحظات:
- الهوية الجديدة "الصوت المحلي" نشطة وجاهزة
- JSON يبقى كـ fallback (يمكن التبديل عبر `.env`)
- `DB_TYPE` في `.env` يتحكم في adapter
- جميع الـ Backend APIs محفوظة ودون تغيير
- واجهة Neo Vintage Newspaper جاهزة للعرض
