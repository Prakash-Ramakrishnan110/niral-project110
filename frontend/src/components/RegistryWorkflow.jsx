import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, XCircle, Clock, AlertCircle, Send, 
  FileEdit, ShieldAlert, Check, ChevronRight, Info,
  Fingerprint, Landmark, Scale, FileText, Database,
  ArrowUpRight, AlertTriangle, Cpu, History, Search,
  Lock, UserCheck, ShieldCheck, Map, Layers
} from 'lucide-react';

// --- PREMIUM UI UTILS ---
const Badge = ({ children, variant = 'info', className = '' }) => {
   const styles = {
      info: 'bg-blue-500/10 text-blue-600 border-blue-200',
      success: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
      danger: 'bg-rose-500/10 text-rose-600 border-rose-200',
      warning: 'bg-amber-500/10 text-amber-600 border-amber-200',
      gold: 'bg-amber-500/10 text-amber-600 border-amber-200',
   };
   return (
      <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${styles[variant]} ${className}`}>
         {children}
      </span>
   );
};

// --- REGISTRY APPROVALS HUB (PREMIUM) ---
export const RegistryApprovalsHub = ({ user }) => {
    const [proposals, setProposals] = useState([
        { 
            id: 'RP-101-X', 
            parcel: 'GL-8842', 
            type: 'UPDATE', 
            status: 'PENDING', 
            proposed_by: 'VAO_SALEM_WEST', 
            field: 'Ownership Transfer',
            value: 'TN Housing Board',
            date: '2026-05-04 14:22',
            hash: 'SHA-256: 8a4e...f211'
        },
        { 
            id: 'RP-102-Y', 
            parcel: 'GL-8901', 
            type: 'CORRECTION', 
            status: 'PENDING', 
            proposed_by: 'TAHSILDAR_METTUR', 
            field: 'Classification',
            value: 'Reserved Forest',
            date: '2026-05-05 09:10',
            hash: 'SHA-256: 4c1a...e901'
        }
    ]);

    const handleApprove = (id) => {
        alert(`PROTOCOL AUTHORIZED: Digital Signature Verified. Applying Registry Patch...`);
        setProposals(proposals.filter(p => p.id !== id));
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            {/* Command Header */}
            <div className="bg-white border border-slate-200 p-8 shadow-sm relative overflow-hidden">
                <div className="absolute right-0 top-0 h-full w-1/3 bg-slate-50 -skew-x-12 translate-x-1/4"></div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                   <div>
                      <div className="flex items-center gap-3 mb-2">
                         <div className="bg-slate-900 p-2 text-white"><ShieldCheck size={24} /></div>
                         <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Registry Authorization Hub</h2>
                      </div>
                      <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest">
                         Official Portal for Land Registry Validation & Approval
                      </p>
                   </div>
                   <div className="flex gap-4">
                      <div className="bg-slate-50 border border-slate-200 px-6 py-3 min-w-[140px]">
                         <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1">Pending Approvals</p>
                         <p className="text-2xl font-black text-slate-900">{proposals.length}</p>
                      </div>
                   </div>
                </div>
            </div>

            {/* List */}
            <div className="space-y-3">
                {proposals.map(p => (
                    <div key={p.id} className="bg-white border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all duration-300 group overflow-hidden">
                        <div className="p-6 flex flex-col md:flex-row justify-between items-center gap-6">
                           <div className="flex items-center gap-6 flex-1">
                                <div className="hidden sm:flex w-12 h-12 bg-slate-50 border border-slate-100 items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                                    <Fingerprint size={24} />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-black text-slate-900">{p.id}</span>
                                        <Badge variant={p.type === 'CORRECTION' ? 'warning' : 'info'}>{p.type}</Badge>
                                    </div>
                                    <div className="flex flex-wrap gap-x-6 gap-y-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Survey: <span className="text-slate-700">{p.parcel}</span></p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Source: <span className="text-slate-700">{p.proposed_by}</span></p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Hash: <span className="text-slate-400 font-mono">{p.hash}</span></p>
                                    </div>
                                </div>
                           </div>

                           <div className="flex items-center gap-6 min-w-[300px]">
                                <div className="flex-1 text-right">
                                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Proposed Modification</p>
                                    <p className="text-xs font-black text-blue-600 uppercase tracking-wide">{p.field}: {p.value}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button className="px-4 py-2 border border-slate-200 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all">Deny</button>
                                    <button onClick={() => handleApprove(p.id)} className="px-6 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 shadow-sm flex items-center justify-center gap-2 transition-all">
                                        <Check size={14} /> Authorize
                                    </button>
                                </div>
                           </div>
                        </div>
                    </div>
                ))}
                {proposals.length === 0 && (
                    <div className="py-20 text-center bg-slate-50 border border-slate-100">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200 border border-slate-100 shadow-sm">
                            <CheckCircle2 size={32} />
                        </div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">All Registry Protocols Authorized</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- REGISTRY UPDATION MODULE (PREMIUM) ---
export const RegistryProposalForm = ({ parcel, onClose }) => {
    const [formData, setFormData] = useState({
        classification: parcel?.classification || 'Government',
        owner_name: parcel?.owner_name || '',
        area: '1.4 Acres',
        justification: '',
        auth_level: 'LEVEL_3_CLEARANCE'
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        alert(`UPDATING CORE REGISTRY... Generating cryptographic hash... Proposal ${Math.random().toString(36).substring(7)} submitted.`);
        onClose();
    };

    return (
        <div className="bg-white border border-slate-200 shadow-2xl p-10 max-w-2xl w-full animate-in zoom-in-95 duration-500 relative">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><Landmark size={120} /></div>
            
            <div className="flex justify-between items-start mb-8 border-b border-slate-100 pb-6">
                <div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Record Modification Request</h3>
                    <div className="flex items-center gap-3 mt-1">
                        <Badge variant="gold">System Auth Required</Badge>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Survey ID: {parcel?.survey_number || 'TN-SLM-142A'}</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 transition-colors"><XCircle size={24} /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Classification</label>
                        <select 
                            className="w-full bg-slate-50 border border-slate-200 p-3 text-xs font-bold outline-none focus:border-blue-600 transition-all appearance-none uppercase"
                            value={formData.classification}
                            onChange={(e) => setFormData({...formData, classification: e.target.value})}
                        >
                            <option>Government - Public</option>
                            <option>Government - Institutional</option>
                            <option>Waterbody - Protected</option>
                            <option>Forest Reserve</option>
                            <option>Temple Land - Trust</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Verified Area</label>
                        <input 
                            type="text" 
                            readOnly
                            className="w-full bg-slate-100 border border-slate-200 p-3 text-xs font-bold text-slate-400 cursor-not-allowed"
                            value={formData.area}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Official Custodian / Owner</label>
                    <div className="relative">
                        <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                            type="text" 
                            className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-3 text-xs font-bold outline-none focus:border-blue-600 transition-all placeholder:text-slate-300"
                            value={formData.owner_name}
                            onChange={(e) => setFormData({...formData, owner_name: e.target.value})}
                            placeholder="REVENUE DEPARTMENT / TNHB..."
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Justification</label>
                    <textarea 
                        className="w-full bg-slate-50 border border-slate-200 p-4 text-xs font-bold outline-none focus:border-blue-600 transition-all h-32 placeholder:text-slate-300"
                        placeholder="Provide detailed administrative reason for modification..."
                        value={formData.justification}
                        onChange={(e) => setFormData({...formData, justification: e.target.value})}
                    ></textarea>
                </div>
                
                <div className="pt-4 flex gap-4">
                    <button type="button" onClick={onClose} className="flex-1 py-3 bg-white border border-slate-200 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all">Cancel</button>
                    <button type="submit" className="flex-[2] py-3 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 shadow-md flex items-center justify-center gap-3 transition-all group">
                        <Fingerprint size={16} /> Submit Modification
                    </button>
                </div>
            </form>
        </div>
    );
};

// --- REGISTRY CORRECTION WIZARD (PREMIUM) ---
export const RegistryCorrectionWizard = ({ alert: alertData, onClose }) => {
    const [step, setStep] = useState(1);

    return (
        <div className="bg-white border border-slate-200 shadow-2xl p-10 max-w-4xl w-full animate-in slide-in-from-bottom-8 duration-700 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-100">
                <div className="h-full bg-rose-500 transition-all duration-500" style={{ width: `${(step / 3) * 100}%` }}></div>
            </div>
            
            <div className="flex justify-between items-start mb-10 relative z-10">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-rose-500 text-white flex items-center justify-center shadow-lg"><Scale size={20} /></div>
                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Discrepancy Correction Protocol</h3>
                    </div>
                    <div className="flex items-center gap-4">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Alert Reference: {alertData?.id || 'ALPHA-SEQ-09'}</p>
                        <div className="h-px w-10 bg-slate-100"></div>
                        <p className="text-[10px] text-rose-600 font-bold uppercase tracking-widest">District Authorization Pending</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 transition-colors"><XCircle size={24} /></button>
            </div>

            {/* Step Indicator */}
            <div className="flex items-center gap-4 mb-12 relative z-10">
                {[1, 2, 3].map(s => (
                    <div key={s} className="flex-1 flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black border-2 transition-all duration-500 ${step >= s ? 'bg-slate-900 border-slate-900 text-white' : 'border-slate-100 text-slate-300'}`}>
                            {step > s ? <Check size={16} /> : s}
                        </div>
                        <div className="hidden md:block">
                            <p className={`text-[8px] font-black uppercase tracking-widest ${step >= s ? 'text-slate-900' : 'text-slate-300'}`}>Phase 0{s}</p>
                            <p className={`text-[10px] font-bold uppercase ${step >= s ? 'text-slate-600' : 'text-slate-200'}`}>
                                {s === 1 ? 'Delta Analysis' : s === 2 ? 'Spatial Mapping' : 'Final Validation'}
                            </p>
                        </div>
                        {s < 3 && <div className={`flex-1 h-px ${step > s ? 'bg-slate-900' : 'bg-slate-100'}`}></div>}
                    </div>
                ))}
            </div>

            {/* Content Area */}
            <div className="min-h-[300px] mb-10 relative z-10">
                {step === 1 && (
                    <div className="grid grid-cols-2 gap-10 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="space-y-4">
                            <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 pb-2">Record Delta</h4>
                            <div className="bg-slate-50 p-6 space-y-3 border border-slate-100">
                                <div className="flex justify-between"><span className="text-[9px] text-slate-400 font-black uppercase">Survey No</span><span className="text-xs font-black text-slate-900">142 / A-3</span></div>
                                <div className="flex justify-between"><span className="text-[9px] text-slate-400 font-black uppercase">Current Class</span><span className="text-xs font-black text-slate-900">Public Common</span></div>
                                <div className="flex justify-between"><span className="text-[9px] text-slate-400 font-black uppercase">Mismatch</span><Badge variant="danger">High Priority</Badge></div>
                            </div>
                            <div className="p-4 bg-blue-50 border-l-4 border-blue-500 flex items-start gap-3">
                                <Info size={18} className="text-blue-500 shrink-0" />
                                <p className="text-[10px] font-bold text-blue-700 leading-relaxed uppercase">
                                    Satellite feed indicates a 420 SQM structure mismatch with cadastral records. 
                                </p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 pb-2">Visual Evidence</h4>
                            <div className="aspect-video bg-slate-100 border border-slate-200 relative overflow-hidden flex items-center justify-center">
                                <div className="z-10 text-center">
                                    <div className="w-10 h-10 bg-rose-100 text-rose-500 flex items-center justify-center mx-auto mb-2"><AlertTriangle size={20} /></div>
                                    <p className="text-[9px] font-black uppercase text-slate-900">Encroachment Identified</p>
                                    <p className="text-[8px] text-slate-400 mt-0.5 uppercase font-bold">Conf: 94.2% • Area: 420 SQM</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {step === 2 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="flex justify-between items-end border-b border-slate-100 pb-3">
                            <h4 className="text-xs font-black uppercase text-slate-900 tracking-widest">Spatial Geometry Correction</h4>
                            <div className="flex gap-2">
                                <button className="px-3 py-1 bg-slate-50 border border-slate-200 text-[8px] font-black uppercase hover:bg-slate-100 transition-all flex items-center gap-2 text-slate-600"><Layers size={10} /> Toggle Layers</button>
                                <button className="px-3 py-1 bg-slate-50 border border-slate-200 text-[8px] font-black uppercase hover:bg-slate-100 transition-all flex items-center gap-2 text-slate-600"><Map size={10} /> Cadastral View</button>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-6">
                            <div className="col-span-2 bg-slate-950 aspect-[16/9] relative flex items-center justify-center group overflow-hidden border border-slate-900">
                                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                                <div className="relative z-10 flex flex-col items-center">
                                    <div className="w-32 h-32 border-2 border-rose-500/30 rounded-full animate-ping absolute"></div>
                                    <p className="text-[9px] font-black text-rose-500 uppercase tracking-[0.5em] animate-pulse">Spatial Sync In Progress</p>
                                </div>
                                <div className="absolute bottom-4 left-4 flex gap-1.5">
                                    <div className="w-1.5 h-1.5 bg-blue-500"></div>
                                    <div className="w-1.5 h-1.5 bg-rose-500"></div>
                                    <div className="w-1.5 h-1.5 bg-emerald-500"></div>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Protocol Directives</p>
                                {[
                                    'Align vertex to boundary',
                                    'Validate drone point cloud',
                                    'Generate spatial patch'
                                ].map((d, i) => (
                                    <div key={i} className="p-3 bg-slate-50 border border-slate-100 text-[9px] font-black text-slate-600 uppercase tracking-tight flex items-center gap-3">
                                        <div className="w-1.5 h-1.5 bg-slate-300 rounded-full"></div>
                                        {d}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
                {step === 3 && (
                    <div className="flex flex-col items-center justify-center py-6 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="relative mb-6">
                            <div className="w-20 h-20 bg-emerald-500 text-white flex items-center justify-center shadow-xl shadow-emerald-100">
                                <ShieldCheck size={40} />
                            </div>
                        </div>
                        <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">Protocol Verified</h4>
                        <p className="text-slate-500 text-[10px] max-w-md text-center uppercase font-bold tracking-widest leading-loose">
                            Spatial and metadata patches verified against TN-GIS rulesets. Data integrity confirmed for final commit.
                        </p>
                        <div className="mt-8 flex gap-3">
                           <div className="px-4 py-2 bg-slate-50 border border-slate-100 text-[9px] font-black uppercase tracking-widest flex items-center gap-2 text-slate-600">
                              <History size={14} className="text-blue-500" /> Audit Log OK
                           </div>
                           <div className="px-4 py-2 bg-slate-50 border border-slate-100 text-[9px] font-black uppercase tracking-widest flex items-center gap-2 text-slate-600">
                              <Fingerprint size={14} className="text-blue-500" /> Signed MD5
                           </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation Footer */}
            <div className="flex gap-4 border-t border-slate-100 pt-8 relative z-10">
                {step > 1 && (
                    <button onClick={() => setStep(step - 1)} className="px-6 py-3 border border-slate-200 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all">
                        Previous
                    </button>
                )}
                <div className="flex-1"></div>
                {step < 3 ? (
                    <button onClick={() => setStep(step + 1)} className="px-8 py-3 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 flex items-center gap-3 transition-all shadow-md">
                        Proceed Phase 0{step + 1} <ChevronRight size={16} />
                    </button>
                ) : (
                    <button onClick={() => { alert('COMMIT SUCCESSFUL: Registry Update Propagated to District Mainframe.'); onClose(); }} className="px-10 py-3 bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 shadow-xl flex items-center gap-3 transition-all">
                        Finalize Patch <Fingerprint size={16} />
                    </button>
                )}
            </div>
        </div>
   );
};
