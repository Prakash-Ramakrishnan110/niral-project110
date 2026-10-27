**GEOMMAND  |  Startup Strategy & Pitch Guide** 

Tamil Nadu Land Encroachment Monitoring 

# **GEOMMAND** 

## **Satellite-Based Land Encroachment Monitoring for Tamil Nadu** Startup Strategy & Pitch Guide 

### **What GEOMMAND does, in one line** 

#### **In simple words** 

GEOMMAND watches government land (lakes, ponds, roads, grazing land) using free satellite images. When AI spots a new building or fence on such land, the system alerts the right officer, sends a VAO to verify on the ground with a geo-tagged photo, and prepares the legal notice under the Tamil Nadu Land Encroachment Act within about 7 days. 

### **How the system works (end to end)** 

|**1. Detect**|**2. Filter**|**3. Verify**|**4. Act**|
|---|---|---|---|
|Satellite AI finds new<br>construction on land|Land records confirm it is<br>government Poramboke,<br>not private Patta|VAO visits site;<br>GPS-checked photo<br>proves presence|Section 7 notice, then<br>Section 6 warrant,<br>drafted automatically|



### **Contents** 

**1.** Government grants available in Tamil Nadu 

**2.** How encroachments are detected, and which APIs are used 

**3.** Where to get government land records 

**4.** Unified Land Dossier: Patta + EC + encroachment map 

**5.** Preventing officer favouritism and corruption 

**6.** Temporary events vs poor huts vs commercial land grabs 

**7.** Ground-to-space red flagging: the High-Risk Watchlist 

**8.** Does this idea already exist? Market reality and your answer 

**9.** Automated FMB Encroachment Sketch (core innovation) 

**10.** Five growth features 

**11.** Summary and support requirements 

**12.** Key terms explained (glossary) 

#### **Note before you present** 

Grant amounts, scheme names and portal access (for example TANSEED rounds, IVP vouchers, STAR 2.0 / 3.0, API sandbox access) change often. Confirm each one on the official website or with your incubation centre before quoting it as fact to officials. 

Page 1 

**GEOMMAND  |  Startup Strategy & Pitch Guide** 

Tamil Nadu Land Encroachment Monitoring 

## **1 Government Grants Available in Tamil Nadu** 

When the startup is registered through an incubation centre, it becomes eligible to apply for: 

|**Scheme**|**What you get**|**Best used for**|
|---|---|---|
|**StartupTN TANSEED 7.0 /**<br>**8.0**|Up to ₹15 lakh equity-free seed grant<br>(you give away no ownership)|Building the first working product<br>and pilot|
|**EDII-TN Innovation Voucher**<br>**Programme (IVP), Voucher**<br>**A**|₹2 lakh|Product research and validation|
|**EDII-TN IVP, Voucher B**|₹5 lakh|Commercialization (taking it to<br>market)|
|**TNeGA GovTech Challenge**|Government contracts awarded<br>directly to startups solving civic<br>problems|Winning your first official pilot or<br>contract|
|**DST NIDHI-PRAYAS**|Up to ₹10 lakh grant|Technology prototypes|



#### **What “equity-free” means** 

The government gives you money but does not take any share of your company. You do not have to pay it back. 

## **2 How Encroachments Are Detected, and the APIs Needed** 

|**Component**|**Technical implementation and API**|**Why it matters**|
|---|---|---|
|**Satellite**<br>**imagery**|**Copernicus Data Space Ecosystem API**(Sentinel-2):<br>10-metre multispectral images, free, new image about<br>every 5 days.<br>For high-priority urban zones:**PlanetScope API**(3 m,<br>daily) or**ISRO Bhuvan Open Data**.|Free base data keeps<br>running cost very low|
|**All-weather /**<br>**monsoon**|**Sentinel-1 SAR radar API**: radar pulses that see through<br>thick rain clouds.|Works during monsoon<br>when normal photos are<br>blocked by clouds|
|**AI detection**<br>**pipeline**|**Step 1:**Compare NDBI (built-up index) with NDVI<br>(vegetation index) to spot new concrete or tin roofs.<br>**Step 2:**OpenCV contour detection to outline shapes.<br>**Step 3:**TensorFlow semantic segmentation to identify<br>building footprints.|Turns raw images into “a<br>new building appeared<br>here”|
|**Spatial**<br>**matching**|**PostgreSQL / PostGIS**runs<br>_ST_Intersects(building_footprint,_<br>_govt_poramboke_boundary)_to calculate the exact<br>encroached area in sq.ft.|Gives the officer a precise<br>number, not a guess|



#### **In simple words** 

NDVI measures how green the ground is. NDBI measures how “built-up” it is. If green land turns into built-up land between two satellite passes, something was constructed. PostGIS then checks whether that new structure overlaps a government land boundary. 

Page 2 

**GEOMMAND  |  Startup Strategy & Pitch Guide** 

Tamil Nadu Land Encroachment Monitoring 

## **3 Where to Get Government Land Records in Tamil Nadu** 

|**Record**|**Source in Tamil Nadu**|**How GEOMMAND uses it**|
|---|---|---|
|**‘A’ Register**<br>**(Adangal)**|Department of Survey and Settlement and<br>NIC (Tamil Nilam portal,<br>eservices.tn.gov.in)|Classifies land as private Patta<br>(Ryotwari) or Government Poramboke<br>(Eri, Kulam, Meikkal, Salai)|
|**FMB (Field**<br>**Measurement**<br>**Book)**|Cadastral (survey) vector sketches from<br>the Survey Department|Gives boundary lines and boundary<br>stones to draw exact sub-division<br>parcel lines|
|**How a startup gets**<br>**access**|TNeGA (Tamil Nadu e-Governance<br>Agency) and TN-SSDI (State Spatial Data<br>Infrastructure)|Through an incubation-centre MoU,<br>request API sandbox access for pilot<br>taluks under DILRMP (Digital India Land<br>Records Modernization Programme)|



## **4 Unified Land Dossier: Patta + EC + Encroachment Map** 

This was one of the product owner’s best suggestions. Pitch it as the **“Unified Parcel Intelligence Dossier”** . When an officer clicks any red-flagged parcel on the map, the system automatically pulls four things: 

|**#**|**What is pulled**|**What it proves**|
|---|---|---|
|1|**Patta / Chitta status**|Whether the land is genuine Patta or Sarkar Poramboke.<br>Stops fraudsters using fake paper pattas.|
|2|**EC (Encumbrance Certificate)**from<br>STAR 2.0, TN Registration Department|Full transaction history: who bought, who sold, and whether<br>any illegal deed was registered on government land.|
|3|**Visual cadastral overlay**|Satellite image with the FMB survey line on top, proving the<br>exact encroached area (for example 10 feet or 2,000 sq.ft).|
|4|**Auto-Lock API (future scope)**|Sends a flag to the local Sub-Registrar Office to freeze<br>transactions so the land cannot be sold to innocent buyers.|



Page 3 

**GEOMMAND  |  Startup Strategy & Pitch Guide** 

Tamil Nadu Land Encroachment Monitoring 

## **5 Preventing Officer Favouritism and Corruption** 

**Question asked:** What if the VAO or Inspector takes bribes or is biased towards some people? **Your answer: Automated 3-Tier AI Triaging and Immutable Audits.** 

|**Tier**|**AI confidence**|**What happens**|
|---|---|---|
|**Tier 1**<br>Critical|80% to 100%|Example: a 3,000 sq.ft concrete building inside a lake. The system<br>alerts the**District Collector and Tahsildar directly**. The local VAO<br>cannot hide, edit or delete this alert.|
|**Tier 2**<br>Medium risk|50% to 79%|Assigned to the local VAO with a mandatory**7-day SLA**(deadline<br>timer). If the VAO reports “No Encroachment”, the system triggers a<br>**random peer audit**by a Revenue Inspector from a neighbouring<br>taluk or the Flying Squad.|
|**Tier 3**<br>Low|Below 50%|Kept in the system for monitoring and re-checked on the next satellite<br>pass (suggested default; not detailed in the source notes).|
|**Tamper-proof**<br>**evidence**|All tiers|The Flutter app checks GPS geofencing (within 15 metres), compass<br>direction and camera EXIF data, so a photo taken from the office desk<br>is rejected. Every action goes into an immutable audit log that cannot<br>be altered.|



## **6 Temporary Events vs Poor Huts vs Commercial Land Grabs** 

### **A. Temporary events (wedding pandals, temple festival tents, weekly shandies)** 

- Satellites pass about every 5 days. A tent that appears on Day 1 and is gone by Day 5 or 10 is tagged **TEMPORARY_OCCUPANCY** , and the system **never** issues an eviction notice for it. 

- Only structures that stay for **15+ days (3 consecutive passes)** with hard roofing are escalated to legal notice. 

### **B. Commercial land grabbers vs poor dwellers** 

|**Type**|**Examples**|**Policy workflow**|
|---|---|---|
|**Commercial /**|Concrete buildings,|Fast-tracked for**Section 7 and Section 6 eviction**|
|**high-value**|layouts, warehouses|under TN Land Encroachment Act III of 1905.|
|**Vulnerable / poor**<br>**dwellers**|Small thatched huts,<br>sheet sheds|Flagged under**“Humanitarian Welfare and**<br>**Rehabilitation”**. No demolition. The system alerts<br>the Tahsildar and TNUHDB (Slum Clearance Board) for<br>in-situ rehabilitation or alternative patta allocation.|



## **7 Ground-to-Space Red Flagging: The High-Risk Watchlist** 

The product owner suggested that officers should be able to flag dangerous spots on the ground so they get regular updates. Your answer is the **Dynamic Watchlist / Geo-Fence Sentinel** feature: 

**1.** A VAO or Tahsildar visits a vulnerable lake or highway parcel and taps **“Mark as High-Risk Watchlist”** in the mobile app. 

**2.** The system creates an automatic **geo-fence** (virtual boundary) around that parcel. 

**3.** The cloud pipeline puts that parcel on **high-frequency satellite surveillance** . 

**4.** When a vehicle, digging, foundation stone or fence appears on the next pass, the Tahsildar gets an **instant WhatsApp / SMS alert** . 

Page 4 

**GEOMMAND  |  Startup Strategy & Pitch Guide** 

Tamil Nadu Land Encroachment Monitoring 

## **8 Does This Idea Already Exist? Market Reality** 

Honest answer: using satellites to monitor land is **not new** . What is new is a complete, working pipeline built for Tamil Nadu taluks. 

### **What already exists** 

- **BLUIS** (Bhubaneswar Land Use Intelligence System), launched by Odisha in 2020, uses high-resolution satellite images to monitor municipal land in Bhubaneswar. 

- **Tamil Nadu DTCP** has run small pilot studies around Coimbatore to detect unauthorised layouts. The Registration Department is linking GIS coordinates in STAR 3.0. 

- Large GIS and space consultancies (for example Genesys, SatSure, MapmyIndia) take government satellite-mapping contracts. 

### **How GEOMMAND is different** 

|**Area**|**Existing systems (TNGIS, BLUIS,**<br>**etc.)**|**GEOMMAND**|
|---|---|---|
|**Cost and speed**|₹10 to 50 crore, built by large IT firms<br>over 3 to 5 years|Lightweight SaaS; deployable to a taluk within<br>about 48 hours at low cost|
|**Legal workflow**|Draws a red box on a map; officer<br>writes notices by hand|Automated drafting of Section 7 Notice and<br>Section 6 Warrant under Act III of 1905|
|**Field app**|Web-only or clunky apps that fail on<br>rural 2G|Offline-first Flutter app, GPS geofenced within<br>15 m, tamper-proof camera metadata|
|**Cost of AI**<br>**processing**|Scans the whole state blindly (very<br>expensive)|**Cadastral masking**: skips the ~80% private<br>Patta land and runs AI only on the ~20%<br>Poramboke and water bodies|
|**Anti-corruption**|Local officers can suppress or ignore<br>reports|3-tier triaging: critical alerts go straight to the<br>Collector dashboard|



### **Common question: “Doesn’t the government already have this?”** 

#### **Suggested answer** 

_“Satellite technology exists, and ISRO or TNGIS have static map viewers. But there is no automated, closed-loop enforcement pipeline operating in Tamil Nadu taluks today. When a lake is encroached right now, it still takes about six months of paper petitions, manual walking and court cases before anyone acts. Our innovation is not just taking satellite pictures. It is the autonomous operational pipeline: satellite anomaly detection, then Tamil Nilam Poramboke filtering, then offline VAO geofenced inspection, then a statutory Section 7 notice in under 7 days. That end-to-end integration does not exist as an off-the-shelf product in Tamil Nadu.”_ 

#### **Key takeaway** 

The goal is not to be the first with the idea, but to execute the most practical solution for Tamil Nadu. Google was not the first search engine, Swiggy was not the first food delivery service, and Ola was not the first taxi service. Odisha’s BLUIS and DTCP’s pilots show that demand is real. 

Page 5 

**GEOMMAND  |  Startup Strategy & Pitch Guide** 

Tamil Nadu Land Encroachment Monitoring 

## **9 Core Innovation: Automated FMB Encroachment Sketch** 

When an encroachment is detected, GEOMMAND automatically produces a survey-style sketch that officers and courts already understand. The steps are: 

|**Step**|**What the system does**|
|---|---|
|**1. Load the official**<br>**sketch**|Loads the official FMB cadastral sketch (CollabLand / WebFMB) for that Survey<br>Number.|
|**2. Project the detection**|The AI and GPS polygon of the detected structure is projected automatically<br>onto the FMB sketch.|
|**3. Draw the evidence**|Boundary stones, G-Line and F-Line, red hatch zone and offset measurements<br>(see below).|
|**4. Generate the legal**<br>**PDF**|Attaches the sketch directly to the Section 7 Show-Cause Notice, generated in<br>about 1 second.|



### **What is drawn on the sketch** 

|**Element**|**Meaning**|**Why it matters**|
|---|---|---|
|**Boundary stones A,**<br>**B, C, D**|Official survey boundary markers, shown<br>with their survey coordinates|Anchors the sketch to the legal<br>boundary of the parcel|
|**G-Line and F-Line**|Internal triangulation lines used in the FMB<br>to fix positions inside the parcel|Lets surveyors verify<br>measurements using the method<br>they already trust|
|**Red hatch**<br>**encroachment zone**|The exact shape of the illegal structure<br>drawn inside the FMB|Shows precisely how much land is<br>occupied|
|**Offset ladder**<br>**measurements**|Automatic distances from a stone along a<br>line, then a sideways offset. Example: “14.2<br>m from Stone A along G-Line, offset 6.5 m<br>North”|Lets a field officer find and<br>re-measure the exact spot on the<br>ground|



#### **In simple words** 

The FMB is the government’s official map of a plot. GEOMMAND draws the illegal structure on that same map, with measurements an officer can walk and verify, and attaches it to the legal notice automatically. 

#### **Legal note** 

The sketch is designed to support legal proceedings, but whether it is accepted as evidence in a particular case is for the court to decide. Have a legal adviser review the notice format and the evidence workflow before first use. 

Page 6 

**GEOMMAND  |  Startup Strategy & Pitch Guide** 

Tamil Nadu Land Encroachment Monitoring 

## **10 Five Growth Features** 

These five features extend GEOMMAND from a monitoring tool into a complete GovTech and PropTech platform. 

#### **1. STAR 3.0 Anti-Land-Grab Lock (automated registry freeze)** 

|**Problem**|Land grabbers forge documents and sell plots on poramboke or lake land to innocent<br>buyers before the government notices.|
|---|---|
|**Feature**|When an encroachment is confirmed, GEOMMAND sends an automated API alert to the<br>local Sub-Registrar Office (TN Registration Department / STAR 3.0).|
|**Result**|The survey number is locked. Any attempt to register a sale deed shows: “TRANSACTION<br>BLOCKED: Encroachment Flagged under TN Act 1905.”|
|**Why it matters**|Protects citizens from buying fake plots and removes the financial incentive for land<br>mafias._Requires approval and API access from the Registration Department._|



|**2. Madras High**|**Court Judicial Compliance Generator**|
|---|---|
|**Problem**|The Madras High Court regularly asks Collectors and the Revenue Secretary for reports on<br>encroached waterbodies (Eri / Kulam) and action taken. Officers spend weeks preparing<br>paper reports.|
|**Feature**|A “High Court Compliance Tab” in the dashboard. In one click the Collector generates an<br>official Affidavit and Action Taken Report (ATR) PDF with: total waterbody parcels<br>monitored, active encroachments vs Section 7 notices served, and before-and-after<br>satellite proof of restored boundaries.|
|**Result**|Reports that took weeks are ready in minutes.|
|**Why it matters**|Helps Collectors respond to court directions on time and avoid contempt proceedings.|



|**3. Citizen Whats**|**App Grievance Bot (CM Helpline 1100 integration)**|
|---|---|
|**Problem**|Citizens see land grabbing or lake filling but do not know the survey number or how to file<br>a formal petition.|
|**Feature**|A citizen sends a photo with a live location pin to a dedicated WhatsApp bot. The bot reads<br>the GPS coordinates, maps them to the exact Tamil Nilam survey number and FMB<br>boundary, and creates a “Citizen-Reported Field Task” on the VAO’s mobile app for<br>verification within 48 hours.|
|**Result**|Citizen reports become verified, trackable field tasks.|
|**Why it matters**|Brings public participation and aligns with the CM Helpline (Mudhalvarin Mugavari, 1100).|



|**4. Multi-Pass Sm**|**art Filter (pandal vs concrete classifier)**|
|---|---|
|**Problem**|Wedding pandals and festival tents must not trigger legal action.|
|**Feature**|Time-series satellite tracking.**Day 1:**anomaly tagged SUSPECTED_TEMPORARY.**Day 5**<br>(next pass): if the tent is gone, auto-closed as TEMPORARY_EVENT (RESOLVED).**Day 15:**if<br>still present and spectral analysis detects brick, concrete or tin sheet, upgraded to<br>PERMANENT_ENCROACHMENT and the Section 7 Notice is triggered.|
|**Result**|No legal action against temporary events.|
|**Why it matters**|Shows the AI can handle real social situations such as weddings and temple festivals.|



Page 7 

**GEOMMAND  |  Startup Strategy & Pitch Guide** 

Tamil Nadu Land Encroachment Monitoring 

#### **5. B2B Private Perimeter Shield (immediate revenue)** 

|**Problem**|Large private landholders cannot watch remote boundaries continuously.|
|---|---|
|**Feature**|A private subscription for solar and wind plants (often 200 to 500 acres), SIPCOT / TIDCO<br>industrial parks, large university campuses, and highway contractors (NHAI) protecting<br>right-of-way land. Customers upload boundary coordinates (KML / Shapefile). GEOMMAND<br>alerts them if a neighbouring farmer or squatter moves a fence or digs inside their land.|
|**Result**|Early warning of boundary intrusion.|
|**Why it matters**|Revenue can start without waiting for government approvals, by selling to private<br>companies from day one.|



## **11 Summary and Support Requirements** 

### **Key strengths** 

- Architecture tested against feedback from a product company owner. 

- Real operational challenges are already addressed: 

   - Multi-pass satellite AI filters out temporary wedding tents. 

   - Automated risk scoring reduces the chance of local officer corruption. 

   - Ground-to-space watchlists let officers protect high-risk lakes. 

   - The unified dossier connects Patta, EC and FMB maps in one view. 

   - The Automated FMB Encroachment Sketch gives court-ready evidence attached to the Section 7 notice. 

   - Five growth features (registry lock, High Court compliance reports, citizen WhatsApp bot, multi-pass filter, private perimeter shield) open both government and private revenue. 

### **Support required** 

|**Requirement**|**Purpose**|
|---|---|
|**Incubation space and startup registration**<br>**support (Pvt Ltd)**|Gives the startup a legal entity to apply for grants<br>and contracts|
|**Recommendation letter to the District Collector /**|Opens the door to real government data and a live|
|**DRO for a 30-day single-taluk pilot**|demonstration|
|**Endorsement for StartupTN TANSEED (up to ₹15**<br>**lakh)**|Funds the first product build|



#### **Realistic note on integrations** 

The registry lock (STAR 3.0), High Court report format, WhatsApp bot and land-record APIs all depend on approvals, official data access and, for WhatsApp, the WhatsApp Business Platform. Present them as planned phases after the first pilot rather than features that work today. 

Page 8 

**GEOMMAND  |  Startup Strategy & Pitch Guide** 

Tamil Nadu Land Encroachment Monitoring 

## **12 Key Terms Explained** 

|**Term**|**Meaning**|
|---|---|
|**Poramboke**|Government-owned land such as lakes (Eri), ponds (Kulam), grazing land (Meikkal)<br>and roads (Salai). Private people cannot own it.|
|**Patta / Chitta**|Official record that shows who owns a piece of private land.|
|**Adangal / ‘A’**<br>**Register**|Village land register that classifies the type and use of each land parcel.|
|**FMB**|Field Measurement Book: the survey sketch that gives exact boundaries of each<br>parcel.|
|**EC**|Encumbrance Certificate: proof of a property’s sale and loan history.|
|**VAO**|Village Administrative Officer: the first-level revenue official in a village.|
|**Tahsildar**|Head of a taluk’s revenue administration; senior to the VAO.|
|**District Collector**|Top administrative officer of a district (an IAS officer).|
|**SLA**|Service Level Agreement: a fixed deadline within which a task must be done.|
|**Geo-fence**|A virtual boundary on a map. Actions or alerts trigger when someone enters it.|
|**SAR (Sentinel-1)**|Radar satellite that can see through clouds, rain and darkness.|
|**Cadastral masking**|Hiding private land from the AI scan so processing is only done on government land.|
|**DILRMP**|Digital India Land Records Modernization Programme: national programme to digitise<br>land records.|
|**TNeGA / TN-SSDI**|TN e-Governance Agency / State Spatial Data Infrastructure: bodies that manage<br>government digital and map data.|
|**G-Line / F-Line**|Internal triangulation lines in an FMB sketch used to fix positions inside a parcel.|
|**Show-Cause Notice**|Formal notice asking the occupant to explain why action should not be taken (Section<br>7).|
|**ATR**|Action Taken Report: official report of what action was taken on a court or<br>government direction.|
|**KML / Shapefile**|Common map-file formats used to share boundary coordinates.|
|**SIPCOT / TIDCO /**<br>**NHAI**|Tamil Nadu industrial park and industrial development bodies / National Highways<br>Authority of India.|
|**Act III of 1905**|Tamil Nadu Land Encroachment Act. Section 7 = notice to the encroacher; Section 6<br>= warrant / eviction order.|



Page 9 

