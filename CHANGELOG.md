# CHANGELOG.md — سجل التغييرات

## [2.2.0] — 2026-06-14 — Phase 2A.2: Design Governance Freeze

### Added
- **`DESIGN_GOVERNANCE.md`** — دستور التصميم الملزم لمنصة الصوت المحلي
  - Brand identity: اسم المنصة، الشعار، المدرسة، الفريق
  - Typography: Tajawal (UI), Noto Naskh Arabic (تحريري), Noto Kufi Arabic (عناوين)
  - Color system: أزرق ملكي (`#1a3a5c`)، أزرق غامق (`#0f2440`)، ذهبي (`#c8a951`)
  - UI rules: زوايا دائرية 8px، ظلال، مسافات، تنقل
  - Editorial rules: 12 قسماً، تخطيط الجريدة، أرشيف، إعلانات
  - Restrictions: قائمة بالممنوع والمسموح في المراحل المستقبلية
  - Governance process: آلية طلب تغيير التصميم

### Changed
- **`ARCHITECTURE.md`** — تحديث ليعكس الهوية الجديدة ويربط بـ DESIGN_GOVERNANCE.md
- **`PROJECT_MAP.md`** — تحديث كامل: version v2.1.0، 12 قسماً، milestones جديدة، pending items محدثة

### Frozen (Design Lock)
- ❌ لا يُستبدل نظام الخطوط (Tajawal / Noto Naskh Arabic / Noto Kufi Arabic)
- ❌ لا يُستبدل نظام الألوان (كحلي/ذهبي/كريمي)
- ❌ لا يُستبدل هيكل التنقل (شريط ثابت مع قوائم منسدلة)
- ❌ لا يُستبدل تخطيط الجريدة (ماستهيد، 3 أعمدة، قصة مميزة)
- ❌ لا تُستبدل تجربة الأرشيف (خط زمني عمودي + إحصائيات)

## [2.1.0] — 2026-06-14 — Phase 2B: Real Content Acquisition Layer

### Added
- **`lib/scraper/`** — إطار جمع محتوى متكامل من 4 أنظمة
  - `fetcher.js` — عميل HTTP مع إعادة محاولة (retry) ومهلة زمنية
  - `parser.js` — استخراج نصوص وميتا من HTML باستخدام cheerio
  - `facebook.js` — جمع من Facebook Graph API v21.0 مع fallback تجريبي
  - `rss.js` — تحليل RSS/Atom feeds باستخدام rss-parser
  - `website.js` — جمع محتوى من أي موقع ويب
  - `index.js` — ScraperFactory يختار الجالب المناسب حسب نوع المصدر
- **`modules/dedup.js`** — محرك كشف التكرار بـ 3 طرق
  - تجزئة محتوى (MD5 hash) للكشف الدقيق
  - رابط URL لكشف المنشورات المكررة
  - تشابه العناوين (bigram/Jaccard similarity) للكشف التقريبي (>80%)
- **`modules/normalizer.js`** — خط أنابيب تطبيع المحتوى
  - تنظيف HTML وإزالة العناصر غير المرغوب فيها
  - استخراج الملخص التلقائي
  - استدلال التصنيف من النص (أخبار، نشاطات، إعلانات)
  - توحيد تنسيق التاريخ
- **`modules/scorer.js`** — نظام تسجيل الثقة للمصادر
  - درجة الثقة (trust score) من الإعدادات
  - درجة الحداثة (freshness score) حسب تاريخ آخر جمع
  - معدل النجاح (success rate) من سجلات التشغيل
  - درجة مركبة (composite score) مرجحة
- **`modules/monitor.js`** — لوحة مراقبة الجمع
  - تسجيل كل عملية جمع مع التفاصيل (source, items, duration, status)
  - إحصائيات (ناجح/فاشل/مكرر) في آخر 7 أيام
  - ملخص المصادر حسب النوع والحالة
  - نقاط نهاية API: `/admin/collector/status`, `/admin/collector/logs`, `/admin/sources/health`
- **`config.js`** — إضافة `FACEBOOK_ACCESS_TOKEN`, `FACEBOOK_PAGE_ID` (من `.env`)

### Changed
- **`modules/collector.js`** — إعادة هيكلة كاملة
  - يستخدم ScraperFactory لاختيار الجالب حسب نوع المصدر
  - يطبق التطبيع (ContentNormalizer) قبل التخزين
  - يمر عبر محرك التكرار (DedupEngine) لكل عنصر
  - يسجل عمليات الجمع في CollectorMonitor
  - يحدث درجات الثقة للمصادر بعد كل عملية
  - **API متوافق بالكامل** — `collectAll()`, `collectFacebook()`, `collectMinistry()`, `collectManual()` كلها تعمل
- **`routes/admin.js`** — إضافة 3 نقاط نهاية للمراقبة:
  - `GET /admin/collector/status` — إحصائيات + ملخص + آخر الجولات + أفضل المصادر
  - `GET /admin/collector/logs` — سجل مفصل مع `limit` و `days`
  - `GET /admin/sources/health` — حالة كل مصدر مع درجاته
- **`package.json`** — إضافة `axios`, `cheerio`, `rss-parser`

### Architecture
```
lib/scraper/
  ├── index.js      ← ScraperFactory
  ├── fetcher.js    ← HTTP client (retry, timeout)
  ├── parser.js     ← HTML → metadata + article
  ├── facebook.js   ← Facebook Graph API collector
  ├── rss.js        ← RSS/Atom feed collector
  └── website.js    ← Generic website scraper

modules/
  ├── collector.js  ← Orchestrator (updated)
  ├── dedup.js      ← Duplicate detection (hash/URL/title)
  ├── normalizer.js ← Content normalization pipeline
  ├── scorer.js     ← Source scoring system
  └── monitor.js    ← Collector run logging & stats
```

### Notes
- Facebook Graph API يتطلب `FACEBOOK_ACCESS_TOKEN` في `.env` — بدونه يستخدم بيانات تجريبية
- جميع الجالبين الجدد لديهم fallback آمن إذا تعذر الاتصال بالمصدر
- JSON adapter يبقى الافتراضي؛ SQLite متاح عبر `DB_TYPE=sqlite`

## [2.0.0] — 2026-06-14 — Phase 2A: Local Voice Rebranding & Neo Vintage UI

### Added
- **هوية جديدة "الصوت المحلي"** — إعادة تسمية النظام من "الجريدة الذكية" إلى "الصوت المحلي"
- **`public/css/newspaper.css`** — نظام تصميم Neo Vintage كامل (2300+ سطر)
  - تصميم جريدة ورقية قديمة (ألوان عالية التباين، خطوط تقليدية، زخارف)
  - قالب متعدد الأعمدة (3 أعمدة سطح المكتب، 2 جهاز لوحي، 1 جوال)
  - لوحة رئيسية (Masthead) بخط عريض بلون عنابي
  - أشرطة زخرفية ونقوش فاصلة
  - مساحات إعلانية جاهزة
  - دعم الطباعة (Print styles)
- **`public/js/newspaper.js`** — محرك عرض جديد للواجهة
  - عرض المقال المميز (Featured Story) بقالب بطولي
  - شبكة تحريرية بثلاثة أعمدة مع تحجيم ديناميكي
  - تنقل بين 12 قسماً تحريرياً
  - بحث فوري
  - تحميل إحصاءات وأرشيف زمني
- **`public/index.html`** — صفحة رئيسية جديدة كلياً
  - شعار "الصوت المحلي" بتصميم جريدة
  - قصة مميزة (Hero Section)
  - شبكة تحريرية (3 أعمدة)
  - أرشيف زمني
  - مساحات إعلانية (جاهزة للتعبئة)
  - قائمة تنقل بـ 12 قسماً + خدمات رقمية
- **`public/section.html`** — صفحة أقسام للأقسام التحريرية الثمانية الجديدة (رياضة، ثقافة، علوم، أدب، رأي، توجيه، طلبة، تربية)
- **`config.js` — `VOICE_NAME`** — متغير الهوية الجديدة

### Changed
- **إعادة تصميم جميع صفحات HTML (8 صفحات)** — تحديث العلامة التجارية والتصميم
  - `index.html` — صفحة رئيسية جديدة
  - `article.html` — عرض المقال بتصميم Neo Vintage
  - `news.html`, `activities.html`, `announcements.html` — صفحات الأقسام
  - `timeline.html` — الأرشيف الزمني
  - `archive.html` — إحصائيات وأرشيف
  - `section.html` — صفحة أقسام جديدة (رياضة، ثقافة، علوم، أدب، رأي، توجيه، طلبة، تربية)
- **`server.js`** — تحديث شعار بدء التشغيل إلى "🎙️ الصوت المحلي"
- **`public/js/api.js`** — يبقى دون تغيير (الحفاظ على التوافقية)

### Design System (Neo Vintage Newspaper)
- **الألوان**: أبيض/أسود عالي التباين مع عنابي (#6B1D2A) وذهبي (#B8943C)
- **الخطوط**: Amiri (للنص)، Noto Kufi Arabic (للعناوين)، Tajawal (للعناصر)
- **الشبكة**: CSS Grid 3 أعمدة، 2 للجهاز اللوحي، 1 للجوال
- **المكونات**: Masthead، Top Bar، Featured Story، Editorial Grid، Timeline، Ad Slots، Stats Bar
- **الزخارف**: قواعد مزدوجة، نقوش، خطوط فاصلة مزخرفة
- **المساحات الإعلانية**: 3 أحجام (كامل، جانبي، بانر) - جاهزة للتعبئة

## [1.3.0] — 2026-06-14 — Sprint 1C: SQLite Migration + Cutover

### Added
- **إعدادات DB_TYPE** — `config.js` يدعم `DB_TYPE=sqlite` عبر `.env` للتبديل بين JSON و SQLite
- **`database.js` — `switchAdapter(dbType)`** — تبديل ديناميكي بين الـ adapters في زمن التشغيل
- **`lib/dal/index.js` — `switchAdapter()` + `getFallbackAdapter()`** — دعم التبديل مع fallback

### Changed
- **`lib/dal/sqlite-adapter.js`** — إضافة `_getTableSchema()` لتصفية الحقول غير الموجودة في الجدول، تحديث `create()` و `update()` لاستخدام schema-aware filtering
- **`lib/dal/migration.js`** — إصلاح اتصال SqliteAdapter: `close()` بعد الانتهاء، معالجة settings عبر key بدلاً من id (لدعم UNIQUE constraint)
- **`database.js`** — تحويل كل الـ properties إلى getters (Adapter, Repos, Articles, Settings, etc.) لدعم التبديل الديناميكي
- **`config.js`** — إضافة `DB_TYPE` (قراءة من `process.env.DB_TYPE`، default: `json`)

### Fixed
- 🔴 **Severity: High** — SqliteAdapter.create() يفشل مع حقول `updated_at` غير الموجودة في schema (تم إضافة `_getTableSchema()` لتصفية الحقول)
- 🔴 **Severity: High** — هجرة settings يفشل بسبب UNIQUE constraint على `key` (تم تعديل migration لاستخدام key-based upsert)
- 🟡 **Severity: Medium** — `verifyMigration()` يغلق الاتصال قبل إنهاء count queries (تم نقل `close()` بعد الحلقة)
- 🟡 **Severity: Medium** — `getMigrationStatus()` يغلق الاتصال قبل إنهاء الاستعلامات (تم نقل `close()` بعد الحلقة)

### Migration Stats
- **Total records migrated**: 62/62 (0 errors)
- **Tables**: 9/9 consistent (sources:3, raw_data:18, processed_content:11, media:0, archive:2, ai_decision_log:22, admin_actions:0, settings:5, views:1)
- **Verification**: ✅ Consistent (JSON count = SQLite count for all tables)
- **Integrity**: ✅ Spot-check passed (titles, statuses, hashes, settings values match)

### Performance (SQLite vs JSON)
- SQLite is 10-100x slower per query on this dataset size (<100 records) due to prepared statement overhead
- JSON remains the default adapter; SQLite available via `DB_TYPE=sqlite` in `.env`
- Real benefits of SQLite (concurrency, transactions, JOINs) expected with larger datasets

## [1.2.0] — 2026-06-14 — Sprint 1B: Data Layer Refactor

### Added
- **`lib/dal/`** — Data Access Layer architecture
  - `adapter.js` — قاعدة موحدة (interface) لجميع الـ adapters
  - `json-adapter.js` — JsonAdapter (مستخرج من database.js القديم)
  - `sqlite-adapter.js` — SqliteAdapter مع 9 جداول + indexes (جاهز لـ Sprint 1C)
  - `backup.js` — خدمة نسخ احتياطي تلقائي قبل كل عملية كتابة
  - `migration.js` — أدوات هجرة JSON → SQLite + تحقق
  - `index.js` — نقطة الدخول الموحدة للـ DAL
- **`lib/repositories/`** — طبقة الـ Repositories
  - `base-repository.js` — CRUD موحد
  - `article-repository.js` — عمليات المقالات (نشر، بحث، إحصائيات، سجلات، مشاهدات)
  - `settings-repository.js` — إعدادات النظام (get/set/getAll/getBool/getInt)
  - `archive-repository.js` — الأرشفة (أرشفة، ترميم، تصدير، خط زمني)
  - `index.js` — createRepositories() factory

### Changed
- **`database.js`** — إعادة هيكلة كاملة: أصبح Facade يستخدم DAL داخلياً
  - يحافظ على التوافقية العكسية (كل دوال `db.query`, `db.get`, إلخ ما زالت تعمل)
  - يصدّر `db.adapter`, `db.repos`, `db.articles`, `db.settings`, `db.archive`
- **`routes/api.js`** — يستخدم `articles` و `archiveRepo` بدلاً من `db.query()` المباشر
- **`routes/admin.js`** — يستخدم `articles`, `settingsRepo`, `archiveRepo`
- **`modules/publisher.js`** — يستخدم ArticleRepository + SettingsRepository + ArchiveRepository
- **`modules/scheduler.js`** — يستخدم repositories
- **`modules/seed.js`** — يستخدم ArticleRepository + ArchiveRepository
- **`modules/archiver.js`** — غلاف رفيع حول ArchiveRepository
- **`modules/analyzer.js`** — يستخدم ArticleRepository
- **`modules/writer.js`** — يستخدم ArticleRepository
- **`modules/collector.js`** — يستخدم repositories للمصادر والبيانات الخام
- **`package.json`** — إضافة `better-sqlite3`

### Architecture
```
database.js (Facade)
  └─ lib/dal/ (DAL)
       ├─ index.js          ← initialize(dbType)
       ├─ adapter.js        ← interface
       ├─ json-adapter.js   ← active
       ├─ sqlite-adapter.js ← ready (Sprint 1C)
       ├─ backup.js         ← auto backup on write
       └─ migration.js      ← JSON → SQLite
  └─ lib/repositories/
       ├─ base-repository.js
       ├─ article-repository.js
       ├─ settings-repository.js
       └─ archive-repository.js
```

### Security
- Backup تلقائي قبل كل عملية كتابة (create/update/delete/upsert)
- النسخ في `data/backups/YYYY-MM-DD/` مع تنظيف آلي بعد 7 أيام

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
