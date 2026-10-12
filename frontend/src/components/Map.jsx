import React, { useState, useEffect, useCallback } from 'react';
import {
    MapContainer, TileLayer, Marker, Popup, Polygon,
    LayersControl, useMapEvents, useMap, WMSTileLayer
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { TamilNilamParcelCard } from './TamilNilamParcelCard';
import { CadastralDetailModals } from './CadastralDetailModals';
import { MapPin, AlertTriangle, Layers, Compass, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

// --- ROBUST VITE ICON FIX ---
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

// --- TACTICAL ICONS ---
const createIcon = (color) => new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const Icons = {
    red: createIcon('red'),
    orange: createIcon('orange'),
    blue: createIcon('blue'),
    violet: createIcon('violet'),
    yellow: createIcon('yellow'),
    green: createIcon('green'),
    grey: createIcon('grey'),
};

// Component to fly map to target coordinates
const MapFlyToController = ({ target }) => {
    const map = useMap();
    useEffect(() => {
        if (target && target.lat && target.lng) {
            map.flyTo([target.lat, target.lng], target.zoom || 16, { duration: 1.2 });
        }
    }, [target, map]);
    return null;
};

// Component to handle map clicks
const MapClickHandler = ({ onClick }) => {
    useMapEvents({
        click: (e) => {
            if (onClick) onClick(e.latlng);
        },
    });
    return null;
};

// ─── Classification Color System ─────────────────────────────────────────────
const CLASSIFICATION_COLORS = {
    'Government': { fill: '#22c55e', stroke: '#16a34a', label: '🟢 Government Land', safe: '#22c55e', threat: '#ef4444' },
    'Roadside':   { fill: '#f59e0b', stroke: '#d97706', label: '🟡 Roadside Land',   safe: '#f59e0b', threat: '#f97316' },
    'Waterbody':  { fill: '#3b82f6', stroke: '#2563eb', label: '🔵 Waterbody',        safe: '#3b82f6', threat: '#ef4444' },
    'Forest':     { fill: '#16a34a', stroke: '#15803d', label: '🟩 Forest Reserve',   safe: '#16a34a', threat: '#ef4444' },
    'Temple':     { fill: '#8b5cf6', stroke: '#7c3aed', label: '🟣 Temple Land',      safe: '#8b5cf6', threat: '#ef4444' },
    'Private':    { fill: '#94a3b8', stroke: '#64748b', label: '⬜ Private Land',     safe: '#94a3b8', threat: '#ef4444' },
};

const getParcelStyle = (parcel, alerts, isSelected) => {
    if (isSelected) {
        return {
            color: '#06b6d4', // Glowing cyan border matching TNGIS screenshot
            fillColor: parcel.is_occupied ? '#ef4444' : '#06b6d4',
            weight: 4,
            fillOpacity: 0.45,
            dashArray: null
        };
    }
    const hasAlert = alerts.some(a =>
        (a.parcel === parcel.id || a.parcel_details === parcel.survey_number) &&
        a.status !== 'Resolved' && a.status !== 'RESOLVED'
    );
    const isOccupied = parcel.is_occupied || hasAlert;
    
    if (isOccupied) {
        return {
            color: '#ef4444',
            fillColor: '#ef4444',
            weight: 2.5,
            fillOpacity: 0.35,
            dashArray: '6 4'
        };
    }

    const colors = CLASSIFICATION_COLORS[parcel.classification] || CLASSIFICATION_COLORS['Government'];
    return {
        color: colors.stroke,
        fillColor: colors.fill,
        weight: 1.8,
        fillOpacity: 0.22,
        dashArray: parcel.classification === 'Roadside' ? '6 4' : null,
    };
};

const getAlertIcon = (alert) => {
    if (alert.status === 'Resolved' || alert.status === 'RESOLVED') return Icons.green;
    if (alert.alert_type?.includes('Waterbody')) return Icons.blue;
    if (alert.alert_type?.includes('Forest')) return Icons.violet;
    if (alert.alert_type?.includes('Roadside') || alert.parcel_classification === 'Roadside') return Icons.orange;
    if (alert.alert_type?.includes('Excavation')) return Icons.orange;
    if (alert.confidence_score < 0.9) return Icons.yellow;
    return Icons.red;
};

// ─── Map Legend Component ─────────────────────────────────────────────────────
const MapLegend = () => (
    <div style={{
        position: 'absolute', bottom: 60, right: 16, zIndex: 1000,
        background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(8px)',
        border: '1px solid #cbd5e1', padding: '10px 12px',
        minWidth: 185, color: '#0f172a', borderRadius: 0,
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15)'
    }}>
        <p style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 6, borderBottom: '1px solid #e2e8f0', paddingBottom: 4, color: '#0f172a' }}>
            📍 Salem Cadastral Legend
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{ width: 10, height: 10, background: '#ef4444', border: '2px solid #b91c1c', flexShrink: 0 }} />
            <span style={{ fontSize: 8.5, fontWeight: 800, color: '#b91c1c', textTransform: 'uppercase' }}>🔴 Occupied / Encroached</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{ width: 10, height: 10, background: '#22c55e', border: '2px solid #16a34a', flexShrink: 0 }} />
            <span style={{ fontSize: 8.5, fontWeight: 800, color: '#15803d', textTransform: 'uppercase' }}>🟢 Vacant / Safe Asset</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{ width: 10, height: 10, background: '#0284c7', border: '2px solid #0369a1', flexShrink: 0 }} />
            <span style={{ fontSize: 8.5, fontWeight: 800, color: '#0369a1', textTransform: 'uppercase' }}>🔵 Selected Parcel (TNGIS)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 10, height: 10, background: '#f59e0b', border: '2px solid #d97706', flexShrink: 0 }} />
            <span style={{ fontSize: 8.5, fontWeight: 800, color: '#b45309', textTransform: 'uppercase' }}>🟡 Adjacent Private Patta</span>
        </div>
    </div>
);

// ─── SALEM QUICK DEMO PRESETS ──────────────────────────────────────────────────
const SALEM_PRESETS = [
    // ── ALL 4 TYPES OF ROADSIDE OCCUPATIONS ──
    {
        id: 'omalur',
        category: 'roadside',
        typeLabel: 'Type 1: Commercial Shed',
        title: 'Omalur NH-44 Commercial Shed',
        title_ta: 'ஓமலூர் நெடுஞ்சாலை கொட்டகை',
        desc: 'Roadside Type 1: Vehicle workshop & commercial tin shed (Patta 488)',
        survey: '119',
        subdivision: '4',
        lat: 11.7450,
        lng: 78.0410,
        zoom: 17
    },
    {
        id: 'kondalampatti',
        category: 'roadside',
        typeLabel: 'Type 2: Scrap & Mechanic',
        title: 'Kondalampatti Truck Scrap Yard',
        title_ta: 'கொண்டலாம்பட்டி லாரி பட்டறை',
        desc: 'Roadside Type 2: Heavy truck mechanic & scrap metal on paved shoulder (Patta 319)',
        survey: '76',
        subdivision: '2B',
        lat: 11.6210,
        lng: 78.1320,
        zoom: 17
    },
    {
        id: 'attur',
        category: 'roadside',
        typeLabel: 'Type 3: Compound Wall',
        title: 'Attur SH-79 Compound Wall',
        title_ta: 'ஆத்தூர் மதில்சுவர் அத்துமீறல்',
        desc: 'Roadside Type 3: Residential concrete wall extended 14m into highway reserve (Patta 582)',
        survey: '204',
        subdivision: '1C',
        lat: 11.5980,
        lng: 78.6010,
        zoom: 17
    },
    {
        id: 'hasthampatti',
        category: 'roadside',
        typeLabel: 'Type 4: Footpath Stalls',
        title: 'Hasthampatti Footpath Stalls',
        title_ta: 'ஹஸ்தம்பட்டி நடைபாதை ஆக்கிரமிப்பு',
        desc: 'Roadside Type 4: Commercial vendor awning & tea stall blocking pedestrian path (Patta 167)',
        survey: '45',
        subdivision: '3',
        lat: 11.6780,
        lng: 78.1650,
        zoom: 18
    },
    // ── WATERBODY & OTHER SALEM ASSETS ──
    {
        id: 'mookaneri',
        category: 'waterbody',
        typeLabel: 'Waterbody Basin',
        title: 'Mookaneri Lake Poramboke',
        title_ta: 'மூக்கனேரி ஏரி புறம்போக்கு',
        desc: 'Lake Basin Wall Encroachment by Neighbor Patta 340',
        survey: '142',
        subdivision: '1A',
        lat: 11.6982,
        lng: 78.1724,
        zoom: 17
    },
    {
        id: 'suramangalam',
        category: 'waterbody',
        typeLabel: 'Govt Commercial',
        title: 'Suramangalam Govt Land',
        title_ta: 'சூரமங்கலம் அரசு புறம்போக்கு',
        desc: 'Commercial Shed Encroachment (Patta 215)',
        survey: '88',
        subdivision: '2A',
        lat: 11.6742,
        lng: 78.1215,
        zoom: 17
    },
    {
        id: 'mettur',
        category: 'waterbody',
        typeLabel: 'Protected Forest',
        title: 'Mettur Dam Riverbank',
        title_ta: 'மேட்டூர் காவேரி படுகை',
        desc: 'Protected State Reserve - 45 Acres Safe',
        survey: '63',
        subdivision: '1',
        lat: 11.7960,
        lng: 77.7980,
        zoom: 16
    }
];

const MapView = React.memo(({ parcels = [], alerts = [], onParcelClick, onMapClick, selectedPosition = null, userRole = 'ADMIN' }) => {
    const center = [11.6643, 78.1460]; // Centered on Salem District
    const [showLegend, setShowLegend] = useState(true);
    const [selectedParcel, setSelectedParcel] = useState(null);
    const [activeModal, setActiveModal] = useState(null);
    const [flyTarget, setFlyTarget] = useState(null);
    const [activePreset, setActivePreset] = useState(null);
    const [presetFilter, setPresetFilter] = useState('roadside'); // 'roadside' | 'all' | 'waterbody'
    const [isDemoBarOpen, setIsDemoBarOpen] = useState(false);

    // Sync selectedParcel when preset is clicked or external parcel is clicked
    const handleSelectParcel = useCallback((parcel) => {
        setSelectedParcel(parcel);
        if (onParcelClick) onParcelClick(parcel);
    }, [onParcelClick]);

    const handlePresetClick = (preset) => {
        setActivePreset(preset.id);
        setFlyTarget({ lat: preset.lat, lng: preset.lng, zoom: preset.zoom });

        // Find parcel in seeded array matching survey
        const match = parcels.find(p => p.survey_number === preset.survey);
        if (match) {
            handleSelectParcel(match);
        } else {
            // Fetch dynamically from backend identify
            fetch(`/api/parcels/identify/?lat=${preset.lat}&lng=${preset.lng}`)
                .then(res => res.json())
                .then(data => {
                    if (data && data.properties) {
                        const coords = data.geometry?.coordinates?.[0]?.map(c => [c[1], c[0]]) || [];
                        handleSelectParcel({ id: data.id, ...data.properties, coordinates: coords });
                    }
                })
                .catch(err => console.error('Preset identify error:', err));
        }
    };

    const handleMapClickInternal = (latlng) => {
        // Trigger external callback if passed
        if (onMapClick) onMapClick(latlng);

        // Fetch parcel at clicked coordinates
        fetch(`/api/parcels/identify/?lat=${latlng.lat}&lng=${latlng.lng}`)
            .then(res => {
                if (!res.ok) throw new Error('Not found');
                return res.json();
            })
            .then(data => {
                if (data && data.properties) {
                    const coords = data.geometry?.coordinates?.[0]?.map(c => [c[1], c[0]]) || [];
                    handleSelectParcel({ id: data.id, ...data.properties, coordinates: coords });
                }
            })
            .catch(() => {
                // If not found in backend, deselect or ignore
            });
    };

    const filteredPresets = SALEM_PRESETS.filter(p => {
        if (presetFilter === 'all') return true;
        return p.category === presetFilter;
    });

    return (
        <div style={{ height: '100%', width: '100%', position: 'relative' }}>
            
            {/* ─── QUICK DEMO PRESETS TOOLBAR (COLLAPSIBLE, TOP OF MAP) ─── */}
            {!isDemoBarOpen ? (
                <button
                    onClick={() => setIsDemoBarOpen(true)}
                    className="absolute top-3 right-14 z-[999] flex items-center gap-2 bg-white/95 backdrop-blur-md px-3 py-1.5 border border-slate-300 shadow-md hover:shadow-lg hover:border-blue-500 rounded transition group cursor-pointer text-slate-800"
                    title="Open Salem Quick Demo Bar"
                >
                    <Compass size={13} className="text-blue-600 group-hover:rotate-45 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-800">
                        Salem Quick Demo Bar
                    </span>
                    <span className="bg-blue-50 text-blue-700 font-mono font-black text-[9px] px-1.5 py-0.5 rounded border border-blue-200">
                        {SALEM_PRESETS.length} Presets
                    </span>
                    <ChevronDown size={14} className="text-slate-400 group-hover:text-blue-600" />
                </button>
            ) : (
                <div className="absolute top-3 right-14 z-[999] flex flex-col gap-2 bg-white/95 backdrop-blur-md p-2.5 border border-slate-200 shadow-xl max-w-2xl rounded animate-in fade-in slide-in-from-top-1 duration-150">
                    {/* Category Switcher Header */}
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 gap-3">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                            <Compass size={13} className="text-blue-600" />
                            <span className="font-extrabold text-blue-900">Salem Quick Demo Bar:</span>
                        </span>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setPresetFilter('roadside')}
                                className={`px-2 py-0.5 text-[9px] font-black rounded uppercase tracking-wider transition ${
                                    presetFilter === 'roadside'
                                        ? 'bg-amber-600 text-white shadow-sm ring-1 ring-amber-400'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 border border-slate-200'
                                }`}
                            >
                                🛣️ Roadside (4 Types)
                            </button>
                            <button
                                onClick={() => setPresetFilter('waterbody')}
                                className={`px-2 py-0.5 text-[9px] font-black rounded uppercase tracking-wider transition ${
                                    presetFilter === 'waterbody'
                                        ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 border border-slate-200'
                                }`}
                            >
                                💧 Waterbody & State
                            </button>
                            <button
                                onClick={() => setPresetFilter('all')}
                                className={`px-2 py-0.5 text-[9px] font-black rounded uppercase tracking-wider transition ${
                                    presetFilter === 'all'
                                        ? 'bg-slate-900 text-white shadow-sm ring-1 ring-slate-700'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 border border-slate-200'
                                }`}
                            >
                                All ({SALEM_PRESETS.length})
                            </button>
                            <button
                                onClick={() => setIsDemoBarOpen(false)}
                                className="ml-2 flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider text-slate-500 hover:text-slate-900 hover:bg-slate-100 px-2 py-0.5 border border-slate-200 rounded transition cursor-pointer"
                                title="Close / Hide Quick Demo Bar"
                            >
                                <ChevronUp size={12} />
                                <span>Close</span>
                            </button>
                        </div>
                    </div>

                    {/* Preset Chips */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        {filteredPresets.map(p => (
                            <button
                                key={p.id}
                                onClick={() => handlePresetClick(p)}
                                className={`px-2.5 py-1 text-[10px] font-bold rounded-none transition flex items-center gap-1.5 border ${
                                    activePreset === p.id
                                        ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-300 font-extrabold'
                                        : p.category === 'roadside'
                                            ? 'bg-amber-50 text-amber-950 border-amber-300 hover:bg-amber-100 hover:border-amber-400 shadow-xs'
                                            : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100 hover:border-slate-300 shadow-xs'
                                }`}
                                title={p.desc}
                            >
                                <span>{p.category === 'roadside' ? '🛣️' : '📍'}</span>
                                <span className="font-extrabold">{p.title}</span>
                                {p.typeLabel && (
                                    <span className={`text-[8px] px-1 py-0.2 rounded font-normal ${
                                        activePreset === p.id 
                                            ? 'bg-white/20 text-white' 
                                            : p.category === 'roadside' 
                                                ? 'bg-amber-200/80 text-amber-900 font-bold' 
                                                : 'bg-slate-200 text-slate-700'
                                    }`}>
                                        {p.typeLabel}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true}>
                <MapFlyToController target={flyTarget} />
                
                <LayersControl position="topright">
                    <LayersControl.BaseLayer checked name="Satellite View">
                        <TileLayer
                            attribution='&copy; Esri World Imagery'
                            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                        />
                    </LayersControl.BaseLayer>
                    <LayersControl.BaseLayer name="Street Map">
                        <TileLayer
                            attribution='&copy; OpenStreetMap'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                    </LayersControl.BaseLayer>
                    <LayersControl.BaseLayer name="Hybrid View">
                        <TileLayer
                            attribution='&copy; Google'
                            url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
                        />
                    </LayersControl.BaseLayer>
                    <LayersControl.Overlay checked name="Live Govt Land Boundaries (GeoServer)">
                        <WMSTileLayer
                            url="http://localhost:8081/geoserver/geommand/wms"
                            layers="geommand:core_landparcel"
                            format="image/png"
                            transparent={true}
                            zIndex={10}
                        />
                    </LayersControl.Overlay>
                    <LayersControl.Overlay checked name="Live Encroachment Alerts (GeoServer)">
                        <WMSTileLayer
                            url="http://localhost:8081/geoserver/geommand/wms"
                            layers="geommand:core_encroachmentalert"
                            format="image/png"
                            transparent={true}
                            zIndex={20}
                        />
                    </LayersControl.Overlay>
                </LayersControl>
                
                {/* Map Click Handler */}
                <MapClickHandler onClick={handleMapClickInternal} />

                {/* District HQ Fixed Node */}
                <Marker position={[11.6643, 78.1460]} icon={Icons.blue}>
                    <Popup>
                        <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Salem District HQ</div>
                        <p className="text-[8px] text-slate-500 font-bold uppercase mt-1">Operational Command Center</p>
                    </Popup>
                </Marker>

                {/* Render Land Parcels with Classification Color Coding */}
                {parcels.map(parcel => {
                    if (!parcel.coordinates || parcel.coordinates.length === 0) return null;
                    const isSelected = selectedParcel && selectedParcel.id === parcel.id;
                    const style = getParcelStyle(parcel, alerts, isSelected);

                    return (
                        <Polygon
                            key={parcel.id}
                            positions={parcel.coordinates}
                            pathOptions={style}
                            eventHandlers={{
                                click: () => handleSelectParcel(parcel)
                            }}
                        >
                            <Popup>
                                <div style={{ minWidth: 160 }}>
                                    <div style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: CLASSIFICATION_COLORS[parcel.classification]?.stroke || '#64748b', marginBottom: 4 }}>
                                        {parcel.classification || 'Government'}
                                    </div>
                                    <div style={{ fontSize: 10, fontWeight: 800, color: '#0f172a', marginBottom: 2 }}>
                                        Survey: {parcel.survey_number}/{parcel.subdivision || '1A'}
                                    </div>
                                    <div style={{ fontSize: 9, color: '#64748b', marginBottom: 2 }}>Owner: {parcel.owner_name || 'N/A'}</div>
                                    <div style={{ fontSize: 9, color: '#64748b' }}>Village: {parcel.village_name || parcel.village_code}</div>
                                    {parcel.is_occupied && (
                                        <div style={{ marginTop: 6, padding: '4px 8px', background: '#fee2e2', border: '1px solid #fca5a5', fontSize: 8, fontWeight: 900, color: '#b91c1c', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                            🔴 Encroached: {parcel.occupied_extent || 'Occupied Area'}
                                        </div>
                                    )}
                                </div>
                            </Popup>
                        </Polygon>
                    );
                })}

                {/* Render Encroachment Alert Markers */}
                {alerts.filter(a => a.position && a.position[0] && a.position[1]).map(alert => {
                    const icon = getAlertIcon(alert);
                    const isResolved = alert.status === 'Resolved' || alert.status === 'RESOLVED';
                    const isRoadside = alert.parcel_classification === 'Roadside';
                    return (
                        <Marker key={`alert-${alert.id}`} position={alert.position} icon={icon}>
                            <Popup>
                                <div style={{ minWidth: 160 }}>
                                    <div style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: isResolved ? '#16a34a' : isRoadside ? '#d97706' : '#dc2626', marginBottom: 4 }}>
                                        {alert.alert_type || 'AI Detection Alert'}
                                        {isResolved && ' ✓'}
                                    </div>
                                    <div style={{ fontSize: 9, color: '#64748b', marginBottom: 2 }}>Survey: {alert.survey_number || alert.parcel_details}</div>
                                    {!isResolved && <div style={{ fontSize: 9, fontWeight: 800, color: '#0f172a' }}>Confidence: {(alert.confidence_score * 100).toFixed(0)}%</div>}
                                    {alert.img && (
                                        <div style={{ marginTop: 6, marginBottom: 4, height: 70, width: '100%', overflow: 'hidden', borderRadius: 4, border: '1px solid #cbd5e1' }}>
                                            <img src={alert.img} alt="Evidence" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                    )}
                                    {alert.verification?.photos && alert.verification.photos.length > 0 && (
                                        <div style={{ marginTop: 4, fontSize: 8, fontWeight: 900, color: '#0284c7', background: '#f0f9ff', border: '1px solid #bae6fd', padding: '2px 4px', textAlign: 'center', textTransform: 'uppercase' }}>
                                            📷 {alert.verification.photos.length} Live Field Photo(s) Attached
                                        </div>
                                    )}
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}

                {/* Selected Parcel Centroid Marker */}
                {selectedParcel && selectedParcel.coordinates && selectedParcel.coordinates[0] && (
                    <Marker position={selectedParcel.coordinates[0]} icon={Icons.red}>
                        <Popup>
                            <div className="text-[10px] font-black text-red-600 uppercase tracking-widest">
                                Selected Parcel: Survey {selectedParcel.survey_number}/{selectedParcel.subdivision || '1A'}
                            </div>
                        </Popup>
                    </Marker>
                )}

                {/* Selected Tactical Probe */}
                {selectedPosition && (
                    <Marker position={selectedPosition} icon={Icons.violet}>
                        <Popup>
                            <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Tactical Probe Active</div>
                            <div className="text-[8px] text-slate-400 font-bold uppercase mt-1">
                                Coordinates: {selectedPosition[0].toFixed(4)}, {selectedPosition[1].toFixed(4)}
                            </div>
                        </Popup>
                    </Marker>
                )}
            </MapContainer>

            {/* ─── FLOATING TAMIL NILAM PARCEL CARD (TOP-LEFT) ─── */}
            {selectedParcel && (
                <TamilNilamParcelCard
                    parcel={selectedParcel}
                    onClose={() => setSelectedParcel(null)}
                    onOpenModal={(modal) => setActiveModal(modal)}
                    activeAlert={alerts.find(a => a.parcel === selectedParcel.id || a.parcel_details === selectedParcel.survey_number)}
                    userRole={userRole}
                />
            )}

            {/* ─── CADASTRAL DETAIL MODALS (PATTA, FMB, NEIGHBORS, G-VALUE, NOTICE) ─── */}
            {activeModal && selectedParcel && (
                <CadastralDetailModals
                    modalType={activeModal}
                    parcel={selectedParcel}
                    onClose={() => setActiveModal(null)}
                    userRole={userRole}
                />
            )}

            {/* Legend Overlay */}
            {showLegend && <MapLegend />}
            
            <div style={{ position: 'absolute', bottom: 24, right: 16, zIndex: 1000, display: 'flex', gap: 8 }}>
                <button
                    onClick={() => setShowLegend(v => !v)}
                    style={{
                        background: 'rgba(255,255,255,0.95)', color: '#0f172a', border: '1px solid #cbd5e1',
                        padding: '6px 12px', fontSize: 9, fontWeight: 900, letterSpacing: '0.12em', cursor: 'pointer',
                        textTransform: 'uppercase', boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                    }}
                >
                    {showLegend ? 'Hide Legend' : 'Show Legend'}
                </button>
            </div>
        </div>
    );
});

export default MapView;
