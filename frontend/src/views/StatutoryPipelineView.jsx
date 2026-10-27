import React, { useState } from 'react';
import {
  Scale, FileText, Download, Lock, CheckCircle2, ShieldAlert,
  AlertTriangle, Compass, MapPin, RefreshCcw, HardHat
} from 'lucide-react';
import LandAPI from '../api/client';

export const StatutoryPipelineView = ({ alerts = [], onRefresh, selectedAlert: initialSelectedAlert }) => {
  const [selectedAlert, setSelectedAlert] = useState(initialSelectedAlert || alerts[0] || null);
  const [isLocking, setIsLocking] = useState(false);
  const [isIssuingSec6, setIsIssuingSec6] = useState(false);
  const [isIssuingSec7, setIsIssuingSec7] = useState(false);
  const [fmbAck, setFmbAck] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);

  const activeAlert = selectedAlert || alerts[0];

  const handleIssueSection7 = async (alertId) => {
    if (!fmbAck) {
      setActionMessage({
        type: 'error',
        text: 'Statutory Requirement: Officer must check the FMB acknowledgement box before issuing Section 7 notice.'
      });
      return;
    }
    setIsIssuingSec7(true);
    setActionMessage(null);
    try {
      await LandAPI.issueSection7(alertId, {
        officer_fmb_acknowledgement: true,
        notes: 'Section 7 notice issued with acknowledged indicative FMB measurements.'
      });
      setActionMessage({ type: 'success', text: `Section 7 Show-Cause Notice issued for Alert #${alertId}!` });
      onRefresh();
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message;
      setActionMessage({ type: 'error', text: 'Failed to issue Section 7 notice: ' + errMsg });
    } finally {
      setIsIssuingSec7(false);
    }
  };

  const handleDownloadNotice = async (alertId, surveyNo) => {
    try {
      await LandAPI.downloadSection7Notice(alertId, surveyNo || 'Survey');
    } catch (err) {
      alert('Error downloading notice: ' + err.message);
    }
  };

  const handleStar3Lock = async (alertId) => {
    setIsLocking(true);
    setActionMessage(null);
    try {
      const res = await LandAPI.lockStar3(alertId);
      setActionMessage({
        type: 'success',
        text: `STAR 3.0 Registration Freeze Activated! Sub-Registrar Office deed transfer blocked. Reference: ${res.star3_transaction_id || 'STAR3-TN-LOCKED'}`
      });
      onRefresh();
    } catch (err) {
      setActionMessage({ type: 'error', text: 'Failed to lock STAR 3.0 deed: ' + err.message });
    } finally {
      setIsLocking(false);
    }
  };

  const handleIssueSection6 = async (alertId) => {
    setIsIssuingSec6(true);
    setActionMessage(null);
    try {
      await LandAPI.issueSection6(alertId);
      setActionMessage({
        type: 'success',
        text: `Section 6 Summary Eviction Warrant issued under Tamil Nadu Act III of 1905!`
      });
      onRefresh();
    } catch (err) {
      setActionMessage({ type: 'error', text: 'Failed to issue Section 6 warrant: ' + err.message });
    } finally {
      setIsIssuingSec6(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* 1. PIPELINE HEADER */}
      <div className="bg-slate-900 border-l-4 border-amber-500 text-white p-6 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-amber-500 text-slate-900 text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
              <Scale size={11} /> DUE PROCESS OF LAW
            </span>
            <span className="text-[10px] text-slate-400 font-mono">TAMIL NADU ACT III OF 1905</span>
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tight mt-1">
            Statutory Legal Enforcement & FMB Notice Center
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Issuance of Section 7 Show-Cause Notices and Section 6 Eviction Warrants backed by automated FMB Cadastral Sketches,
            triangulation ladders, and STAR 3.0 Sub-Registrar deed locking.
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border border-slate-700 transition-all shrink-0"
        >
          <RefreshCcw size={14} /> Refresh
        </button>
      </div>

      {actionMessage && (
        <div className={`p-4 border-2 ${actionMessage.type === 'success' ? 'bg-green-50 border-green-500 text-green-900' : 'bg-red-50 border-red-500 text-red-900'} flex items-center gap-3 animate-in slide-in-from-top duration-300`}>
          <CheckCircle2 size={18} className={actionMessage.type === 'success' ? 'text-green-600' : 'text-red-600'} />
          <p className="text-xs font-bold uppercase tracking-wide">{actionMessage.text}</p>
        </div>
      )}

      {/* 2. STATUTORY STEPPER PIPELINE */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white p-4 border border-slate-200 shadow-sm">
        <div className="p-3 bg-slate-50 border-l-2 border-blue-600">
          <span className="text-[9px] font-black uppercase text-blue-600">STEP 1</span>
          <p className="text-xs font-black text-slate-900 mt-0.5">Satellite Detection</p>
          <p className="text-[10px] text-slate-500">Sentinel-2 & Tamil Nilam match</p>
        </div>
        <div className="p-3 bg-slate-50 border-l-2 border-indigo-600">
          <span className="text-[9px] font-black uppercase text-indigo-600">STEP 2</span>
          <p className="text-xs font-black text-slate-900 mt-0.5">VAO Field Recon</p>
          <p className="text-[10px] text-slate-500">GPS geofenced evidence photo</p>
        </div>
        <div className="p-3 bg-slate-50 border-l-2 border-amber-600">
          <span className="text-[9px] font-black uppercase text-amber-600">STEP 3</span>
          <p className="text-xs font-black text-slate-900 mt-0.5">Section 7 Notice</p>
          <p className="text-[10px] text-slate-500">7-Day show-cause with FMB sketch</p>
        </div>
        <div className="p-3 bg-slate-50 border-l-2 border-red-600">
          <span className="text-[9px] font-black uppercase text-red-600">STEP 4</span>
          <p className="text-xs font-black text-slate-900 mt-0.5">Section 6 Warrant</p>
          <p className="text-[10px] text-slate-500">STAR 3.0 deed lock & eviction</p>
        </div>
      </div>

      {/* 3. CASE DETAIL INSPECTION & FMB SKETCH VIEWER */}
      {activeAlert && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT: Case Dossier & Action Buttons */}
          <div className="lg:col-span-6 bg-white border border-slate-200 p-6 shadow-sm space-y-5">
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Case Dossier • Act III of 1905
                </span>
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight mt-1">
                  Survey No: {activeAlert.survey_number || activeAlert.parcel_details || '142/1'}
                </h2>
                <p className="text-xs text-blue-600 font-bold uppercase mt-0.5">
                  Taluk: {activeAlert.taluk || 'Salem West'} • Classification: {activeAlert.parcel_classification || 'Waterbody Poramboke'}
                </p>
              </div>

              <span className={`px-2.5 py-1 text-[9px] font-black uppercase border ${activeAlert.tier === 'TIER_1_CRITICAL' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                {activeAlert.tier || 'TIER_1_CRITICAL'}
              </span>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-100">
                <span className="text-[8px] font-black text-slate-400 uppercase">Encroached Area</span>
                <p className="text-sm font-black text-slate-900">{activeAlert.encroachment_area_sqm || 350} sq.m</p>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-100">
                <span className="text-[8px] font-black text-slate-400 uppercase">Structure Type</span>
                <p className="text-sm font-black text-slate-900 uppercase truncate">{activeAlert.structure_category || 'COMMERCIAL'}</p>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-100">
                <span className="text-[8px] font-black text-slate-400 uppercase">STAR 3.0 Status</span>
                <p className="text-sm font-black text-red-600 uppercase">
                  {activeAlert.star3_locked ? 'LOCKED' : 'UNLOCKED'}
                </p>
              </div>
            </div>

            {/* Executive Action Buttons */}
            <div className="space-y-3 pt-2">
              <div className="p-3 bg-amber-50 border border-amber-300 text-amber-950 text-xs">
                <span className="font-bold flex items-center gap-1 text-[11px] uppercase tracking-wider text-amber-800">
                  <AlertTriangle size={13} className="text-amber-600" /> Statutory Survey Notice Disclaimer
                </span>
                <p className="mt-1 text-[11px] text-slate-700 leading-snug">
                  Cadastral measurements are <b>INDICATIVE</b> (polygon-derived). Under TN Act III of 1905, issuing Section 7 notice requires officer acknowledgement.
                </p>
                <label className="flex items-start gap-2 mt-2 cursor-pointer font-bold text-[11px] text-slate-900">
                  <input
                    type="checkbox"
                    checked={fmbAck}
                    onChange={(e) => setFmbAck(e.target.checked)}
                    className="mt-0.5"
                  />
                  <span>I acknowledge that FMB measurements are indicative polygon-derived coordinates pending certified field survey.</span>
                </label>
              </div>

              <button
                onClick={() => handleIssueSection7(activeAlert.id)}
                disabled={isIssuingSec7 || activeAlert.status === 'SECTION_7_ISSUED'}
                className={`w-full py-2.5 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                  activeAlert.status === 'SECTION_7_ISSUED'
                    ? 'bg-purple-100 text-purple-800 border border-purple-300 cursor-not-allowed'
                    : 'bg-purple-700 hover:bg-purple-600 text-white shadow-md'
                }`}
              >
                <Scale size={14} /> {activeAlert.status === 'SECTION_7_ISSUED' ? 'Section 7 Notice Already Issued' : isIssuingSec7 ? 'Issuing Section 7...' : 'Issue Section 7 Show-Cause Notice'}
              </button>

              <button
                onClick={() => handleDownloadNotice(activeAlert.id, activeAlert.survey_number)}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all"
              >
                <Download size={14} /> Download Section 7 Notice + FMB Sketch (PDF)
              </button>

              <button
                onClick={() => handleStar3Lock(activeAlert.id)}
                disabled={isLocking || activeAlert.star3_locked}
                className={`w-full py-2.5 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 border transition-all ${
                  activeAlert.star3_locked
                    ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                    : 'bg-red-50 text-red-700 border-red-300 hover:bg-red-100'
                }`}
              >
                <Lock size={14} /> {activeAlert.star3_locked ? 'STAR 3.0 Registration Locked (Active)' : isLocking ? 'Locking in Sub-Registrar DB...' : 'Freeze Deed Transfer in STAR 3.0'}
              </button>

              <button
                onClick={() => handleIssueSection6(activeAlert.id)}
                disabled={isIssuingSec6}
                className="w-full py-2.5 bg-slate-900 hover:bg-black text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
              >
                <Scale size={14} /> {isIssuingSec6 ? 'Issuing Section 6 Warrant...' : 'Issue Section 6 Summary Eviction Warrant'}
              </button>
            </div>
          </div>

          {/* RIGHT: Automated FMB Cadastral Sketch Visualizer */}
          <div className="lg:col-span-6 bg-slate-900 text-white p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Compass size={16} className="text-blue-400" />
                  <span className="text-xs font-black uppercase tracking-wider text-slate-200">
                    CollabLand / WebFMB Cadastral Sketch
                  </span>
                </div>
                <span className="text-[10px] text-green-400 font-mono">SURVEY SCALED 1:500</span>
              </div>

              {/* FMB Vector Drawing Canvas Representation */}
              <div className="my-6 p-4 bg-slate-950 border border-slate-800 flex flex-col items-center justify-center relative min-h-[260px]">
                {/* SVG Cadastral Map Representation */}
                <svg className="w-full h-56" viewBox="0 0 400 220">
                  {/* Outer Parcel Boundary */}
                  <polygon
                    points="40,30 360,30 340,190 60,190"
                    fill="none"
                    stroke="#475569"
                    strokeWidth="2"
                    strokeDasharray="4 2"
                  />
                  {/* G-Line Triangulation */}
                  <line x1="40" y1="30" x2="340" y2="190" stroke="#3b82f6" strokeWidth="1" strokeDasharray="3 3" />
                  <text x="180" y="105" fill="#60a5fa" fontSize="10" fontFamily="monospace">G-Line (142.4m)</text>

                  {/* Boundary Stones */}
                  <circle cx="40" cy="30" r="5" fill="#3b82f6" />
                  <text x="25" y="25" fill="#ffffff" fontSize="10" fontWeight="bold">Stone A</text>

                  <circle cx="360" cy="30" r="5" fill="#3b82f6" />
                  <text x="365" y="25" fill="#ffffff" fontSize="10" fontWeight="bold">Stone B</text>

                  <circle cx="340" cy="190" r="5" fill="#3b82f6" />
                  <text x="345" y="205" fill="#ffffff" fontSize="10" fontWeight="bold">Stone C</text>

                  <circle cx="60" cy="190" r="5" fill="#3b82f6" />
                  <text x="45" y="205" fill="#ffffff" fontSize="10" fontWeight="bold">Stone D</text>

                  {/* Red Hatch Encroachment Zone */}
                  <polygon
                    points="160,50 240,50 250,110 170,110"
                    fill="rgba(239, 68, 68, 0.35)"
                    stroke="#ef4444"
                    strokeWidth="2"
                  />
                  <text x="175" y="85" fill="#fca5a5" fontSize="10" fontWeight="bold">ENCROACHMENT</text>
                  <text x="185" y="98" fill="#ffffff" fontSize="9" fontFamily="monospace">{activeAlert.encroachment_area_sqm || 350} sq.m</text>

                  {/* Ladder Offset Pointer */}
                  <line x1="160" y1="50" x2="160" y2="90" stroke="#fbbf24" strokeWidth="1" />
                  <text x="95" y="70" fill="#fde047" fontSize="8" fontFamily="monospace">Offset: 14.2m N</text>
                </svg>

                <div className="text-[10px] text-slate-400 font-mono mt-2 text-center">
                  Survey Ladder Offsets verified from Stone A baseline along G-Line.
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-800 text-[10px] text-slate-300 font-mono flex justify-between">
              <span>GPS: 11.6643° N, 78.1460° E</span>
              <span>DATUM: WGS84 / EPSG:4326</span>
            </div>
          </div>
        </div>
      )}

      {/* 4. ACTIVE CASES LIST */}
      <div className="bg-white border border-slate-200 shadow-sm p-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-3">
          Select Encroachment Case for Statutory Inspection:
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {alerts.map(a => (
            <button
              key={a.id}
              onClick={() => setSelectedAlert(a)}
              className={`p-3 text-left border transition-all ${
                selectedAlert?.id === a.id
                  ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="font-mono text-xs font-bold text-slate-900">#{a.id}</span>
                <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 ${a.tier === 'TIER_1_CRITICAL' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                  {a.tier || 'Tier 2'}
                </span>
              </div>
              <p className="font-black text-xs text-slate-800 mt-1">{a.survey_number || a.parcel_details || '142/1'}</p>
              <p className="text-[10px] text-slate-500 uppercase">{a.taluk || 'Salem West'}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StatutoryPipelineView;
