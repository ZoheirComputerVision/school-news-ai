# Phase 3A — Multi-Tenant SaaS Foundation

## Overview
تحويل بنية المنصة من نطاق جهوي واحد (الصوت المحلي — تيارت) إلى **بنية متعددة المنصات (Multi-Tenant SaaS)** تدعم 6 ولايات بنفس قاعدة الشيفرة.

## Architecture

```
                    ┌─────────────────────────────────────┐
                    │        middleware/tenant.js          │
                    │  URL rewrite + tenant resolution     │
                    │  slug → req.tenant (or default)      │
                    └────────────┬────────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   TenantRegistry        │
                    │   ConfigManager         │
                    └────────────┬────────────┘
                                 │ tenant_id
         ┌───────────────────────┼───────────────────────┐
         ▼                       ▼                       ▼
  ┌────────────┐         ┌──────────────┐        ┌──────────────┐
  │ Public API │         │ Admin API    │        │  SaaS Admin  │
  │ (filtered) │         │ (filtered)   │        │  UI          │
  └────────────┘         └──────────────┘        └──────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 ▼
                    ┌─────────────────────────┐
                    │  Database (JSON/SQLite) │
                    │  All tables have        │
                    │  tenant_id column       │
                    └─────────────────────────┘
```

## New Files

### `modules/tenant/` — Core Modules

| File | Purpose | Key Exports |
|------|---------|-------------|
| `tenant-registry.js` | Tenant CRUD, 6 default tenants, stats | `TenantRegistry` class (getAll, getById, getBySlug, create, update, activate, deactivate, getStats, seedDefaults) |
| `config-manager.js` | Per-tenant configuration (14 keys) | `TenantConfigManager` class (getAll, get, set, setBulk, getKeys) |
| `migrate.js` | Verify tables exist + migrate existing data | `ensureTenantTables()`, `migrateExistingData()` |

### `middleware/tenant.js`

| Method | Description |
|--------|-------------|
| `tenantMiddleware` | Resolves tenant from URL path slug (e.g., `/oran/article/123`), `x-tenant-id` header, or defaults to `tiaret`. Rewrites URL by removing slug prefix. |
| `requireTenant` | Ensures `req.tenant` is set |

### `routes/tenants.js` — 10 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/tenants` | List all tenants |
| GET | `/api/tenants/active` | List active tenants |
| GET | `/api/tenants/stats` | Stats (total, active, inactive, by_region) |
| GET | `/api/tenants/:id` | Get tenant by ID |
| POST | `/api/tenants/create` | Create new tenant |
| PUT | `/api/tenants/update/:id` | Update tenant |
| POST | `/api/tenants/activate/:id` | Activate tenant |
| POST | `/api/tenants/deactivate/:id` | Deactivate tenant |
| GET | `/api/tenants/:id/config` | Get tenant configuration |
| PUT | `/api/tenants/:id/config` | Update tenant configuration |

### `admin/saas-control-center.html` — SaaS Control Center

- **Summary Cards**: Total tenants, active, inactive, geographic regions
- **Tab Navigation**: Tenants, New Tenant, Stats
- **Tenants Table**: ID, name, slug, region, status badge, created date, actions (config gear, activate/deactivate)
- **New Tenant Form**: Name, slug, region
- **Stats Tab**: Region distribution table
- **Config Modal**: Title, slogan, phone, email, address, social links (Facebook, Twitter, Instagram, YouTube), primary/secondary colors

## Database Changes

### New Tables

```json
// tenants — ID, SLUG, NAME, REGION, STATUS (active/inactive), CREATED_AT
// tenant_config — ID, TENANT_ID, CONFIG_KEY, CONFIG_VALUE
```

### Modified Tables (tenant_id added)

| Table | Field | Source |
|-------|-------|--------|
| `processed_content` | `tenant_id` | موجودة مسبقاً ← 11 مقالة لمنصة تيارت |
| `editorial_items` | `tenant_id` | تضاف عند إنشاء عناصر تحريرية جديدة |
| `advertisers` | `tenant_id` | تضاف عند إنشاء معلنين جدد |
| `campaigns` | `tenant_id` | تضاف عند إنشاء حملات إعلانية جديدة |

### Default Tenants

| ID | Slug | Name | Region |
|----|------|------|--------|
| 1 | `tiaret` | تيارت | ولاية تيارت |
| 2 | `oran` | وهران | ولاية وهران |
| 3 | `setif` | سطيف | ولاية سطيف |
| 4 | `algiers` | الجزائر العاصمة | ولاية الجزائر |
| 5 | `mostaganem` | مستغانم | ولاية مستغانم |
| 6 | `chlef` | الشلف | ولاية الشلف |

## Modified Files

| File | Changes |
|------|---------|
| `lib/dal/json-adapter.js` | Added `tenants` and `tenant_config` tables to init() |
| `server.js` | Mounted tenant middleware globally, mounted `/api/tenants` routes, added `ensureTenantTables()` + `migrateExistingData()` to startup |
| `routes/api.js` | Added `tenant_id` filtering to all endpoints (content, section, archive-data, search, homepage, recent, latest-news) |
| `routes/admin.js` | Added `tenant_id` filtering to admin content list + `tenant_id` on manual content creation |
| `routes/editorial.js` | Pass `tenantId` to review queue and governance methods |
| `routes/ads.js` | Added `tenant_id` filtering on campaigns, advertisers, zones, stats + `tenant_id` on create |
| `modules/editorial/review-queue.js` | `add()` accepts `tenantId`, all getters filter by `tenantId`, `getStats()` filters by `tenantId` |
| `modules/editorial/governance.js` | `getSummary()` and `getAllItems()` accept optional `tenantId` |
| `modules/editorial/homepage-selector.js` | Constructor accepts `tenantId`, all methods filter via `_filter()` |
| `modules/ads/ad-inventory.js` | All methods accept optional `tenantId` for campaign filtering |
| `modules/ads/campaign-manager.js` | `create()` stores `tenant_id`, `getAll()`/`getActive()`/`getStats()` filter by `tenantId` |

## Migration Strategy

1. **Create tenants table** → `ensureTenantTables()` seeds 6 default tenants
2. **Seed defaults** → `tenant-registry.js` `seedDefaults()` inserts if fewer than 6 exist
3. **Migrate existing data** → `migrateExistingData()`:
   - Finds the `tiaret` tenant by slug
   - Updates all `processed_content` records without `tenant_id` → `tiaret`'s ID
   - Same for `editorial_items`, `advertisers`, `campaigns`
4. **Zero downtime** — all changes are backward-compatible:
   - Queries check `!item.tenant_id || item.tenant_id === currentTenantId`
   - Existing URLs without tenant slug default to `tiaret`

## Security Model

| Threat | Mitigation |
|--------|-----------|
| Tenant A accesses Tenant B's content | Every route filters by `req.tenant.id`; data without `tenant_id` is treated as default tenant |
| Tenant A sees Tenant B's campaigns | `getActiveAds()`, `getCampaigns()`, `getAdvertisers()` filter by `tenantId` |
| Tenant A reads Tenant B's editorial queue | `getPending()`, `getApproved()`, `getRejected()` accept `tenantId` |
| Missing tenant header | Defaults to `tiaret` — safe fallback |
| Inactive tenant | Returns 503 with Arabic error message |

## Tenant URL Examples

| URL | Tenant | Action |
|-----|--------|--------|
| `/article/123` | تيارت (default) | Reads article, filtered by tenant_id=1 |
| `/tiaret/article/123` | تيارت | Same, explicit tenant slug |
| `/oran/article/456` | وهران | Reads article, filtered by tenant_id=2 |
| `/setif/section/news` | سطيف | Section page, filtered by tenant_id=3 |
| `x-tenant-id: algiers` + `/api/content` | الجزائر العاصمة | API call filtered by tenant_id=4 |

## Tenant Configuration Keys

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `title` | string | الصوت المحلي | عنوان المنصة |
| `slogan` | string | عين كرمس - تيارت | شعار المنصة |
| `contact_phone` | string | '' | رقم الهاتف |
| `contact_email` | string | '' | البريد الإلكتروني |
| `address` | string | '' | العنوان |
| `facebook_url` | string | '' | رابط فيسبوك |
| `twitter_url` | string | '' | رابط تويتر |
| `instagram_url` | string | '' | رابط إنستغرام |
| `youtube_url` | string | '' | رابط يوتيوب |
| `homepage_hero_count` | string | 3 | عدد مقالات البطل |
| `homepage_latest_count` | string | 12 | عدد آخر الأخبار |
| `primary_color` | string | #1a3a5c | اللون الأساسي |
| `secondary_color` | string | #c8a951 | اللون الثانوي |

## Verification

Server starts with:
```
✓ Tenant JSON tables ready
✓ Migrated 11 articles to tenant tiaret
✓ Data migration complete
```

Tested endpoints:
- `GET /api/tenants` → 6 tenants returned
- `GET /api/tenants/stats` → total: 6, active: 6, by_region: 6 regions
- `GET /api/tenants/tiaret...` → single tenant by slug
- `GET /api/content` → 11 articles filtered by default tenant
- `POST /api/tenants/create` → creates new tenant
- `POST /api/tenants/activate/:id` / `deactivate/:id` → status toggle
- All existing `/api/content`, `/api/section`, `/api/homepage`, `/api/editorial`, `/api/ads` endpoints still work

## Design Constraints

- **DESIGN_GOVERNANCE.md unchanged**: No logo, typography, colors, editorial workflow modifications
- **Existing URLs work without changes** — default tenant is used when no slug is present
- **Dual adapter support** — JSON adapter persists `tenants` and `tenant_config` tables
- **No custom domains** — foundation only (Phase 3B planned)
- **No tenant billing** — foundation only (Phase 3B planned)
- **No per-tenant JWT** — shared admin credentials for now (Phase 3B planned)
