import React, { useState } from 'react';
import MapView from '../components/Map';
import {
  Layers, Globe, ShieldAlert, CheckCircle2, AlertTriangle, Users, RefreshCcw
} from 'lucide-react';
import LandAPI from '../api/client';

export const SentinelGISView = ({ parcels = [], alerts = [], onRefresh, onMapClick, selectedPosition }) => {
  const [selectedAlertForAudit, setSelectedAlertForAudit] = useState(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditMessage, setAuditMessage] = useState(null);

  const handleDispatchPeerAudit = async (alertId) => {
    setIsAuditing(true);
    setAuditMessage(null);
    try {
      const res = await LandAPI.markFalsePositive(alertId);
      setAuditMessage({
        type: 'success',
        text: `Cross-Taluk Peer Audit Dispatched! Assigned to: ${res.peer_audit_taluk || 'Omalur Taluk Flying Squad'}. Discrepancy logged in state immutable audit trail.`
      });
      onRefresh();
    } catch (err) {
      setAuditMessage({ type: 'error', text: 'Failed to dispatch peer audit: ' + err.message });
    } finally {
      setIsAuditing(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* 1. GIS APEX BANNER */}
      <div className="bg-slate-900 border-l-4 border-blue-500 text-white p-6 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
              <Layers size={11} /> POSTGIS & SENTINEL SPATIAL INFRASTRUCTURE
            </span>
            <span className="text-[10px] text-slate-400 font-mono">TN-SSDI STATE SPATIAL NODE</span>
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tight mt-1">
            Cadastral Sentinel GIS & Anti-Corruption Peer Audit
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            High-resolution PostGIS cadastral masking over Tamil Nilam Poramboke land records,
            Sentinel-2 multispectral anomaly detection, and cross-taluk peer audit routing.
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border border-slate-700 transition-all shrink-0"
        >
          <RefreshCcw size={14} /> Refresh GIS
        </button>
      </div>

      {auditMessage && (
        <div className={`p-4 border-2 ${auditMessage.type === 'success' ? 'bg-green-50 border-green-500 text-green-900' : 'bg-red-50 border-red-500 text-red-900'} flex items-center gap-3 animate-in slide-in-from-top duration-300`}>
          <CheckCircle2 size={18} className={auditMessage.type === 'success' ? 'text-green-600' : 'text-red-600'} />
          <p className="text-xs font-bold uppercase tracking-wide">{auditMessage.text}</p>
        </div>
      )}

      {/* 2. MAP CONTAINER */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 bg-white border border-slate-200 shadow-sm h-[600px] overflow-hidden relative">
          <MapView
            parcels={parcels}
            alerts={alerts}
            onParcelClick={() => {}}
            onMapClick={onMapClick}
            selectedPosition={selectedPosition}
          />
        </div>

        {/* 3. ANTI-CORRUPTION AUDIT PANEL */}
        <div className="col-span-12 lg:col-span-4 bg-white border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <ShieldAlert size={18} className="text-red-600" />
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
                Anti-Corruption Peer Audit Engine
              </h2>
            </div>

            <p className="text-xs text-slate-600 mt-3 leading-relaxed">
              When a field officer marks a high-confidence satellite detection as <span className="font-bold text-red-600">"No Encroachment"</span>,
              the system automatically detects the statistical anomaly and bypasses the local node by triggering an unbiased
              <span className="font-bold text-blue-600"> Cross-Taluk Flying Squad</span> inspection.
            </p>

            <div className="mt-5 space-y-3">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                Select Case for Flying Squad Audit:
              </span>
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {alerts.map(a => (
                  <button
                    key={a.id}
                    onClick={() => setSelectedAlertForAudit(a)}
                    className={`w-full p-2.5 text-left border transition-all text-xs flex justify-between items-center ${
                      selectedAlertForAudit?.id === a.id
                        ? 'border-blue-600 bg-blue-50/50'
                        : 'border-slate-100 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <div>
                      <span className="font-black text-slate-900">#{a.id} • {a.survey_number || '142/1'}</span>
                      <p className="text-[10px] text-slate-500">{a.taluk || 'Salem West'}</p>
                    </div>
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-slate-200 text-slate-700">
                      {a.status || 'NEW'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button
              onClick={() => handleDispatchPeerAudit(selectedAlertForAudit ? selectedAlertForAudit.id : alerts[0]?.id)}
              disabled={isAuditing || alerts.length === 0}
              className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all"
            >
              <Users size={14} />
              {isAuditing ? 'Routing to Adjacent Taluk...' : 'Dispatch Cross-Taluk Flying Squad'}
            </button>
            <p className="text-[9px] text-slate-400 text-center mt-2 uppercase font-mono">
              Immutable logging enabled under Tamil Nadu Vigilance Protocol.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SentinelGISView;
