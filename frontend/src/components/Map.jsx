import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, LayersControl, useMapEvents, Circle, WMSTileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

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

const getParcelStyle = (parcel, alerts) => {
    const colors = CLASSIFICATION_COLORS[parcel.classification] || CLASSIFICATION_COLORS['Private'];
    const hasAlert = alerts.some(a =>
        (a.parcel === parcel.id || a.parcel_details === parcel.survey_number) &&
        a.status !== 'Resolved' && a.status !== 'RESOLVED'
    );
    return {
        color: hasAlert ? '#ef4444' : colors.stroke,
        fillColor: hasAlert ? '#ef4444' : colors.fill,
        weight: hasAlert ? 3 : 1.5,
        fillOpacity: hasAlert ? 0.5 : 0.25,
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
const MapLegend = ({ showRoadside }) => (
    <div style={{
        position: 'absolute', bottom: 24, left: 16, zIndex: 1000,
        background: 'rgba(15,23,42,0.92)', backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.1)', padding: '14px 16px',
        minWidth: 180, color: 'white',
    }}>
        <p style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 6 }}>
            📍 Classification Legend
        </p>
        {Object.entries(CLASSIFICATION_COLORS).map(([key, val]) => (
            key !== 'Private' && (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <div style={{ width: 12, height: 12, background: val.fill, border: `2px solid ${val.stroke}`, flexShrink: 0 }} />
                    <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.85 }}>{key}</span>
                </div>
            )
        ))}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: 8, paddingTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <div style={{ width: 12, height: 12, background: '#ef4444', border: '2px solid #b91c1c', flexShrink: 0 }} />
                <span style={{ fontSize: 9, fontWeight: 700, color: '#fca5a5', textTransform: 'uppercase' }}>Active Threat</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 12, height: 12, background: '#22c55e', border: '2px solid #16a34a', flexShrink: 0 }} />
                <span style={{ fontSize: 9, fontWeight: 700, color: '#86efac', textTransform: 'uppercase' }}>Resolved</span>
            </div>
        </div>
    </div>
);

const MapView = React.memo(({ parcels = [], alerts = [], onParcelClick, onMapClick, selectedPosition = null }) => {
    const center = [11.6643, 78.1460]; // Centered on Salem District
    const [showLegend, setShowLegend] = useState(true);
    const [showPrivate, setShowPrivate] = useState(false);

    return (
        <div style={{ height: '100%', width: '100%', position: 'relative' }}>
            <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true}>
                <LayersControl position="topright">
                    <LayersControl.BaseLayer name="Street Map">
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                    </LayersControl.BaseLayer>
                    <LayersControl.BaseLayer checked name="Satellite View">
                        <TileLayer
                            attribution='&copy; Esri'
                            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
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
                <MapClickHandler onClick={onMapClick} />

                {/* District HQ Fixed Node */}
                <Marker position={[11.6643, 78.1460]} icon={Icons.blue}>
                    <Popup>
                        <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Salem District HQ</div>
                        <p className="text-[8px] text-slate-500 font-bold uppercase mt-1">Operational Command Center</p>
                    </Popup>
                </Marker>

                {/* Render Land Parcels with Classification Color Coding */}
                {parcels.filter(p => showPrivate || p.classification !== 'Private').map(parcel => {
                    if (!parcel.coordinates || parcel.coordinates.length === 0) return null;
                    const style = getParcelStyle(parcel, alerts);
                    return (
                        <Polygon
                            key={parcel.id}
                            positions={parcel.coordinates}
                            pathOptions={style}
                            eventHandlers={{
                                click: () => onParcelClick && onParcelClick(parcel)
                            }}
                        >
                            <Popup>
                                <div style={{ minWidth: 160 }}>
                                    <div style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: CLASSIFICATION_COLORS[parcel.classification]?.stroke || '#64748b', marginBottom: 4 }}>
                                        {parcel.classification || 'Unknown'}
                                    </div>
                                    <div style={{ fontSize: 10, fontWeight: 800, color: '#0f172a', marginBottom: 2 }}>Survey: {parcel.survey_number}</div>
                                    <div style={{ fontSize: 9, color: '#64748b', marginBottom: 2 }}>Owner: {parcel.owner_name || 'N/A'}</div>
                                    <div style={{ fontSize: 9, color: '#64748b' }}>Village: {parcel.village_code}</div>
                                    {alerts.some(a => a.parcel === parcel.id && a.status !== 'Resolved') && (
                                        <div style={{ marginTop: 6, padding: '4px 8px', background: '#fee2e2', border: '1px solid #fca5a5', fontSize: 8, fontWeight: 900, color: '#b91c1c', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                            ⚠ Active Encroachment Alert
                                        </div>
                                    )}
                                    {parcel.classification === 'Roadside' && (
                                        <div style={{ marginTop: 4, padding: '4px 8px', background: '#fef3c7', border: '1px solid #fcd34d', fontSize: 8, fontWeight: 900, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                            🛣 Roadside — Collector Priority
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
                                    {isRoadside && (
                                        <div style={{ fontSize: 8, fontWeight: 900, color: '#b45309', background: '#fef3c7', padding: '2px 6px', marginBottom: 4, textTransform: 'uppercase' }}>
                                            🛣 ROADSIDE PRIORITY
                                        </div>
                                    )}
                                    <div style={{ fontSize: 9, color: '#64748b', marginBottom: 2 }}>Survey: {alert.survey_number || alert.parcel_details}</div>
                                    {!isResolved && <div style={{ fontSize: 9, fontWeight: 800, color: '#0f172a' }}>Confidence: {(alert.confidence_score * 100).toFixed(0)}%</div>}
                                    {isResolved && (
                                        <div style={{ marginTop: 4, padding: '4px 8px', background: '#dcfce7', border: '1px solid #86efac', fontSize: 8, fontWeight: 900, color: '#15803d' }}>
                                            {alert.resolution_notes || 'Resolved by Field Officer'}
                                        </div>
                                    )}
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}

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

            {/* Legend Overlay */}
            {showLegend && <MapLegend />}
            <div style={{ position: 'absolute', bottom: 24, right: 16, zIndex: 1000, display: 'flex', gap: 8 }}>
                <button
                    onClick={() => setShowPrivate(v => !v)}
                    style={{
                        background: showPrivate ? 'rgba(37,99,235,0.9)' : 'rgba(15,23,42,0.85)',
                        color: 'white', border: '1px solid rgba(255,255,255,0.15)',
                        padding: '6px 12px', fontSize: 9, fontWeight: 900, letterSpacing: '0.12em', cursor: 'pointer',
                        textTransform: 'uppercase',
                    }}
                >
                    {showPrivate ? 'Govt Focus: OFF' : 'Govt Focus: ON'}
                </button>
                <button
                    onClick={() => setShowLegend(v => !v)}
                    style={{
                        background: 'rgba(15,23,42,0.85)', color: 'white', border: '1px solid rgba(255,255,255,0.15)',
                        padding: '6px 12px', fontSize: 9, fontWeight: 900, letterSpacing: '0.12em', cursor: 'pointer',
                        textTransform: 'uppercase',
                    }}
                >
                    {showLegend ? 'Hide Legend' : 'Show Legend'}
                </button>
            </div>
        </div>
    );
});

export default MapView;
