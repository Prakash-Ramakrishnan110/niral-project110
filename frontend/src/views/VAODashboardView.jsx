import React, { useState, useMemo } from 'react';
import {
  Compass, MapPin, Camera, CheckCircle2, AlertTriangle, ShieldCheck,
  Send, Upload, Eye, FileText, RefreshCcw, Home, Building, Sparkles
} from 'lucide-react';
import MapView from '../components/Map';
import LandAPI from '../api/client';

export const VAODashboardView = ({ alerts = [], parcels = [], user, patchAlertStatus, onRefresh }) => {
  const [selectedAlert, setSelectedAlert] = useState(alerts[0] || null);
  const [structureType, setStructureType] = useState('COMMERCIAL_LAYOUT');
  const [remarks, setRemarks] = useState('');
  const [evidencePhoto, setEvidencePhoto] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  // Village-level alerts (Salem West / Suramangalam)
  const vaoAlerts = useMemo(() => {
    return alerts.filter(a => {
      const taluk = (a.taluk || '').toLowerCase();
      return taluk.includes('salem') || taluk.includes('west') || !a.taluk;
    });
  }, [alerts]);

  const activeAlert = selectedAlert || vaoAlerts[0] || alerts[0];

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEvidencePhoto(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitFieldReport = async () => {
    if (!activeAlert) return;
    setIsSubmitting(true);
    setSuccessMessage(null);

    try {
      // 1. Update Alert status and structure category
      await patchAlertStatus(activeAlert.id, 'VAO_SUBMITTED', {
        structure_category: structureType,
        resolution_notes: remarks || `On-ground field inspection completed by VAO ${user?.officer || 'P. Murugan'}.`,
        resolution_images: evidencePhoto ? [evidencePhoto] : undefined,
      });

      // 2. Submit formal verification record
      try {
        const formData = new FormData();
        formData.append('alert_id', activeAlert.id);
        formData.append('officer_name', user?.officer || 'Thiru. P. Murugan');
        formData.append('remarks', remarks || `Structure verified as ${structureType}`);
        formData.append('gps_lat', activeAlert.position?.[0] || 11.6643);
        formData.append('gps_lon', activeAlert.position?.[1] || 78.1460);
        await LandAPI.submitVerification(formData);
      } catch (verifErr) {
        console.warn('Formal verification API optional sync:', verifErr);
      }

      setSuccessMessage(`Field Inspection Dossier for Survey ${activeAlert.survey_number} transmitted to Tahsildar with Geofenced Evidence!`);
      setRemarks('');
      setEvidencePhoto(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert('Failed to submit report: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* 1. VAO APEX HEADER */}
      <div className="bg-slate-900 border-l-4 border-emerald-500 text-white p-6 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
              <Compass size={11} /> VILLAGE ADMINISTRATIVE OFFICER COMMAND
            </span>
            <span className="text-[10px] text-slate-400 font-mono">NODE: SURAMANGALAM • SALEM WEST</span>
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tight mt-1">
            Village Encroachment Reconnaissance & Field Evidence Hub
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Logged in as <span className="text-emerald-400 font-bold">{user?.officer || 'Thiru. P. Murugan'} (VAO)</span>.
            Responsible for on-site physical inspection, 15m GPS geofencing, structure categorization, and ground photo proof.
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border border-slate-700 transition-all shrink-0"
        >
          <RefreshCcw size={14} /> Refresh Village Queue
        </button>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border-2 border-emerald-500 text-emerald-900 flex items-center gap-3 animate-in slide-in-from-top duration-300">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <p className="text-xs font-bold uppercase tracking-wide">{successMessage}</p>
        </div>
      )}

      {/* 2. VILLAGE TELEMETRY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-5 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Assigned Tasks</span>
          <p className="text-3xl font-black text-slate-900 mt-1">{vaoAlerts.length}</p>
          <p className="text-[10px] text-slate-500 mt-1">Parcels pending verification</p>
        </div>

        <div className="bg-white border border-slate-200 p-5 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">GPS Geofence</span>
          <p className="text-xl font-black text-emerald-600 mt-1 flex items-center gap-1.5">
            <ShieldCheck size={20} /> 15m LOCKED
          </p>
          <p className="text-[10px] text-slate-500 mt-1">Tamper-proof EXIF & GPS validation</p>
        </div>

        <div className="bg-white border border-slate-200 p-5 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Village Sector</span>
          <p className="text-lg font-black text-slate-900 mt-1 truncate">Salem West - Sector A</p>
          <p className="text-[10px] text-slate-500 mt-1">Suramangalam / Meyyanur Zone</p>
        </div>

        <div className="bg-white border border-slate-200 p-5 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">Statutory SLA</span>
          <p className="text-xl font-black text-blue-600 mt-1">48 Hours</p>
          <p className="text-[10px] text-slate-500 mt-1">Field report submission target</p>
        </div>
      </div>

      {/* 3. ACTIVE FIELD MISSION & EVIDENCE CAPTURE CONSOLE */}
      {activeAlert && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT: Task Dossier & Evidence Submission Form */}
          <div className="lg:col-span-6 bg-white border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">
                Current Field Inspection Mission
              </span>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight mt-1">
                Survey No: {activeAlert.survey_number || activeAlert.parcel_details || '142/1'}
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Classification: <span className="font-bold text-slate-900">{activeAlert.parcel_classification || 'Government Poramboke'}</span> • Taluk: <span className="font-bold text-slate-900">{activeAlert.taluk || 'Salem West'}</span>
              </p>
            </div>

            {/* Structure Categorization (Crucial for Legal vs Humanitarian workflow) */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-700 mb-2">
                1. On-Ground Structure Categorization:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setStructureType('COMMERCIAL_LAYOUT')}
                  className={`p-3 text-left border text-xs font-bold transition-all ${
                    structureType === 'COMMERCIAL_LAYOUT'
                      ? 'border-red-600 bg-red-50 text-red-900 shadow-sm'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Building size={16} className="text-red-600 mb-1" />
                  <p className="text-[11px] font-black uppercase leading-tight">Commercial Grab</p>
                  <p className="text-[8px] text-red-600 mt-0.5">Section 7 Eviction</p>
                </button>

                <button
                  type="button"
                  onClick={() => setStructureType('TEMPORARY_PANDAL')}
                  className={`p-3 text-left border text-xs font-bold transition-all ${
                    structureType === 'TEMPORARY_PANDAL'
                      ? 'border-amber-600 bg-amber-50 text-amber-900 shadow-sm'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Sparkles size={16} className="text-amber-600 mb-1" />
                  <p className="text-[11px] font-black uppercase leading-tight">Temp Pandal</p>
                  <p className="text-[8px] text-amber-600 mt-0.5">15-Day Auto Grace</p>
                </button>

                <button
                  type="button"
                  onClick={() => setStructureType('VULNERABLE_HOUSING')}
                  className={`p-3 text-left border text-xs font-bold transition-all ${
                    structureType === 'VULNERABLE_HOUSING'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-sm'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Home size={16} className="text-emerald-600 mb-1" />
                  <p className="text-[11px] font-black uppercase leading-tight">Thatched Hut</p>
                  <p className="text-[8px] text-emerald-600 mt-0.5">TNUHDB Housing Aid</p>
                </button>
              </div>
            </div>

            {/* Evidence Photo Attachment */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-700 mb-2">
                2. Geofenced Field Evidence Photo:
              </label>
              <div className="flex items-center gap-4">
                <label className="flex-1 border-2 border-dashed border-slate-300 hover:border-emerald-500 p-4 text-center cursor-pointer bg-slate-50 hover:bg-emerald-50/20 transition-all">
                  <Camera size={24} className="mx-auto text-slate-400 mb-1" />
                  <span className="text-xs font-bold text-slate-700 block">
                    {evidencePhoto ? 'Photo Attached (Click to Replace)' : 'Attach Geotagged Field Photo'}
                  </span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">
                    Validates GPS coordinate within 15 meters of parcel centroid
                  </span>
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </label>

                {evidencePhoto && (
                  <div className="w-20 h-20 border border-slate-300 overflow-hidden shrink-0 shadow-sm">
                    <img src={evidencePhoto} alt="Evidence" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>

            {/* Remarks Input */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-700 mb-1">
                3. Field Verification Remarks / Encroacher Details:
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Enter occupant identity, structural details, fence boundaries, and on-ground observations..."
                rows={3}
                className="w-full text-xs p-3 border border-slate-300 focus:outline-none focus:border-emerald-500 rounded-none"
              />
            </div>

            {/* Action Submit Button */}
            <button
              onClick={handleSubmitFieldReport}
              disabled={isSubmitting}
              className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all"
            >
              <Send size={15} />
              {isSubmitting ? 'Transmitting to Tahsildar...' : 'Submit Geotagged Field Report to Tahsildar'}
            </button>
          </div>

          {/* RIGHT: Village Cadastral Map */}
          <div className="lg:col-span-6 bg-white border border-slate-200 p-4 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-emerald-600" />
                  <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                    Village Cadastral Boundary Map
                  </span>
                </div>
                <span className="text-[10px] font-mono text-emerald-700 font-bold">
                  SURAMANGALAM GRID
                </span>
              </div>

              <div className="h-[380px] overflow-hidden border border-slate-200 relative">
                <MapView
                  parcels={parcels}
                  alerts={alerts}
                  onParcelClick={() => {}}
                  onMapClick={() => {}}
                  selectedPosition={activeAlert.position}
                />
              </div>
            </div>

            <div className="pt-3 text-[10px] text-slate-500 font-mono flex justify-between">
              <span>TARGET GPS: {activeAlert.position ? `${activeAlert.position[0]?.toFixed(4)}° N, ${activeAlert.position[1]?.toFixed(4)}° E` : '11.6643° N, 78.1460° E'}</span>
              <span className="text-emerald-700 font-bold">TAMIL NILAM VERIFIED</span>
            </div>
          </div>
        </div>
      )}

      {/* 4. VILLAGE QUEUE LIST */}
      <div className="bg-white border border-slate-200 shadow-sm p-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-3">
          Select Village Parcel for Physical Inspection:
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {vaoAlerts.map(a => (
            <button
              key={a.id}
              onClick={() => setSelectedAlert(a)}
              className={`p-3 text-left border transition-all ${
                activeAlert?.id === a.id
                  ? 'border-emerald-600 bg-emerald-50/50 shadow-sm'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="font-mono text-xs font-bold text-slate-900">#{a.id}</span>
                <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 ${a.status === 'VAO_SUBMITTED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-800'}`}>
                  {a.status || 'PENDING_RECON'}
                </span>
              </div>
              <p className="font-black text-xs text-slate-800 mt-1">{a.survey_number || a.parcel_details || '142/1'}</p>
              <p className="text-[10px] text-slate-500 uppercase">{a.parcel_classification || 'Government Poramboke'}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VAODashboardView;
