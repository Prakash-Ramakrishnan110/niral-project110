# GEOMMAND Project Backlog & Open Items for Human Owners

**Last Updated:** October 2026  
**Document:** `docs/BACKLOG.md`  
**Status:** Active  

---

## 1. Critical Open Items for Human Owners (Do Not Guess)

The following items require official decisions or access from government stakeholders and legal counsel before production sign-off:

| # | Open Item Description | Stakeholder / Authority | Impact / Scope | Action Required |
|---|---|---|---|---|
| **1** | **Judicial Verification of Writ Petition Number** | Government Pleader / High Court Registry | High Court ATR Affidavit header | Verify whether the operative Division Bench waterbody order is **W.P. No. 34091 of 2023** or **W.P. No. 18420 of 2024**, or make it dynamic per District Collector case file. |
| **2** | **Statutory Legal Review of Section 7 & Section 6 Templates** | Revenue Pleader / Spl. Govt. Pleader (Taxes & Land) | Eviction Notices & Warrants under TN Act III of 1905 | Obtain formal legal sign-off on notice wording, bilingual Tamil phrases, and survey ladder disclaimers. |
| **3** | **Tamil Nilam / WebFMB / TNGIS Data Feed & API Licencing** | Commissioner of Land Administration (CLA) / Survey & Settlement Dept | Cadastral parcel polygons & real FMB ladder offsets | Secure official API credentials or shapefile export protocol for Salem District A-Register and CollabLand FMB data. |
| **4** | **Guideline Valuation Dataset Authority** | Inspector General of Registration (STAR 3.0 / TN Reg Dept) | Land value-at-risk calculations | Obtain structured CSV/database feed of street/survey guideline values (₹/sq.ft) to replace mock valuations. |
| **5** | **Hosting & Data Residency (State Data Centre vs Cloud)** | TNeGA / NIC Tamil Nadu | Infrastructure & DPDP Act 2023 compliance | Determine if production workloads and satellite archives must reside within the State Data Centre (ELCOT/SDC) or MeitY-empanelled cloud. |
| **6** | **TNUHDB Humanitarian Routing Protocol** | Tamil Nadu Urban Habitat Development Board | Welfare routing for vulnerable dwellings | Establish formal API or SOP for forwarding thatched hut cases to the District Housing Welfare Officer. |

---

## 2. Technical Debt & Implementation Backlog

- [ ] **TD-01:** Migrate Base64 photos from PostgreSQL `FieldVerification.photos` to MinIO/S3 object storage with signed URLs and SHA-256 deduplication.
- [ ] **TD-02:** Replace synthetic FMB offset heuristics with real CollabLand FMB geometry parsing when official survey files are provided.
- [ ] **TD-03:** Deploy Celery + Redis task queue for asynchronous PDF generation and Copernicus satellite ingestion.
- [ ] **TD-04:** Add real QR code image rendering on Section 7 notices linking to public verification endpoint `/api/v1/verify/{doc_hash}/`.
