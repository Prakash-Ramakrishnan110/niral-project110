import React, { useState, useEffect } from 'react';
import { Layers, Globe, Shield, RefreshCcw, AlertTriangle } from 'lucide-react';
import MapView from '../components/Map';
import { LandAPI, CaseAPI } from '../api/client';
import CaseDetailModal from '../components/CaseDetailModal';

export const TacticalMapView = () => {
  const [parcels, setParcels] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCaseId, setSelectedCaseId] = useState(null);

  const loadMapData = async () => {
    setLoading(true);
    try {
      const [parcelsData, casesData] = await Promise.all([
        LandAPI.getParcels(),
        CaseAPI.getCases(),
      ]);
      setParcels(parcelsData?.features || parcelsData || []);
      setCases(Array.isArray(casesData) ? casesData : []);
    } catch (err) {
      console.error('Failed to load GIS data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMapData();
  }, []);

  return (
    <div className="h-[calc(100vh-105px)] flex flex-col relative bg-slate-100">
      {/* MAP CONTROLS OVERLAY */}
      <div className="absolute top-4 left-4 z-20 bg-white/95 backdrop-blur-xs p-3 rounded-xl border border-slate-200 shadow-md max-w-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Tactical Cadastral Map
            </h2>
          </div>
          <button
            onClick={loadMapData}
            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">
          PostGIS cadastral boundaries overlaid with Sentinel-2 change footprints.
        </p>
      </div>

      {/* MAP COMPONENT */}
      <div className="flex-1 w-full h-full">
        <MapView
          parcels={parcels}
          alerts={cases}
          onSelectAlert={(a) => setSelectedCaseId(a.id)}
        />
      </div>

      {/* CASE DETAIL MODAL */}
      {selectedCaseId && (
        <CaseDetailModal
          caseId={selectedCaseId}
          onClose={() => setSelectedCaseId(null)}
          onCaseUpdated={loadMapData}
        />
      )}
    </div>
  );
};

export default TacticalMapView;
