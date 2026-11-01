# GEOMMAND Project Backlog & Open Items for Human Owners

**Last Updated:** November 2026  
**Document:** `docs/BACKLOG.md`  
**Status:** Active  

---

## 1. Critical Open Items for Human Owners (Do Not Guess)

The following items require official decisions or access from government stakeholders and legal counsel before production sign-off. All statutory procedures and timelines are **UNVERIFIED** pending formal Law Department certification:

| # | Open Item Description | Stakeholder / Authority | Impact / Scope | Action Required |
|---|---|---|---|---|
| **1** | **Judicial Verification of Writ Petition Number (UNRESOLVED CONFLICT)** | Government Pleader / High Court Registry | High Court ATR Affidavit header | **UNRESOLVED CONFLICT**: Prototype referenced *W.P. No. 34091 of 2023*, while PIL compliance filings reference *W.P. No. 18420 of 2024*. The system must NOT hardcode either writ number. Every ATR requires the operative writ number to be configured per district in `DistrictLegalConfig`. |
| **2** | **Statutory Notice Authority Delegation (UNCONFIRMED / DENY BY DEFAULT)** | Revenue Dept / Law Dept / CLA | Sections 7 & 6 of TN Act III of 1905 | **DENY BY DEFAULT**: `StatutoryNoticeAuthority` must NOT default to Tahsildar. Demo/test seeds configure it explicitly and are labeled **UNVERIFIED**. If no authority is configured for a statutory action, execution is denied and documents state `STATUTORY AUTHORITY PENDING OFFICIAL DESIGNATION`. |
| **3** | **Statutory Legal Review of Section 7 & Section 6 Templates (UNVERIFIED)** | Revenue Pleader / Spl. Govt. Pleader (Taxes & Land) | Eviction Notices & Warrants under TN Act III of 1905 | **UNVERIFIED**: Obtain formal legal sign-off on notice wording, bilingual Tamil phrases, and survey ladder disclaimers. |
| **4** | **Tamil Nilam / WebFMB / TNGIS Data Feed & API Licencing** | Commissioner of Land Administration (CLA) / Survey & Settlement Dept | Cadastral parcel polygons & real FMB ladder offsets | Secure official API credentials or shapefile export protocol for statewide A-Register and CollabLand FMB data. |
| **5** | **Guideline Valuation Dataset Authority** | Inspector General of Registration (STAR 3.0 / TN Reg Dept) | Land value-at-risk calculations | Obtain structured CSV/database feed of street/survey guideline values (₹/sq.ft) to replace mock valuations. |
| **6** | **Hosting & Data Residency (State Data Centre vs Cloud)** | TNeGA / NIC Tamil Nadu | Infrastructure & DPDP Act 2023 compliance | Determine if production workloads and satellite archives must reside within the State Data Centre (ELCOT/SDC) or MeitY-empanelled cloud. |
| **7** | **TNUHDB Humanitarian Rehabilitation Protocol (UNCONFIRMED)** | Tamil Nadu Urban Habitat Development Board | Welfare routing for vulnerable dwellings | Establish formal API or SOP for forwarding thatched hut cases to the District Housing Welfare Officer. Do not name or assume any specific housing scheme until official protocol is formally signed off. |
| **8** | **Statutory Timelines under TN Act III of 1905 (UNCONFIRMED)** | Revenue Dept / Spl. Govt. Pleader | Section 7 show-cause reply, Section 6 vacate window, and appeal limitations | **UNVERIFIED**: Remove hardcoded "15 days / 7 days" and "7-day SLA timers" from code and plans. All durations are per-district settings in `DistrictLegalConfig`, marked **UNVERIFIED**. Zero hardcoded duration literals in logic. |
| **9** | **Ex-Parte Section 6 Procedure on Notice Non-Response (LEGAL RULE UNKNOWN)** | Revenue Dept / Government Pleader | Section 7 non-response to Section 6 transition | **LEGAL RULE UNKNOWN**: Confirm statutory mechanism when an occupant fails to respond to a Section 7 notice. System does NOT automatically issue Section 6; explicit hearing or default review is required. |
| **10** | **Certified CollabLand FMB Parser Protocol** | Directorate of Survey & Settlement | Automated FMB survey ladder parsing | **HOLD**: Do NOT build a synthetic `.dxf` parser without official sample survey files from the Survey Department. Continue rendering indicative sketches with explicit `[INDICATIVE FMB]` disclaimers. |
| **11** | **Satellite Ingestion vs Feasibility Test Kit** | Space Applications Centre / NRSC / Copernicus | Change detection verification | **SCOPE GUARD**: Do NOT build a continuous 5-day ingestion pipeline or claim trench detection at 10m. Maintain the Feasibility Test Kit (`SatelliteFeasibilityKit`) evaluating ground-truth CSVs for precision, recall, smallest detectable area, and cloud-gap statistics with offline fixtures. |
| **12** | **Dual Configurable Spatial Tolerances** | Revenue Administration / Technical Lead | On-site anti-fraud enforcement | System enforces two independent configurable limits: 1) Physical Geofence tolerance (`GEOFENCE_TOLERANCE_METERS`, default 15m), and 2) Camera EXIF mismatch limit (`PHOTO_EXIF_MISMATCH_LIMIT_METERS`, default 50m). Screens and audit events explicitly identify which check failed. |

---

## 2. Fixed Legal Phrases Across PDF Generators (Pending Official Legal Review) - UNVERIFIED

All statutory citations, judicial headers, procedural timelines, and affidavit wording across report generators are cataloged below. Zero legal text is assumed authoritative until signed off by the Special Government Pleader / Revenue Administration:

| Generator File | Location | Fixed Legal Text / Parameter | Statutory / Judicial Context | Status / Mitigation |
|---|---|---|---|---|
| `high_court_compliance.py` | Header Line 84 | `(Special Original Jurisdiction - [SPECIAL BENCH JURISDICTION - NOT CONFIGURED, PENDING LEGAL REVIEW])` | Roster designation of High Court Bench hearing PIL | **UNVERIFIED**: Accepts `bench_name` param; defaults to explicit unverified placeholder. |
| `high_court_compliance.py` | Preamble Line 93 | `IN COMPLIANCE WITH DIRECTIONS OF THE HON'BLE MADRAS HIGH COURT ([ORDER DATE NOT CONFIGURED - PENDING JUDICIAL VERIFICATION])` | High Court writ petition interim/final order date | **UNVERIFIED**: Accepts `order_date` param; defaults to unconfigured notice. |
| `high_court_compliance.py` | Title Line 86 | `IN THE MATTER OF: {str(writ_petition_no).upper()}` | Writ petition case number | **UNVERIFIED**: Requires explicit `writ_no` param with 400 validation; defaults to `W.P. No. [NOT CONFIGURED]`. |
| `high_court_compliance.py` | Section Head Line 94 | `FOR THE RESTORATION AND REMOVAL OF ENCROACHMENTS IN WATERBODIES (ERI / KULAM / ODDAI)` | Judicial direction scope for waterbody PILs | **UNVERIFIED**: Pending Law Dept / Spl Govt Pleader review of operative court prayer text. |
| `high_court_compliance.py` | Verification Line 184 | `Verified at {district} on [EXECUTION DATE PENDING SWORN ATTESTATION]` | Sworn attestation affidavit clause | **UNVERIFIED**: Requires notarised/deponent signing date on physical affidavit execution. |
| `high_court_compliance.py` | Signatory Line 190 | `Counsel for the State of Tamil Nadu, High Court, Madras` & `DISTRICT COLLECTOR & DISTRICT MAGISTRATE (Sworn Attestation Pending)` | Counsel and deponent signature blocks | **UNVERIFIED**: Pending High Court Standing Counsel formal verification of deponent designation. |
| `legal_notice_pdf.py` | Header Line 107 | `GOVERNMENT OF TAMIL NADU / REVENUE & DISASTER MANAGEMENT DEPARTMENT` | Departmental heading | **UNVERIFIED**: Standard department nomenclature under Revenue Administration. |
| `legal_notice_pdf.py` | Notice Title Line 121 | `FORM OF NOTICE UNDER SECTION 7 OF THE TAMIL NADU LAND ENCROACHMENT ACT, 1905 (TAMIL NADU ACT III OF 1905)` | Statutory form title under Act III of 1905 | **UNVERIFIED**: Matches statutory schedule heading of TN Act III of 1905 Form A; pending Law Dept template certification. |
| `legal_notice_pdf.py` | Notice Preamble Line 134 | `WHEREAS, satellite surveillance and on-ground cadastral verification show that you have entered upon and unauthorizedly occupied Government land classified as {classification}...` | Statutory recitals and grounds of show-cause | **UNVERIFIED**: Evidentiary recital coupling satellite detection with cadastral overlap; pending Spl Govt Pleader sign-off. |
| `legal_notice_pdf.py` | Show Cause Mandate Line 136 | `NOW, THEREFORE, take notice that you are hereby required to show cause... on or before {reply_deadline} (within {reply_window} days of service hereof [UNVERIFIED DISTRICT TIMELINE])...` | Statutory mandate and show-cause timeline | **UNVERIFIED**: Reply window loaded dynamically from `DistrictLegalConfig`; labeled unverified. |
| `legal_notice_pdf.py` | Schedule Table Line 142 | `SCHEDULE OF UNAUTHORIZED OCCUPATION` | Statutory property schedule | **UNVERIFIED**: Formal format for cadastral boundaries and extent schedule. |
| `legal_notice_pdf.py` | FMB Disclaimer Line 171 | `[DISCLAIMER: INDICATIVE - computed from polygon geometry, not a certified survey measurement]` | Survey ladder legal disclaimer | **UNVERIFIED / ACTIVE GUARD**: Essential judicial safeguard protecting officers against Section 7 challenge on uncertified sketches. |
| `legal_notice_pdf.py` | Signatory Line 287 | `{sig_designation}, {taluk} TALUK, {district} DISTRICT` | Issuing authority rank | **UNVERIFIED**: Dynamic delegation from `StatutoryNoticeAuthority`; labeled UNVERIFIED. |

---

## 3. Technical Debt & Implementation Roadmap

- [x] **TD-01 (M1-02):** Migrate Base64 photos from PostgreSQL to MinIO/S3 object storage with signed URLs and safe migration command (`migrate_base64_photos`). **RESOLVED (Commit `4b5cca2`)**.
- [ ] **TD-02:** Replace indicative FMB geometry with certified CollabLand FMB geometry parsing when official survey files are provided.
- [ ] **TD-03:** Deploy Celery + Redis task queue for asynchronous PDF generation, watch zones, and review scheduler.
- [x] **TD-04:** Embed scannable 2D QR codes in Section 7/6 PDFs linking to `/api/v1/verify/{doc_hash}/` with rate limiting and zero PII. **RESOLVED (Commit `8cc1b5e`)**.
- [x] **TD-05:** Deny-by-default administrative jurisdiction scoping via `OfficerAssignment` and `ScopedOfficerQuerysetMixin`. **RESOLVED**.
- [ ] **TD-06:** In production, httpOnly refresh cookie transmission requires web frontend and Django API to be hosted on the same origin (reverse proxy) to satisfy SameSite=Strict / Secure cookie policies.

---

## 4. Next Build Order (Strict Sequential Milestones)

Each milestone must include automated tests and stop for user review prior to database migrations:

1. **Lanes and Accuracy Ledger:**
   - Wilson 95% confidence intervals per confidence lane (High / Medium / Low).
   - Minimum sample size threshold $n$ before publishing verified accuracy percentage.
2. **Watch Zones & Review Scheduler:**
   - Background periodic worker using Celery + Redis.
   - Low-lane watch zone re-checks and statutory review timers.
3. **ExternalSource Registry & Adapters:**
   - Model registry for 8 external government adapters (TNGIS, CollabLand, Tamil Nilam, STAR 3.0, TNUHDB, Copernicus, CCTNS, CM Helpline).
   - All 8 adapters created and disabled by default.
4. **Tamil Text Rendering & PDF Font Tests:**
   - Automated visual and text-extraction tests verifying zero mojibake or glyph clipping for Tamil script in ReportLab notices.
5. **Dharmapuri Hierarchy Import:**
   - Import script ready for certified Dharmapuri District revenue hierarchy upon user provision of official data files.
6. **Load Testing, Observability & Privacy Documentation:**
   - Locust load tests for statutory verify and work-queue endpoints.
   - Structured JSON logging and statutory data privacy documentation pursuant to DPDP Act 2023.
