# Phase 2C — Editorial Intelligence Layer

## Overview
القشرة الذكية التحريرية — AI-assisted editorial pipeline with human-in-the-loop governance. Implements a complete editorial workflow: classification → fact-validation → AI writing → review queue → governance audit.

## Architecture

```
Raw Data (scraped content)
        │
        ▼
  ┌─────────────────┐
  │   Classifier    │  ← modules/editorial/classifier.js
  │   (9 categories)│
  └────────┬────────┘
           │ category, confidence
           ▼
  ┌─────────────────┐
  │  Fact Validator │  ← modules/editorial/fact-validator.js
  │ (0-100 score)   │
  └────────┬────────┘
           │ confidence_score
           ▼
  ┌─────────────────┐
  │   AI Writer     │  ← modules/editorial/ai-writer.js
  │ (headline,body) │
  └────────┬────────┘
           │ headline, summary, article, tags
           ▼
  ┌─────────────────┐
  │  Review Queue   │  ← modules/editorial/review-queue.js
  │ (pending queue) │
  └────────┬────────┘
           │ approve/reject
           ▼
  ┌─────────────────┐
  │   Governance    │  ← modules/editorial/governance.js
  │ (audit trail)   │
  └─────────────────┘
```

## New Files

### `modules/editorial/` — Core Modules

| File | Purpose | Key Exports |
|------|---------|-------------|
| `classifier.js` | 9-category Arabic classifier (regional-news, education, sports, etc.) | `classify(content)` → `{category, confidence, reasoning}` |
| `fact-validator.js` | Validates content against source metadata, returns 0-100 confidence | `validate(content, sourceInfo)` → `{confidence_score, validation_notes}` |
| `ai-writer.js` | Generates SEO-optimized Arabic articles from classified content | `generate(content, classification)` → `{headline, summary, article, tags}` |
| `review-queue.js` | CRUD for editorial_items with status transitions & audit logging | `add()`, `approve()`, `reject()`, `getPending()`, `getApproved()`, `getRejected()` |
| `governance.js` | Read-only audit trail access with summary aggregations | `getSummary()`, `getAllItems()`, `getItemDecisionChain()` |
| `migrate.js` | Ensures editorial database tables exist on startup | `ensureEditorialTables()` (SQLite + JSON) |

### `routes/editorial.js` — API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/editorial/pending` | List pending items (default 20, ?limit=) |
| GET | `/api/editorial/approved` | List approved items |
| GET | `/api/editorial/rejected` | List rejected items |
| GET | `/api/editorial/items` | All items for governance center |
| GET | `/api/editorial/governance/summary` | Aggregated stats (by category, confidence, action, status) |
| GET | `/api/editorial/governance/chain/:itemId` | Full decision chain for a specific item |
| POST | `/api/editorial/approve/:id` | Approve an item (requires `actor` in body) |
| POST | `/api/editorial/reject/:id` | Reject an item (requires `reason` + `actor`) |
| POST | `/api/editorial/process/:rawDataId` | Process single raw data through pipeline |
| POST | `/api/editorial/process-all` | Process up to 5 pending raw data items |

### `admin/editorial-center.html` — AI Governance Center

- **Summary Cards**: Total items, pending/approved/rejected/published counts
- **Confidence Distribution**: Low/Medium/High breakdown with progress bars
- **Filterable Items Table**: Columns for ID, category, confidence, headline, status, actions
- **Approve/Reject Actions**: Inline buttons with reason prompt for rejection
- **Quick Process**: Button to process pending raw data
- **Auto-Refresh**: 30-second polling interval

## Database Changes

Two new tables (SQLite schema shown; JSON adapter auto-creates files):

```sql
CREATE TABLE IF NOT EXISTS editorial_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_id INTEGER,
  raw_content_id INTEGER,
  category TEXT DEFAULT 'uncategorized',
  confidence_score REAL DEFAULT 0,
  headline TEXT DEFAULT '',
  summary TEXT DEFAULT '',
  article TEXT DEFAULT '',
  tags TEXT DEFAULT '',
  status TEXT DEFAULT 'pending',        -- pending → approved/rejected → published
  rejection_reason TEXT DEFAULT '',
  published_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS editorial_audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  editorial_item_id INTEGER,
  action TEXT DEFAULT '',               -- created, approved, rejected, published
  actor TEXT DEFAULT 'system',
  details TEXT DEFAULT '{}',            -- JSON with context (reason, previous status, etc.)
  timestamp TEXT DEFAULT (datetime('now'))
);
```

## Governance Features

- **Full Audit Trail**: Every action (create, approve, reject, publish) logged with actor and context
- **Immutability**: Audit logs are append-only; no delete operation exposed through governance API
- **Decision Chain**: Complete lifecycle view per editorial item (from creation through publication)
- **Summary Aggregation**:
  - `by_category`: Count per category
  - `by_confidence`: Low (0-40), Medium (41-70), High (71-100)
  - `by_action`: Count per action type
  - `status_breakdown`: pending, approved, rejected, published counts

## Migration Details

- `lib/dal/json-adapter.js` updated to pre-load `editorial_items` and `editorial_audit` tables in `init()`
- `server.js` updated to:
  - Mount editorial routes at `/api/editorial`
  - Call `ensureEditorialTables()` on startup
- `data/` will auto-create `editorial_items.json` and `editorial_audit.json` on first write

## Verification

All 10 API endpoints tested and return 200:
- `/api/editorial/pending` → `{"items":[],"total":0,"status":"pending"}`
- `/api/editorial/approved` → `{"items":[],"total":0,"status":"approved"}`
- `/api/editorial/governance/summary` → full stats object
- `/api/editorial/governance/chain/1` → item + decisions array
- `POST /api/editorial/process/1` → processes raw data through full pipeline
- `POST /api/editorial/approve/1` → transitions item to approved

End-to-end flow verified: raw data → classify → validate → write → pending → approve → audit log.

## Design Constraints

- **No automatic publication**: Human must explicitly approve before any item is published
- **DESIGN_GOVERNANCE.md unchanged**: No layout/color/typography modifications
- **Existing pipeline preserved**: New editorial tables coexist with `processed_content`
- **Dual adapter support**: Both SQLite and JSON storage work with the new tables
- **Batch limit**: `/process-all` caps at 5 items per call to prevent timeout
