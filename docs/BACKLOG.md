# GEOMMAND Project Backlog & Open Items for Human Owners

**Last Updated:** October 2026  
**Document:** `docs/BACKLOG.md`  
**Status:** Active  

---

## 1. Critical Open Items for Human Owners (Do Not Guess)

The following items require official decisions or access from government stakeholders and legal counsel before production sign-off:

| # | Open Item Description | Stakeholder / Authority | Impact / Scope | Action Required |
|---|---|---|---|---|
| **1** | **Judicial Verification of Writ Petition Number (UNRESOLVED CONFLICT)** | Government Pleader / High Court Registry | High Court ATR Affidavit header | **UNRESOLVED CONFLICT**: The hackathon prototype referenced *W.P. No. 34091 of 2023*, while recent PIL compliance filings reference *W.P. No. 18420 of 2024*. The system must NOT hardcode either writ number. Pending judicial verification from the Government Pleader, every ATR requires the operative writ number to be supplied or configured per district in `DistrictCourtOrderMapping`. |
| **2** | **Statutory Notice Authority Delegation (UNCONFIRMED)** | Revenue Dept / Law Dept / CLA | Sections 7 & 6 of TN Act III of 1905 | Confirm exact officer ranks empowered to sign Section 7 show-cause notices and Section 6 eviction orders. Current schema treats this as configurable data (`StatutoryNoticeAuthority`) with Tahsildar as unconfirmed default, pending formal government orders / legal confirmation. |
| **3** | **Statutory Legal Review of Section 7 & Section 6 Templates** | Revenue Pleader / Spl. Govt. Pleader (Taxes & Land) | Eviction Notices & Warrants under TN Act III of 1905 | Obtain formal legal sign-off on notice wording, bilingual Tamil phrases, and survey ladder disclaimers. |
| **4** | **Tamil Nilam / WebFMB / TNGIS Data Feed & API Licencing** | Commissioner of Land Administration (CLA) / Survey & Settlement Dept | Cadastral parcel polygons & real FMB ladder offsets | Secure official API credentials or shapefile export protocol for statewide A-Register and CollabLand FMB data. |
| **5** | **Guideline Valuation Dataset Authority** | Inspector General of Registration (STAR 3.0 / TN Reg Dept) | Land value-at-risk calculations | Obtain structured CSV/database feed of street/survey guideline values (₹/sq.ft) to replace mock valuations. |
| **6** | **Hosting & Data Residency (State Data Centre vs Cloud)** | TNeGA / NIC Tamil Nadu | Infrastructure & DPDP Act 2023 compliance | Determine if production workloads and satellite archives must reside within the State Data Centre (ELCOT/SDC) or MeitY-empanelled cloud. |
| **7** | **TNUHDB Humanitarian Rehabilitation Protocol (UNCONFIRMED)** | Tamil Nadu Urban Habitat Development Board | Welfare routing for vulnerable dwellings | Establish formal API or SOP for forwarding thatched hut cases to the District Housing Welfare Officer. Do not name or assume any specific housing scheme until official protocol is formally signed off. |
| **8** | **Statutory Timelines under TN Act III of 1905 (UNCONFIRMED)** | Revenue Dept / Spl. Govt. Pleader | Section 7 show-cause reply, Section 6 vacate window, and appeal limitations | **UNVERIFIED - pending legal review**: Confirm exact statutory reply windows (commonly referenced as 15 days for standard Form A show-cause; 48 hours for emergency waterbody obstruction), eviction vacate periods, and pandal grace timers. System must load all durations from `DistrictLegalConfig` per district; zero hardcoded literals in code. |
| **9** | **Ex-Parte Section 6 Procedure on Notice Non-Response (LEGAL RULE UNKNOWN)** | Revenue Dept / Government Pleader | Section 7 non-response to Section 6 transition | **LEGAL RULE UNKNOWN**: Confirm statutory mechanism and evidentiary burden required when an occupant fails to respond to a Section 7 notice within the stipulated window. Does the Tahsildar pass an ex-parte order directly, or is a mandatory spot-inspection/default hearing required prior to Section 6 issuance? |

---

## 2. Fixed Legal Phrases Across PDF Generators (Pending Official Legal Review) - UNVERIFIED

All statutory citations, judicial headers, procedural timelines, and affidavit wording across report generators are cataloged below. Zero legal text is assumed authoritative until signed off by the Special Government Pleader / Revenue Administration:

| Generator File | Location | Fixed Legal Text / Parameter | Statutory / Judicial Context | Status / Mitigation |
|---|---|---|---|---|
| `high_court_compliance.py` | Header Line 84 | `(Special Original Jurisdiction - [SPECIAL BENCH JURISDICTION - NOT CONFIGURED, PENDING LEGAL REVIEW])` | Roster designation of High Court Bench hearing PIL | **UNVERIFIED**: Removed invented "Waterbody Protection Bench". Accepts `bench_name` param; defaults to explicit unverified placeholder. |
| `high_court_compliance.py` | Preamble Line 93 | `IN COMPLIANCE WITH DIRECTIONS OF THE HON'BLE MADRAS HIGH COURT ([ORDER DATE NOT CONFIGURED - PENDING JUDICIAL VERIFICATION])` | High Court writ petition interim/final order date | **UNVERIFIED**: Removed invented dynamic `datetime.now()` date. Accepts `order_date` param; defaults to unconfigured notice. |
| `high_court_compliance.py` | Title Line 86 | `IN THE MATTER OF: {str(writ_petition_no).upper()}` | Writ petition case number | **UNVERIFIED**: Requires explicit `writ_no` param with 400 validation; defaults to `W.P. No. [NOT CONFIGURED]`. |
| `high_court_compliance.py` | Section Head Line 94 | `FOR THE RESTORATION AND REMOVAL OF ENCROACHMENTS IN WATERBODIES (ERI / KULAM / ODDAI)` | Judicial direction scope for waterbody PILs | **UNVERIFIED**: Pending Law Dept / Spl Govt Pleader review of operative court prayer text. |
| `high_court_compliance.py` | Verification Line 184 | `Verified at {district} on [EXECUTION DATE PENDING SWORN ATTESTATION]` | Sworn attestation affidavit clause | **UNVERIFIED**: Removed dynamic today's date. Requires notarised/deponent signing date on physical affidavit execution. |
| `high_court_compliance.py` | Signatory Line 190 | `Counsel for the State of Tamil Nadu, High Court, Madras` & `DISTRICT COLLECTOR & DISTRICT MAGISTRATE (Sworn Attestation Pending)` | Counsel and deponent signature blocks | **UNVERIFIED**: Pending High Court Standing Counsel formal verification of deponent designation. |
| `legal_notice_pdf.py` | Header Line 107 | `GOVERNMENT OF TAMIL NADU / REVENUE & DISASTER MANAGEMENT DEPARTMENT / OFFICE OF THE TAHSILDAR` | Departmental heading | **UNVERIFIED**: Standard department nomenclature under Revenue Administration. |
| `legal_notice_pdf.py` | Notice Title Line 121 | `FORM OF NOTICE UNDER SECTION 7 OF THE TAMIL NADU LAND ENCROACHMENT ACT, 1905 (TAMIL NADU ACT III OF 1905)` | Statutory form title under Act III of 1905 | **UNVERIFIED**: Matches statutory schedule heading of TN Act III of 1905 Form A; pending Law Dept template certification. |
| `legal_notice_pdf.py` | Notice Preamble Line 134 | `WHEREAS, satellite surveillance and on-ground cadastral verification show that you have entered upon and unauthorizedly occupied Government land classified as {classification}...` | Statutory recitals and grounds of show-cause | **UNVERIFIED**: Evidentiary recital coupling satellite detection with cadastral overlap; pending Spl Govt Pleader sign-off. |
| `legal_notice_pdf.py` | Show Cause Mandate Line 136 | `NOW, THEREFORE, take notice that you are hereby required to show cause in writing or in person before the Tahsildar... on or before {reply_deadline} (within 15 days of service of this notice), why you should not be summarily evicted... under Section 6... and why the structures, crops or building materials erected thereon should not be forfeited.` | Statutory mandate and show-cause timeline | **UNVERIFIED**: 15-day statutory window must be loaded from `DistrictLegalConfig`; default 15-day period pending confirmation for emergency vs standard encroachers. |
| `legal_notice_pdf.py` | Schedule Table Line 142 | `SCHEDULE OF UNAUTHORIZED OCCUPATION` | Statutory property schedule | **UNVERIFIED**: Formal format for cadastral boundaries and extent schedule. |
| `legal_notice_pdf.py` | FMB Disclaimer Line 171 | `[DISCLAIMER: INDICATIVE - computed from polygon geometry, not a certified survey measurement]` | Survey ladder legal disclaimer | **UNVERIFIED / ACTIVE GUARD**: Essential judicial safeguard protecting officers against Section 7 challenge on uncertified sketches. |
| `legal_notice_pdf.py` | Signatory Line 216 | `TAHSILDAR & EXECUTIVE MAGISTRATE, {taluk} TALUK, {district} DISTRICT` | Issuing authority rank | **UNVERIFIED**: Authority delegation under Section 7/Section 6 must be legally verified (see Item 2 above). |

---

## 3. Technical Debt & Implementation Backlog

- [ ] **TD-01:** Migrate Base64 photos from PostgreSQL `FieldVerification.photos` to MinIO/S3 object storage with signed URLs and SHA-256 deduplication.
- [ ] **TD-02:** Replace synthetic FMB offset heuristics with real CollabLand FMB geometry parsing when official survey files are provided.
- [ ] **TD-03:** Deploy Celery + Redis task queue for asynchronous PDF generation and Copernicus satellite ingestion.
- [ ] **TD-04:** Add real QR code image rendering on Section 7 notices linking to public verification endpoint `/api/v1/verify/{doc_hash}/`.
- [x] **TD-05:** ~~Stop-gap UserProfile jurisdiction matching is single-string case-insensitive (district/taluk/village).~~ **RESOLVED** via `OfficerAssignment` and `ScopedOfficerQuerysetMixin` with canonical hierarchy models (`District`, `Taluk`, `RevenueVillage`), tenures, and deny-by-default scoping.
- [ ] **TD-06:** In production, httpOnly refresh cookie transmission requires web frontend and Django API to be hosted on the same origin (reverse proxy) to satisfy SameSite=Strict / Secure cookie policies.
