# LitHelper — Build Progress Log

> Updated after each phase. Check `plans.md` for the full architecture.

## Status: Complete - All 11 Phases Done

---

## Phase 1: Foundation
**Status**: Complete
**Started**: 2026-02-17

### Completed
- [x] Created plans.md and process.md tracking files
- [x] Backend scaffold: FastAPI app, config, database, Paper model
- [x] OpenAlex client service (search_works, get_work, get_work_citations, batch_get_works, search_authors, get_author_works, cache_works)
- [x] Search endpoint: GET /api/search/works with local caching
- [x] Frontend scaffold: Vite + React 18 + TypeScript + Tailwind CSS
- [x] Frontend search UI: SearchBar, SearchResults, SearchResultCard, AppShell with sidebar nav
- [x] Zustand store for search state
- [x] API client layer with Axios
- [x] React Router with all placeholder pages
- [x] Dev script (scripts/dev.sh) for concurrent backend + frontend

### Notes
- Python 3.9.6 on system — used `typing.Optional` instead of `X | None` syntax, added `eval-type-backport`
- bibtexparser capped at <2.0 (2.0 requires Python 3.10+)
- Vite proxy configured to forward /api/* to backend on port 8711
- Frontend uses `verbatimModuleSyntax` — must use `import type` for type-only imports

---

## Phase 2: Paper Detail + Citation Graph
**Status**: Complete

### Completed
- [x] Paper detail endpoint: GET /api/papers/{id}
- [x] References endpoint: GET /api/papers/{id}/references (batch fetch from referenced_work_ids)
- [x] Citations endpoint: GET /api/papers/{id}/citations (cites: filter on OpenAlex)
- [x] Citation graph builder service (BFS traversal, configurable depth/direction, 500-node cap, concurrent batch fetch)
- [x] Graph endpoints: POST /api/graph/build, POST /api/graph/expand
- [x] Graph schemas: GraphNode, GraphEdge, GraphData, GraphBuildRequest, GraphExpandRequest
- [x] Frontend: CitationGraph component (react-force-graph-2d, DAG layout, year-based coloring, citation-based sizing)
- [x] Frontend: GraphControls (depth, direction, max nodes selectors)
- [x] Frontend: PaperDetail panel (abstract reconstruction from inverted index, topics, DOI link, explore button)
- [x] Frontend: GraphPage with split layout (graph + detail panel)
- [x] Frontend: useGraphStore (Zustand) for graph state
- [x] Frontend: API clients for papers and citations
- [x] Search results now have "Explore" button → loads graph and navigates to /graph
- [x] Abstract reconstructor utility
- [x] Graph color/size helper utilities
- [x] Build passes clean (tsc + vite)

### Backend routes active
`/api/health`, `/api/search/works`, `/api/papers/{id}`, `/api/papers/{id}/references`, `/api/papers/{id}/citations`, `/api/graph/build`, `/api/graph/expand`

---

## Phase 3: Date-Citation Scatter + Dual View
**Status**: Complete

### Completed
- [x] DateCitationPlot component using Recharts ScatterChart (X=year, Y=citations log-scale, color by seed vs discovered)
- [x] View toggle in GraphPage: Graph | Scatter | Split (with linked selections)
- [x] Build passes clean

---

## Phase 4: Collections
**Status**: Complete

### Completed
- [x] Collection + CollectionPaper SQLAlchemy models (with relationships, cascade delete)
- [x] Collection schemas (CollectionCreate, CollectionUpdate, CollectionPaperAdd, CollectionSummary, CollectionDetail, CollectionPaperInfo)
- [x] Full CRUD router: list, create, get, update, delete collections + add/remove papers
- [x] Router registered in main.py
- [x] Frontend API client (collections.ts) — all endpoints including update
- [x] Zustand store (useCollectionStore) — fetchCollections, createCollection, loadCollection, deleteCollection, addPaper, removePaper
- [x] CollectionsPage with collection sidebar, create dialog, detail view with paper list
- [x] AddToCollectionDropdown shared component — dropdown with collection list, inline create, checkmark feedback
- [x] "Save" button added to SearchResultCard and PaperDetail for saving papers to collections
- [x] App.tsx routing updated for /collections
- [x] Build passes clean

### Backend routes active
`/api/collections` (GET, POST), `/api/collections/{id}` (GET, PUT, DELETE), `/api/collections/{id}/papers` (POST), `/api/collections/{id}/papers/{openalex_id}` (DELETE)

## Phase 5: Multi-Seed Discovery
**Status**: Complete

### Completed
- [x] Discovery schemas (DiscoveryRequest, DiscoveryResult, DiscoveryResponse)
- [x] Discovery service: co-citation analysis (fetch citers of seeds, aggregate their references, rank by overlap)
- [x] Discovery service: bibliographic coupling (collect seed references, find papers sharing those refs)
- [x] Discovery router: POST /api/discovery/multi-seed with strategy selection
- [x] Router registered in main.py
- [x] Frontend API client (discovery.ts)
- [x] Zustand store (useDiscoveryStore) — seeds, results, strategy, addSeed/removeSeed/runDiscovery
- [x] DiscoveryPage with seed paper chips, inline search to add seeds, strategy selector, discovery results with scores
- [x] App.tsx routing updated for /discovery
- [x] Build passes clean

### Backend routes active
`/api/discovery/multi-seed` (POST)

## Phase 6: Search Trails
**Status**: Complete

### Completed
- [x] SearchTrail + SearchTrailStep SQLAlchemy models (with relationships, step ordering)
- [x] Trail schemas (TrailCreate, TrailSummary, TrailDetail, TrailStepOut, TrailAddStep)
- [x] Trail router: CRUD for trails + add step endpoint
- [x] Router registered in main.py, model imported for table creation
- [x] Frontend API client (trails.ts)
- [x] Zustand store (useTrailStore) — start/stop recording, load/delete trails, record steps, back/forward navigation
- [x] TrailBreadcrumbs component in AppShell top bar (back/forward nav, step indicators)
- [x] TrailsPage with recording controls, active trail detail, saved trail history
- [x] Auto-recording integrated into SearchPage (records search queries and citation explores)
- [x] App.tsx routing updated for /trails
- [x] Build passes clean

### Backend routes active
`/api/trails` (GET, POST), `/api/trails/{id}` (GET, DELETE), `/api/trails/{id}/steps` (POST)

## Phase 7: Author Tracking
**Status**: Complete

### Completed
- [x] TrackedAuthor SQLAlchemy model
- [x] Author schemas (AuthorSearchResult, AuthorSearchResponse, TrackedAuthorOut, TrackAuthorRequest, AuthorWorksResponse)
- [x] Author router: search authors, get author works, list/track/untrack authors
- [x] New publication detection via last_known_work_date comparison
- [x] Router + model registered in main.py
- [x] Frontend API client (authors.ts)
- [x] AuthorsPage with author search, tracked list, works view, new publication highlighting
- [x] App.tsx routing updated for /authors
- [x] Build passes clean

### Backend routes active
`/api/authors/search` (GET), `/api/authors/{id}/works` (GET), `/api/authors/tracked` (GET, POST), `/api/authors/tracked/{id}` (DELETE)

## Phase 8: Monitored Searches
**Status**: Complete

### Completed
- [x] MonitoredSearch + MonitoredSearchResult SQLAlchemy models
- [x] Monitor schemas (MonitorCreate, MonitorSummary, MonitorDetail, MonitorResultOut)
- [x] Monitor router: list, create, get, delete monitors + force check + mark read
- [x] Force-check discovers new papers by comparing known results to OpenAlex search
- [x] Router + model registered in main.py
- [x] Frontend API client (monitors.ts)
- [x] MonitorsPage with create dialog (name, query, interval), monitor list with unread badges, detail view with check-now button and result list
- [x] App.tsx routing updated for /monitors, removed unused PlaceholderPage import
- [x] Build passes clean

### Backend routes active
`/api/monitors` (GET, POST), `/api/monitors/{id}` (GET, DELETE), `/api/monitors/{id}/check` (POST), `/api/monitors/{id}/results/{rid}/read` (POST)

## Phase 9: Import/Export + Zotero Integration
**Status**: Complete

### Completed
- [x] Import/export service: BibTeX export (bibtexparser), RIS export (rispy), parse BibTeX/RIS for resolution
- [x] Import/export router: POST /api/export (BibTeX/RIS), POST /api/import (file upload with OpenAlex resolution)
- [x] ZoteroConfig + ZoteroPaperMapping SQLAlchemy models
- [x] Zotero service: pyzotero wrapper for collections, items, create, add-to-collection
- [x] Zotero router: config CRUD, list Zotero collections, pull (Zotero → LitHelper), push (LitHelper → Zotero)
- [x] DOI/title-based resolution via OpenAlex for both import and Zotero pull
- [x] Router + model registered in main.py
- [x] Frontend API clients (importExport.ts, zotero.ts)
- [x] SettingsPage with Zotero connection, pull/push sync, BibTeX/RIS import, collection export
- [x] Settings link added to sidebar
- [x] App.tsx routing updated for /settings
- [x] Build passes clean

### Backend routes active
`/api/export` (POST), `/api/import` (POST), `/api/zotero/config` (GET, POST, DELETE), `/api/zotero/collections` (GET), `/api/zotero/pull` (POST), `/api/zotero/push` (POST)

## Phase 10: Sharing + Electron Packaging
**Status**: Complete

### Completed
- [x] Sharing service: JSON bundle export/import with full paper data
- [x] Sharing router: GET /api/sharing/export/{id}, POST /api/sharing/import
- [x] Router registered in main.py
- [x] Frontend API client (sharing.ts)
- [x] Share section added to SettingsPage (export bundle, import from friend)
- [x] Electron shell: main.js (window creation, IPC for file dialogs)
- [x] Electron preload.js (context bridge for native dialogs)
- [x] Electron backend-manager.js (spawn/health-check/kill FastAPI)
- [x] Electron package.json with electron-builder config (dmg, nsis, AppImage)
- [x] Build script: scripts/build-all.sh (PyInstaller + Vite + electron-builder)
- [x] Build passes clean

### Backend routes active
`/api/sharing/export/{id}` (GET), `/api/sharing/import` (POST)

## Phase 11: Polish
**Status**: Complete

### Completed
- [x] Dark mode: CSS variables for dark theme, manual toggle (system/light/dark) with localStorage persistence
- [x] Theme store (useThemeStore) with cycle through system → light → dark
- [x] Dark mode toggle button in sidebar footer (Sun/Moon/Monitor icons)
- [x] Keyboard shortcuts: Cmd+K (search), Cmd+[ (back), Cmd+] (forward), Cmd+1-8 (nav sections)
- [x] Removed unused PlaceholderPage
- [x] Final build passes clean (TypeScript + Vite)
