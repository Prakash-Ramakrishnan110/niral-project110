# GEOMMAND System Audit & Current State Baseline
**Date:** October 2026  
**Document:** `docs/CURRENT_STATE.md`  
**Baseline Version:** 0.9.0-prototype  
**Auditor:** Principal Engineer / Tech Lead  

---

## 1. Resolved Version Matrix (Code Truth vs Documentation)

Documentation had conflicting claims across various files. Below is the ground truth verified directly from dependency manifests, lockfiles, and container recipes:

| Component | Documented Claims | Actual Pinned Reality in Code | Source File | Status / Action |
|---|---|---|---|---|
| **Python** | 3.11 vs 3.12 | **Python 3.12** (`python:3.12-slim`) | `backend/Dockerfile:1` | Pinned to 3.12 |
| **Django** | 4.2 vs 5.0 | **Django 6.0.4** | `backend/requirements.txt:1` | Modern Django 6.x release; update docs |
| **DRF** | 3.14 vs 3.15 | **3.16.1** | `backend/requirements.txt:2` | Pinned to 3.16.1 (resolved 3.15.2 drift) |
| **PostgreSQL / PostGIS** | Postgres 15 vs 16 | **PostgreSQL 15 + PostGIS 3.3** (`postgis/postgis:15-3.3`) | `docker-compose.yml:3` | Postgres 15 retained as baseline |
| **GeoServer** | 2.24 vs 2.24.1 | **GeoServer 2.24.1** (`docker.osgeo.org/geoserver:2.24.1`) | `docker-compose.yml:33` | Confirmed |
| **Frontend Runtime** | React 18 vs 19 | **React 19.2.5** (`react@^19.2.5`, `react-dom@^19.2.5`) | `frontend/package.json:21-22` | React 19 in use; eliminate any React 18 references |
| **Build Tooling** | Vite 5 vs 6 | **Vite 8.0.9** (`vite@^8.0.9`, `@vitejs/plugin-react@^6.0.1`) | `frontend/package.json:30,38` | Vite 8 + Tailwind v4 (`@tailwindcss/vite@^4.2.3`) |
| **Mobile Runtime** | Flutter 3.8 vs 3.29 | **Dart SDK ^3.8.1 / Flutter 3.29+** | `field_officer_app/pubspec.yaml:22` | Confirmed: Dart SDK 3.8.1 corresponds to Flutter 3.29+ |

---

## 2. Critical Defects Ranking (Urgent Remediation Required)

The following 6 defects present severe operational, legal, and security vulnerabilities and must be remediated immediately:

| Rank | Defect Description | Severity | Impact | Remediation Plan |
|---|---|---|---|---|
| **1** | **Fabricated Fallback Rows in ATR Affidavit** | **CRITICAL (LEGAL)** | If no waterbody alerts exist in DB, `HighCourtComplianceGenerator` injects 3 fake Salem parcels (`Salem West / Kannankurichi`, `Salem South / Dadagapatty`, `Omalur / Omalur North`). Submitting this to the High Court constitutes contempt of court / perjury. | Remove fake fallback rows immediately. Print clear "No waterbody encroachments recorded for `<district>` as of `<timestamp>`" if count is 0. |
| **2** | **Non-District-Scoped ATR Queries** | **CRITICAL (LEGAL)** | Queries in ATR (`LandParcel.objects.filter(classification='Waterbody').count()`) aggregate state-wide counts instead of scoping by `district=district`. Sworn affidavit misrepresents totals. | Add mandatory `.filter(district=district)` on all parcel and alert queries. |
| **3** | **Synthetic FMB Offsets Presented as Survey Data** | **HIGH (LEGAL/OPERATIONAL)** | `FMBSketchGenerator` calculates chainages and ladder offsets from naive polygon coordinates with hardcoded multipliers (`dist * 0.22`, `offset: 8.4m`), presenting them as certified settlement measurements. | Watermark sketches: *"INDICATIVE - computed from polygon geometry, not a certified survey measurement"*. Require surveyor field measurements or explicit officer acknowledgment for Section 7. |
| **4** | **Client-Trusted Role Parameter in API Payloads** | **CRITICAL (SECURITY)** | Endpoints (`issue_section_7`, `issue_section_6`, `inspector_approve`, `complete_eviction`) check `request.data.get('role')`. Any unauthenticated user or script can bypass judicial/statutory authority by sending `{"role": "COLLECTOR"}`. | Eliminate client-sent `role`. Enforce server-side JWT authentication, user model roles, and DRF permission classes. |
| **5** | **Fake "Cryptographic Hash: SHA256-<id>" Line** | **MEDIUM (INTEGRITY)** | PDF prints `• Cryptographic Hash: SHA256-` with first 12 chars of alert UUID. No actual SHA-256 hash of the PDF bytes is computed, and no QR code or verification endpoint exists. | Remove fake hash claim. Implement genuine SHA-256 over generated PDF buffer and real QR code resolving to public verification URL. |
| **6** | **Base64 Photo Bloat in PostgreSQL `JSONField`** | **HIGH (INFRASTRUCTURE)** | Flutter app posts raw Base64 images directly into `FieldVerification.photos` JSONField. Causes extreme DB bloat, query degradation, and 50MB payload workarounds in Django. | Migrate photo payloads to S3/MinIO object store with signed URLs and hash deduplication. |

---

## 3. Actual API Endpoints (`backend/core/urls.py` & `views.py`)

| HTTP Method | Route | Handler View / Action | Description | Real vs Defective Status |
|---|---|---|---|---|
| `GET`, `POST` | `/api/parcels/` | `LandParcelViewSet` | List/Create cadastral parcels | **Real** (PostGIS DB) |
| `GET` | `/api/parcels/presets/` | `LandParcelViewSet.presets` | 4 Salem benchmark demo parcels | **Real** (Hardcoded fixture list) |
| `GET` | `/api/parcels/identify/` | `LandParcelViewSet.identify` | Lat/Lon spatial identification (`Distance`) | **Real** (PostGIS spatial query) |
| `GET`, `POST` | `/api/alerts/` | `EncroachmentAlertViewSet` | GeoJSON FeatureCollection of alerts | **Real** (PostGIS spatial DB) |
| `POST`, `PATCH` | `/api/alerts/{id}/inspector_approve/` | `EncroachmentAlertViewSet.inspector_approve` | Approves field verification | **Defective** (Relies on client-sent `role` parameter) |
| `POST`, `PATCH` | `/api/alerts/{id}/issue_section_7/` | `EncroachmentAlertViewSet.issue_section_7` | Issues Section 7 Show-Cause Notice | **Defective** (Relies on client-sent `role` parameter) |
| `POST`, `PATCH` | `/api/alerts/{id}/issue_section_6/` | `EncroachmentAlertViewSet.issue_section_6` | Issues Section 6 Eviction Warrant | **Defective** (Relies on client-sent `role` parameter; lacks hard humanitarian block) |
| `POST`, `PATCH` | `/api/alerts/{id}/complete_eviction/` | `EncroachmentAlertViewSet.complete_eviction` | Marks parcel evicted/restored | **Defective** (Relies on client-sent `role` parameter) |
| `GET` | `/api/alerts/{id}/download_section_7/` | `EncroachmentAlertViewSet.download_section_7` | Dynamic Section 7 Notice PDF with vector FMB | **Partial / Defective** (FMB sketch uses synthetic offsets; no real QR code or verification link; displays unhashed fake SHA-256 string) |
| `GET` | `/api/alerts/{id}/fmb_sketch/` | `EncroachmentAlertViewSet.fmb_sketch` | Boundary stones, triangulation, offsets JSON | **Partial / Defective** (Offsets are hardcoded percentage multipliers along diagonal baseline, not derived from official certified survey settlement/WebFMB data) |
| `POST` | `/api/alerts/{id}/star3_lock/` | `EncroachmentAlertViewSet.star3_lock` | Freezes property sale at Sub-Registrar | **Stub** (Writes note & lock ref in DB, no real adapter) |
| `POST` | `/api/alerts/{id}/humanitarian_rehabilitation/` | `EncroachmentAlertViewSet.humanitarian_rehabilitation` | Routes hut to TNUHDB welfare | **Stub** (Sets structure category & notes, no real adapter) |
| `POST`, `PATCH` | `/api/alerts/{id}/mark_false_positive/` | `EncroachmentAlertViewSet.mark_false_positive` | Triggers peer audit on false alarm | **Partial** (Sets flag, but uses hardcoded auditor string) |
| `POST`, `PATCH` | `/api/alerts/{id}/reject_boundary/` | `EncroachmentAlertViewSet.reject_boundary` | Rejects based on FMB boundary mismatch | **Defective** (Relies on client-sent `role` parameter) |
| `POST`, `PATCH` | `/api/alerts/{id}/cancel_legal/` | `EncroachmentAlertViewSet.cancel_legal` | Cancels Section 7 proceedings | **Defective** (Relies on client-sent `role` parameter) |
| `GET`, `POST` | `/api/verifications/` | `FieldVerificationViewSet` | Submits mobile verification photos/remarks | **Partial / Defective** (Stores raw Base64 in JSONField; lacks server-side 15m metric geofence check) |
| `GET`, `POST` | `/api/registry-proposals/` | `RegistryProposalViewSet` | Proposed edits to LandParcels | **Real** (Workflow state in DB) |
| `POST` | `/api/registry-proposals/{id}/approve/` | `RegistryProposalViewSet.approve` | Applies proposed data to LandParcel | **Real** (Updates parcel attributes) |
| `POST`, `GET` | `/api/tngis/{action}/` | `TNGISProxyView` | Proxy to Tamil Nadu GIS APIs | **Partial** (External TNGIS API adapter) |
| `POST` | `/api/smart-alert/` | `SmartAlertView` | Checks coordinates against TNGIS layer | **Partial** (External dependency with local fallback) |
| `GET` | `/api/compliance/high-court-atr/` | `HighCourtATRView` | High Court Judicial Compliance ATR PDF | **Partial / Defective** (Database queries omit district filtering; fallbacks to hardcoded Salem waterbody rows if query is empty; lacks required writ parameter) |

---

## 4. Real vs Simulated Breakdown

### Real Components
1. **Spatial Database:** PostGIS models (`LandParcel`, `EncroachmentAlert`) store spatial geometries (`PolygonField`, `PointField`) and execute `ST_Intersects` and distance calculations.
2. **ReportLab Document Engine:** Generates styled binary PDFs dynamically for legal notices and court affidavits.
3. **Flutter Ground Recon App:** Captures mobile GPS coordinates and camera frames, sending structured payloads to the backend.

### Simulated / Mocked Components
1. **Satellite AI Pipeline:** `scripts/ai_simulation.py` is an ungrounded timer script using `random.uniform()` rather than processing satellite feeds.
2. **Frontend UI Mock Data:** `App.jsx` contains `feedInterval` injecting synthetic `LIVE-XXXX` alerts, `Math.random()` valuations, and hardcoded static status metrics.
3. **Role Authorization:** Roles are switched via an unauthenticated dropdown passing `role` in the request body rather than cryptographic JWT tokens.
4. **Third-Party Integrations:** `star3_lock` (Sub-Registrar) and `humanitarian_rehabilitation` (TNUHDB) append static text notes to the DB record.
5. **Peer Audit Allocation:** Assigns a hardcoded string rather than querying real officers from adjacent taluks.
6. **Mobile Geofence Enforcement:** Geofence verification is currently in Flutter UI without server-side validation against `parcel.geom`.

---

## 5. Live Stack Verification Results

Tested under pinned dependencies (`Django==6.0.4`, `djangorestframework==3.16.1`):
* `python manage.py check`: Passed with **0 issues**.
* GeoDjango + GDAL/GEOS: Successfully loaded GDAL 3.12.3 and GEOS 3.14.1.

---

## 6. Stop-Gap Legal-Safety Commit — Verification Evidence

**Date verified:** 27-Oct-2026  
**Commit scope:** Legal-safety fixes for defects Rank 1, 2, 3 and 5 in Section 2 above.

### What Was Fixed

| Fix | File | Change |
|---|---|---|
| **Removed fake ATR fallback rows** | `core/services/high_court_compliance.py` | Deleted hard-coded Salem parcels (`Kannankurichi`, `Dadagapatty`, `Omalur North`). Empty result now prints: *"No waterbody encroachments recorded for `<district>` as of `<timestamp>`"* |
| **District-scoped ATR queries** | `core/services/high_court_compliance.py` | All `LandParcel` and `EncroachmentAlert` queries now filter on `district__iexact=district`. State-wide aggregate is eliminated. |
| **Mandatory writ petition parameter** | `core/services/high_court_compliance.py` | `writ_petition_no=None` raises `ValueError` with clear message. No default writ number exists. |
| **FMB sketch disclaimer** | `core/services/fmb_sketch_generator.py` | All FMB drawings and PDF annexures carry: *"DISCLAIMER: INDICATIVE — computed from polygon geometry, not a certified survey measurement"* |
| **Removed fake SHA256 hash claim** | `core/services/legal_notice_pdf.py` | No `Cryptographic Hash: SHA256-…` line in Section 7 PDF output. |
| **Fixed `structure_category` None-safety** | `core/services/legal_notice_pdf.py` | `str(alert.structure_category or "Unknown").replace(...)` — prevents `None` or Mock object leaking into PDF table cell. |
| **Env-driven settings** | `backend/config/settings.py` | `GDAL_LIBRARY_PATH`, `GEOS_LIBRARY_PATH`, `SECRET_KEY`, `DB_*` read from environment variables. Windows paths not committed. |
| **`.env.example` added** | `backend/.env.example` | Template for all required env vars with safe defaults for local dev. |
| **`BACKLOG.md` committed** | `docs/BACKLOG.md` | Explicit list of items requiring government stakeholder decisions before production sign-off. |

### PDF Test Results (4/4 PASS)

Run with: `python verify_pdfs.py` from `backend/` using venv.

| Test | Result | Evidence |
|---|---|---|
| **ATR-A: Salem (zero data)** | ✅ PASS (3918 bytes) | Contains "No water-body encroachments recorded for Salem"; no `Kannankurichi` / `Dadagapatty` / `Omalur North` rows; DRAFT watermark present; W.P. No. 34091 of 2023 in header. |
| **ATR-B: Coimbatore (district scoping)** | ✅ PASS (3929 bytes) | Shows "COIMBATORE DISTRICT" heading; no Salem-specific data leaked; W.P. No. 18420 of 2024 in header. |
| **ATR-C: No writ_no** | ✅ PASS | `ValueError: writ_petition_no is a required parameter with no default and cannot be empty` raised. |
| **Section 7 PDF (mock alert)** | ✅ PASS (6475 bytes) | FMB disclaimer "INDICATIVE - computed from polygon geometry" present; no `SHA256-` hash claim; no `<Mock` or `MagicMock` string in rendered text; "Nature of Structure" renders `Shed` (correct string coercion). |

### What Remains Open (Requires Phase 0 Next Steps)

- **Local PostgreSQL & PostGIS Environment Truth (Verified 27-Oct-2026)**:
  * **Port 5432 (Windows Native PostgreSQL 15.13)**: Native Windows service. PostGIS extension is NOT installed (`postgis.control` missing). Databases: `govland_shield` (7 tables from 13-Apr-2026, 0 alerts), `land_records` (empty, 0 tables).
  * **Port 5433 (Windows Native PostgreSQL 18.1)**: Native Windows service. Databases: `postgres`, `eduai`.
  * **Port 5434 (Windows Native PostgreSQL 17.7)**: Native Windows service. Databases: `govland_shield` (19 tables, 5 parcels, 0 alerts).
  * **Port 5435 (Docker Container `postgis_15` - `postgis/postgis:15-3.3`)**: Official pinned environment running PostgreSQL 15.4 (Debian) + PostGIS 3.3.4. Database: `land_records` (17 Django tables, 0 alerts, 0 parcels). `manage.py migrate` was executed exclusively against this container. Role `landuser` was granted `CREATEDB` (`ALTER ROLE landuser CREATEDB;`) to permit Django's `SafeTestCase` runner to spin up `test_land_records`.
  * **CI Pipeline (`.github/workflows/ci.yml`)**: Pinned to `postgis/postgis:15-3.3` service container matching local container parity.
- **Server-side RBAC**: `role` parameter is still client-sent on `issue_section_7`, `inspector_approve`, `issue_section_6`, `complete_eviction`, `reject_boundary`, `cancel_legal`. JWT authentication + DRF permission classes required (Phase 0, Step 3).
- **State machine migration**: Alert status codes need explicit allowed-transition table (Phase 0, Step 4).
- **Real QR code**: Section 7 PDF still has no QR code graphic (TD-04 in BACKLOG.md).
- **Photo storage**: Base64 photos still stored in PostgreSQL JSONField (TD-01 in BACKLOG.md).
