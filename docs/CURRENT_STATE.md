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
