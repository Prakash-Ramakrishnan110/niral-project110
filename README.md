# GEOMMAND — GIS-Based Mapping & Satellite Surveillance for Government Land Protection

[![Tamil Nadu Revenue Administration](https://img.shields.io/badge/Government_of-Tamil_Nadu-blue.svg)](https://www.tn.gov.in/)
[![Niral Thiruvizha 2026](https://img.shields.io/badge/Hackathon-Niral_Thiruvizha_2026-orange.svg)](https://naanmudhalvan.tn.gov.in/)
[![Spatial Stack](https://img.shields.io/badge/Spatial-PostgreSQL_|_PostGIS_|_GeoServer-green.svg)](https://postgis.net/)

> **Periodic space-to-ground monitoring pipeline supporting revenue officers in detecting possible construction on government poramboke lands, waterbodies, and highway margins across Tamil Nadu under statutory due process (TN Act III of 1905).**

---

## 📚 Project Documentation

* 📄 **[docs/CURRENT_STATE.md](docs/CURRENT_STATE.md)** — Verified technical baseline generated from runtime code, database models, and test suite.
* 📄 **[docs/BACKLOG.md](docs/BACKLOG.md)** — Open items for human owners, unverified statutory citations, and technical roadmap.
* 📄 **[VIP_EXECUTIVE_BRIEF.md](VIP_EXECUTIVE_BRIEF.md)** — High-level briefing document for senior administrative officers and evaluation jury.
* 📄 **[VIDEO_SCRIPT.md](VIDEO_SCRIPT.md)** — Factual video narration script based on real 5-day satellite revisit workflow.

---

## 🏛️ System Principles & Architecture

1. **Human-in-the-Loop Statutory Process:** Satellite differencing flags potential physical changes every 5 days. Detections do not execute automatic actions; they route geofenced ground verification tasks to Village Administrative Officers (VAOs).
2. **Strict Server-Side Authorization:** The server decides all allowable officer actions based on statutory role (Collector, Tahsildar, State Apex, DVAC Auditor, Field VAO, GIS Admin) and jurisdictional district/taluk scoping.
3. **Evidence Over Simulation:** All cadastral measurements, change footprints, and legal notice schedules strictly reflect database records with explicit honesty badges (`DEMO/SYNTHETIC`, `INDICATIVE FMB`) where certified data is pending.
4. **Current Data Footprint:** Active development database contains 39 cadastral parcels and 160 alerts across Salem, Coimbatore, and Chennai with PostGIS R-Tree spatial indexing, architected for statewide rollout.

---

## ⚡ Local Development Services

```bat
# Start Docker backend services:
docker compose up -d

# Publish ports:
# land_backend   -> http://localhost:8000
# land_db        -> localhost:5435 (PostGIS 15-3.3)
# land_geoserver -> http://localhost:8081/geoserver
# land_adminer   -> http://localhost:8080
```

### Command Portals
* **Tactical Command Dashboard:** `http://localhost:5173`
* **Field Officer Mobile App (Flutter):** `http://localhost:5174`
* **Django API / Admin:** `http://localhost:8000/admin/`
* **GeoServer Spatial Portal:** `http://localhost:8081/geoserver`
* **Adminer Database Console:** `http://localhost:8080`

---
*GEOMMAND Platform — Revenue & Disaster Management Department, Government of Tamil Nadu.*
