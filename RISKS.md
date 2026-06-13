# RISKS.md — تحليل المخاطر

## Technical Risks

| # | الخطر | التأثير | الاحتمالية | الإجراء |
|---|-------|---------|-----------|---------|
| 1 | JSON DB فساد مع الكتابة المتزامنة (Cron jobs) | فقدان بيانات كامل | عالية | الانتقال لـ SQLite فوراً (Phase 1) |
| 2 | `_nextId()` تستخدم spread operator | Stack overflow مع >125K سجل | متوسطة | استبدال بـ reduce/loop |
| 3 | لا Cache invalidation دقيق | عرض بيانات قديمة | متوسطة | تحسين TTL + manual refresh |
| 4 | File upload: لا scan للفيروسات | مخاطر أمنية | منخفضة | إضافة virus scanning |
| 5 | لا Backup آلي | فقدان البيانات عند crash | عالية | Daily backup script لحظة بلحظة |

## Security Risks

| # | الخطر | التأثير | الاحتمالية | الإجراء |
|---|-------|---------|-----------|---------|
| 1 | **Hardcoded admin credentials** (`zoheir/admin2026`) | اختراق كامل للنظام | عالية جداً | JWT + bcrypt + env vars (Phase 1) |
| 2 | **لا CSRF protection** | هجمات CSRF على Admin | عالية | إضافة csurf (Phase 1) |
| 3 | **لا Rate Limiting** | API معرضة للإساءة / DDoS | عالية | إضافة express-rate-limit (Phase 1) |
| 4 | **Reverse Tabnabbing** | الروابط الخارجية تفتح بدون `rel="noopener"` | متوسطة | إضافة `rel="noopener noreferrer"` |
| 5 | **HTTP (بدون SSL)** | تنصت على حركة البيانات | عالية | تفعيل HTTPS على HostingGuru |
| 6 | **لا Input Validation** | XSS/Harassment | متوسطة | إضافة Joi/Zod validation |
| 7 | **express.json({ limit: '50mb' })** | DoS عبر طلبات ضخمة | متوسطة | تقليل الحد إلى 10mb |
| 8 | **Auth token مخزن في localStorage** | XSS يسرق التوكن | متوسطة | HttpOnly cookies + CSRF |

## Scalability Risks

| # | الخطر | التأثير | الاحتمالية | الإجراء |
|---|-------|---------|-----------|---------|
| 1 | **JSON DB + Single process** | لا scaling أفقي | عالية | SQLite أولاً، ثم PostgreSQL |
| 2 | **No connection pooling** | أداء ضعيف مع عدة مستخدمين | متوسطة | Add pool to SQLite |
| 3 | **Vanilla JS frontend** | صيانة صعبة مع 10+ صفحات | متوسطة | Component-based (React/Vue) في Phase 5 |
| 4 | **Single server deployment** | Single point of failure | عالية | Multi-region في Phase 6 |
| 5 | **No CDN** | تأخير في تحميل الصور | متوسطة | CDN (Cloudflare) |

## Technical Debt

| # | العنصر | التفاصيل | الجهد المطلوب |
|---|--------|---------|--------------|
| 1 | Hardcoded credentials | `username === 'zoheir' && password === 'admin2026'` | ساعة واحدة |
| 2 | JSON DB + spread operator | `Math.max(...arr.map(r => r.id))` | 30 دقيقة |
| 3 | No middleware structure | All logic in `routes/admin.js` | 3 ساعات |
| 4 | Demo data in production | `modules/collector.js` يحتوي DEMO_DATA فقط | 4 ساعات |
| 5 | No error boundaries | Frontend uses `catch(e) { /* silent */ }` | ساعتان |
| 6 | Duplicate CSS | بعض الأنماط مكررة في style.css | ساعة واحدة |
| 7 | No testing | صفر unit/integration tests | عدة أيام |
| 8 | Inline scripts in HTML | JS مبعثر في HTML بدلاً من ملفات منفصلة | 3 ساعات |

## Summary Risk Score

| الفئة | Score | Trend |
|-------|-------|-------|
| Technical | **8/10** 🔴 | Rising (JSON DB is ticking time bomb) |
| Security | **9/10** 🔴 | Critical (hardcoded creds + no CSRF) |
| Scalability | **6/10** 🟡 | Manageable for single school |
| Technical Debt | **7/10** 🟡 | Growing |
| **Overall** | **7.5/10** 🔴 | **Requires immediate action** |
