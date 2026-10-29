import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search, Filter, AlertTriangle, Scale, Clock, CheckCircle2,
  ChevronRight, RefreshCcw, FileText, Download, Shield, Eye
} from 'lucide-react';
import { CaseAPI } from '../api/client';
import CaseDetailModal from '../components/CaseDetailModal';

export const WorkQueueView = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [laneFilter, setLaneFilter] = useState('');
  const [classificationFilter, setClassificationFilter] = useState('');
  const [actionableOnly, setActionableOnly] = useState(false);

  // Detail Modal
  const [selectedCaseId, setSelectedCaseId] = useState(searchParams.get('id') || null);

  const loadCases = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (statusFilter) params.status = statusFilter;
      if (laneFilter) params.priority_lane = laneFilter;
      if (classificationFilter) params.classification = classificationFilter;
      if (actionableOnly) params.is_actionable = 'true';

      const data = await CaseAPI.getCases(params);
      setCases(Array.isArray(data) ? data : (data?.results || []));
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load statutory cases.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCases();
  }, [statusFilter, laneFilter, classificationFilter, actionableOnly]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadCases();
  };

  const handleOpenCase = (id) => {
    setSelectedCaseId(id);
    setSearchParams({ id });
  };

  const handleCloseCase = () => {
    setSelectedCaseId(null);
    setSearchParams({});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* 1. TOP HEADER & WORKQUEUE TITLE */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Statutory Encroachment WorkQueue
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700 border border-slate-200">
              {cases.length} Cases
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Jurisdiction-scoped cases under Tamil Nadu Land Encroachment Act III of 1905 with active SLA clocks and optimistic locking.
          </p>
        </div>

        <button
          onClick={loadCases}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 transition-colors shadow-xs"
        >
          <RefreshCcw className="w-3.5 h-3.5" /> Refresh Queue
        </button>
      </div>

      {/* 2. FILTER & SEARCH CONTROLS */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Survey Number, ULPIN, Village, or Occupant Name..."
              className="w-full text-xs pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500">
            <Filter className="w-3.5 h-3.5" /> Filters:
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-700 text-xs focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="NEW">NEW</option>
            <option value="TIER1_ESCALATED">TIER1 ESCALATED</option>
            <option value="VAO_ASSIGNED">VAO ASSIGNED</option>
            <option value="IN_FIELD_VERIFICATION">IN FIELD VERIFICATION</option>
            <option value="VAO_SUBMITTED">VAO SUBMITTED</option>
            <option value="INSPECTOR_APPROVED">INSPECTOR APPROVED</option>
            <option value="NOTICE_PREPARATION">NOTICE PREPARATION</option>
            <option value="SECTION_7_ISSUED">SECTION 7 ISSUED</option>
            <option value="HEARING_SCHEDULED">HEARING SCHEDULED</option>
            <option value="SECTION_6_ORDERED">SECTION 6 ORDERED</option>
            <option value="EVICTION_EXECUTED">EVICTION EXECUTED</option>
            <option value="COURT_STAY_HOLD">COURT STAY HOLD</option>
            <option value="REHABILITATION_ROUTED">REHABILITATION ROUTED</option>
          </select>

          {/* Lane Filter */}
          <select
            value={laneFilter}
            onChange={(e) => setLaneFilter(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-700 text-xs focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Priority Lanes</option>
            <option value="HIGH">High Lane (Fast)</option>
            <option value="MEDIUM">Medium Lane</option>
            <option value="LOW">Low Lane (Watching)</option>
          </select>

          {/* Classification Filter */}
          <select
            value={classificationFilter}
            onChange={(e) => setClassificationFilter(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-700 text-xs focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Classifications</option>
            <option value="Government">Government Poramboke</option>
            <option value="Waterbody">Waterbody / Lake / Eri</option>
            <option value="Forest">Forest Land</option>
            <option value="Temple">Temple / HR&CE</option>
            <option value="Roadside">Highway Margin</option>
          </select>

          {/* Actionable Switch */}
          <label className="flex items-center gap-1.5 cursor-pointer ml-auto font-medium text-slate-700 select-none">
            <input
              type="checkbox"
              checked={actionableOnly}
              onChange={(e) => setActionableOnly(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span>Requires My Action</span>
          </label>
        </div>
      </div>

      {/* 3. CASE TABLE LIST */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            Loading statutory cases from statewide registry...
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-600 text-xs">
            {error}
          </div>
        ) : cases.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            No cases match the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Survey / S.D.</th>
                  <th className="py-3 px-4">Village & Taluk</th>
                  <th className="py-3 px-4">Classification</th>
                  <th className="py-3 px-4">Structure Type</th>
                  <th className="py-3 px-4">Encroached Extent</th>
                  <th className="py-3 px-4">Confidence / Lane</th>
                  <th className="py-3 px-4">Current State</th>
                  <th className="py-3 px-4">SLA Clock</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cases.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => handleOpenCase(c.id)}
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
                    <td className="py-3 px-4 text-slate-700">
                      {String(c.structure_category || 'Commercial').replace(/_/g, ' ')}
                    </td>
                    <td className="py-3 px-4 font-semibold text-red-600">
                      {c.encroached_area_sqft || 850} sq.ft
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-slate-800">
                          {c.confidence_score ? `${Math.round(c.confidence_score * 100)}%` : 'N/A'}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${
                          c.priority_lane === 'HIGH'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {c.priority_lane || 'MEDIUM'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full font-semibold bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap">
                        {c.status_display || c.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {c.is_sla_breached ? (
                        <span className="text-red-600 font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Breached
                        </span>
                      ) : (
                        <span className="text-slate-500 font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" /> Active
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleOpenCase(c.id)}
                        className="px-3 py-1 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 rounded font-bold transition-all shadow-xs"
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
          onClose={handleCloseCase}
          onCaseUpdated={loadCases}
        />
      )}
    </div>
  );
};

export default WorkQueueView;
