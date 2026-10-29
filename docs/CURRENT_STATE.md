# GEOMMAND System Audit & Current State Baseline
**Generated Date:** 29 October 2026  
**Document:** `docs/CURRENT_STATE.md`  
**Baseline Version:** 0.9.1-verified  
**Environment:** Docker (`postgis/postgis:15-3.3`, `python:3.12-slim`, `geoserver:2.24.1`, `adminer`)

---

## 1. Verified Architecture & Version Matrix (Source Truth)

Every dependency and runtime version listed below has been verified against the physical manifests and container descriptors:

| Component | Documented Version | Actual File Truth | Manifest Source | Status |
|---|---|---|---|---|
| **Python** | 3.12 | `3.12` | `backend/Dockerfile:1` (`python:3.12-slim`) | Verified |
| **Django** | 6.0.4 | `django==6.0.4` | `backend/requirements.txt:1` | Verified |
| **DRF** | 3.16.1 | `djangorestframework==3.16.1` | `backend/requirements.txt:2` | Verified |
| **SimpleJWT** | 5.5.1 | `djangorestframework-simplejwt==5.5.1` | `backend/requirements.txt:10` | Verified |
| **django-axes** | 8.3.1 | `django-axes==8.3.1` | `backend/requirements.txt:11` | Verified (5-attempt lockout) |
| **pypdf** | 6.21.2 | `pypdf==6.21.2` | `backend/requirements.txt:12` | Installed in container; verifies PDF stream text |
| **PostgreSQL / PostGIS** | Postgres 15 / PostGIS 3.3 | `PostgreSQL 15.10 + PostGIS 3.3.4` | `docker-compose.yml:3` (`postgis/postgis:15-3.3`) | Verified via `PostGIS_Full_Version()` |
| **GeoServer** | 2.24.1 | `2.24.1` | `docker-compose.yml:33` (`geoserver:2.24.1`) | Verified |
| **Frontend Runtime** | React 19.2.5 | `react@^19.2.5`, `react-dom@^19.2.5` | `frontend/package.json:21-22` | Verified |
| **Frontend Tooling** | Vite 8 + Tailwind 4 | `vite@^8.0.9`, `@tailwindcss/vite@^4.2.3` | `frontend/package.json:19,38` | Verified |
| **Mobile Runtime** | Flutter 3.29+ / Dart 3.8.1 | `sdk: ^3.8.1` | `field_officer_app/pubspec.yaml:22` | Verified |

---

## 2. Database Content Reality (`land_records`)

Verified by direct SQL queries on the active PostgreSQL 15 database container (`land_db`):

| Model / Table | UI Display Claim | Actual Database Rows | Reality & Discrepancy |
|---|---|---|---|
| `core_landparcel` | `14,242.8 Ha` / `12,482 parcels` | **39 parcels** | **Forest:** 8, **Roadside:** 9, **Temple:** 4, **Waterbody:** 10, **Government:** 8. All 39 parcels are in **Salem District**. |
| `core_encroachmentalert` | "Dynamic Sentinel stream" | **160 alerts** | Seeded prototype alerts (`is_synthetic=False` in initial seed, confidence numbers hardcoded/random). |
| `core_fieldverification` | "100+ on-ground inspections" | **0 records** | Empty table in database. Mobile app sends photos in Base64 string payload. |
| `core_registryproposal` | "Registry Workflow Ledger" | **0 records** | Table exists; UI uses local state with hardcoded proposals (`UP-8821`, `CR-991A`). |
| `auth_user` | 17 roles | **19 users** | Covers all primary officer personas (`col_salem`, `tah_salem_west`, `vao_kannan`, `apex_tn`, etc.). |

---

## 3. Endpoints & API Topology

Defined in `backend/core/urls.py` and routed through `/api/`:

### Authentication
- `POST /api/auth/login/` — SimpleJWT authentication protected by `django-axes` (locked out after 5 consecutive failed attempts).
- `POST /api/auth/token/refresh/` — Rotates refresh token, blacklists previous token, sets `httpOnly` cookie.
- `POST /api/auth/logout/` — Blacklists refresh token, clears `httpOnly` cookie.
- `GET /api/auth/me/` — Returns user profile, active role, and jurisdiction (`district`, `taluk`, `village`).

### Restful Resources
- `/api/parcels/` — GeoJSON polygon features from `LandParcel`.
- `/api/alerts/` — GeoJSON point features from `EncroachmentAlert` with nested verification and FMB metadata.
- `/api/verifications/` — CRUD for `FieldVerification`.
- `/api/registry-proposals/` — Mutation proposals.

### Statutory Actions (`/api/alerts/{id}/...`)
- `POST .../inspector_approve/` — Revenue Inspector countersignature.
- `POST .../issue_section_7/` — Section 7 Show-Cause Notice issuance (blocks if FMB is indicative without officer acknowledgement).
- `POST .../issue_section_6/` — Section 6 Summary Eviction Order (blocks for `VULNERABLE_HOUSING` and `COURT_STAY_HOLD`).
- `POST .../complete_eviction/` — Demolition sign-off.
- `POST .../mark_false_positive/` — Marks false positive.
- `POST .../reject_boundary/` — Boundary mismatch rejection.
- `POST .../cancel_legal/` — Legal cancellation upon valid patta presentation.
- `POST .../star3_lock/` — Freezes SRO deed registration.
- `GET .../download_section_7/` — Official ReportLab court-admissible PDF notice.
- `GET .../fmb_sketch/` — Mathematical FMB boundary stone coordinates and ladder offsets.

### Compliance & Spatial Services
- `GET /api/compliance/high-court-atr/?district=<district>&writ_petition_no=<writ>` — Madras High Court Compliance ATR PDF generator.
- `POST /api/smart-alert/` — Automated threat assessment via TNGIS proxy.
- `ANY /api/tngis/<action>/` — TNGIS generic API proxy.

---

## 4. Current Frontend & Mobile Baseline

### Web Frontend (`frontend/src/`)
- Single entrypoint `App.jsx` (4,670 lines).
- Navigation is state-based (`activeTab`), with **no URL routing**.
- Real API connections exist for parcels, alerts, High Court ATR PDF download, and alert status dispatch.
- Dashboard stats (`14,242.8 Ha`, `12,482 parcels`, `₹1,842.4 Cr`) and auxiliary tabs (Users, Database, Storage, Satellites) are hardcoded static dummy arrays.

### Mobile Field App (`field_officer_app/lib/main.dart`)
- Full Flutter application (206 KB).
- Connects to `/api/auth/login/` and attaches `Authorization: Bearer <token>`.
- Captures on-site camera photos, GPS coordinates, and sends Base64 payloads (2 MB to 10 MB) to `/api/verifications/`.
- Zero offline queue (no SQLite/Drift); network errors fail immediately.

---

## 5. Test Suite Verification

Verified running inside the `land_backend` container:
```
Ran 19 tests in 32.253s
OK (19 passing tests)
```
- Tests assert: Mandatory district scoping on ATR, non-empty waterbody alerts, absence of fake fallback rows, presence of DRAFT watermark and INDICATIVE disclaimers, absence of fake SHA256 string claims, axes brute-force lockout, and Section 6 vulnerable dweller guards.
