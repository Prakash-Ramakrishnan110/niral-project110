import React, { useState, useEffect } from 'react';
import {
  FileText, Clock, AlertTriangle, RefreshCcw, Scale, CheckCircle2
} from 'lucide-react';
import { CaseAPI } from '../api/client';
import CaseDetailModal from '../components/CaseDetailModal';

export const HearingsView = () => {
  const [hearingCases, setHearingCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCaseId, setSelectedCaseId] = useState(null);

  const loadHearings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await CaseAPI.getCases();
      const all = Array.isArray(data) ? data : (data?.results || []);
      const filtered = all.filter((c) =>
        ['NOTICE_PREPARATION', 'SECTION_7_ISSUED', 'NOTICE_REPLY_PENDING', 'HEARING_SCHEDULED', 'TAHSILDAR_ACCEPTED_LEGACY'].includes(c.status)
      );
      setHearingCases(filtered);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load hearings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHearings();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Tahsildar Statutory Hearings & Notice Management
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-purple-50 text-purple-800 border border-purple-300">
              {hearingCases.length} In-Process
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            15-day show-cause notices issued under Section 7 and scheduled personal hearings before the Taluk Magistrate.
          </p>
        </div>

        <button
          onClick={loadHearings}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 transition-colors shadow-xs"
        >
          <RefreshCcw className="w-3.5 h-3.5" /> Refresh Schedule
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
            Loading hearing schedules...
          </div>
        ) : hearingCases.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            No hearings or show-cause notices currently scheduled.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Survey / S.D.</th>
                  <th className="py-3 px-4">Village & Taluk</th>
                  <th className="py-3 px-4">Classification</th>
                  <th className="py-3 px-4">Statutory Stage</th>
                  <th className="py-3 px-4">Hearing / Reply Deadline</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {hearingCases.map((c) => (
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
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-medium">
                        {c.classification}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                        {c.status_display}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-mono">
                      {c.sla_deadline ? new Date(c.sla_deadline).toLocaleDateString() : 'Pending Date'}
                    </td>
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedCaseId(c.id)}
                        className="px-3 py-1 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 rounded font-bold transition-all shadow-xs"
                      >
                        Examine Case
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
          onCaseUpdated={loadHearings}
        />
      )}
    </div>
  );
};

export default HearingsView;
