# NEXT_SESSION.md — تعليمات الجلسة القادمة

## المهمة التالية: بدء Phase 1 — الإصلاحات العاجلة

### الأولوية: 🔴 حرجة

### الملفات المستهدفة:
| الملف | التعديل المطلوب |
|-------|-----------------|
| `database.js` | هجرة JSON DB → SQLite (الجداول موجودة مسبقاً) |
| `config.js` | إضافة متغيرات البيئة (DB, JWT_SECRET, etc.) |
| `routes/admin.js` | استبدال auth بـ JWT + bcrypt + middleware |
| `server.js` | إضافة rate limiting + CSRF middleware |
| `package.json` | إضافة تبعيات: `better-sqlite3`, `jsonwebtoken`, `bcryptjs`, `express-rate-limit`, `csurf` |
| `modules/analyzer.js` | إصلاح `_nextId()` — استبدال spread بحلقة reduce |
| `admin/dashboard.html` | اختبار رفع الصور بعد النشر |
| جميع ملفات HTML | إضافة `rel="noopener noreferrer"` للروابط الخارجية |

### تقدير الجهد: 3 أيام (جلسات متعددة)

### خطوات التنفيذ:
1. تثبيت الحزم الجديدة: `npm install better-sqlite3 jsonwebtoken bcryptjs express-rate-limit csurf`
2. إنشاء `lib/database-sqlite.js` — طبقة SQLite جديدة
3. تعديل `database.js` لاستخدام SQLite مع fallback للـ JSON
4. إنشاء `middleware/auth.js` — JWT verification
5. إنشاء `middleware/validate.js` — Rate limiting + CSRF
6. تعديل `routes/admin.js` لاستخدام middleware الجديد
7. إضافة `.env` support عبر `dotenv`
8. اختبار على localhost
9. Commit + Push للنشر

### ملاحظات:
- لا تبدأ أي تطوير جديد قبل الإنتهاء من Phase 1
- جميع الإصلاحات الأمنية أولوية قصوى
- اختبار رفع الصور بعد النشر مباشرة
