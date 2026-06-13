# CHANGELOG.md — سجل التغييرات

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
