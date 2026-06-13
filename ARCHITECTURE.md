# ARCHITECTURE.md — التصميم المعماري للنظام

## 1. Overview

**Project:** school-news-ai — الجريدة المدرسية الذكية  
**Type:** SaaS Platform (single-tenant حالياً)  
**School:** ثانوية المجاهد خليل محمد المدعو يوسف - عين كرمس (تيارت)  
**Data Sources:** Facebook Graph API (غير فعال), Web Scraping (غير فعال), Manual Entry  
**Target Design:** Neo Vintage Newspaper — أبيض وأسود عالي التباين

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
│                   AI PIPELINE                              │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐    │
│  │Collector│→ │Analyzer │→ │ Writer  │→ │Publisher│    │
│  │(30min)  │  │(15min)  │  │(on pub) │  │(10min)  │    │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘    │
│         ↓            ↓                           ↓        │
│  ┌─────────┐  ┌─────────┐               ┌─────────┐      │
│  │ Archiver│  │Scheduler│               │   DB    │      │
│  │  (6hrs) │  │(cron)   │               │(JSON)   │      │
│  └─────────┘  └─────────┘               └─────────┘      │
├──────────────────────────────────────────────────────────┤
│                     DATABASE LAYER                         │
│     JSON files (9 tables) + SQLite (unused)               │
│     Custom JsonDB class with in-memory cache (20s TTL)    │
└──────────────────────────────────────────────────────────┘
```

## 3. Data Flow

### 3.1 Collection Flow
```
External Sources → Collector → raw_data (JSON) → pending status
     ↓                  ↓
  Demo Data         Facebook API (disabled)
  (active)          Ministry Scraper (disabled)
                    Manual Entry (working)
```

### 3.2 Analysis Flow
```
raw_data (pending) → Analyzer → processed_content
     │                   │
     │   1. Duplicate Detection (bigram similarity > 75%)
     │   2. Classification (keyword-based: news/activity/announcement)
     │   3. Fact Check (source trust + date validation + content quality)
     │   4. Urgency Detection (keyword counting)
     │   5. Overall Score (weighted: 25% class + 35% fact + 25% source + 15% urgency)
     │
     └──→ ai_decision_log (full audit trail)
```

### 3.3 Publishing Flow
```
processed_content (draft/review) → Publisher
     │
     │   1. Quality Check (title length, body length, source, similarity)
     │   2. Auto-publish check (score >= 0.8, no emergency stop, quota OK)
     │   3. Manual review if score < 0.8
     │   4. Archive on publish/reject
     │
     └──→ Public pages + Archive
```

## 4. Database Schema (JSON)

| Table | File | Key Fields |
|-------|------|------------|
| sources | `data/sources.json` | id, name, url, type, is_active, trust_score |
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

- **JSON DB:** Not safe for concurrent writes (multiple cron jobs)
- **Demo Data:** No real external data sources connected
- **Rule-based AI:** Not actual machine learning
- **Single-tenant:** One school only
- **No tests:** Zero test coverage
- **Hardcoded credentials:** In source code

## 8. Deployment

```
Local Dev:  Windows + Node.js + npm start
Production:  HostingGuru.io (Linux)
Deploy:     GitHub push → auto-deploy
URL:        https://school-news-ai-209c.apps.hostingguru.io/
```
