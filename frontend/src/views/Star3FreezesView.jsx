import React, { useState } from 'react';
import { 
  Lock, AlertTriangle, ShieldCheck, FileText, 
  RefreshCcw, ArrowRight, CheckCircle2, Building
} from 'lucide-react';

export const Star3FreezesView = () => {
  const freezeList = [
    {
      id: 301,
      freezeId: 'FRZ-STAR3-2026-081',
      surveyNumber: '142/1',
      village: 'Kannankurichi',
      subdivision: '1B',
      classification: 'Eri Poramboke (Waterbody)',
      areaSqm: 850,
      status: 'FREEZE_ACTIVE',
      lockTimestamp: '2026-10-24 11:30 IST',
      remarks: 'Automated encumbrance lock dispatched to Registration Dept (STAR 3.0 API). All sale deed, settlement, and mortgage registrations frozen.',
    },
    {
      id: 302,
      freezeId: 'FRZ-STAR3-2026-079',
      surveyNumber: '88/4',
      village: 'Mettur Dam',
      subdivision: '2',
      classification: 'PWD Drainage Channel',
      areaSqm: 1200,
      status: 'FREEZE_ACTIVE',
      lockTimestamp: '2026-10-22 09:15 IST',
      remarks: 'Registration block verified by Sub-Registrar Mettur. Prohibits alienation during statutory eviction trial.',
    },
    {
      id: 303,
      freezeId: 'FRZ-STAR3-2026-074',
      surveyNumber: '210/5',
      village: 'Salem West',
      subdivision: '3A',
      classification: 'Mayanam / Cremation Ground',
      areaSqm: 400,
      status: 'FREEZE_ACTIVE',
      lockTimestamp: '2026-10-18 14:00 IST',
      remarks: 'STAR 3.0 block applied. Encroachment case pending Section 6 notice execution.',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold uppercase tracking-wider rounded-md flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" /> Registration Directorate
            </span>
            <span className="text-[11px] text-slate-500 font-mono">STAR 3.0 INTEROPERABILITY PORTAL</span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            STAR 3.0 Real-Time Encumbrance & Patta Transfer Freeze Directorate
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl">
            Tahsildar automated API locks transmitted to the Inspector General of Registration (IGR) to instantaneously prevent registration of encroached government poramboke land.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Active STAR 3.0 Freezes</span>
          <p className="text-2xl font-black text-slate-900 mt-2">{freezeList.length}</p>
          <p className="text-[11px] text-blue-600 font-medium mt-1">Parcels locked from fraudulent sale deed transfer</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Sub-Registrar Sync</span>
          <p className="text-2xl font-black text-emerald-600 mt-2">100% Synced</p>
          <p className="text-[11px] text-slate-500 mt-1">Direct API handshake with Tamil Nadu IGR</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Illegal Transfers Prevented</span>
          <p className="text-2xl font-black text-slate-900 mt-2">14</p>
          <p className="text-[11px] text-emerald-700 font-medium mt-1">Interceptions at Sub-Registrar Offices</p>
        </div>
      </div>

      {/* Freezes Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Lock className="w-4 h-4 text-blue-600" />
            <span>Active Parcel Freeze Docket — Salem West Taluk</span>
          </h2>
          <span className="text-xs text-slate-500">{freezeList.length} Active Records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Freeze ID</th>
                <th className="py-3 px-4">Village / Survey</th>
                <th className="py-3 px-4">Classification</th>
                <th className="py-3 px-4">Encroached Area</th>
                <th className="py-3 px-4">Lock Applied Timestamp</th>
                <th className="py-3 px-4">IGR STAR 3.0 Status</th>
                <th className="py-3 px-4 text-right">Protection</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {freezeList.map(f => (
                <tr key={f.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{f.freezeId}</td>
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-slate-900 block">{f.village}</span>
                    <span className="text-[11px] text-slate-500 font-mono">Survey {f.surveyNumber} ({f.subdivision})</span>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-blue-700">{f.classification}</td>
                  <td className="py-3.5 px-4 font-mono font-medium text-slate-800">{f.areaSqm} sq.m</td>
                  <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">{f.lockTimestamp}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      REGISTRATION BLOCKED
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="px-2.5 py-1 bg-slate-900 text-white rounded text-[10px] font-bold uppercase tracking-wider">
                      Locked
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

export default Star3FreezesView;
