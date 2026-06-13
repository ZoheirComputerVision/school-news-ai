# NEXT_SESSION.md — تعليمات الجلسة القادمة

## ✅ Sprint 1A Complete — Security Hardening

### المنجز:
- [x] نقل credentials إلى `.env` عبر `dotenv`
- [x] bcrypt password hashing (10 rounds)
- [x] JWT authentication middleware مع صلاحية 24h
- [x] Rate limiting (3 tiers: auth 10/15min, admin 100/15min, api 200/15min)
- [x] CSRF protection عبر `X-CSRF-Token` header
- [x] Input validation للمحتوى اليدوي
- [x] إصلاح `_nextId()` — استبدال spread بـ reduce
- [x] إضافة `rel="noopener noreferrer"` لجميع الروابط الخارجية
- [x] تحديث `helmet` مع `referrerPolicy`

---

## المهمة التالية: Sprint 1B — Data Layer Refactor

### الأولوية: 🔴 عالية

### الوصف:
إعادة هيكلة طبقة البيانات لتكون قابلة للهجرة إلى SQLite. إنشاء طبقة تجريد (abstraction layer) تسمح بالتبديل بين JSON و SQLite بسلاسة، مع إضافة backup آلي.

### الملفات المستهدفة:
| الملف | التعديل المطلوب |
|-------|-----------------|
| `lib/database-sqlite.js` | إنشاء طبقة SQLite جديدة |
| `database.js` | إضافة واجهة موحدة (adapter pattern) |
| `config.js` | إضافة خيار نوع قاعدة البيانات |
| `server.js` | تمرير adapter حسب الإعدادات |

### خطوات التنفيذ المقترحة:
1. إنشاء `lib/database-adapter.js` — واجهة موحدة (interface)
2. إنشاء `lib/database-sqlite.js` — تنفيذ SQLite باستخدام `better-sqlite3`
3. تعديل `database.js` — تحويله إلى adapter مع fallback للـ JSON
4. إضافة backup تلقائي (cron daily + manual)
5. إضافة أداة هجرة (migration tool)
6. اختبار الأداء والمقارنة
7. Commit + Push

### ملاحظات:
- `better-sqlite3` ليس مثبتاً بعد (يحتاج Python build tools على Windows)
- البديل: `sql.js` (pure JS SQLite, لا يحتاج build tools)
- إبقاء JSON DB كـ fallback للتوافقية
- لا تبدأ Sprint 1C قبل اكتمال Sprint 1B
