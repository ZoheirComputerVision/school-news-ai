# ARCHITECTURE.md — التصميم المعماري للنظام

## 1. Overview

- **Project:** school-news-ai — الصوت المحلي
- **Type:** SaaS Platform (single-tenant حالياً)
- **School:** ثانوية المجاهد خليل محمد المدعو يوسف - عين كرمس (تيارت)
- **Data Sources:** Facebook Graph API, RSS/Atom, Web Scraping, Manual Entry
- **Design Identity:** الصوت المحلي — أزرق ملكي وذهبي
- **Design Governance:** [`DESIGN_GOVERNANCE.md`](./DESIGN_GOVERNANCE.md) — وثيقة مُلزمة لجميع التطوير المستقبلي

## 2. System Layers

```
┌──────────────────────────────────────────────────────────┐
│                     PUBLIC FRONTEND                       │
│          HTML5 + CSS3 + Vanilla JS (SPA-like)             │
│          8 pages: index, news, activities,                │
│    announcements, article, media, archive, timeline        │
├──────────────────────────────────────────────────────────┤
│                     ADMIN PANEL                            │
│     dashboard, review, logs, settings (4 HTML pages)      │
├──────────────────────────────────────────────────────────┤
│                     API LAYER                              │
│          Express Router: /api, /api/admin                  │
│    Content CRUD, Search, Stats, Timeline, View Tracking    │
 ├──────────────────────────────────────────────────────────┤
│                   AI PIPELINE (PHASE 2C)                    │
│  ┌──────────┐  ┌──────────────┐  ┌──────────┐            │
│  │Collector │→ │ Editorial    │→ │  Writer  │→ Publisher │
│  │(per src) │  │ Classifier   │  │(SEO gen) │  (workflow)│
│  └────┬─────┘  │(9 categories)│  └────┬─────┘  └──────────┘
│       ↓        │confidence    │       ↓                    │
│  ┌──────────┐  └──────┬───────┘  ┌──────────┐            │
│  │  Source  │         ↓          │Governance│             │
│  │ Registry │  ┌──────────────┐  │Dashboard │             │
│  │ (SQLite) │  │Fact Validator│  │(HTML)    │             │
│  └──────────┘  │(source rep)  │  └──────────┘            │
│  ┌──────────┐  │(cross-source)│                            │
│  │ Archiver │  └──────┬───────┘                            │
│  │  (6hrs)  │         ↓                                   │
│  └──────────┘  ┌──────────┐    ┌──────────┐               │
│                │Publisher │    │Scheduler │               │
│                │+ Queue   │←───│(cron)    │               │
│                │+ Review  │    └──────────┘               │
│                │+ Quota   │    ┌──────────┐               │
│                └──────────┘    │   DB    │               │
│                                │(JSON)   │               │
│                                └──────────┘               │
├──────────────────────────────────────────────────────────┤
│                     DATABASE LAYER                         │
│     JSON files (9 tables) + SQLite (Schema v2 with         │
│     Source Registry: region, municipality, category,        │
│     reliability_score, sync_frequency, last_sync)          │
└──────────────────────────────────────────────────────────┘
```

## 3. Data Flow

### 3.1 Collection Flow
```
Source Registry (SQLite) → Collector
     ↓
  For each active source:
    1. ScraperFactory.create(source) → dispatches by type
       ├── FacebookCollector → Graph API / demo fallback
       ├── RssCollector      → RSS/Atom feed
       └── WebsiteCollector  → HTTP + cheerio parse
    2. ContentNormalizer.normalize(raw, source)
       → cleaned body, summary, date, category inference
    3. DedupEngine.isDuplicate({hash, url, title})
       → skip if duplicate (hash/URL/similarity > 80%)
    4. rawDataRepo.create({source_id, raw_text, content_hash, status:'pending'})
    5. SourceScorer.updateSourceScore(source)
    6. CollectorMonitor.logRun({status, items, duration})
    7. SourceRegistry.markSync(source.id, success)
```

### 3.2 Analysis Flow (Phase 2C — Editorial Intelligence)
```
raw_data (pending) → EditorialClassifier + FactValidator → processed_content
     │                              │
     │   1. Duplicate Detection (bigram similarity > 75%)
     │   2. Editorial Classification (9 categories via keyword/context):
     │      Event | National | Regional News | Society | Culture
     │      Sports | Development | Faces & Stories | Advertisements
     │      Confidence scoring with margin-of-victory weighting
     │   3. Fact Validation:
     │      - Source reputation from Source Registry (reliability_score)
     │      - Cross-source duplicate comparison
     │      - Date validation, content quality, named entity detection
     │   4. Urgency Detection (keyword counting)
     │   5. Overall Score (weighted: 20% class + 30% fact + 25% source + 15% urgency + 10% passed)
     │
     └──→ ai_decision_log (full audit trail with per-category scores)
```

### 3.3 Publishing Flow (Phase 2C — Review Workflow + Queue)
```
processed_content (draft/review) → EditorialPublisher
     │
     │   0. Priority Queue (sorted by importance × score × urgency × trust)
     │   1. Quality Check (title length, body length, source, similarity)
     │   2. Auto-publish check (score >= 0.8, fact >= 0.7, quota OK, no emergency)
     │   3. Manual review workflow: pending → in_review → approved/rejected
     │   4. Daily quota enforcement (MAX_PUBLISH_PER_DAY = 15)
     │   5. Archive on publish/reject
     │
     ├──→ Public pages + Archive
     └──→ ai_decision_log (full decision chain + governance trace)
```

### 3.4 Governance Flow
```
Each pipeline step writes to ai_decision_log:
     ┌─────────────┐     ┌──────────────┐     ┌─────────────┐
     │  Classifier │────→│ FactValidator │────→│   Writer    │
     │ (category,  │     │ (reputation, │     │ (SEO, tags, │
     │  confidence)│     │  cross-dup)  │     │  slug)      │
     └─────────────┘     └──────────────┘     └──────┬──────┘
                                                      ↓
     ┌─────────────┐     ┌──────────────┐     ┌─────────────┐
     │ Governance  │←────│  Publisher   │←────│    Queue    │
     │ Dashboard   │     │ (approve/    │     │ (priority   │
     │ (HTML+API)  │     │  reject/     │     │  ordering)  │
     └─────────────┘     │  auto)       │     └─────────────┘
                          └──────────────┘
```

## 4. Database Schema

### 4.1 SQLite Schema (sources table — extended)
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment |
| source_id | TEXT UNIQUE | Human-readable key (e.g. `fb-official`) |
| name | TEXT | Source name |
| url | TEXT | Source URL/feed URL |
| type | TEXT | `facebook`, `rss`, `web`, `manual` |
| region | TEXT | e.g. `تيارت`, `الجزائر` |
| municipality | TEXT | e.g. `عين كرمس` |
| category | TEXT | `social`, `official`, `news`, `education`, `internal` |
| status | TEXT | `active`, `paused`, `error`, `disabled` |
| reliability_score | REAL | 0.0 – 1.0 |
| sync_frequency | INTEGER | Sync interval in minutes |
| is_active | INTEGER | 1/0 |
| trust_score | REAL | Legacy score |
| last_scraped | TEXT | ISO timestamp |
| last_sync | TEXT | ISO timestamp |

### 4.2 Other Tables (JSON)
| Table | File | Key Fields |
|-------|------|------------|
| raw_data | `data/raw_data.json` | id, source_id, raw_text, content_hash, status |
| processed_content | `data/processed_content.json` | id, title, body, category, status, overall_score |
| media | `data/media.json` | id, content_id, url, type |
| archive | `data/archive.json` | id, content_id, original_data, archive_reason |
| ai_decision_log | `data/ai_decision_log.json` | id, content_id, decision_type, confidence |
| admin_actions | `data/admin_actions.json` | id, action, details |
| settings | `data/settings.json` | key, value |
| views | `data/views.json` | id, content_id, ip |

## 5. Security Architecture

| Layer | Current | Required |
|-------|---------|----------|
| Transport | None (HTTP) | HTTPS/SSL |
| API Auth | Hardcoded in route | JWT + bcrypt middleware |
| CSRF | None | CSRF token |
| Rate Limit | None | express-rate-limit |
| Headers | Helmet default | Custom CSP |
| Input Validation | Basic | Joi/Zod validation |
| File Upload | 5MB limit, file storage | Scan + resize |

## 6. Cron Schedule

| Task | Interval | Batch Size |
|------|----------|------------|
| collectAll | Every 30 min | Unlimited |
| runAnalyzer | Every 15 min | 5 items |
| runPublisher | Every 10 min | 3 items |
| runArchiveSync | Every 6 hours | Unlimited |
| resetDailyCount | Daily at midnight | — |

## 7. Key Limitations

- **JSON DB:** Not safe for concurrent writes — SQLite recommended for production (set `DB_TYPE=sqlite`)
- **Demo Fallback:** Real sources available but Facebook requires `FACEBOOK_ACCESS_TOKEN` in `.env`
- **Rule-based AI:** Classification is keyword-based (Phase 2C upgrade to 9 categories with confidence scoring)
- **Single-tenant:** One school only
- **No tests:** Zero test coverage
- **Source Registry:** Full metadata in SQLite `sources` table with region, municipality, category, reliability scoring

## 8. Deployment

```
Local Dev:  Windows + Node.js + npm start
Production:  HostingGuru.io (Linux)
Deploy:     GitHub push → auto-deploy
URL:        https://school-news-ai-209c.apps.hostingguru.io/
```
