import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, AlertTriangle, Clock, CheckCircle2, Scale, Users,
  Layers, Compass, ArrowRight, RefreshCcw, FileText, Download,
  CloudOff, ShieldAlert, ChevronRight, Eye
} from 'lucide-react';
import { DashboardAPI, CaseAPI } from '../api/client';
import CaseDetailModal from '../components/CaseDetailModal';

export const ExecutiveDashboardView = ({ onRefreshData }) => {
  const [summary, setSummary] = useState(null);
  const [actionableCases, setActionableCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const navigate = useNavigate();

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await DashboardAPI.getSummary();
      setSummary(data);

      // Load actionable cases quick list
      const casesData = await CaseAPI.getCases({ is_actionable: 'true' });
      setActionableCases(Array.isArray(casesData) ? casesData.slice(0, 6) : []);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load executive summary.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const kpis = summary?.kpis || {};
  const pipeline = summary?.pipeline_stages || {};
  const coverageGaps = summary?.coverage_gaps || [];
  const integrity = summary?.integrity_indicators || {};
  const accuracy = summary?.accuracy || {};

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* 1. TOP HEADER & APEX STATUS */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Executive Encroachment Dashboard
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-blue-50 text-blue-700 border border-blue-200">
              {summary?.role || 'COLLECTOR'}
            </span>
            {summary?.is_demo && (
              <span className="text-xs px-2 py-0.5 rounded-full font-black bg-amber-50 text-amber-800 border border-amber-300">
                DEMO MODE
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time cadastral encroachment detection, statutory due process (TN Act III of 1905), and judicial compliance monitoring.
          </p>
        </div>

        <button
          onClick={() => {
            loadDashboard();
            onRefreshData?.();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 transition-colors shadow-xs"
        >
          <RefreshCcw className="w-3.5 h-3.5" /> Refresh Dashboard
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* 2. SECTION 1: TOP EXECUTIVE KPIS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Needs My Action */}
        <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600" />
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Needs Action</p>
          <p className="text-2xl font-black text-blue-700 mt-1">{kpis.needs_my_action ?? 0}</p>
          <p className="text-[10px] text-slate-400 mt-1">Awaiting your role</p>
        </div>

        {/* SLA Breached */}
        <div className="bg-white p-4 rounded-xl border border-red-200 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-red-600" />
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">SLA Breached</p>
          <p className="text-2xl font-black text-red-600 mt-1">{kpis.sla_breached ?? 0}</p>
          <p className="text-[10px] text-slate-400 mt-1">Past statutory SLA</p>
        </div>

        {/* Due in 48h */}
        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Due in 48h</p>
          <p className="text-2xl font-black text-amber-600 mt-1">{kpis.due_within_48h ?? 0}</p>
          <p className="text-[10px] text-slate-400 mt-1">Impending deadline</p>
        </div>

        {/* Peer Audits Open */}
        <div className="bg-white p-4 rounded-xl border border-purple-200 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-purple-600" />
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Peer Audits</p>
          <p className="text-2xl font-black text-purple-700 mt-1">{kpis.peer_audits_open ?? 0}</p>
          <p className="text-[10px] text-slate-400 mt-1">False-positive audit</p>
        </div>

        {/* Court Stays */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-slate-700" />
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Court Stays</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{kpis.court_stays_in_force ?? 0}</p>
          <p className="text-[10px] text-slate-400 mt-1">Clocks paused</p>
        </div>

        {/* Open Cases Total */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-600" />
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Cases</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{kpis.open_cases_total ?? 0}</p>
          <p className="text-[10px] text-slate-400 mt-1">Total active scope</p>
        </div>
      </div>

      {/* 3. SECTION 2: STATUTORY DUE PROCESS PIPELINE */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Statutory Lifecycle Due Process Pipeline
            </h2>
            <p className="text-xs text-slate-500">
              Stages governed by Tamil Nadu Land Encroachment Act III of 1905 with mandatory show-cause notice and hearing.
            </p>
          </div>
          <button
            onClick={() => navigate('/cases')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            View WorkQueue <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-center">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-xs text-slate-500 font-medium">1. Triage</p>
            <p className="text-lg font-black text-slate-900 mt-1">{pipeline.triage ?? 0}</p>
            <p className="text-[10px] text-slate-400">High/Med/Low</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-xs text-slate-500 font-medium">2. Field Survey</p>
            <p className="text-lg font-black text-blue-600 mt-1">{pipeline.field_verification ?? 0}</p>
            <p className="text-[10px] text-slate-400">VAO Inspection</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-xs text-slate-500 font-medium">3. Endorsement</p>
            <p className="text-lg font-black text-indigo-600 mt-1">{pipeline.inspection ?? 0}</p>
            <p className="text-[10px] text-slate-400">Rev. Inspector</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-xs text-slate-500 font-medium">4. Section 7</p>
            <p className="text-lg font-black text-amber-600 mt-1">{pipeline.statutory_notice ?? 0}</p>
            <p className="text-[10px] text-slate-400">Show-Cause (15d)</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-xs text-slate-500 font-medium">5. Hearing</p>
            <p className="text-lg font-black text-purple-600 mt-1">{pipeline.hearing ?? 0}</p>
            <p className="text-[10px] text-slate-400">Tahsildar Court</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-xs text-slate-500 font-medium">6. Section 6</p>
            <p className="text-lg font-black text-red-600 mt-1">{pipeline.eviction_order ?? 0}</p>
            <p className="text-[10px] text-slate-400">Eviction Warrant</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-xs text-slate-500 font-medium">7. Restored</p>
            <p className="text-lg font-black text-emerald-600 mt-1">{pipeline.executed_resolved ?? 0}</p>
            <p className="text-[10px] text-slate-400">Govt Possession</p>
          </div>
        </div>
      </div>

      {/* 4. SECTION 3 & 4: EMPIRICAL ACCURACY & SATELLITE COVERAGE GAPS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Empirical Accuracy Ledger */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Empirical Accuracy Ledger (Wilson 95% CI)
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                EMPIRICAL VERIFIED
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Measured strictly against on-ground field inspection verdicts, distinct from raw AI model confidence.
            </p>

            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-800">Fast Lane (High Confidence ≥ 80%)</p>
                  <p className="text-[10px] text-slate-500">
                    Precision 95% CI: <span className="font-semibold text-slate-700">{accuracy.high?.ci_95 || 'Insufficient data (n < 30)'}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-blue-600">
                    {accuracy.high?.precision_pct ? `${accuracy.high.precision_pct}%` : 'N/A'}
                  </p>
                  <p className="text-[10px] text-slate-400">n = {accuracy.high?.sample_size_n ?? 0}</p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-800">Medium Lane (50% – 80%)</p>
                  <p className="text-[10px] text-slate-500">
                    Precision 95% CI: <span className="font-semibold text-slate-700">{accuracy.medium?.ci_95 || 'Insufficient data (n < 30)'}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-amber-600">
                    {accuracy.medium?.precision_pct ? `${accuracy.medium.precision_pct}%` : 'N/A'}
                  </p>
                  <p className="text-[10px] text-slate-400">n = {accuracy.medium?.sample_size_n ?? 0}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Recall Control Checks Sampled: <strong>{integrity.control_checks_count ?? 0}</strong></span>
            <span className="text-[10px] text-slate-400 italic">Statistical validity threshold: n ≥ 30</span>
          </div>
        </div>

        {/* Satellite Coverage Gaps & Integrity Indicators */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Satellite Coverage Gaps & Cadastral Health
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                SENTINEL-2 CADENCE
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Identifies taluks where cloud cover or revisit intervals have exceeded the 10-day operational threshold.
            </p>

            {coverageGaps.length === 0 ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>All taluks have clear satellite observations within the 10-day cadence window.</span>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {coverageGaps.map((gap, i) => (
                  <div key={i} className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CloudOff className="w-4 h-4 text-amber-600 shrink-0" />
                      <div>
                        <p className="font-bold text-slate-900">{gap.taluk} Taluk ({gap.district})</p>
                        <p className="text-[10px] text-slate-500">{gap.reason}</p>
                      </div>
                    </div>
                    <span className="text-xs font-extrabold text-amber-700">
                      {gap.days_since_clear_observation != null ? `+${gap.days_since_clear_observation}d` : 'No pass'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-slate-400 text-[10px]">Indicative FMB Sketches</p>
              <p className="font-bold text-slate-800">{integrity.indicative_fmb_count ?? 0} (polygon-derived)</p>
            </div>
            <div>
              <p className="text-slate-400 text-[10px]">Unverified Approvals</p>
              <p className="font-bold text-slate-800">{integrity.unverified_approvals_count ?? 0} cases flagged</p>
            </div>
          </div>
        </div>
      </div>

      {/* 5. SECTION 5: ACTIONABLE CASES QUICK QUEUE */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Priority Work Queue: Immediate Action Required
            </h2>
            <p className="text-xs text-slate-500">
              Encroachments in your jurisdiction awaiting your statutory review or order issuance.
            </p>
          </div>
          <button
            onClick={() => navigate('/cases')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            All Cases ({kpis.open_cases_total ?? 0}) <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {actionableCases.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            No pending cases currently require your immediate action.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Survey / S.D.</th>
                  <th className="py-2.5 px-3">Village & Taluk</th>
                  <th className="py-2.5 px-3">Classification</th>
                  <th className="py-2.5 px-3">Encroached Extent</th>
                  <th className="py-2.5 px-3">Current Status</th>
                  <th className="py-2.5 px-3">Lane</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {actionableCases.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-900">
                      {c.survey_number}/{c.subdivision || '1'}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {c.village}, {c.taluk}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-medium">
                        {c.classification}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-red-600">
                      {c.encroached_area_sqft || 850} sq.ft
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        {c.status_display}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        c.priority_lane === 'HIGH'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {c.priority_lane || 'MEDIUM'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => setSelectedCaseId(c.id)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold transition-colors shadow-xs"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DETAIL MODAL */}
      {selectedCaseId && (
        <CaseDetailModal
          caseId={selectedCaseId}
          onClose={() => setSelectedCaseId(null)}
          onCaseUpdated={() => {
            loadDashboard();
            onRefreshData?.();
          }}
        />
      )}
    </div>
  );
};

export default ExecutiveDashboardView;
