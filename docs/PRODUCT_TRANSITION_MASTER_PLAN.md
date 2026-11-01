# GEOMMAND: Master Milestone Roadmap & Open Items Ledger

**Document:** `docs/PRODUCT_TRANSITION_MASTER_PLAN.md`  
**System:** Satellite-Based Land Encroachment Monitoring & Enforcement Platform  
**Target Pilot District:** Salem (`pilot district (Salem, data to be supplied)`)  
**Statutory Legal Status:** All notice templates, statutory reply windows, and authority delegations are **UNVERIFIED – pending formal Law Department & Revenue Administration sign-off**.  

---

## 🗺️ Master Milestone Breakdown & Honest Status

| Milestone | Scope & Deliverables | Honest Status | Critical Open Items Before Sign-Off |
|:---:|---|:---:|---|
| **M0** | **Foundation & Trust Architecture**<br/>• 28-State statutory encroachment state machine with social guards (`VULNERABLE_HOUSING` blocks Section 6).<br/>• SHA-256 tamper-evident hash chaining on audit logs.<br/>• Deny-by-default jurisdiction scoping (`OfficerAssignment`).<br/>• Public notice verify endpoint (`/api/v1/verify/<doc_hash>/`) with zero PII and rate limiting (30/min).<br/>• 9-Role server-authorized React dashboard layout with zero fake stats. | **IN HARDENING / PARTIAL** | • Official Law Department sign-off on Section 7 & 6 notice wording.<br/>• High Court Pleader verification of operative PIL Writ Petition number.<br/>• Authority delegation: `StatutoryNoticeAuthority` has no Tahsildar default; pending government order specifying signing ranks.<br/>• Notice generation strictly refuses if no `DistrictLegalConfig` exists. |
| **M1** | **Field Operations & Mobile Evidence App**<br/>• Dynamic token auth (`/api/auth/login/`), mandatory remarks ($\ge 10$ chars), dynamic officer context.<br/>• MinIO/S3 object storage with signed HMAC URLs & safe base64 migration command.<br/>• Offline inspection queue (`QueuedInspection`) & HTTP 409 concurrency conflict dialog.<br/>• Dual configurable spatial tolerances: 15m physical geofence & 50m photo EXIF mismatch limit.<br/>• Satellite Feasibility Kit (NDBI/NDVI/NDWI differencing with offline fixtures, labeled `FIXTURE SELF-TEST`). | **BUILT / FIELD TEST PENDING** | • Real field test on physical Android device with cellular network toggled off.<br/>• User review of conflict resolution choice: "Re-apply my changes on latest version" + visual diff.<br/>• Survey Department official sample FMB files to replace indicative sketches. |
| **M2** | **Lanes & Accuracy Ledger (Next Up)**<br/>• Separation of Land Priority Classes (A to D by land type) from Confidence Lanes (High / Medium / Low).<br/>• Wilson 95% binomial confidence intervals $[CI_{\text{lower}} - CI_{\text{upper}}]$.<br/>• Statistical honesty threshold $n < 30$: displays `"Insufficient data (n < 30)"`. | **SPECIFIED / READY TO BUILD** | • Step 1 build: Implement `AccuracyLedgerService` API endpoint & dual priority/lane badge serializers.<br/>• Zero database migrations. |
| **M3** | **Watch Zones & Review Scheduler**<br/>• Celery worker + Redis message broker.<br/>• Automated review scheduler for low-lane watch zones and statutory SLA timers. | **PENDING** | • Celery + Redis docker container definition and periodic task scheduling. |
| **M4** | **Data-Source Layer (8 Adapters)**<br/>• `ExternalSource` model registry.<br/>• 8 Government Adapters: TNGIS, CollabLand, Tamil Nilam, STAR 3.0, TNUHDB, Copernicus, CCTNS, CM Helpline.<br/>• All 8 adapters created and **disabled by default**. | **PENDING** | • Implementation of adapter interfaces with explicit disabled flags and connection mocks. |
| **M5** | **Remaining Web Pages + Tamil Text + Real Salem Data Import**<br/>• Remaining role-specific web views.<br/>• ReportLab Tamil typography & font embedding tests.<br/>• Import hierarchy and cadastral data for pilot district (Salem, data to be supplied). | **PENDING** | • User provision of official Salem cadastral and A-Register data exports.<br/>• Automated visual/text extraction tests for Tamil script in ReportLab. |
| **M6** | **Detection Test + Load Tests + Monitoring + Privacy Docs + Pilot Report**<br/>• Live satellite detection benchmark run against real ground-truth sites.<br/>• Locust load testing for public verify and work-queue endpoints.<br/>• Structured JSON logging, DPDP Act 2023 compliance documentation, and final executive pilot report. | **PENDING** | • Production deployment validation and pilot readiness sign-off. |

---

## 🛡️ Statutory Legal Disclaimers (Active Across All Modules)

1. **Indicative Survey Sketches:** All FMB cadastral sketches generated from polygon boundary geometries carry the persistent notice: `[INDICATIVE FMB – computed from parcel geometry, not a certified survey measurement]`. Certified survey ladder parsing is held pending provision of official survey files.
2. **Deny-by-Default Authority:** If an officer attempts a statutory action not explicitly configured in `StatutoryNoticeAuthority`, the system denies the request. Notice documents output `STATUTORY AUTHORITY PENDING OFFICIAL DESIGNATION`.
3. **Configurable District Timelines:** All statutory reply deadlines (e.g. 15 days) and eviction grace periods (e.g. 7 days) are loaded dynamically from `DistrictLegalConfig`. If no legal config exists for a district, notice generation refuses with an explicit configuration error.
