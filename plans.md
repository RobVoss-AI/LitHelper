# LitHelper — Master Plan

> **IMPORTANT**: Read this file before any context compacting. It contains the full architecture and phase breakdown for the project.

## Context

LitHelper is a personal desktop literature discovery app that converges the best features of Research Rabbit and Litmaps. Built with Python (FastAPI) backend, React (TypeScript/Vite) frontend, Electron desktop shell, powered by the free OpenAlex API (250M+ works). Includes Zotero two-way sync.

## Tech Stack

| Layer | Choice |
|-------|--------|
| Backend | Python + FastAPI + SQLAlchemy 2.0 + SQLite |
| HTTP Client | httpx (async) |
| Data Source | OpenAlex API (free, no key needed) |
| Frontend | React 18 + TypeScript + Vite |
| State | Zustand (UI) + React Query (server) |
| Citation Graph | react-force-graph-2d |
| Scatter Plot | Recharts |
| UI Components | Tailwind CSS + shadcn/ui |
| Desktop Shell | Electron |
| Zotero Sync | pyzotero |
| Packaging | PyInstaller (backend) + electron-builder (app) |

## Project Structure

```
LitHelper/
├── plans.md                        # This file
├── process.md                      # Running progress log
├── backend/
│   ├── pyproject.toml
│   ├── alembic/                    # DB migrations
│   └── app/
│       ├── main.py                 # FastAPI app + CORS + /api/health
│       ├── config.py               # Settings (DB path, email, port)
│       ├── database.py             # Async SQLAlchemy engine
│       ├── models/                 # Paper, Collection, TrackedAuthor, MonitoredSearch, SearchTrail, ZoteroSync
│       ├── schemas/                # Pydantic request/response models
│       ├── services/
│       │   ├── openalex.py         # OpenAlex API client
│       │   ├── citation_graph.py   # Graph builder (BFS to depth N)
│       │   ├── discovery.py        # Multi-seed co-citation + bibliographic coupling
│       │   ├── collection_service.py
│       │   ├── author_service.py
│       │   ├── monitor_service.py  # APScheduler periodic checks
│       │   ├── trail_service.py
│       │   ├── import_export.py    # BibTeX/RIS
│       │   ├── zotero_service.py   # Zotero two-way sync
│       │   └── sharing.py          # JSON bundle export/import
│       ├── routers/                # One router per domain
│       └── utils/
├── frontend/
│   ├── package.json
│   └── src/
│       ├── api/                    # Typed API client modules
│       ├── stores/                 # Zustand stores
│       ├── components/
│       │   ├── layout/             # AppShell, Sidebar, TopBar
│       │   ├── search/             # SearchBar, SearchResults, Filters
│       │   ├── paper/              # PaperDetail, PaperMeta, PaperActions
│       │   ├── graph/              # CitationGraph, GraphControls
│       │   ├── scatter/            # DateCitationPlot
│       │   ├── discovery/          # MultiSeedPanel, DiscoveryResults
│       │   ├── collections/        # CollectionList, CollectionView
│       │   ├── authors/            # AuthorProfile, AuthorTimeline
│       │   ├── monitors/           # MonitorList, MonitorDetail
│       │   ├── trails/             # TrailBreadcrumbs, TrailHistory
│       │   ├── zotero/             # ZoteroSync, ZoteroSettings
│       │   └── shared/             # PaperCard, LoadingSpinner, FileDropZone
│       ├── pages/
│       ├── hooks/
│       └── utils/
├── electron/
│   ├── main.js
│   ├── preload.js
│   └── backend-manager.js
└── scripts/
    ├── dev.sh
    └── build-all.sh
```

## Database Schema

- **papers** — Cached OpenAlex work data (openalex_id PK, title, year, citations, authorships JSON, referenced_work_ids JSON, fetched_at)
- **collections** + **collection_papers** — Named collections with paper membership and notes
- **tracked_authors** — Followed authors with last_known_work_date
- **monitored_searches** + **monitored_search_results** — Saved queries with periodic checking
- **search_trails** + **search_trail_steps** — Exploration history with step type and payload
- **zotero_sync** + **zotero_item_map** — Zotero connection config + paper-to-item-key mapping

## Key Architecture Decisions

1. **Local paper cache**: Papers cached in SQLite for instant re-display and offline access
2. **Denormalized JSON columns** for authorships, topics, locations (display-only data)
3. **Abstract reconstruction on frontend** from OpenAlex inverted index format
4. **Electron spawns FastAPI** on port 8711, polls /api/health before showing window

## Implementation Phases

### Phase 1: Foundation
Backend scaffold (FastAPI + SQLite + Paper model) + OpenAlex client (search_works, get_work) + search endpoint + React scaffold (Vite + Tailwind + shadcn/ui) + SearchBar + SearchResults.
**Milestone**: Type a query -> see results from OpenAlex.

### Phase 2: Paper Detail + Citation Graph
Paper detail/references/citations endpoints + citation graph builder (BFS, batch fetch, 500-node cap) + PaperDetail panel + CitationGraph (react-force-graph-2d, DAG layout) + graph controls.
**Milestone**: Search -> click paper -> see citation network -> expand nodes.

### Phase 3: Date-Citation Scatter + Dual View
Recharts ScatterChart (year vs citations log-scale) + view toggle (Graph | Scatter | Split) + linked selections.
**Milestone**: Toggle between graph and Litmaps-style scatter.

### Phase 4: Collections
Collection + CollectionPaper models + CRUD + sidebar list + "Add to Collection" on papers + CollectionView with graph/scatter.
**Milestone**: Save papers to collections, manage them.

### Phase 5: Multi-Seed Discovery
Co-citation analysis + bibliographic coupling + discovery endpoint + DiscoveryPage (seed chips, strategy selector, ranked results).
**Milestone**: Add seed papers -> discover overlooked work.

### Phase 6: Search Trails
SearchTrail models + auto-recording hook + TrailBreadcrumbs (back/forward) + TrailHistory sidebar.
**Milestone**: Navigate back through exploration path.

### Phase 7: Author Tracking
TrackedAuthor model + author profile/works endpoints + AuthorProfile page + publication timeline + new publication detection.
**Milestone**: Track author -> see new publications.

### Phase 8: Monitored Searches
MonitoredSearch models + APScheduler checks + MonitorList with unread badges.
**Milestone**: Save search -> see new papers over time.

### Phase 9: Import/Export + Zotero
BibTeX/RIS parsing + export + FileDropZone + Zotero two-way sync (pyzotero) with settings UI.
**Milestone**: Connect Zotero -> pull/push collections; import/export .bib files.

### Phase 10: Sharing + Electron Packaging
JSON bundle sharing + Electron integration (main.js, backend-manager.js) + production build pipeline.
**Milestone**: Double-click LitHelper.app -> fully working.

### Phase 11: Polish
Error handling, loading states, keyboard shortcuts, dark mode, tests, performance verification.
