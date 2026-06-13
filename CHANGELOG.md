# CHANGELOG.md — سجل التغييرات

## [1.1.0] — 2026-06-13 — Sprint 1A: Security Hardening

### Added
- **`.env`** — متغيرات البيئة لبيانات الدخول (تم إزالة الـ hardcoded credentials)
- **`middleware/auth.js`** — JWT authentication middleware مع صلاحية 24 ساعة
- **`middleware/validate.js`** — Rate limiting (3 مستويات) + CSRF protection + Input validation
- **إضافة تبعيات أمنية**: `dotenv`, `bcryptjs`, `jsonwebtoken`, `express-rate-limit`

### Changed
- **`config.js`** — تحميل الإعدادات من `.env` عبر `dotenv` (JWT_SECRET, ADMIN_USERNAME, ADMIN_PASSWORD)
- **`server.js`** — تطبيق rate limiter على `/api`, تقليل `express.json()` حد إلى 10mb, إضافة `referrerPolicy`
- **`routes/admin.js`** — استبدال hardcoded auth بـ JWT + bcrypt + middleware أمني
- **`public/js/api.js`** — إرسال `Authorization: Bearer` و `X-CSRF-Token` في طلبات الإدارة
- **`database.js`** — استبدال `Math.max(...arr.map(...))` بـ `arr.reduce()` (إصلاح `_nextId()`)
- **جميع ملفات HTML (8 صفحات)** — إضافة `rel="noopener noreferrer"` للروابط الخارجية

### Fixed
- 🔴 **Severity: Critical** — Hardcoded admin credentials removed, replaced with bcrypt + JWT
- 🔴 **Severity: High** — `_nextId()` spread operator risk (stack overflow with >125K records)
- 🟡 **Severity: Medium** — Reverse Tabnabbing (external links now have `rel="noopener noreferrer"`)
- 🟡 **Severity: Medium** — Rate limiting added to prevent API abuse
- 🟡 **Severity: Medium** — Express JSON body limit reduced from 50mb to 10mb (DoS protection)
- 🔴 CSRF protection implemented via custom header validation

### Security Improvements
- Admin credentials moved from source code to `.env`
- Password hashing via bcrypt (10 rounds)
- JWT tokens with 24h expiry
- 3-tier rate limiting: auth (10/15min), admin (100/15min), api (200/15min)
- CSRF token validation via `X-CSRF-Token` header
- Input validation for manual content submission
- `helmet` enhanced with `referrerPolicy`
- `console.log` removed from sensitive error paths

## [1.0.0] — 2026-06-13 — Session: Structural Analysis

### Added
- **ARCHITECTURE.md** — التصميم المعماري الكامل للنظام
- **ROADMAP.md** — خارطة طريق من 6 مراحل
- **CHANGELOG.md** — هذا الملف
- **NEXT_SESSION.md** — تعليمات الجلسة القادمة
- **RISKS.md** — تحليل المخاطر الكامل
- SESSION SUMMARY — تقرير الجلسة النهائي
- التوثيق الكامل للمشروع في ARCHITECTURE.md

### Changed
- **PROJECT_MAP.md** — تحديث شامل لجميع الأقسام والمكونات
- **admin/dashboard.html** — إصلاح #1: عرض الأخطاء داخل المودال + تحقق حجم الصورة + تعطيل الزر
- **routes/admin.js** — إصلاح #2: حفظ الصور كملفات في `public/uploads/` بدلاً من Base64
- **database.js** — إصلاح #3: إزالة try-catch من `_save()` و `_saveNow()` لتصريف الأخطاء
- **public/js/api.js** — إصلاح #4: إضافة `_fetch()` مع AbortController (مهلة 30 ثانية)
- **.gitignore** — إضافة `public/uploads/`

### Fixed
- Image upload now saves as files instead of Base64 (prevents server crash on large JSON)
- Error messages now display inside the modal (not hidden behind it)
- Save button disabled during processing (prevents double submit)
- Request timeout set to 30 seconds (AbortController)
- Database errors now propagate to user (no silent swallowing)
- Image size validation (max 5MB) on client side

### Known Issues
- 🔴 Manual content add with image — save button not working (fixes applied locally, pending deploy)
- JSON DB not safe for concurrent writes (SQLite available but unused)
- Hardcoded admin credentials (`zoheir/admin2026`)
- No CSRF protection
- No rate limiting
- `_nextId()` uses spread operator — risk of stack overflow with >125K records

## [0.9.0] — 2026-06-06 — Session: Image Upload Fixes

### Added
- `public/uploads/` directory for image file storage
- Session close report tracking

### Changed
- **admin/dashboard.html** — Added edit modal + delete functionality
- **admin/review.html** — Content review with filter tabs
- **admin/logs.html** — AI decision log viewer

### Fixed
- Image preview in manual entry modal
- Error handling in modal forms

## [0.8.0] — Previous

### Added
- رابط التسجيل في شهادة البكالوريا bac.onec.dz إلى القائمة المنسدلة
- قاعدة النشر المباشر في AGENTS.md
