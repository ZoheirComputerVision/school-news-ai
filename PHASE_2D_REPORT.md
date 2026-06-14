# Phase 2D — Advertising & Revenue Layer

## Overview
نظام إعلانات متكامل للصوت المحلي — إدارة الحملات الإعلانية، المعلنين، المناطق الإعلانية، تتبع مرات الظهور والنقرات، لوحة تحكم الإعلانات، والتقارير.

## Architecture

```
Client (admin UI)
        │
        ▼
  ┌──────────────────────────┐
  │   HTTP API (/api/ads)    │  ← routes/ads.js (12 endpoints)
  └─────────┬────────────────┘
            │
     ┌──────┼────────┐
     ▼      ▼        ▼
 ┌──────┐ ┌──────┐ ┌──────┐
 │Inventory│Campaign│Tracker│
 │        │Manager │       │
 └───────┘ └──────┘ └──────┘
  modules/ads/

     │        │        │
     ▼        ▼        ▼
  ┌────────────────────────┐
  │   JSON / SQLite Adapters │
  │   (advertisers,         │
  │    campaigns, ad_events)│
  └────────────────────────┘

Client (homepage)
        │
        ▼
  GET /api/ads/zone/:zoneId
        │
        ▼
  Render in hp-ad-1 / hp-ad-2
  (auto-hide via CSS if no ad)
```

## New Files

### `modules/ads/` — Core Modules

| File | Purpose | Key Exports |
|------|---------|-------------|
| `ad-inventory.js` | 6 zone definitions, getActiveAds/getAdsForZone/getAdPayload with random selection | `AdInventory` class |
| `campaign-manager.js` | Campaign CRUD with status transitions (draft→active→paused→completed), stats by zone/status | `CampaignManager` class |
| `tracker.js` | Impression/click event logging, daily/weekly/monthly reports, top campaigns, CTR calculation | `AdTracker` class |
| `migrate.js` | Verifies advertisers/campaigns/ad_events tables exist on startup | `ensureAdTables()` |

### `routes/ads.js` — 12 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/ads/campaigns` | List all campaigns (?limit=) |
| GET | `/api/ads/campaigns/:id` | Get campaign by ID |
| GET | `/api/ads/zones` | List all ad zones |
| GET | `/api/ads/zone/:zoneId` | Get active ad payload for a zone (random selection) |
| GET | `/api/ads/advertisers` | List all advertisers |
| POST | `/api/ads/advertisers` | Create new advertiser |
| POST | `/api/ads/create` | Create new campaign |
| PUT | `/api/ads/update/:id` | Update campaign |
| POST | `/api/ads/pause/:id` | Pause campaign |
| POST | `/api/ads/activate/:id` | Activate campaign |
| DELETE | `/api/ads/delete/:id` | Delete campaign |
| GET | `/api/ads/stats` | Full stats (total/active/impressions/clicks/CTR, by zone, by status, daily/weekly/monthly) |
| POST | `/api/ads/track/impression/:id` | Track impression event (client-side beacon) |
| POST | `/api/ads/track/click/:id` | Track click event (client-side beacon) |
| GET | `/api/ads/reports/daily` | Daily report (?date=) |
| GET | `/api/ads/reports/weekly` | Weekly report |
| GET | `/api/ads/reports/monthly` | Monthly report |

### `admin/ads-center.html` — Advertising Dashboard

- **Summary Cards**: Total campaigns, active campaigns, impressions, clicks, CTR
- **Tab Navigation**: Campaigns, Advertisers, Zones, Reports, New Campaign
- **Campaigns Table**: ID, title, advertiser, zone, status (badge), impressions, clicks, dates, actions
- **Advertisers Table**: ID, company, contact, email, phone
- **Zones Table**: Zone ID, name, dimensions, type, active campaigns count
- **Reports Tab**: Daily/weekly/monthly impression counts + top 5 campaigns table
- **New Campaign Form**: Title, description, advertiser select, zone select, date range, image URL, link URL, budget
- **Advertiser Modal**: Company name, contact, email, phone, website, notes
- **Inline Actions**: Activate (draft), pause (active), delete (not completed)
- **Auto-Refresh**: All data reloads on tab switch and after actions

## Ad Zones

| Zone ID | Name | Dimensions | Type |
|---------|------|-----------|------|
| `homepage-top` | أعلى الصفحة الرئيسية | 728×90 | banner |
| `homepage-middle` | وسط الصفحة الرئيسية | 728×90 | banner |
| `homepage-bottom` | أسفل الصفحة الرئيسية | 728×90 | banner |
| `article-sidebar` | جانب المقال | 300×250 | sidebar |
| `article-inline` | داخل المقال | 468×60 | inline |
| `archive-page` | صفحة الأرشيف | 728×90 | banner |

## Database Changes

Three new tables (JSON adapter auto-creates files):

```json
// advertisers — COMPANY_NAME, CONTACT_NAME, EMAIL, PHONE, WEBSITE, NOTES, CREATED_AT
// campaigns — ADVERTISER_ID, TITLE, DESCRIPTION, START_DATE, END_DATE,
//             TARGET_ZONE, IMAGE_URL, LINK_URL, IMPRESSIONS, CLICKS,
//             BUDGET, STATUS (draft/active/paused/completed), CREATED_AT, UPDATED_AT
// ad_events — CAMPAIGN_ID, EVENT_TYPE (impression/click), TIMESTAMP
```

## Homepage Ad Integration

- `public/js/newspaper.js`: `renderAds()` method fetches ads for `homepage-top`, `homepage-middle`, `homepage-bottom` zones via `/api/ads/zone/:zoneId`
- Ad sections (`hp-ad-1`, `hp-ad-2`) are hidden by default via CSS (`hp-ad-section { display:none }`)
- When an active ad exists, section is set to `display:block` and ad content rendered
- Impression beacon sent on ad display; click beacon sent on ad click
- Homepage-selector.js returns empty ads array when no active campaigns — CSS handles visibility

## Campaign Status Flow

```
draft ──▶ active ──▶ paused ──▶ completed
  │                    │
  └────────────────────┘
```

## Verification

Server starts with `✓ Advertising JSON tables ready`:
- `GET /api/ads/zones` → returns 6 zone definitions
- `GET /api/ads/stats` → returns full stats object with 0 values (empty state)
- `POST /api/ads/advertisers` → creates advertiser, returns new record
- `POST /api/ads/create` → creates draft campaign
- `POST /api/ads/activate/:id` → activates campaign
- `GET /api/ads/zone/:zoneId` → returns ad payload when active campaign exists
- `POST /api/ads/track/impression/:id` → increments impressions
- `POST /api/ads/track/click/:id` → increments clicks
- `GET /api/ads/reports/daily` → returns report with tracked events
- Homepage renders ads in hp-ad-1 and hp-ad-2 when active campaigns target homepage zones

## Design Constraints

- **DESIGN_GOVERNANCE.md unchanged**: No layout/color/typography modifications
- **Ad zones auto-hide**: When no active campaigns, sections remain `display:none`
- **Dual adapter support**: Both SQLite and JSON storage work with the new tables
- **No payment processing**: Focus on inventory, campaigns, tracking, and reporting infrastructure
