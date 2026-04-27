import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, LayersControl, useMapEvents } from 'react-leaflet';
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
    green: createIcon('green')
};

// Component to handle map clicks
const MapClickHandler = ({ onClick }) => {
    useMapEvents({
        click: (e) => {
            onClick(e.latlng);
        },
    });
    return null;
};

const MapView = React.memo(({ parcels = [], alerts = [], onParcelClick, onMapClick, selectedPosition = null }) => {
    const center = [11.6643, 78.1460]; // Centered on Salem District

    const getParcelColor = (classification) => {
        switch(classification) {
            case 'Government': return '#ef4444';
            case 'Waterbody': return '#3b82f6';
            case 'Forest': return '#10b981';
            default: return '#64748b';
        }
    };

    return (
        <div style={{ height: '100%', width: '100%' }}>
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

                {/* Render Land Parcels */}
                {parcels.map(parcel => (
                    <Polygon 
                        key={parcel.id} 
                        positions={parcel.coordinates} 
                        pathOptions={{ 
                            color: getParcelColor(parcel.classification), 
                            weight: 2, 
                            fillOpacity: 0.3 
                        }}
                        eventHandlers={{
                            click: () => onParcelClick && onParcelClick(parcel)
                        }}
                    >
                        <Popup>
                            <div className="text-[10px] font-black uppercase text-blue-600">{parcel.village_code}</div>
                            <div className="text-[9px] font-bold uppercase text-slate-800 mt-1">Survey No: {parcel.survey_number}</div>
                            <div className="text-[9px] text-slate-500 uppercase mt-1">Owner: {parcel.owner_name}</div>
                        </Popup>
                    </Polygon>
                ))}

                {/* Render Encroachment Alerts */}
                {alerts.filter(a => a.position && a.position[0] && a.position[1]).map(alert => {
                    let icon = Icons.red;
                    if (alert.status === 'Resolved') icon = Icons.green;
                    else if (alert.alert_type?.includes('Waterbody')) icon = Icons.blue;
                    else if (alert.alert_type?.includes('Forest')) icon = Icons.violet;
                    else if (alert.alert_type?.includes('Excavation')) icon = Icons.orange;
                    else if (alert.confidence_score < 0.9) icon = Icons.yellow;

                    return (
                        <Marker key={`alert-${alert.id}`} position={alert.position} icon={icon}>
                            <Popup>
                                <div className={`text-[10px] font-black uppercase tracking-tight ${alert.status === 'Resolved' ? 'text-green-600' : (alert.alert_type?.includes('Waterbody') ? 'text-blue-600' : 'text-red-600')}`}>
                                    {alert.alert_type || 'AI Detection Alert'}
                                    {alert.status === 'Resolved' && ' [VERIFIED]'}
                                </div>
                                <div className="text-[9px] text-slate-500 uppercase mt-1">Survey: {alert.survey_number || alert.parcel_details}</div>
                                {alert.status === 'Resolved' ? (
                                    <div className="bg-green-50 p-2 rounded-lg mt-2 border border-green-100">
                                        <p className="text-[8px] font-black text-green-700 uppercase leading-tight">{alert.resolution_notes || 'Resolved by Field Officer'}</p>
                                    </div>
                                ) : (
                                    <div className="text-[9px] font-black text-slate-800 mt-1">Confidence: {(alert.confidence_score * 100).toFixed(0)}%</div>
                                )}
                            </Popup>
                        </Marker>
                    );
                })}
                {/* Render Selected Tactical Probe */}
                {selectedPosition && (
                    <Marker position={selectedPosition} icon={Icons.violet}>
                        <Popup>
                            <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Tactical Probe Active</div>
                            <div className="text-[8px] text-slate-400 font-bold uppercase mt-1">Coordinates: {selectedPosition[0].toFixed(4)}, {selectedPosition[1].toFixed(4)}</div>
                        </Popup>
                    </Marker>
                )}
            </MapContainer>
        </div>
    );
});

export default MapView;
