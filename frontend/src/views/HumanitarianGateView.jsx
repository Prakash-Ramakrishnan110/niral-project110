import React, { useState, useMemo } from 'react';
import {
  HeartHandshake, Home, ShieldCheck, AlertCircle, CheckCircle2,
  Users, Building, RefreshCcw
} from 'lucide-react';
import LandAPI from '../api/client';

export const HumanitarianGateView = ({ alerts = [], onRefresh }) => {
  const [selectedCase, setSelectedCase] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Filter or categorize alerts by structure category
  const categorized = useMemo(() => {
    const vulnerable = alerts.filter(a => {
      const cat = (a.structure_category || '').toUpperCase();
      return cat.includes('VULNERABLE') || cat.includes('HUT') || cat.includes('SLUM') || cat.includes('RESIDENTIAL');
    });

    const commercial = alerts.filter(a => {
      const cat = (a.structure_category || a.alert_type || '').toUpperCase();
      return cat.includes('COMMERCIAL') || cat.includes('LAYOUT') || cat.includes('CONCRETE') || cat.includes('FENCING');
    });

    const temporary = alerts.filter(a => {
      const cat = (a.structure_category || a.alert_type || '').toUpperCase();
      return cat.includes('PANDAL') || cat.includes('TEMPORARY') || cat.includes('FESTIVAL');
    });

    return { vulnerable, commercial, temporary };
  }, [alerts]);

  const activeCase = selectedCase || categorized.vulnerable[0] || alerts[0];

  const handleDispatchHousingAid = async (alertId) => {
    setIsSubmitting(true);
    setStatusMessage(null);
    try {
      await LandAPI.humanitarianRehab(alertId, {
        scheme: 'TNUHDB In-Situ Tenement Allotment Scheme',
        officer_notes: 'Eligible for urban poor housing under Tamil Nadu Slum Clearance Board.',
      });
      setStatusMessage({
        type: 'success',
        text: `Humanitarian Rehabilitation Protocol dispatched! Tenement allotment initiated with TNUHDB. Eviction notice cancelled.`
      });
      onRefresh();
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Failed to dispatch housing aid: ' + err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* 1. WELFARE BANNER */}
      <div className="bg-white border border-slate-200 border-l-4 border-emerald-500 text-slate-900 p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
              <HeartHandshake size={11} /> SOCIAL JUSTICE & REHABILITATION
            </span>
            <span className="text-[10px] text-slate-500 font-mono">TNUHDB STATE COLLABORATION</span>
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tight mt-1 text-slate-900">
            Humanitarian Welfare & Vulnerable Citizen Housing Gate
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl">
            In accordance with state welfare policy, zero eviction or demolition is executed against economically vulnerable families,
            thatched huts, or roadside dwellings. These cases are automatically protected and rerouted to the
            Tamil Nadu Urban Habitat Development Board (TNUHDB) for rehabilitation.
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border border-slate-300 transition-all shrink-0 shadow-xs"
        >
          <RefreshCcw size={14} /> Refresh
        </button>
      </div>

      {statusMessage && (
        <div className={`p-4 border-2 ${statusMessage.type === 'success' ? 'bg-green-50 border-green-500 text-green-900' : 'bg-red-50 border-red-500 text-red-900'} flex items-center gap-3 animate-in slide-in-from-top duration-300`}>
          <CheckCircle2 size={18} className={statusMessage.type === 'success' ? 'text-green-600' : 'text-red-600'} />
          <p className="text-xs font-bold uppercase tracking-wide">{statusMessage.text}</p>
        </div>
      )}

      {/* 2. THREE-WAY POLICY TRIAGE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border-2 border-emerald-500/30 p-5 shadow-sm bg-gradient-to-br from-emerald-50/20 to-white">
          <div className="flex justify-between items-center text-emerald-700">
            <span className="text-[10px] font-black uppercase tracking-widest">Vulnerable Housing ({categorized.vulnerable.length})</span>
            <Home size={18} />
          </div>
          <p className="text-xl font-black text-slate-900 mt-2">Humanitarian Aid</p>
          <p className="text-[10px] text-emerald-800 font-bold mt-1">
            Demolition prohibited. Direct tenement allotment via TNUHDB.
          </p>
        </div>

        <div className="bg-white border-2 border-red-500/30 p-5 shadow-sm bg-gradient-to-br from-red-50/20 to-white">
          <div className="flex justify-between items-center text-red-600">
            <span className="text-[10px] font-black uppercase tracking-widest">Commercial Grabs ({categorized.commercial.length})</span>
            <Building size={18} />
          </div>
          <p className="text-xl font-black text-slate-900 mt-2">Section 6 Eviction</p>
          <p className="text-[10px] text-red-700 font-bold mt-1">
            Zero tolerance. Fast-tracked for statutory summary clearance.
          </p>
        </div>

        <div className="bg-white border border-slate-200 p-5 shadow-sm">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-[10px] font-black uppercase tracking-widest">Temporary Pandals ({categorized.temporary.length})</span>
            <ShieldCheck size={18} />
          </div>
          <p className="text-xl font-black text-slate-900 mt-2">15-Day Auto Grace</p>
          <p className="text-[10px] text-slate-500 mt-1">
            Wedding tents and festival pandals auto-expire without notice.
          </p>
        </div>
      </div>

      {/* 3. CASE ACTION CONSOLE */}
      {activeCase && (
        <div className="bg-white border border-slate-200 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">
                Welfare Case Candidate • Case #{activeCase.id}
              </span>
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight mt-0.5">
                Survey No: {activeCase.survey_number || activeCase.parcel_details || '142/1'} • {activeCase.taluk || 'Salem West'}
              </h2>
            </div>

            <button
              onClick={() => handleDispatchHousingAid(activeCase.id)}
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all"
            >
              <HeartHandshake size={15} />
              {isSubmitting ? 'Dispatching Protocol...' : 'Dispatch TNUHDB Housing Aid'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="p-3 bg-slate-50 border border-slate-100">
              <span className="text-[8px] font-black text-slate-400 uppercase">Occupant Assessment</span>
              <p className="text-xs font-black text-slate-900 mt-1">Economically Weaker Section (EWS)</p>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-100">
              <span className="text-[8px] font-black text-slate-400 uppercase">Recommended Scheme</span>
              <p className="text-xs font-black text-slate-900 mt-1">TNUHDB Tenement Allotment</p>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-100">
              <span className="text-[8px] font-black text-slate-400 uppercase">Demolition Protection</span>
              <p className="text-xs font-black text-green-700 mt-1">ACTIVE (Stay of Demolition)</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HumanitarianGateView;
