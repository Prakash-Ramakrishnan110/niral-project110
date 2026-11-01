import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShieldCheck, ShieldAlert, CheckCircle2, AlertTriangle, FileText,
  MapPin, Calendar, Clock, Copy, Check, ExternalLink, ArrowLeft, Loader2
} from 'lucide-react';

export const PublicDocumentVerifyView = () => {
  const { hash } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!hash) {
      setError("No document hash provided.");
      setLoading(false);
      return;
    }

    const verifyDocument = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/notices/verify/${encodeURIComponent(hash)}/`);
        const json = await response.json();
        if (response.ok && json.verified) {
          setData(json);
        } else {
          setError(json.message || json.error || "The document digest could not be verified in the GEOMMAND registry.");
        }
      } catch (err) {
        setError("Network error connecting to GEOMMAND verification service.");
      } finally {
        setLoading(false);
      }
    };

    verifyDocument();
  }, [hash]);

  const handleCopyHash = () => {
    if (hash) {
      navigator.clipboard.writeText(hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between text-slate-800">
      {/* Official Government Header */}
      <header className="bg-slate-900 text-white border-b-4 border-amber-500 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:flex sm:items-center sm:justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center font-bold text-slate-950 text-base shadow-inner">
              TN
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-widest text-amber-400 font-bold">
                Government of Tamil Nadu
              </p>
              <h1 className="text-lg font-bold text-white tracking-tight">
                GEOMMAND Statutory Notice Verification Registry
              </h1>
            </div>
          </div>
          <div className="mt-2 sm:mt-0 text-right">
            <span className="text-[10px] font-mono uppercase bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-slate-300">
              TD-04 Cryptographic Proof
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 py-8 flex-1 w-full">
        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4" />
            <h2 className="text-base font-bold text-slate-900">Validating Document Digest...</h2>
            <p className="text-xs text-slate-500 mt-1 font-mono break-all max-w-md mx-auto">
              Querying SHA-256 hash: {hash}
            </p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl shadow-sm border border-red-200 overflow-hidden">
            <div className="bg-red-50 p-6 border-b border-red-200 flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-xl text-red-700">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-red-200 text-red-900 px-2 py-0.5 rounded">
                  Verification Failed
                </span>
                <h2 className="text-lg font-bold text-red-950 mt-1">
                  Document Digest Not Found or Tampered
                </h2>
                <p className="text-xs text-red-700 mt-0.5">
                  This SHA-256 fingerprint does not correspond to any registered statutory notice in the active registry.
                </p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Requested Cryptographic Digest:
                </p>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs text-slate-800 break-all select-all">
                  {hash}
                </div>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Tamper Warning & Statutory Notice
                </p>
                <p className="text-amber-800 leading-relaxed">
                  If this document was received as an official Section 7 Show-Cause Notice or Section 6 Eviction Warrant, please contact the jurisdictional Taluk Office immediately. Any discrepancy between a printed notice and the GEOMMAND registry indicates an invalid or unauthenticated document.
                </p>
              </div>

              <div className="pt-2">
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Return to Officer Portal
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Verified Header Banner */}
            <div className="bg-emerald-50 p-6 border-b border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-100 rounded-xl text-emerald-700 shadow-xs">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded">
                      Authentic Document
                    </span>
                    <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
                      Audit Chain Intact
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-emerald-950 mt-1">
                    {data.document_type}
                  </h2>
                  <p className="text-xs text-emerald-800 font-mono">
                    Official Notice ID: <b>{data.notice_number}</b>
                  </p>
                </div>
              </div>
            </div>

            {/* Document Attributes Grid */}
            <div className="p-6 space-y-6">
              {/* Cadastral & Authority Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    Cadastral Jurisdiction
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">District</span>
                      <span className="font-bold text-slate-900">{data.cadastral_details?.district}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Taluk</span>
                      <span className="font-bold text-slate-900">{data.cadastral_details?.taluk}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Village</span>
                      <span className="font-bold text-slate-900">{data.cadastral_details?.village}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Survey / S.D.</span>
                      <span className="font-bold font-mono text-blue-700">{data.cadastral_details?.survey_number}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-amber-600" />
                    Statutory Case Details
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Classification</span>
                      <span className="font-bold text-slate-900">{data.cadastral_details?.classification}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Encroached Extent</span>
                      <span className="font-bold text-slate-900">{data.cadastral_details?.encroached_sqft} sq.ft</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400 block text-[10px] uppercase">Issuing Authority</span>
                      <span className="font-semibold text-slate-800">{data.issuing_authority}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Occupant Notice */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                <span className="text-slate-400 block text-[10px] uppercase">Alleged Occupant / Encroacher</span>
                <span className="font-bold text-slate-900 text-sm mt-0.5 block">{data.occupant}</span>
              </div>

              {/* Cryptographic SHA-256 Digest Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    SHA-256 Cryptographic Document Digest
                  </span>
                  <button
                    onClick={handleCopyHash}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    {copied ? "Copied" : "Copy Digest"}
                  </button>
                </div>
                <div className="p-3 bg-slate-900 rounded-xl font-mono text-xs text-amber-400 break-all select-all shadow-inner">
                  {data.sha256_digest}
                </div>
              </div>

              {/* Statutory Disclaimer Box */}
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Statutory Disclaimer (Design Intent & Officer Execution)
                </p>
                <p className="text-amber-800 leading-relaxed">
                  {data.disclaimer}
                </p>
                <p className="text-[11px] text-amber-700 italic pt-1">
                  • Notice replies, hearings, and statutory stay orders are governed strictly by the Tamil Nadu Land Encroachment Act III of 1905.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Return to Portal
                </Link>
                <span className="text-[10px] text-slate-400 font-mono">
                  Case Ref: {data.case_id}
                </span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-4 border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 Government of Tamil Nadu. GEOMMAND Land Administration Platform.</p>
          <p className="text-[11px] font-mono">Tamper-evident statutory document verification service</p>
        </div>
      </footer>
    </div>
  );
};

export default PublicDocumentVerifyView;
