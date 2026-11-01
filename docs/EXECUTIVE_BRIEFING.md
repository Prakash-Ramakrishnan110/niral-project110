# GEOMMAND System Executive Briefing
**Document Status:** Draft – Design Intent  
**Last Verified Date:** 01 November 2026  
**Document:** `docs/EXECUTIVE_BRIEFING.md`  
**Statutory Context:** Tamil Nadu Land Encroachment Act, 1905 (TN Act III of 1905)

> [!CAUTION]
> **NOTICE TO REVIEWERS:**  
> This briefing describes the current built prototype baseline alongside planned engineering modules. It is an internal technical document. Legal timelines, statutory authorities, notice templates, and procedural rules cited herein are **provisional design assumptions pending formal confirmation** by the Special Government Pleader (Taxes & Land) and the Commissioner of Land Administration (CLA).

---

## 1. What is Built & Verified in Code and Database Today

The following capabilities are implemented, migrated in the PostgreSQL 15 database container (`land_db`), and verified by the 79-test backend suite and production frontend build:

### A. Core Architecture & Runtime Baseline
- **PostGIS Spatial Database:** PostgreSQL 15.10 with PostGIS 3.3.4 running in Docker (`land_db` published on host port `5435`).
- **Statewide Administrative Hierarchy Models:** Canonical `State`, `District` (38 districts), `Taluk` (11 taluks loaded), `RevenueVillage` (24 villages loaded), and `LandParcel` (39 seed parcels in Salem District).
- **Engine-Level Consistency Trigger:** PostgreSQL trigger `trg_check_district_taluk_village_consistency` enforcing boundary hierarchy integrity at the database engine level.
- **Deny-by-Default Jurisdictional Scoping:** `OfficerAssignment` model supporting primary, additional charge, and in-charge tenures. Implemented in `ScopedOfficerQuerysetMixin` so officers only retrieve records within their assigned territory.
- **Security & Lockout:** `django-axes` 5-attempt brute-force lockout, SimpleJWT token rotation with in-memory access token storage and `httpOnly` refresh cookies.

### B. 28-State Statutory Workflow Engine (`CaseStateMachine`)
- Full implementation of a 28-state machine in `backend/core/services/case_state_machine.py`.
- **Statutory Transition Guards:**
  1. **Vulnerable Housing Humanitarian Guard:** Transition to `SECTION_6_ORDERED` is hard-blocked if `structure_category == 'VULNERABLE_HOUSING'`. The system mandates routing to `REHABILITATION_ROUTED` (TNUHDB).
  2. **Court Stay Hold Guard:** Entering `COURT_STAY_HOLD` requires a certified court stay order number (`stay_order_no`). It automatically freezes statutory SLA clocks and preserves the prior operational state.
  3. **Survey Certification Guard:** Issuing Section 7 notice on an indicative FMB sketch requires explicit officer acknowledgement (`fmb_certified: false`).
  4. **Pandal Grace Timer:** Blocks premature eviction during permitted festival/pandal windows.
- **False-Positive Peer Audit Path:** When a false positive is reported by a VAO, the case transitions to `STATE_PEER_AUDIT_PENDING` for cross-taluk independent inspector review, which may either confirm the false positive (`STATE_FALSE_POSITIVE_CONFIRMED`) or reinstate the case (`STATE_REINSTATED`).

### C. Concurrency, Sync & Quality Control
- **Optimistic Concurrency Control:** Enforced via `EncroachmentAlert.version`. Simultaneous conflicting updates reject with HTTP 409 Conflict.
- **Network Idempotency:** Implemented via `IdempotencyKeyRecord` and the HTTP `Idempotency-Key` header, guaranteeing exactly-once transition execution.
- **Commit-Safe Change Feed:** `ChangeFeedEvent` table with monotonic sequence IDs and safe-horizon cursor, preventing replication race conditions.
- **Dual Priority Classification:**
  1. **Priority Class (Asset Sensitivity, A to D):**
     - **Class A:** Waterbody emergency (*Eri, Kulam, Odai*), riverbeds, forest reserves.
     - **Class B:** Commercial establishments, high-value urban land banks.
     - **Class C:** Road margins, public street encroachments.
     - **Class D:** Residential and livelihood dwellings.
  2. **Confidence Lane (Model Certainty):**
     - **High Lane:** Confidence $\ge 80\%$.
     - **Medium Lane:** Confidence $50\% - 79\%$.
     - **Low Lane:** Confidence $< 50\%$.
- **Empirical Accuracy Ledger:** `AccuracyLedgerService` calculates Wilson 95% Confidence Interval precision and recall based exclusively on verified ground inspection verdicts. Displays `INSUFFICIENT_DATA` whenever sample size $n < 30$.

### D. Production API Endpoints & Frontend Role Dashboards
- **API Endpoints:**
  - `GET /api/auth/me/` — Returns authenticated officer profile, scope, and role navigation.
  - `GET /api/dashboard/summary/` — Scoped SQL metrics for KPIs, stage pipeline, accuracy ledger, and coverage gaps.
  - `GET /api/cases/` and `POST /api/cases/{id}/transitions/` — Guard-validated case mutations.
  - `GET /api/cases/{id}/notice-pdf/` — ReportLab draft notice PDF generator with document SHA-256 header and indicative survey disclaimer.
- **Frontend SPA:** Modular React 19 router (`frontend/src/App.jsx`) with 8 active routes:
  - `/dashboard` (Executive command center with role-differentiated views for Tahsildar, Collector, VAO, State Apex, Vigilance, GIS Admin)
  - `/cases` (Work queue with priority badges, SLA clocks, and filter drawer)
  - `/court-stays` (Injunction stay registry)
  - `/hearings` (Section 7 magisterial inquiry tracker)
  - `/rehabilitation` (TNUHDB welfare routing)
  - `/map` (Leaflet tactical map)
  - `/field-queue` (Field inspection queue)
  - `/atr` (High Court Compliance ATR generator)
- **Forbidden Claims Linter:** `npm run lint:forbidden` runs as part of the build pipeline, enforcing 0 occurrences of prohibited marketing claims.

---

## 2. Planned Features & External Pre-requisites (Not Yet Built)

The following components are **not built or verified** and represent future workstreams requiring external data feeds, accounts, or field testing:

| Feature / Module | Planned Implementation | Current Reality / Pre-requisite |
|---|---|---|
| **Satellite Ingestion Pipeline** | Continuous ingestion of Sentinel-2 multispectral imagery; automated spectral index computation (NDVI, NDWI, NDBI) and bi-temporal pixel differencing. | **NOT BUILT.** No Copernicus API client or raster processing pipeline exists. All current alerts in `land_records` are seeded/synthetic prototype records. |
| **Detection Resolution Scope** | Detection of substantial structural changes and land clearance at 10-meter pixel resolution. | **LIMITATION:** 10m Sentinel-2 optical imagery **cannot detect foundation trenching**. Foundation detection requires sub-meter commercial imagery (PlanetScope/WorldView) or drone orthophotos. |
| **Coverage Gap Monitor** | Real-time scanner identifying taluks where satellite revisit or cloud cover exceeds 10 days based on Copernicus scene metadata. | **PARTIALLY BUILT (Proxy Heuristic):** Current code checks the date of the most recent alert in a taluk, not real satellite scene metadata. Real imagery feeds are required. |
| **CollabLand FMB Parsing** | Parsing certified digital Field Measurement Book (FMB) CollabLand geometry and survey ladder measurements. | **NOT BUILT.** Current FMB ladder offsets are mathematically computed approximations from parcel polygon geometry. Labeled as indicative. |
| **Document QR & Public Verification** | QR code rendered on notices linking to public endpoint `/api/v1/verify/{hash}` for third-party verification. | **NOT BUILT.** Document SHA-256 is computed and printed as text in PDF headers, but QR rendering and public `/verify` endpoint are listed as technical debt (TD-04). |
| **Offline Mobile SQLite Queue** | Drift/SQLite offline queue for field officer app in remote rural areas with zero connectivity. | **NOT BUILT.** Mobile app currently submits directly via HTTP; network dropouts fail immediately without an offline sync queue. |
| **Secondary Sub-Routes** | Dedicated sub-route views for RDO, Inspector, `/districts`, `/peer-audits`, `/star3-freezes`, `/evictions`, `/officer-assignments`. | **NOT BUILT.** Sub-navigation links currently fall back to `/dashboard` or `/cases`. |

---

## 3. Illustrative Spatial SQL Architecture

The cadastral intersection concept planned for the future ingestion pipeline is illustrated below:

```sql
-- ILLUSTRATIVE SPATIAL QUERY: Cadastral Boundary Overlap Analysis
SELECT 
    p.id AS parcel_id,
    p.survey_number,
    p.subdivision,
    p.classification,
    ST_Area(ST_Intersection(p.geom, c.change_polygon)::geography) AS encroached_area_sqm
FROM core_landparcel p
JOIN raw_satellite_change c 
    ON ST_Intersects(p.geom, c.change_polygon)
WHERE p.classification IN ('Waterbody', 'Forest', 'Government Poramboke', 'Temple Land')
  AND ST_Area(ST_Intersection(p.geom, c.change_polygon)::geography) > 10.0;
```
*(Note: `raw_satellite_change` represents the planned schema table once the Copernicus ingestion pipeline is established).*

---

## 4. Operational Due Process Workflow & Legal Disclaimers

```
 [1. Detection Alert] (Currently Seeded Prototype Alerts)
          |
          v
 [2. Field Verification] (Local VAO on-site; Server checks GPS against parcel boundary)
          |
          +-----------------------+-----------------------+
          | (Encroachment Denied)                         | (Encroachment Confirmed)
          v                                               v
 [Peer Audit Pending]                      [3. Revenue Inspector Review]
 (Cross-Taluk Inspector Audit)                            |
          |                                               v
          +---> [False Positive Confirmed] [4. Section 7 Show-Cause Notice]
          |                                (Draft PDF generated; 15-day reply window - UNCONFIRMED)
          +---> [Reinstated to Active]                    |
                                          +---------------+---------------+
                                          | (Vulnerable Dwelling)         | (Standard / Commercial)
                                          v                               v
                             [TNUHDB Welfare Routing]          [5. Magisterial Inquiry]
                             (Eviction Guard Block)            (Review representations/title)
                                                                          |
                                                                          v
                                                       [6. Section 6 Eviction Warrant]
                                                       (Summary Eviction Order - UNCONFIRMED)
                                                                          |
                                                  +-----------------------+-----------------------+
                                                  | (Certified Stay Order)                        | (Order Enforceable)
                                                  v                                               v
                                        [Court Stay Hold]                               [7. Eviction Execution]
                                        (Eviction Clocks Paused)                        (Demolition & Restoration)
                                                                                                  |
                                                                                                  v
                                                                                        [8. High Court Compliance ATR]
                                                                                        (Draft Report for Sworn Signing)
```

### Critical Legal Disclaimers (Items Pending Official Government Sign-Off)

1. **Statutory Notice Authority Delegation (UNCONFIRMED):**  
   The current system defaults to Tahsildars signing Section 7 show-cause notices and Section 6 eviction orders. Formal government orders and Law Department circulars must confirm whether Deputy Tahsildars or Revenue Divisional Officers hold concurrent or exclusive powers for specific land categories.
2. **Statutory Reply & Eviction Windows (UNCONFIRMED):**  
   The 15-day show-cause reply window and 48-hour emergency waterbody notice timelines are provisional figures based on standard revenue practice. All statutory durations must be formally confirmed by the Special Government Pleader before production use.
3. **Procedure on Notice Non-Response (LEGAL RULE UNKNOWN):**  
   Whether a Tahsildar may pass an ex-parte Section 6 summary eviction order immediately upon non-response to a Section 7 notice, or whether an on-site default inquiry is mandatory, remains an unverified legal question.
4. **Court Injunction Registration:**  
   A case enters `COURT_STAY_HOLD` **only upon receipt and verification of a certified interim or final court order** from the High Court or Civil Court. Entering a Writ Petition number alone does not operate as an automatic stay.
5. **Cadastral & Document Admissibility:**  
   All mathematical FMB sketches produced by the system are explicitly disclaimed as **INDICATIVE** (derived from parcel polygon geometry, not a certified survey measurement). All generated notices and High Court Action Taken Reports are **drafts for officer review and physical sworn execution**; they do not constitute self-executing judicial instruments.

---

## 5. Current Database Reality Matrix

Counts verified by direct query against the active `land_db` PostgreSQL container:

| Entity | Loaded Reality | Source Table | Scope Notes |
|---|---|---|---|
| **Districts** | **38** | `core_district` | Canonical statewide districts (Ariyalur to Virudhunagar) with LG codes. |
| **Taluks** | **11** | `core_taluk` | 9 taluks in Salem, Egmore in Chennai, Coimbatore North in Coimbatore. |
| **Revenue Villages** | **24** | `core_revenuevillage` | Seeded villages across Salem, Chennai, and Coimbatore. |
| **Cadastral Parcels** | **39** | `core_landparcel` | All 39 parcels located in Salem District (Waterbodies, Roads, Forest, Temples, Poramboke). |
| **Encroachment Alerts** | **160** | `core_encroachmentalert` | Seeded alerts across the 39 Salem parcels. |
| **Officer Accounts** | **19** | `auth_user` | Demo officer personas across Salem, Chennai, Coimbatore, and State Apex. |

