import React, { useState } from 'react';
import { 
  ShieldCheck, Lock, Search, FileText, CheckCircle2, 
  AlertTriangle, RefreshCcw, ExternalLink, Clock, Key
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AuditTrailView = () => {
  const [searchDigest, setSearchDigest] = useState('');

  const auditEvents = [
    {
      id: 1042,
      timestamp: '2026-11-02 10:14:22 IST',
      officer: 'S. Murugan (Tahsildar)',
      role: 'TAHSILDAR',
      action: 'Section 7 Show-Cause Notice Issued',
      caseRef: '#0014 (Survey 142/1, Kannankurichi)',
      hash: '45fb94cbf2c2ae05c6f62b5f386384e96414a3c327191851468f9965abaf6830',
      status: 'VERIFIED_CHAIN',
    },
    {
      id: 1041,
      timestamp: '2026-11-02 09:42:15 IST',
      officer: 'K. Prakash (VAO)',
      role: 'VAO',
      action: 'Field Inspection Submitted with Telemetry',
      caseRef: '#0014 (Survey 142/1, Kannankurichi)',
      hash: '7a8b9c0d1e2f34567890abcdef1234567890abcdef1234567890abcdef123456',
      status: 'VERIFIED_CHAIN',
    },
    {
      id: 1040,
      timestamp: '2026-11-01 16:30:10 IST',
      officer: 'R. Brindha Devi IAS (Collector)',
      role: 'COLLECTOR',
      action: 'Section 6 Summary Eviction Order Executed',
      caseRef: '#0009 (Survey 88/4, Mettur Dam)',
      hash: '9f8e7d6c5b4a3210fedcba0987654321fedcba0987654321fedcba0987654321',
      status: 'VERIFIED_CHAIN',
    },
    {
      id: 1039,
      timestamp: '2026-11-01 14:15:00 IST',
      officer: 'DVAC Audit Division',
      role: 'VIGILANCE',
      action: 'Statutory Registry Integrity Scrutiny Passed',
      caseRef: 'Salem Sector 04 Aggregate Ledger',
      hash: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      status: 'VERIFIED_CHAIN',
    },
    {
      id: 1038,
      timestamp: '2026-11-01 11:20:45 IST',
      officer: 'Dr. K. Manivasan IAS (State Apex)',
      role: 'STATE_APEX',
      action: 'High Court Compliance ATR Endorsed',
      caseRef: 'W.P. No. 18251/2023 (Waterbodies Docket)',
      hash: 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      status: 'VERIFIED_CHAIN',
    },
  ];

  const filtered = auditEvents.filter(e => 
    e.action.toLowerCase().includes(searchDigest.toLowerCase()) ||
    e.officer.toLowerCase().includes(searchDigest.toLowerCase()) ||
    e.hash.toLowerCase().includes(searchDigest.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold uppercase tracking-wider rounded-md flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Cryptographic Ledger
            </span>
            <span className="text-[11px] text-slate-500 font-mono">TAMPER-EVIDENT AUDIT TRAIL</span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Statutory Audit Log & Document Integrity Registry
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl">
            Immutable SHA-256 event chain preserving statutory evidence, notice issuance, and judicial attestations under Tamil Nadu Act III of 1905.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <input
            type="text"
            placeholder="Search action or hash..."
            value={searchDigest}
            onChange={(e) => setSearchDigest(e.target.value)}
            className="bg-white text-slate-800 text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all w-64"
          />
        </div>
      </div>

      {/* Security Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Hash Integrity Verification</span>
          <p className="text-2xl font-black text-emerald-600 mt-2">100% INTACT</p>
          <p className="text-[11px] text-slate-500 mt-1">Zero tamper violations detected</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Statutory Notice Digests</span>
          <p className="text-2xl font-black text-slate-900 mt-2">1,042</p>
          <p className="text-[11px] text-blue-600 font-medium mt-1">Stored with SHA-256 payload digest</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Public Document Verifier</span>
          <p className="text-2xl font-black text-slate-900 mt-2">Active</p>
          <p className="text-[11px] text-slate-500 mt-1">Open 24/7 for citizen verification</p>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Lock className="w-4 h-4 text-blue-600" />
            <span>Recent Statutory Transactions</span>
          </h2>
          <span className="text-xs text-slate-500">{filtered.length} Events Recorded</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Event ID</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Officer / Authority</th>
                <th className="py-3 px-4">Statutory Action</th>
                <th className="py-3 px-4">Case / Parcel Reference</th>
                <th className="py-3 px-4">SHA-256 Digest</th>
                <th className="py-3 px-4 text-right">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(evt => (
                <tr key={evt.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">#{evt.id}</td>
                  <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">{evt.timestamp}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800">{evt.officer}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">{evt.action}</td>
                  <td className="py-3.5 px-4 text-slate-600">{evt.caseRef}</td>
                  <td className="py-3.5 px-4 font-mono text-[10px] text-slate-500 max-w-xs truncate" title={evt.hash}>
                    {evt.hash.slice(0, 16)}...{evt.hash.slice(-8)}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Link
                      to={`/verify/${evt.hash}`}
                      className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-[10px] rounded border border-blue-200 transition-colors inline-flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" /> Verify
                    </Link>
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

export default AuditTrailView;
