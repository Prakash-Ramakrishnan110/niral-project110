"""
Integrated Government Land Records & AI-Based Encroachment Monitoring System
AI Bridge: Continuous Monitoring Module
"""

import urllib.request
import urllib.parse
import json
import time
import random
import sys
import os

if os.environ.get('GEOMMAND_ENV') != 'demo':
    print(f"[{time.strftime('%H:%M:%S')}] [BLOCKED] ai_simulation refuses to run: GEOMMAND_ENV != 'demo'. Set GEOMMAND_ENV=demo for local demonstration.")
    sys.exit(1)

API_URL = "http://localhost:8000/api/alerts/"
PARCEL_API = "http://localhost:8000/api/parcels/"

def make_request(url, method="GET", data=None):
    try:
        req_data = None
        if data:
            req_data = json.dumps(data).encode('utf-8')
        
        req = urllib.request.Request(url, data=req_data, method=method)
        req.add_header('Content-Type', 'application/json')
        
        with urllib.request.urlopen(req, timeout=5) as response:
            return json.loads(response.read().decode('utf-8'))
    except Exception as e:
        return None

def get_parcels():
    res = make_request(PARCEL_API)
    return res.get('features', []) if res else []

def clear_alerts():
    """Tactical Purge of existing alerts to maintain a clean demo map."""
    print(f"[{time.strftime('%H:%M:%S')}] [PURGE] Clearing existing tactical nodes...")
    res = make_request(API_URL)
    if not res: return
    features = res.get('features', [])
    for f in features:
        alert_id = f.get('id')
        if alert_id:
            make_request(f"{API_URL}{alert_id}/", method="DELETE")

last_parcel_id = None

def simulate_ai_scan():
    global last_parcel_id
    # Clear map for fresh demo feel
    # clear_alerts() # Keep them for a while to see the variety
    
    print(f"[{time.strftime('%H:%M:%S')}] [SCAN] Initializing District-Wide Satellite Audit...")
    
    parcels = get_parcels()
    if not parcels:
        return

    # Filter out the last one to ensure variety
    available_parcels = [p for p in parcels if p.get('id') != last_parcel_id]
    if not available_parcels: available_parcels = parcels
    
    parcel = random.choice(available_parcels)
    last_parcel_id = parcel.get('id')
    parcel_id = parcel.get('id')
    props = parcel.get('properties', {})
    survey_no = props.get('survey_number', 'Unknown')
    
    geometry = parcel.get('geometry')
    if not geometry: return
    
    # Get center-ish coordinates
    coords = geometry.get('coordinates', [])[0][0]
    
    # Rotate through different tactical types for color variety
    tactical_type = random.choice([
        "Illegal Structure",     # Red
        "Wall Construction",      # Red
        "Waterbody Incursion",    # Blue
        "Forest Encroachment",    # Violet
        "Excavation Work",        # Orange
        "Survey Warning"          # Yellow (lower confidence)
    ])

    alert_data = {
        "parcel": parcel_id,
        "confidence_score": round(random.uniform(0.92, 0.99), 2) if "Warning" not in tactical_type else round(random.uniform(0.75, 0.88), 2),
        "alert_type": tactical_type,
        "status": "TAHSILDAR_ACCEPTED" if random.random() > 0.7 else "Pending",
        "is_synthetic": True,
        "alert_geom": {
            "type": "Point",
            "coordinates": [coords[0] + (random.uniform(-0.0003, 0.0003)), coords[1] + (random.uniform(-0.0003, 0.0003))]
        }
    }

    res = make_request(API_URL, method="POST", data=alert_data)
    if res:
        print(f"  [ALERT] [CRITICAL] {alert_data['alert_type']} at Survey {survey_no} (Conf: {alert_data['confidence_score']})")
        print(f"[{time.strftime('%H:%M:%S')}] [SUCCESS] 1 new tactical alert generated.")
    else:
        print(f"[{time.strftime('%H:%M:%S')}] [ERROR] Failed to transmit alert to Command Hub.")

if __name__ == "__main__":
    print("====================================================")
    print("   TN GeoCommand - AI Real-Time Monitoring Engine")
    print("====================================================")
    print("Status: LIVE STREAMING")
    print("Mode: AUTOMATED EVICTION MONITORING")
    print("----------------------------------------------------")
    
    try:
        while True:
            simulate_ai_scan()
            print("\nNext scan in 30 seconds... (Press Ctrl+C to stop)")
            for i in range(30, 0, -1):
                sys.stdout.write(f"\r[HEARTBEAT] System Online - Next probe in {i}s  ")
                sys.stdout.flush()
                time.sleep(1)
    except KeyboardInterrupt:
        print("\n[INFO] Monitoring suspended by operator.")
