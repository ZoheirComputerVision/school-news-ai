# NEXT_SESSION.md — تعليمات الجلسة القادمة

## ✅ Sprint 1B Complete — Data Layer Refactor

### المنجز:
- [x] `lib/dal/adapter.js` — قاعدة الـ adapters
- [x] `lib/dal/json-adapter.js` — JsonAdapter (نشط حالياً)
- [x] `lib/dal/sqlite-adapter.js` — SqliteAdapter (جاهز، 9 جداول + indexes)
- [x] `lib/dal/backup.js` — نسخ احتياطي تلقائي قبل الكتابة
- [x] `lib/dal/migration.js` — أدوات هجرة JSON → SQLite
- [x] `lib/dal/index.js` — نقطة دخول موحدة
- [x] `lib/repositories/base-repository.js`
- [x] `lib/repositories/article-repository.js`
- [x] `lib/repositories/settings-repository.js`
- [x] `lib/repositories/archive-repository.js`
- [x] تحديث `database.js` — Facade يحافظ على التوافقية العكسية
- [x] تحديث جميع الـ routes (api.js, admin.js)
- [x] تحديث جميع الـ modules (publisher, scheduler, seed, archiver, analyzer, writer, collector)
- [x] اختبارات regression (Status, Content, Login, Search) ✅

---

## المهمة التالية: Sprint 1C — SQLite Migration + Cutover

### الأولوية: 🔴 عالية

### الوصف:
تفعيل SqliteAdapter كقاعدة بيانات أساسية مع الإبقاء على JsonAdapter كـ fallback.

### الملفات المستهدفة:
| الملف | التعديل المطلوب |
|-------|-----------------|
| `lib/dal/index.js` | تفعيل SqliteAdapter كـ active adapter |
| `database.js` | دعم التبديل الديناميكي بين JSON و SQLite |
| `lib/dal/migration.js` | تشغيل الهجرة الفعلية |
| `data/` | إنشاء database.sqlite مع البيانات المهاجرة |

### خطوات التنفيذ:
1. تشغيل `migration.migrateJsonToSqlite()` — هجرة كل الجداول
2. تشغيل `migration.verifyMigration()` — التحقق من التطابق
3. تفعيل SqliteAdapter كـ active adapter (مع JSON fallback)
4. اختبار شامل (نفس اختبارات Sprint 1B + اختبار الأداء)
5. إذا نجح: إعلان SQLite جاهز، JSON → read-only fallback
6. تحديث التوثيق
7. Commit + Push

### ملاحظات:
- JSON يبقى للقراءة فقط بعد Sprint 1C
- `better-sqlite3` مثبت مسبقاً
- دعم `journal_mode = WAL` للأداء
- النسخ الاحتياطي مستمر عبر `lib/dal/backup.js`
