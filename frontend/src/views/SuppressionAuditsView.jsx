import React from 'react';
import { 
  ShieldAlert, AlertTriangle, Clock, CheckCircle2, 
  Search, RefreshCcw, Eye, Gavel
} from 'lucide-react';

export const SuppressionAuditsView = () => {
  const flaggedCases = [
    {
      id: 601,
      caseNumber: 'CAS-SLM-2026-0089',
      taluk: 'Salem West',
      surveyNumber: '112/3',
      classification: 'Meikkal Poramboke',
      stage: 'NOTICE_REPLY_PENDING',
      daysDelayed: '22 Days',
      allowedSLA: '15 Days Max',
      flagReason: 'No hearing scheduled after statutory 15-day show-cause elapsed without judicial stay.',
      severity: 'HIGH_RISK_SUPPRESSION',
      status: 'DVAC_NOTICE_SERVED',
    },
    {
      id: 602,
      caseNumber: 'CAS-SLM-2026-0072',
      taluk: 'Omalur',
      surveyNumber: '54/1B',
      classification: 'Eri Poramboke (Waterbody)',
      stage: 'VAO_ASSIGNED',
      daysDelayed: '18 Days',
      allowedSLA: '7 Days Max',
      flagReason: 'Field inspection not completed within 7-day waterbody SLA. Zero inspection photographs uploaded.',
      severity: 'HIGH_RISK_SUPPRESSION',
      status: 'EXPLANATION_CALLED',
    },
    {
      id: 603,
      caseNumber: 'CAS-SLM-2026-0055',
      taluk: 'Attur',
      surveyNumber: '29/4',
      classification: 'Government Cart Track',
      stage: 'INSPECTOR_APPROVED',
      daysDelayed: '14 Days',
      allowedSLA: '10 Days Max',
      flagReason: 'Delayed notice generation past statutory triage window.',
      severity: 'MEDIUM_RISK',
      status: 'MONITORING',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold uppercase tracking-wider rounded-md flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" /> Vigilance & Audit Directorate
            </span>
            <span className="text-[11px] text-slate-500 font-mono">STATUTORY SLA WATCHDOG & INACTION AUDIT</span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Administrative SLA Delay & Inaction Audit Directorate
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl">
            Independent statutory scrutiny detecting overdue notices and procedural delays (implements the project's workflow design; legal timelines, authority and wording unverified).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Flagged Delay Cases</span>
          <p className="text-2xl font-black text-amber-600 mt-2">{flaggedCases.length}</p>
          <p className="text-[11px] text-slate-500 mt-1">Exceeded statutory SLA without court stay</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">DVAC Inquiries Opened</span>
          <p className="text-2xl font-black text-slate-900 mt-2">1</p>
          <p className="text-[11px] text-red-600 font-medium mt-1">Formal notice served to taluk bench</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Read-Only Audit Status</span>
          <p className="text-2xl font-black text-emerald-600 mt-2">ACTIVE</p>
          <p className="text-[11px] text-slate-500 mt-1">Zero tamper-permitted vigilance ledger</p>
        </div>
      </div>

      {/* Flagged Cases Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <span>Overdue Encroachment Cases Flagged for Inaction</span>
          </h2>
          <span className="text-xs text-slate-500">{flaggedCases.length} Cases Under Inquiry</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Case Number</th>
                <th className="py-3 px-4">Taluk / Survey</th>
                <th className="py-3 px-4">Current Stage</th>
                <th className="py-3 px-4">Delay Past SLA</th>
                <th className="py-3 px-4">Vigilance Flag Reason</th>
                <th className="py-3 px-4 text-right">Inquiry Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {flaggedCases.map(c => (
                <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{c.caseNumber}</td>
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-slate-900 block">{c.taluk}</span>
                    <span className="text-[11px] text-slate-500">Survey {c.surveyNumber} ({c.classification})</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                      {c.stage}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-red-600">
                    {c.daysDelayed} <span className="text-[10px] text-slate-400 font-normal">({c.allowedSLA})</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 max-w-sm">{c.flagReason}</td>
                  <td className="py-3.5 px-4 text-right">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      c.status.includes('NOTICE') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {c.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SuppressionAuditsView;
