import React from 'react';
import { 
  Users, UserCheck, Shield, MapPin, Building, 
  CheckCircle2, Key, Clock
} from 'lucide-react';

export const OfficerAssignmentsView = () => {
  const officers = [
    {
      id: 501,
      officerName: 'S. Murugan',
      designation: 'Tahsildar & Executive Magistrate',
      role: 'TAHSILDAR',
      jurisdiction: 'Salem West Taluk',
      district: 'Salem',
      powers: 'Statutory Section 7, Section 6, STAR 3.0 Encumbrance Freeze',
      status: 'COMMISSIONED',
    },
    {
      id: 502,
      officerName: 'R. Brindha Devi IAS',
      designation: 'District Collector & District Magistrate',
      role: 'COLLECTOR',
      jurisdiction: 'Salem District (All Taluks)',
      district: 'Salem',
      powers: 'High Court Compliance ATR, Final Eviction Sanction, Peer Audits',
      status: 'COMMISSIONED',
    },
    {
      id: 503,
      officerName: 'Dr. K. Manivasan IAS',
      designation: 'Principal Secretary / State Apex',
      role: 'STATE_APEX',
      jurisdiction: 'Statewide Tamil Nadu (38 Districts)',
      district: 'Statewide',
      powers: 'Secretariat Strategic Oversight, Statewide Land Bank Protection',
      status: 'COMMISSIONED',
    },
    {
      id: 504,
      officerName: 'DVAC Audit Division',
      designation: 'Superintendent of Police (Vigilance)',
      role: 'VIGILANCE',
      jurisdiction: 'Statewide Tamper-Evident Scrutiny',
      district: 'Statewide',
      powers: 'Statutory Delay Suppression Scrutiny, Read-Only Audit Log Access',
      status: 'COMMISSIONED',
    },
    {
      id: 505,
      officerName: 'K. Prakash',
      designation: 'Village Administrative Officer (VAO)',
      role: 'VAO',
      jurisdiction: 'Kannankurichi Village, Salem West',
      district: 'Salem',
      powers: 'Field Ground Reconnaissance, Drone Telemetry, Inspection Attestation',
      status: 'COMMISSIONED',
    },
    {
      id: 506,
      officerName: 'GIS Operations Core',
      designation: 'GIS Administrator & Systems Officer',
      role: 'ADMIN_GIS',
      jurisdiction: 'Central Spatial Infrastructure & Telemetry',
      district: 'Statewide',
      powers: 'GeoServer WMS Layers, Sentinel-2 Pipeline, Cadastral Integrity',
      status: 'COMMISSIONED',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold uppercase tracking-wider rounded-md flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5" /> Personnel & Cadre Directorate
            </span>
            <span className="text-[11px] text-slate-500 font-mono">REVENUE ADMINISTRATION CADRE</span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Revenue Officer Cadre & Statutory Jurisdiction Scoping
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl">
            Official delegation of statutory authority under the Tamil Nadu Land Encroachment Act III of 1905 with strict role-based access control and jurisdiction boundaries.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Commissioned Officers</span>
          <p className="text-2xl font-black text-slate-900 mt-2">{officers.length}</p>
          <p className="text-[11px] text-slate-500 mt-1">Active across Salem pilot and state nodes</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Jurisdiction Scoping</span>
          <p className="text-2xl font-black text-emerald-600 mt-2">ENFORCED</p>
          <p className="text-[11px] text-emerald-700 font-medium mt-1">Zero cross-taluk unauthorized access</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Security Guard</span>
          <p className="text-2xl font-black text-blue-600 mt-2">Axes Lockout</p>
          <p className="text-[11px] text-slate-500 mt-1">5-attempt brute-force protection active</p>
        </div>
      </div>

      {/* Officers Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <span>Commissioned Statutory Revenue Officers</span>
          </h2>
          <span className="text-xs text-slate-500">{officers.length} Active Officers</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Officer Name</th>
                <th className="py-3 px-4">Designation</th>
                <th className="py-3 px-4">Statutory Role</th>
                <th className="py-3 px-4">Assigned Jurisdiction</th>
                <th className="py-3 px-4">Delegated Powers</th>
                <th className="py-3 px-4 text-right">Cadre Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {officers.map(o => (
                <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{o.officerName}</td>
                  <td className="py-3.5 px-4 font-medium text-slate-700">{o.designation}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                      {o.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 font-semibold">{o.jurisdiction}</td>
                  <td className="py-3.5 px-4 text-slate-600 max-w-xs">{o.powers}</td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {o.status}
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

export default OfficerAssignmentsView;
