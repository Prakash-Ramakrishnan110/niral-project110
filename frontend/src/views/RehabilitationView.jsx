import React, { useState, useEffect } from 'react';
import {
  HeartHandshake, Home, AlertTriangle, ShieldCheck, RefreshCcw, Building
} from 'lucide-react';
import { CaseAPI } from '../api/client';
import CaseDetailModal from '../components/CaseDetailModal';

export const RehabilitationView = () => {
  const [rehabCases, setRehabCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCaseId, setSelectedCaseId] = useState(null);

  const loadRehabCases = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await CaseAPI.getCases();
      const all = Array.isArray(data) ? data : (data?.results || []);
      const filtered = all.filter((c) =>
        c.structure_category === 'VULNERABLE_HOUSING' || c.status === 'REHABILITATION_ROUTED'
      );
      setRehabCases(filtered);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load rehabilitation queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRehabCases();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Humanitarian Rehabilitation (TNUHDB Protocol)
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
              {rehabCases.length} Welfare Cases
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Statutory Guard: Eviction warrants under Section 6 are strictly prohibited for vulnerable dwellers. In-situ tenement allotment via TNUHDB.
          </p>
        </div>

        <button
          onClick={loadRehabCases}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 transition-colors shadow-xs"
        >
          <RefreshCcw className="w-3.5 h-3.5" /> Refresh Queue
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            Loading humanitarian rehabilitation cases...
          </div>
        ) : rehabCases.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            No vulnerable housing cases currently registered in this jurisdiction.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Survey / S.D.</th>
                  <th className="py-3 px-4">Village & Taluk</th>
                  <th className="py-3 px-4">Dweller Category</th>
                  <th className="py-3 px-4">Extent</th>
                  <th className="py-3 px-4">TNUHDB Allotment Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rehabCases.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedCaseId(c.id)}
                    className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4 font-bold text-slate-900 group-hover:text-blue-600">
                      {c.survey_number}/{c.subdivision || '1'}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {c.village}, {c.taluk}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        VULNERABLE HOUSING
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {c.encroached_area_sqft || 420} sq.ft
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        {c.status_display}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedCaseId(c.id)}
                        className="px-3 py-1 bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 rounded font-bold transition-all shadow-xs"
                      >
                        Allotment Protocol
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedCaseId && (
        <CaseDetailModal
          caseId={selectedCaseId}
          onClose={() => setSelectedCaseId(null)}
          onCaseUpdated={loadRehabCases}
        />
      )}
    </div>
  );
};

export default RehabilitationView;
