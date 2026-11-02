import React, { useState } from 'react';
import { 
  Gavel, ShieldAlert, Truck, Users, CheckCircle2, 
  AlertTriangle, RefreshCcw, Download, Calendar, MapPin
} from 'lucide-react';
import { LandAPI } from '../api/client';

export const EvictionExecutionView = () => {
  const [downloadingId, setDownloadingId] = useState(null);

  const evictionOrders = [
    {
      id: 401,
      warrantId: 'WRN-SEC6-SLM-2026-012',
      surveyNumber: '142/1',
      village: 'Kannankurichi',
      encroacherName: 'V. Senthilkumar & Others',
      structureType: 'Commercial Workshop & Brick Shed',
      encroachedArea: '850 sq.m',
      orderDate: '2026-10-25',
      scheduledExecutionDate: '2026-11-06',
      status: 'POLICE_BANDOBAST_REQUISITIONED',
      officer: 'S. Murugan (Tahsildar)',
      policeStation: 'Kannankurichi Law & Order PS',
      machinery: '2x JCB Excavators, 4x Revenue Squad Lorries',
    },
    {
      id: 402,
      warrantId: 'WRN-SEC6-SLM-2026-009',
      surveyNumber: '88/4',
      village: 'Mettur Dam',
      encroacherName: 'K. Rangasamy',
      structureType: 'Reinforced Concrete Compound Wall',
      encroachedArea: '1,200 sq.m',
      orderDate: '2026-10-18',
      scheduledExecutionDate: '2026-11-04',
      status: 'SQUAD_DEPLOYED',
      officer: 'HQ Deputy Tahsildar',
      policeStation: 'Mettur Town Police Station',
      machinery: '1x Heavy Breaker, 2x Tippers',
    },
    {
      id: 403,
      warrantId: 'WRN-SEC6-SLM-2026-004',
      surveyNumber: '31/2',
      village: 'Omalur',
      encroacherName: 'Sri Mariamman Traders',
      structureType: 'Temporary GI Sheet Enclosure',
      encroachedArea: '320 sq.m',
      orderDate: '2026-10-12',
      scheduledExecutionDate: '2026-10-28',
      status: 'EVICTION_COMPLETED',
      officer: 'Tahsildar Omalur',
      policeStation: 'Omalur Police Station',
      machinery: 'Completed. Government Land Handed to PWD.',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 bg-red-50 border border-red-200 text-red-700 text-[10px] font-bold uppercase tracking-wider rounded-md flex items-center gap-1.5">
              <Gavel className="w-3.5 h-3.5" /> Statutory Enforcement Bench
            </span>
            <span className="text-[11px] text-slate-500 font-mono">SECTION 6 SUMMARY EVICTION WARRANTS</span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Section 6 Summary Eviction Warrant & Field Execution Directorate
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl">
            Issuance of final magisterial warrants under Section 6 of the Tamil Nadu Land Encroachment Act III of 1905, police assistance coordination, and physical land restoration.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Section 6 Warrants Issued</span>
          <p className="text-2xl font-black text-slate-900 mt-2">{evictionOrders.length}</p>
          <p className="text-[11px] text-slate-500 mt-1">Salem West Magisterial Bench</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Scheduled for Removal</span>
          <p className="text-2xl font-black text-amber-600 mt-2">2</p>
          <p className="text-[11px] text-amber-700 font-medium mt-1">Police force requisitioned</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Parcels Restored</span>
          <p className="text-2xl font-black text-emerald-600 mt-2">1</p>
          <p className="text-[11px] text-emerald-700 font-medium mt-1">Handed over to public department</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Vulnerable Protection</span>
          <p className="text-2xl font-black text-blue-600 mt-2">100%</p>
          <p className="text-[11px] text-slate-500 mt-1">Zero indigent dwellings evicted</p>
        </div>
      </div>

      {/* Eviction Orders Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Truck className="w-4 h-4 text-red-600" />
            <span>Active Eviction Warrants & Squad Deployments</span>
          </h2>
          <span className="text-xs text-slate-500">{evictionOrders.length} Warrants</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Warrant ID</th>
                <th className="py-3 px-4">Village / Survey</th>
                <th className="py-3 px-4">Encroacher / Structure</th>
                <th className="py-3 px-4">Area</th>
                <th className="py-3 px-4">Police Bandobast Station</th>
                <th className="py-3 px-4">Execution Date</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {evictionOrders.map(o => (
                <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{o.warrantId}</td>
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-slate-900 block">{o.village}</span>
                    <span className="text-[11px] text-slate-500 font-mono">Survey {o.surveyNumber}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-slate-800 block">{o.encroacherName}</span>
                    <span className="text-[10px] text-slate-500">{o.structureType}</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-medium text-slate-800">{o.encroachedArea}</td>
                  <td className="py-3.5 px-4 text-slate-600">
                    <span className="font-medium block">{o.policeStation}</span>
                    <span className="text-[10px] text-slate-400">{o.machinery}</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{o.scheduledExecutionDate}</td>
                  <td className="py-3.5 px-4 text-right">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      o.status === 'EVICTION_COMPLETED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      o.status === 'SQUAD_DEPLOYED' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                      {o.status.replace(/_/g, ' ')}
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

export default EvictionExecutionView;
