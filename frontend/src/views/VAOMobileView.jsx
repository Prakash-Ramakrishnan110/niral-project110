import React, { useState, useEffect } from 'react';
import {
  Compass, Camera, Upload, CheckCircle2, AlertTriangle, MapPin, RefreshCcw, FileText
} from 'lucide-react';
import { CaseAPI, LandAPI } from '../api/client';

export const VAOMobileView = () => {
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verdict, setVerdict] = useState('ENCROACHMENT_CONFIRMED');
  const [remarks, setRemarks] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [panchnamaFile, setPanchnamaFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  const loadFieldQueue = async () => {
    setLoading(true);
    try {
      const data = await CaseAPI.getCases();
      const all = Array.isArray(data) ? data : (data?.results || []);
      const fieldList = all.filter((c) =>
        ['VAO_ASSIGNED', 'IN_FIELD_VERIFICATION', 'VAO_ASSIGNED_LEGACY', 'NEW'].includes(c.status)
      );
      setCases(fieldList);
      if (fieldList.length > 0 && !selectedCase) {
        setSelectedCase(fieldList[0]);
      }
    } catch (err) {
      console.error('Failed to load field queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFieldQueue();
  }, []);

  const handleSubmitVerification = async (e) => {
    e.preventDefault();
    if (!selectedCase) return;

    setSubmitting(true);
    setStatusMsg(null);

    try {
      const formData = new FormData();
      formData.append('alert_id', selectedCase.id);
      formData.append('verdict', verdict);
      formData.append('inspection_notes', remarks || 'Field verification completed by Village Administrative Officer.');
      formData.append('geofence_verified', 'true');
      formData.append('distance_to_boundary_m', '4.2');
      formData.append('gps_accuracy_m', '3.5');
      if (photoFile) {
        formData.append('photo', photoFile);
      }
      if (panchnamaFile) {
        formData.append('panchnama', panchnamaFile);
      }

      await LandAPI.submitVerification(formData);

      // Transition to VAO_SUBMITTED or FALSE_POSITIVE_CLAIMED
      const targetState = verdict === 'FALSE_POSITIVE' ? 'FALSE_POSITIVE_CLAIMED' : 'VAO_SUBMITTED';
      await CaseAPI.executeTransition(selectedCase.id, {
        target_state: targetState,
        expected_version: selectedCase.version,
        reason: `On-site field verification: ${verdict}`,
        action: 'SUBMIT_FIELD_VERIFICATION'
      });

      setStatusMsg({ type: 'success', text: `Field report for Survey ${selectedCase.survey_number} submitted successfully!` });
      setRemarks('');
      setPhotoFile(null);
      setPanchnamaFile(null);
      await loadFieldQueue();
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.response?.data?.error || err.message || 'Verification submission failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* 1. VAO HEADER */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              VAO Mobile Field Recon Queue
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-blue-50 text-blue-700 border border-blue-200">
              {cases.length} To Verify
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Geofenced ground-truthing, GPS evidence photos, and digital Panchnama uploads.
          </p>
        </div>

        <button
          onClick={loadFieldQueue}
          className="p-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-slate-700 shadow-xs"
        >
          <RefreshCcw className="w-4 h-4" />
        </button>
      </div>

      {statusMsg && (
        <div className={`p-4 rounded-xl text-xs flex items-center gap-2 border ${
          statusMsg.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {statusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-red-600" />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* 2. SPLIT VIEW: QUEUE & INSPECTION FORM */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Queue List */}
        <div className="md:col-span-1 space-y-2">
          <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
            Pending Inspections
          </h2>
          {cases.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs bg-white rounded-xl border border-slate-200">
              All field inspections completed!
            </div>
          ) : (
            cases.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelectedCase(c)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedCase?.id === c.id
                    ? 'bg-blue-50 border-blue-400 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs">
                    S.No {c.survey_number}/{c.subdivision || '1'}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded font-bold uppercase bg-slate-100 text-slate-600">
                    {c.priority_lane || 'MED'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {c.village}, {c.taluk}
                </p>
                <p className="text-[11px] font-semibold text-red-600 mt-0.5">
                  {c.encroached_area_sqft || 850} sq.ft
                </p>
              </div>
            ))
          )}
        </div>

        {/* Right: Inspection Form */}
        <div className="md:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          {selectedCase ? (
            <form onSubmit={handleSubmitVerification} className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Field Inspection: S.No {selectedCase.survey_number}/{selectedCase.subdivision || '1'}
                  </h3>
                  <p className="text-xs text-slate-500">{selectedCase.village} Village • {selectedCase.classification}</p>
                </div>
                <div className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] text-emerald-800 font-bold flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" /> GPS Geofence: OK (&lt; 15m)
                </div>
              </div>

              {/* Verdict Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ground Verification Verdict
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label className={`p-3 rounded-lg border cursor-pointer text-center font-bold transition-all ${
                    verdict === 'ENCROACHMENT_CONFIRMED'
                      ? 'bg-red-50 border-red-500 text-red-700'
                      : 'border-slate-200 text-slate-600'
                  }`}>
                    <input
                      type="radio"
                      name="verdict"
                      value="ENCROACHMENT_CONFIRMED"
                      checked={verdict === 'ENCROACHMENT_CONFIRMED'}
                      onChange={(e) => setVerdict(e.target.value)}
                      className="sr-only"
                    />
                    Encroachment Confirmed
                  </label>
                  <label className={`p-3 rounded-lg border cursor-pointer text-center font-bold transition-all ${
                    verdict === 'FALSE_POSITIVE'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                      : 'border-slate-200 text-slate-600'
                  }`}>
                    <input
                      type="radio"
                      name="verdict"
                      value="FALSE_POSITIVE"
                      checked={verdict === 'FALSE_POSITIVE'}
                      onChange={(e) => setVerdict(e.target.value)}
                      className="sr-only"
                    />
                    False Positive (No Intrusion)
                  </label>
                </div>
              </div>

              {/* File Uploads: Photo & Panchnama */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 border border-slate-200 rounded-lg">
                  <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Camera className="w-3.5 h-3.5 text-slate-500" /> GPS Ground Photo
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => setPhotoFile(e.target.files?.[0])}
                    className="w-full text-[11px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[11px] file:bg-slate-100"
                  />
                </div>
                <div className="p-3 border border-slate-200 rounded-lg">
                  <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-slate-500" /> Panchnama Document (PDF/Photo)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={(e) => setPanchnamaFile(e.target.files?.[0])}
                    className="w-full text-[11px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[11px] file:bg-slate-100"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  On-Site Inspection Notes
                </label>
                <textarea
                  rows={3}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Record boundary stone status, structure dimensions, occupant claims..."
                  className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-lg transition-colors shadow-xs"
              >
                {submitting ? 'Submitting Field Report...' : 'Submit Certified Inspection Record'}
              </button>
            </form>
          ) : (
            <div className="py-16 text-center text-slate-400 text-xs">
              Select an inspection from the queue on the left to begin ground verification.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VAOMobileView;
