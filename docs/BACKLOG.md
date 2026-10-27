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
| **7** | **TNUHDB Humanitarian Routing Protocol** | Tamil Nadu Urban Habitat Development Board | Welfare routing for vulnerable dwellings | Establish formal API or SOP for forwarding thatched hut cases to the District Housing Welfare Officer. |
| **8** | **Statutory Timelines under TN Act III of 1905 (UNCONFIRMED)** | Revenue Dept / Spl. Govt. Pleader | Section 7 show-cause reply, Section 6 vacate window, and appeal limitations | **UNVERIFIED - pending legal review**: Confirm exact statutory reply windows (commonly referenced as 15 days for standard Form A show-cause; 48 hours for emergency waterbody obstruction), eviction vacate periods, and pandal grace timers. System must load all durations from `DistrictLegalConfig` per district; zero hardcoded literals in code. |

---

## 2. Technical Debt & Implementation Backlog

- [ ] **TD-01:** Migrate Base64 photos from PostgreSQL `FieldVerification.photos` to MinIO/S3 object storage with signed URLs and SHA-256 deduplication.
- [ ] **TD-02:** Replace synthetic FMB offset heuristics with real CollabLand FMB geometry parsing when official survey files are provided.
- [ ] **TD-03:** Deploy Celery + Redis task queue for asynchronous PDF generation and Copernicus satellite ingestion.
- [ ] **TD-04:** Add real QR code image rendering on Section 7 notices linking to public verification endpoint `/api/v1/verify/{doc_hash}/`.
