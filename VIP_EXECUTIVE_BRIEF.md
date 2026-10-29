# GEOMMAND — VIP Executive Briefing & Policy Summary
## Periodic Satellite Surveillance & Statutory Land Recovery Workflow
**Prepared for:** High-Level Evaluation Authority, Government of Tamil Nadu  
**Initiative:** Niral Thiruvizha 2026 (Naan Mudhalvan) — Final Jury Review  
**Project:** GEOMMAND (Geo-Command Land Administration Platform)  
**Authors:** Prakash Ramakrishnan, Mukesh S, Vidhyapathi R

---

## 1. At a Glance: Executive Problem & Workflow Transformation

| Conventional Administration | The GEOMMAND Operational Workflow |
| :--- | :--- |
| **Reaction Time:** 6 to 24 months (Discovered only after permanent RCC structure completion). | **Detection Time:** 5-day revisit cycle (Flags boundary excavation and masonry walls during foundation stage). |
| **Inspection Methodology:** Manual foot patrol across thousands of village parcels by overburdened VAOs. | **Inspection Methodology:** Automated 5-day Sentinel-2 optical change differencing cross-referenced with PostGIS cadastral layers. |
| **Legal Vulnerability:** Evictions stayed in Court due to unverified dates, vague allegations, or procedural shortcuts. | **Statutory Integrity:** Strictly adheres to due process under **Tamil Nadu Land Encroachment Act (Act III of 1905)** with mandatory Section 7 show-cause windows and geotagged evidence. |
| **Data Scope:** Siloed physical registers across taluks. | **Statewide Architecture:** Unified spatial database with strict jurisdictional scoping; current pilot database holds 39 parcels across Salem, Coimbatore, and Chennai. |

---

## 2. Core Operational Workflow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       SPACE-TO-GROUND VERIFICATION                          │
│                                                                             │
│   [ Satellite: Sentinel-2 ]                                                 │
│             │ (5-Day Revisit Cycle)                                         │
│             ▼                                                               │
│   [ Change Detection Node ] ──► Multispectral differencing on monitored     │
│             │                   government land boundaries                  │
│             ▼                                                               │
│   [ PostGIS Cadastral Check ] ─► ST_Intersects on Waterbody & Poramboke     │
│             │                                                               │
│             ▼                                                               │
│   [ Field Task Dispatch ]   ──► VAO Geofenced (<50m) On-Site Inspection     │
│             │                                                               │
│             ▼                                                               │
│   [ Statutory Review ]      ──► Tahsildar reviews real evidence; issues     │
│                                  Section 7 Show-Cause Notice under Act 1905 │
└─────────────────────────────────────────────────────────────────────────────┘
```

1. **5-Day Satellite Change Ingestion:** Periodic multispectral differencing flags surface changes across waterbodies (*Eri, Kulam, Odai*), forest margins, and poramboke parcels.
2. **Tamil Nilam & Cadastral Synchronization:** Cross-references Revenue Department 'A' Register classifications, survey numbers, and subdivision boundaries.
3. **Geofenced Field Ground Truth:** The Flutter mobile application requires physical GPS proximity ($< 50\text{m}$) before allowing inspection report submission, capturing timestamped and geotagged photographic evidence.
4. **Statutory Human Authorization:** No automated evictions. Detections solely generate field tasks; notice issuance and eviction warrants require authenticated Tahsildar/Collector execution under **Tamil Nadu Act III of 1905**.

---

## 3. High-Impact Demonstration Case: Salem West Pilot

During the live demonstration, the following scenario in **Salem West Taluk** illustrates the end-to-end statutory workflow:

* **Location:** Mookaneri Lake Poramboke, Kannankurichi Village, Salem West.
* **Cadastral Record:** Survey No. **142/1A** | Classification: `Water Body Poramboke`
* **The Detection:** Optical differencing detects possible new footprint measuring **2,400 sq.ft**.
* **Statutory Human-in-the-Loop Progression:**
  1. System creates a pending ground verification task for the Kannankurichi VAO.
  2. VAO conducts physical on-site inspection within GPS geofence and submits factual inspection verdict with photographic evidence.
  3. Revenue Inspector verifies report and forwards to Tahsildar.
  4. Tahsildar reviews cadastral overlap, confirms indicative survey ladder, and authorizes an official **Section 7 Show-Cause Notice** allowing mandatory statutory reply period under Act III of 1905.

---

## 4. Key Questions & Administrative Realities

### Q1: "How does the system handle statewide scale across 38 districts?"
> **Answer:** GEOMMAND implements server-side pagination, tile caching via GeoServer, and PostGIS R-Tree spatial indices (`geom USING GIST`). Statewide officers see aggregate metrics; district and taluk officers only query parcels within their assigned jurisdiction.

### Q2: "Can field officers falsely submit inspection reports from elsewhere?"
> **Answer:** No. The mobile application strictly checks hardware GPS coordinates against parcel polygon boundaries; submission is blocked if the officer is $> 50\text{m}$ away from the surveyed parcel centroid.

### Q3: "Does the platform comply with Madras High Court directions?"
> **Answer:** Yes. The platform includes a dedicated High Court Judicial Compliance generator producing Action Taken Reports (ATRs) strictly scoped to waterbody parcels within the deponent Collector's district, with explicit disclaimers and zero synthetic filler data.

---

## 5. Technology Stack Summary

* **Frontend Dashboard:** React 18, Tailwind CSS, Leaflet, React-Leaflet
* **Mobile Field Terminal:** Flutter (Dart), Geolocator, Image Picker
* **Backend Architecture:** Python 3.12, Django 6, Django REST Framework, GeoDjango
* **Spatial Database:** PostgreSQL 15, PostGIS 3.3 (SRID 4326 WGS 84, GIST Spatial Indexing)
* **Security & Auth:** django-axes brute-force protection, SimpleJWT token rotation, server-side deny-by-default role authorization
