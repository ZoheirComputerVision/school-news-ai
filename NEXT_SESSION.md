# NEXT_SESSION.md — تعليمات الجلسة القادمة

## ✅ Sprint 1C Complete — SQLite Migration + Cutover

### المنجز:
- [x] `lib/dal/index.js` — دعم `switchAdapter()` + `getFallbackAdapter()`
- [x] `database.js` — دعم التبديل الديناميكي (console, admin, modules)
- [x] `lib/dal/sqlite-adapter.js` — `_getTableSchema()` لتصفية الحقول
- [x] `lib/dal/migration.js` — إصلاحات connection lifecycle + key-based upsert
- [x] `config.js` — إضافة `DB_TYPE` (json/sqlite عبر `.env`)
- [x] **الهجرة**: 62/62 سجل، 0 أخطاء، 9/9 جداول متطابقة
- [x] **التحقق**: Row counts, data integrity, spot-check ✅
- [x] **Benchmark**: SQLite أبطأ على البيانات الصغيرة (<100 سجل) — JSON يبقى default
- [x] **Regression**: جميع API endpoints (status, content, categories, recent, timeline, stats, search) تعمل مع SQLite
- [x] جميع الـ modules (collector, analyzer, writer, archiver, scheduler, publisher, seed) تحمل بنجاح مع SQLite

---

## المهمة التالية: Phase 2 — بنية بيانات ومصادر حقيقية

### الأولوية: 🔴 عالية

### الوصف:
ربط المصادر الحقيقية (Facebook Graph API، مواقع وزارة التربية) بدلاً من البيانات الوهمية.

### الملفات المستهدفة:
| الملف | التعديل المطلوب |
|-------|-----------------|
| `modules/collector.js` | Facebook Graph API + Web scraper حقيقي |
| `modules/analyzer.js` | AI classification حقيقي (AraBERT أو API) |
| `modules/writer.js` | LLM integration (GPT أو Gemini) |
| `config.js` | API keys للمصادر |
| `lib/dal/index.js` | تفعيل SQLite كـ active adapter (اختياري) |

### خطوات التنفيذ:
1. تفعيل SQLite: إضافة `DB_TYPE=sqlite` إلى `.env`
2. ربط Facebook Graph API (token حقيقي + pagination)
3. Web scraper باستخدام axios + cheerio للمواقع الرسمية
4. Multi-source deduplication
5. Data quality dashboard
6. Caching layer (اختياري)

### ملاحظات:
- JSON يبقى كـ read-only fallback بعد Sprint 1C
- `better-sqlite3` مع `WAL mode` للأداء
- `DB_TYPE` في `.env` يتحكم في الـ adapter
- النسخ الاحتياطي مستمر عبر `lib/dal/backup.js`
- HTTPS/WSS مقفول عبر HostingGuru (Cloudflare Tunnel)
