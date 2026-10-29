# GEOMMAND System Audit & Current State Baseline
**Generated Date:** 29 October 2026  
**Document:** `docs/CURRENT_STATE.md`  
**Baseline Version:** 0.9.3-hardened  
**Environment:** Docker (`postgis/postgis:15-3.3` on host port `5435`, `python:3.12-slim`, `geoserver:2.24.1`, `adminer`)

---

## 1. Verified Architecture & Version Matrix (Source Truth)

Every dependency and runtime version listed below has been verified against physical manifests and container descriptors:

| Component | Documented Version | Actual File Truth | Manifest Source | Status |
|---|---|---|---|---|
| **Python** | 3.12 | `3.12` | `backend/Dockerfile:1` (`python:3.12-slim`) | Verified |
| **Django** | 6.0.4 | `django==6.0.4` | `backend/requirements.txt:1` | Verified |
| **DRF** | 3.16.1 | `djangorestframework==3.16.1` | `backend/requirements.txt:2` | Verified |
| **SimpleJWT** | 5.5.1 | `djangorestframework-simplejwt==5.5.1` | `backend/requirements.txt:10` | Verified |
| **django-axes** | 8.3.1 | `django-axes==8.3.1` | `backend/requirements.txt:11` | Verified (5-attempt lockout) |
| **pypdf** | 6.21.2 | `pypdf==6.21.2` | `backend/requirements.txt:12` | Installed in container; verifies PDF stream text |
| **ReportLab** | 4.4.10 | `reportlab==4.4.10` | `backend/requirements.txt:9` | Verified; powers Section 7 & Section 6 PDF generation |
| **PostgreSQL / PostGIS** | Postgres 15 / PostGIS 3.3 | `PostgreSQL 15.10 + PostGIS 3.3.4` | `docker-compose.yml:3` (`postgis/postgis:15-3.3`) | Verified via `PostGIS_Full_Version()` (Published on host port `5435:5432`) |
| **GeoServer** | 2.24.1 | `2.24.1` | `docker-compose.yml:33` (`geoserver:2.24.1`) | Verified |
| **Frontend Runtime** | React 19.2.5 | `react@^19.2.5`, `react-dom@^19.2.5` | `frontend/package.json:21-22` | Verified |
| **Frontend Router** | React Router 7.13 | `react-router-dom@^7.13.0` | `frontend/package.json:24` | Verified (Deep-linking, state preservation) |
| **Frontend Tooling** | Vite 8 + Tailwind 4 | `vite@^8.0.9`, `@tailwindcss/vite@^4.2.3` | `frontend/package.json:19,39` | Verified (1840 modules, 237 kB bundle) |
| **Mobile Runtime** | Flutter 3.29+ / Dart 3.8.1 | `sdk: ^3.8.1` | `field_officer_app/pubspec.yaml:22` | Verified (0 analyzer issues) |

---

## 2. Database Content Reality (`land_records`)

Verified by direct SQL queries on the active PostgreSQL 15 database container (`land_db`):

| Model / Table | Scope / Domain | Actual Database Rows / State | Source Reality |
|---|---|---|---|
| `core_state` | Administrative Hierarchy | **1 state record** | Tamil Nadu (State Code `TN` / Census `33`). |
| `core_district` | Administrative Hierarchy | **38 canonical districts** | Complete statewide coverage (Ariyalur to Virudhunagar) with LG codes. |
| `core_taluk` | Administrative Hierarchy | **315 taluks** | Canonical statewide taluk registry linked to parent districts. |
| `core_revenuevillage` | Administrative Hierarchy | **1,768 revenue villages** | Canonical village registry linked to parent taluks and districts. |
| `core_landparcel` | Cadastre | **39 parcels** | Linked via foreign keys (`district_ref`, `taluk_ref`, `village_ref`). **Forest:** 8, **Roadside:** 9, **Temple:** 4, **Waterbody:** 10, **Government:** 8. All parcels in Salem District. |
| `core_officerassignment` | Jurisdiction & Tenurial Scope | Active tenure records | Primary, additional charge, and in-charge tenures with deny-by-default spatial scoping. |
| `core_encroachmentalert` | Statutory Cases | **160 alert cases** | Governed by 28-state `CaseStateMachine`, optimistic versioning (`version`), and priority lane classification. |
| `core_caseauditevent` | Immutable Audit Trail | Case transitions recorded | Append-only audit record capturing `from_state`, `to_state`, `actor`, `reason`, and payload diff. |
| `core_laneconfig` | Priority Lane Calibration | 4 lanes (A, B, C, D) | Waterbody emergency (Lane A), Commercial/High-Value (Lane B), Road/Street (Lane C), Residential/Livelihood (Lane D). |
| `core_idempotencykeyrecord` | Network Idempotency | Transition requests | Guarantees exactly-once mutation execution using HTTP `Idempotency-Key` headers. |
| `core_changefeedevent` | Commit-Safe Sync | CDC event stream | Monotonic ID ordering with safe-horizon cursor preventing replication race conditions. |
| `auth_user` | Authentication & Authorization | **19 users** | Covers all administrative officer personas with unique demo passwords. |

---

## 3. Endpoints & API Topology

Defined in `backend/core/urls.py` and routed through `/api/`:

### Authentication & Officer Context
- `POST /api/auth/login/` — SimpleJWT authentication protected by `django-axes` (locked out after 5 consecutive failed attempts).
- `POST /api/auth/token/refresh/` — Rotates refresh token, blacklists previous token, sets `httpOnly` cookie.
- `POST /api/auth/logout/` — Blacklists refresh token, clears `httpOnly` cookie.
- `GET /api/auth/me/` — Returns structured `{ user, role, role_display, scope, nav, feature_flags }` along with backward-compatible top-level keys.

### Executive & Operational Intelligence
- `GET /api/dashboard/summary/` — Scoped executive metrics:
  - `kpis`: Total active, high-priority waterbody, critical SLA breaches, court stays, certified FMBs, pending rehabilitation.
  - `statutory_pipeline`: Counts grouped by legal lifecycle stages (Detection, Section 7, Section 6, Eviction, Closed).
  - `accuracy`: Wilson 95% Confidence Interval precision and recall ledger by priority lane.
  - `satellite_coverage_gaps`: Identifies spatial gaps where last satellite capture > 14 days.
  - `integrity`: Certified vs indicative survey counts and active court stay counts.

### Statutory Case Lifecycle (`/api/cases/`)
- `GET /api/cases/` — Paginated, filtered case list with deny-by-default jurisdictional scoping and dynamic `allowed_actions[]`.
- `GET /api/cases/{id}/` — Comprehensive single case detail with parcel metadata, FMB ladder, audit log, and permitted transitions.
- `POST /api/cases/{id}/transitions/` — Atomic state transition endpoint supporting:
  - Optimistic concurrency control (409 Conflict if `expected_version` != `current_version`).
  - Network idempotency via `Idempotency-Key` header.
  - Statutory guard enforcement (vulnerable housing, court stay lock, certified survey requirement, pandal grace window).
- `GET /api/cases/{id}/notice-pdf/?notice_type=section_7|section_6` — Dynamic ReportLab PDF generator with draft watermark, SHA-256 integrity hash, and indicative survey disclaimer.

### Distributed Data Synchronization
- `GET /api/sync/changes/?cursor=<id>&limit=100` — Commit-safe Change Feed stream for mobile clients and downstream replication services.

### Compliance & Legacy Endpoints
- `GET /api/compliance/high-court-atr/?district=<district>&writ_no=<writ>` — Madras High Court Compliance ATR PDF generator.
- `POST /api/smart-alert/` — Automated threat assessment via TNGIS proxy.
- `ANY /api/tngis/<action>/` — TNGIS generic API proxy (`TNGIS_DEMO_MODE=False` default).

---

## 4. Frontend & Mobile Baseline

### Web Frontend (`frontend/src/`)
- **Architecture:** Modular component-based SPA built with Vite 8, Tailwind CSS 4, and React Router 7.
- **Monolith Decommissioned:** Legacy 4,700-line `App.jsx` replaced with a 108-line router.
- **Design Tokens:** Strict executive palette (`bg-slate-50`, `text-slate-900`, `border-slate-200`, `font-sans`).
- **Dedicated Route Views:**
  - `ExecutiveDashboardView` (`/dashboard`) — Statutory KPI cards, stage funnel, accuracy ledger, satellite coverage map.
  - `WorkQueueView` (`/cases`) — Filterable case queue with priority lane badges, SLA timers, and detail drawer.
  - `CourtStaysView` (`/stays`) — Injunction tracker with court writ numbers and compliance holds.
  - `HearingsView` (`/hearings`) — Section 7 inquiry tracker, representation records, and ex-parte logs.
  - `RehabilitationView` (`/rehabilitation`) — TNUHDB welfare routing for vulnerable dwelling cases.
  - `TacticalMapView` (`/map`) — Interactive Leaflet cadastral map with certified/indicative boundary toggles.
  - `HighCourtATRView` (`/atr`) — Compliance Action Taken Report generator with draft disclaimers.
  - `VAOMobileView` (`/mobile-preview`) — Interactive emulator for ground verification workflow.
- **Compliance Guard:** `npm run lint:forbidden` automatically validates that no unverified marketing claims or fake legal phrases exist in the frontend code.

### Mobile Field App (`field_officer_app/lib/`)
- Flutter 3.29+ mobile application implementing the verdict-driven verification state contract.
- Captures GPS coordinates, geotagged on-site photographs, and boundary deviation metrics.
- Submits structured inspection payloads to `/api/verifications/` with server-derived officer credentials.
- Analyzer health: `No issues found! (ran in 44.9s)`.

---

## 5. Test Suite Verification

Verified running inside the `land_backend` container:
```
Ran 79 tests in 126.201s

OK
Destroying test database for alias 'default'...
Found 79 test(s).
System check identified no issues (0 silenced).
```

### Test Coverage Highlights:
- **Jurisdictional Scoping:** Statewide administrative hierarchy, officer assignment tenure, multi-taluk access control, deny-by-default queries.
- **Statutory Workflow Machine:** All 28 statutory states, transition guards (vulnerable housing, stay holds, certified FMB, pandal grace), and audit logs.
- **Accuracy Ledger:** Wilson 95% Confidence Interval precision and recall calculations across priority lanes A–D.
- **Sync & Concurrency:** Version incrementing, 409 conflict handling, network idempotency caching, safe-horizon change feed cursor.
- **Production API Endpoints:** Role navigation schemas, dashboard metrics computation, transition dispatch, and ReportLab notice generation.
- **Security & Authentication:** `django-axes` lockout enforcement, JWT cookie rotation, demo credential restrictions.
