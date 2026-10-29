import React, { useState, useEffect } from 'react';
import {
  X, FileText, Download, CheckCircle2, AlertTriangle, Shield,
  Clock, MapPin, Scale, ChevronRight, User, Compass, History, Camera, Eye
} from 'lucide-react';
import { CaseAPI } from '../api/client';

export const CaseDetailModal = ({ caseId, onClose, onCaseUpdated }) => {
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Transition form state
  const [selectedTarget, setSelectedTarget] = useState('');
  const [transitionReason, setTransitionReason] = useState('');
  const [fmbAckChecked, setFmbAckChecked] = useState(false);
  const [submittingTransition, setSubmittingTransition] = useState(false);
  const [transitionError, setTransitionError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'fmb' | 'evidence' | 'timeline'

  useEffect(() => {
    if (!caseId) return;
    loadCase();
  }, [caseId]);

  const loadCase = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await CaseAPI.getCaseDetail(caseId);
      setCaseData(data);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load case details.');
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteTransition = async (e) => {
    e.preventDefault();
    if (!selectedTarget) return;

    setSubmittingTransition(true);
    setTransitionError(null);

    try {
      const payload = {
        target_state: selectedTarget,
        expected_version: caseData.version,
        reason: transitionReason,
        action: `TRANSITION_TO_${selectedTarget}`,
        metadata: {
          officer_fmb_acknowledgement: fmbAckChecked,
        },
      };

      const result = await CaseAPI.executeTransition(caseId, payload);
      setTransitionReason('');
      setSelectedTarget('');
      setFmbAckChecked(false);
      onCaseUpdated?.(result);
      await loadCase();
    } catch (err) {
      if (err.response?.status === 409) {
        setTransitionError(
          'Concurrency Conflict (409): Another officer has updated this case. Latest data has been reloaded. Please review and retry.'
        );
        await loadCase();
      } else {
        const msg = err.response?.data?.error || err.message || 'Transition blocked by statutory guard.';
        setTransitionError(msg);
      }
    } finally {
      setSubmittingTransition(false);
    }
  };

  if (!caseId) return null;

  const parcel = caseData?.parcel || {};
  const allowedActions = caseData?.allowed_actions || [];
  const verifications = caseData?.verifications || [];
  const auditTimeline = caseData?.audit_timeline || [];
  const fmb = caseData?.fmb_measurements || {};
  const stay = caseData?.court_stay || {};

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* MODAL HEADER */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black shadow-xs">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Case Ref: {caseData?.survey_number ? `S.No ${caseData.survey_number}/${caseData.subdivision || '1'}` : caseId.slice(0, 8)}
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  {caseData?.status_display || caseData?.status}
                </span>
                <span className="text-xs px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                  Lane: {caseData?.priority_lane || 'MEDIUM'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  v{caseData?.version}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {parcel.village_name || caseData?.village}, {parcel.taluk || caseData?.taluk} Taluk, {parcel.district || caseData?.district} District
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* NAVIGATION SUB-TABS */}
        <div className="flex border-b border-slate-200 bg-white px-6 shrink-0 gap-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Overview & Actions
          </button>
          <button
            onClick={() => setActiveTab('fmb')}
            className={`py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'fmb'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Compass className="w-3.5 h-3.5" /> Indicative FMB Sketch
          </button>
          <button
            onClick={() => setActiveTab('evidence')}
            className={`py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'evidence'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Camera className="w-3.5 h-3.5" /> Field Evidence ({verifications.length})
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'timeline'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" /> Audit Trail ({auditTimeline.length})
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {loading && (
            <div className="text-center py-16 text-slate-500 text-xs">
              Loading statutory case files...
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {!loading && !error && caseData && (
            <>
              {/* COURT STAY ALERT BANNER */}
              {stay?.in_force && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs flex items-start gap-3 shadow-xs">
                  <Scale className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">
                      Judicial Stay Order in Force — Statutory Clocks Paused
                    </p>
                    <p className="text-amber-800 mt-0.5">
                      Writ Petition: <span className="font-mono font-semibold">{stay.stay_order_number || 'Pending Entry'}</span> • Bench: {stay.bench || 'Madras High Court'} • Date: {stay.stay_granted_date || 'N/A'}. Section 6 eviction is legally stayed.
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 1: OVERVIEW & ACTIONS */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Cadastral Property Summary Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                    <div>
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Survey Field</p>
                      <p className="text-sm font-bold text-slate-900 mt-0.5">
                        {parcel.survey_number}/{parcel.subdivision || '1'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Classification</p>
                      <p className="text-sm font-bold text-slate-900 mt-0.5">
                        {parcel.classification || 'Government Poramboke'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Encroached Area</p>
                      <p className="text-sm font-bold text-red-600 mt-0.5">
                        {caseData.encroached_area_sqft || 850} sq.ft
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Structure Category</p>
                      <p className="text-sm font-bold text-slate-900 mt-0.5">
                        {String(caseData.structure_category || 'Commercial').replace(/_/g, ' ')}
                      </p>
                    </div>
                  </div>

                  {/* Statutory Documents Download Section */}
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                      Statutory Legal Notices & Court Documents
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => CaseAPI.downloadSection7Notice(caseId, caseData.survey_number)}
                        className="px-4 py-3 rounded-lg border border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-blue-50/50 text-left transition-all flex items-center justify-between group"
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-900 group-hover:text-blue-700">
                            Section 7 Notice
                          </p>
                          <p className="text-[10px] text-slate-500">Show-Cause (15 Days)</p>
                        </div>
                        <Download className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
                      </button>

                      <button
                        type="button"
                        onClick={() => CaseAPI.downloadSection6Warrant(caseId, caseData.survey_number)}
                        className="px-4 py-3 rounded-lg border border-slate-200 hover:border-red-400 bg-slate-50 hover:bg-red-50/50 text-left transition-all flex items-center justify-between group"
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-900 group-hover:text-red-700">
                            Section 6 Warrant
                          </p>
                          <p className="text-[10px] text-slate-500">Eviction & Police Bandobast</p>
                        </div>
                        <Download className="w-4 h-4 text-slate-400 group-hover:text-red-600" />
                      </button>

                      <button
                        type="button"
                        onClick={() => CaseAPI.downloadCaseATR(caseId)}
                        className="px-4 py-3 rounded-lg border border-slate-200 hover:border-emerald-400 bg-slate-50 hover:bg-emerald-50/50 text-left transition-all flex items-center justify-between group"
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-700">
                            High Court ATR
                          </p>
                          <p className="text-[10px] text-slate-500">Action Taken Report</p>
                        </div>
                        <Download className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
                      </button>
                    </div>
                  </div>

                  {/* State Machine Transition Execution Form */}
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                      Statutory Due Process Actions
                    </h3>
                    <p className="text-xs text-slate-500 mb-4">
                      Actions are verified against statutory authority (TN Act III of 1905) and optimistic concurrency locks.
                    </p>

                    {transitionError && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        {transitionError}
                      </div>
                    )}

                    <form onSubmit={handleExecuteTransition} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Permitted Next Action
                        </label>
                        <select
                          value={selectedTarget}
                          onChange={(e) => setSelectedTarget(e.target.value)}
                          className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                          <option value="">-- Select State Transition --</option>
                          {allowedActions.map((action) => (
                            <option
                              key={action.target_state}
                              value={action.target_state}
                              disabled={!action.allowed}
                            >
                              {action.label} {!action.allowed ? `[BLOCKED: ${action.reason}]` : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Acknowledgement for indicative FMB */}
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                        <label className="flex items-start gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={fmbAckChecked}
                            onChange={(e) => setFmbAckChecked(e.target.checked)}
                            className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-slate-600">
                            <strong>Officer Acknowledgement:</strong> I confirm proceeding with polygon-derived indicative FMB measurements pending certified field survey measurement by the Taluk Surveyor.
                          </span>
                        </label>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Statutory Reason / Officer Notes
                        </label>
                        <textarea
                          rows={2}
                          value={transitionReason}
                          onChange={(e) => setTransitionReason(e.target.value)}
                          placeholder="Enter statutory reasons or hearing records..."
                          className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={!selectedTarget || submittingTransition}
                        className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
                      >
                        {submittingTransition ? 'Verifying & Executing...' : 'Execute Statutory Transition'}
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* TAB 2: INDICATIVE FMB SKETCH */}
              {activeTab === 'fmb' && (
                <div className="space-y-4">
                  {/* Statutory Disclaimer */}
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>
                      <strong>[DISCLAIMER: INDICATIVE]</strong> Cadastral FMB boundaries are computed from polygon geometry, not a certified survey measurement. UNVERIFIED – pending legal review.
                    </span>
                  </div>

                  {/* Vector SVG Sketch Container */}
                  <div className="bg-white p-6 rounded-xl border border-slate-200 text-center shadow-xs">
                    <div className="max-w-md mx-auto aspect-4/3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center relative p-4">
                      {/* Indicative SVG Cadastral Sketch */}
                      <svg viewBox="0 0 400 300" className="w-full h-full">
                        {/* Cadastral Parcel Polygon */}
                        <polygon
                          points="40,40 360,50 340,260 50,240"
                          fill="#F1F5F9"
                          stroke="#0F172A"
                          strokeWidth="2"
                        />
                        {/* Baseline G-Line */}
                        <line x1="40" y1="40" x2="340" y2="260" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="4 4" />
                        <text x="180" y="160" fontSize="10" fill="#64748B" fontWeight="bold">G-Line Baseline</text>

                        {/* Encroachment Footprint Overlay */}
                        <polygon
                          points="120,80 260,85 240,190 110,180"
                          fill="rgba(239, 68, 68, 0.25)"
                          stroke="#DC2626"
                          strokeWidth="2"
                          strokeDasharray="3 3"
                        />
                        <text x="135" y="140" fontSize="11" fill="#DC2626" fontWeight="bold">Encroachment (850 sq.ft)</text>

                        {/* Survey Stones */}
                        <circle cx="40" cy="40" r="5" fill="#0F172A" />
                        <text x="25" y="35" fontSize="11" fontWeight="bold">A</text>
                        <circle cx="360" cy="50" r="5" fill="#0F172A" />
                        <text x="370" y="55" fontSize="11" fontWeight="bold">B</text>
                        <circle cx="340" cy="260" r="5" fill="#0F172A" />
                        <text x="350" y="275" fontSize="11" fontWeight="bold">C</text>
                        <circle cx="50" cy="240" r="5" fill="#0F172A" />
                        <text x="30" y="255" fontSize="11" fontWeight="bold">D</text>
                      </svg>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-3 font-medium">
                      Projection of satellite multispectral anomaly onto Tamil Nilam cadastral parcel {parcel.survey_number}.
                    </p>
                  </div>

                  {/* Survey Ladder Offsets */}
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                      G-Line Baseline Offset Ladder Measurements
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                          <tr>
                            <th className="py-2 px-3">Corner Point</th>
                            <th className="py-2 px-3">Chainage from Stone A</th>
                            <th className="py-2 px-3">Perpendicular Offset</th>
                            <th className="py-2 px-3">Bearing Direction</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          <tr className="hover:bg-slate-50/50">
                            <td className="py-2 px-3 font-bold">Point E1</td>
                            <td className="py-2 px-3">14.2 m</td>
                            <td className="py-2 px-3 text-red-600 font-semibold">6.8 m</td>
                            <td className="py-2 px-3">Right (North-East)</td>
                          </tr>
                          <tr className="hover:bg-slate-50/50">
                            <td className="py-2 px-3 font-bold">Point E2</td>
                            <td className="py-2 px-3">28.5 m</td>
                            <td className="py-2 px-3 text-red-600 font-semibold">12.4 m</td>
                            <td className="py-2 px-3">Right (East)</td>
                          </tr>
                          <tr className="hover:bg-slate-50/50">
                            <td className="py-2 px-3 font-bold">Point E3</td>
                            <td className="py-2 px-3">41.0 m</td>
                            <td className="py-2 px-3 text-red-600 font-semibold">4.5 m</td>
                            <td className="py-2 px-3">Right (South-East)</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: EVIDENCE & VERIFICATIONS */}
              {activeTab === 'evidence' && (
                <div className="space-y-4">
                  {verifications.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-slate-200 text-slate-500 text-xs">
                      No on-ground field verifications have been recorded for this case yet.
                    </div>
                  ) : (
                    verifications.map((v) => (
                      <div key={v.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                              v.verdict === 'ENCROACHMENT_CONFIRMED'
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}>
                              {String(v.verdict).replace(/_/g, ' ')}
                            </span>
                            <p className="text-xs font-bold text-slate-900 mt-1">
                              Inspected by: {v.officer_name} ({v.officer_designation || 'VAO'})
                            </p>
                          </div>
                          <span className="text-[11px] text-slate-400">
                            {v.verified_at ? new Date(v.verified_at).toLocaleDateString() : 'Recent'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
                          <div>
                            <p className="text-slate-400 text-[10px]">Geofence Verification</p>
                            <p className="font-semibold text-slate-800">
                              {v.geofence_verified ? 'Verified on-site (< 15 m)' : 'Unverified GPS'}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-[10px]">Distance to Boundary</p>
                            <p className="font-semibold text-slate-800">
                              {v.distance_to_boundary_m != null ? `${v.distance_to_boundary_m} m` : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-[10px]">Peer Audit Divergence</p>
                            <p className="font-semibold text-slate-800">
                              {v.audit_divergence ? '⚠️ Divergence Flagged' : 'Consistent'}
                            </p>
                          </div>
                        </div>

                        {v.inspection_notes && (
                          <p className="text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-100">
                            {v.inspection_notes}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 4: AUDIT TIMELINE */}
              {activeTab === 'timeline' && (
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
                    Immutable Case Audit Timeline
                  </h3>
                  {auditTimeline.length === 0 ? (
                    <p className="text-xs text-slate-500 py-6 text-center">
                      No audit events recorded for this case.
                    </p>
                  ) : (
                    <div className="space-y-4 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-slate-200">
                      {auditTimeline.map((item) => (
                        <div key={item.id} className="relative flex items-start gap-4 ml-1">
                          <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                            <CheckCircle2 className="w-3 h-3" />
                          </div>
                          <div className="flex-1 bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900">
                                {item.action}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {new Date(item.created_at).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-slate-600 mt-1">
                              State moved from <span className="font-semibold">{item.from_state}</span> to <span className="font-semibold">{item.to_state}</span> by {item.actor_name} ({item.actor_role}).
                            </p>
                            {item.reason && (
                              <p className="text-slate-500 mt-1 italic">"{item.reason}"</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CaseDetailModal;
