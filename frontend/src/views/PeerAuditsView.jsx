import React, { useState } from 'react';
import { 
  Users, CheckCircle2, AlertTriangle, ShieldCheck, 
  MapPin, RefreshCcw, Eye, ArrowRight
} from 'lucide-react';
import CaseDetailModal from '../components/CaseDetailModal';

export const PeerAuditsView = () => {
  const [selectedCaseId, setSelectedCaseId] = useState(null);

  const peerAuditCases = [
    {
      id: 201,
      caseNumber: 'CAS-SLM-2026-0042',
      originTaluk: 'Salem West',
      assignedPeerTaluk: 'Omalur',
      assignedAuditor: 'T. Selvam (Tahsildar Omalur)',
      surveyNumber: '184/2',
      classification: 'Waterbody / Kulam Poramboke',
      status: 'AUDIT_IN_PROGRESS',
      finding: 'Independent GPS check confirms 420 sq.m structural encroachment.',
      discrepancy: '0% (Full Concordance)',
    },
    {
      id: 202,
      caseNumber: 'CAS-SLM-2026-0038',
      originTaluk: 'Attur',
      assignedPeerTaluk: 'Salem South',
      assignedAuditor: 'V. Anand (HQ Deputy Tahsildar)',
      surveyNumber: '92/1A',
      classification: 'Meikkal / Grazing Ground',
      status: 'RECONCILIATION_NEEDED',
      finding: 'Original report stated 120 sq.m; peer audit identified 310 sq.m fenced compound.',
      discrepancy: '+190 sq.m Under-reporting Flagged',
    },
    {
      id: 203,
      caseNumber: 'CAS-SLM-2026-0019',
      originTaluk: 'Mettur',
      assignedPeerTaluk: 'Salem West',
      assignedAuditor: 'S. Murugan (Tahsildar Salem West)',
      surveyNumber: '45/3',
      classification: 'River Bed / Cauvery Bank',
      status: 'PEER_VERIFIED',
      finding: 'Permanent commercial structure verified. Section 6 eviction recommended.',
      discrepancy: '0% (Full Concordance)',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold uppercase tracking-wider rounded-md flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> District Collector Command
            </span>
            <span className="text-[11px] text-slate-500 font-mono">CROSS-TALUK PEER SCRUTINY</span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Inter-Taluk Peer Audit & Independent Verification Registry
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl">
            Collector-mandated cross-audits where adjacent taluk Tahsildars re-inspect high-value or sensitive encroachments to prevent local compromise.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Active Peer Audits</span>
          <p className="text-2xl font-black text-slate-900 mt-2">{peerAuditCases.length}</p>
          <p className="text-[11px] text-slate-500 mt-1">Cross-assigned across Salem taluks</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Concordance Rate</span>
          <p className="text-2xl font-black text-emerald-600 mt-2">88.5%</p>
          <p className="text-[11px] text-emerald-700 font-medium mt-1">Agreement between field inspection & peer audit</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Discrepancies Flagged</span>
          <p className="text-2xl font-black text-amber-600 mt-2">1</p>
          <p className="text-[11px] text-amber-700 font-medium mt-1">Referred to Collector executive bench</p>
        </div>
      </div>

      {/* Peer Audit Cases Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            <span>Assigned Cross-Taluk Audit Dockets</span>
          </h2>
          <span className="text-xs text-slate-500">{peerAuditCases.length} Cases Listed</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Case Number</th>
                <th className="py-3 px-4">Origin Taluk</th>
                <th className="py-3 px-4">Assigned Auditor</th>
                <th className="py-3 px-4">Survey / Classification</th>
                <th className="py-3 px-4">Audit Finding</th>
                <th className="py-3 px-4">Discrepancy</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {peerAuditCases.map(c => (
                <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{c.caseNumber}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800">{c.originTaluk}</td>
                  <td className="py-3.5 px-4 text-slate-700">
                    <span className="font-semibold block">{c.assignedAuditor}</span>
                    <span className="text-[10px] text-slate-400">Peer: {c.assignedPeerTaluk}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-slate-900 block">{c.surveyNumber}</span>
                    <span className="text-[10px] text-indigo-700 font-semibold">{c.classification}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 max-w-xs">{c.finding}</td>
                  <td className="py-3.5 px-4 font-mono font-semibold">
                    <span className={c.discrepancy.includes('Under-reporting') ? 'text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200' : 'text-emerald-700'}>
                      {c.discrepancy}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      c.status === 'PEER_VERIFIED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                      {c.status.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedCaseId && (
        <CaseDetailModal
          caseId={selectedCaseId}
          onClose={() => setSelectedCaseId(null)}
        />
      )}
    </div>
  );
};

export default PeerAuditsView;
