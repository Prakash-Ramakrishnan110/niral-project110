import React, { useState } from 'react';
import {
    X, ExternalLink, ShieldAlert, CheckCircle2, AlertTriangle,
    Layers, MapPin, Copy, Check, Eye, Users, FileText, Compass,
    Scale, ChevronDown, ChevronUp, Landmark, ShieldCheck
} from 'lucide-react';

export const TamilNilamParcelCard = ({
    parcel,
    onClose,
    onOpenModal,
    activeAlert = null,
    userRole = 'ADMIN'
}) => {
    const [copied, setCopied] = useState(false);
    const [showNeighbors, setShowNeighbors] = useState(true);

    if (!parcel) return null;

    const copyUlpin = () => {
        if (parcel.ulpin) {
            navigator.clipboard.writeText(parcel.ulpin);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const isOccupied = parcel.is_occupied || (activeAlert && activeAlert.status !== 'Resolved');
    const neighbors = parcel.adjacent_neighbors || [];

    const noticeConfig = {
        TAHSILDAR: { label: 'Sec 6 Order', title: 'Issue Section 6 Final Eviction Order' },
        COLLECTOR: { label: 'Exec Order', title: 'Authorize Magisterial Enforcement Order' },
        VAO: { label: 'Form 7 Report', title: 'Submit Form 7 Notice Field Inspection' },
        INSPECTOR: { label: 'Notice Endorse', title: 'Endorse Statutory Eviction Notice' },
    }[userRole] || { label: 'Notice', title: 'Issue Eviction Notice' };

    return (
        <div className="absolute top-3 left-3 z-[1000] w-[390px] max-w-[calc(100%-24px)] max-h-[calc(100%-24px)] flex flex-col bg-white border border-slate-300 shadow-2xl rounded-lg overflow-hidden font-sans transition-all duration-300">
            {/* ─── 1. FIXED HEADER: Official Tamil Nadu Government Deep Teal ─── */}
            <div className="shrink-0 bg-gradient-to-r from-teal-800 via-teal-900 to-cyan-900 text-white px-3.5 py-2.5 flex items-center justify-between border-b border-teal-700">
                <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
                    <h3 className="text-xs font-black tracking-wider text-cyan-100 uppercase">
                        Land Parcel Information
                    </h3>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-cyan-200/90 font-mono font-medium">
                        ({parcel.coordinates?.[0]?.[0]?.[1]?.toFixed(5) || '11.6982'}, {parcel.coordinates?.[0]?.[0]?.[0]?.toFixed(5) || '78.1724'})
                    </span>
                    <button
                        onClick={onClose}
                        className="text-cyan-200 hover:text-white hover:bg-white/20 p-1 rounded transition"
                        title="Close"
                    >
                        <X size={14} />
                    </button>
                </div>
            </div>

            {/* ─── 2. SCROLLABLE BODY: Crisp Official White Theme ─── */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2.5 text-xs bg-white text-slate-800">
                
                {/* 2-Column Revenue Grid matching TNGIS Official Portal */}
                <div className="grid grid-cols-2 gap-2 bg-white p-2.5 border border-slate-200 shadow-xs rounded">
                    <div>
                        <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block">District:</span>
                        <span className="text-slate-900 font-bold">
                            {parcel.district || 'Salem'} / <span className="text-teal-700 font-semibold">{parcel.district_ta || 'சேலம்'}</span>
                        </span>
                    </div>
                    <div>
                        <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block">Taluk:</span>
                        <span className="text-slate-900 font-bold">
                            {parcel.taluk || 'Salem West'} / <span className="text-teal-700 font-semibold">{parcel.taluk_ta || 'சேலம் மேற்கு'}</span>
                        </span>
                    </div>
                    <div>
                        <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block">Village:</span>
                        <span className="text-slate-900 font-bold">
                            {parcel.village_name || parcel.village_code} / <span className="text-teal-700 font-semibold">{parcel.village_ta || 'கன்னங்குறிச்சி'}</span>
                        </span>
                    </div>
                    <div>
                        <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block">Village LGD Code:</span>
                        <span className="text-slate-900 font-mono font-bold">
                            {parcel.village_lgd_code || '608142'} <span className="text-[10px] text-slate-500 font-normal">(Rural)</span>
                        </span>
                    </div>
                </div>

                {/* ULPIN (Bhu-Aadhaar) Bar */}
                <div className="flex items-center justify-between bg-cyan-50/80 border border-cyan-200 px-3 py-2 rounded">
                    <div>
                        <span className="text-[9px] uppercase tracking-wider text-teal-800 font-black block">
                            ULPIN (Bhu-Aadhaar):
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-900 tracking-wider">
                            {parcel.ulpin || '608W14201A9876'}
                        </span>
                    </div>
                    <button
                        onClick={copyUlpin}
                        className="flex items-center gap-1 text-[10px] bg-white hover:bg-cyan-100 text-teal-800 font-bold px-2 py-1 rounded border border-cyan-300 shadow-sm transition"
                    >
                        {copied ? <Check size={11} className="text-green-600" /> : <Copy size={11} />}
                        <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                </div>

                {/* Survey Number & Sub Division Box */}
                <div className="grid grid-cols-3 gap-2 text-center bg-white p-2 border border-slate-200 shadow-xs rounded">
                    <div className="border-r border-slate-200">
                        <span className="text-[9px] uppercase text-slate-500 block font-bold">Survey No</span>
                        <span className="text-sm font-black text-slate-900">{parcel.survey_number || '142'}</span>
                    </div>
                    <div className="border-r border-slate-200">
                        <span className="text-[9px] uppercase text-slate-500 block font-bold">Sub Division</span>
                        <span className="text-sm font-black text-teal-700">{parcel.subdivision || '1A'}</span>
                    </div>
                    <div>
                        <span className="text-[9px] uppercase text-slate-500 block font-bold">Classification</span>
                        <span className="text-[11px] font-black text-amber-700 truncate block">
                            {parcel.classification || 'Government'}
                        </span>
                    </div>
                </div>

                {/* Encroachment / Occupation Status Banner */}
                {isOccupied ? (
                    <div className="bg-red-50 border-l-4 border-red-500 p-2.5 rounded border border-red-200">
                        <div className="flex items-center justify-between mb-1">
                            <span className="flex items-center gap-1 text-red-700 font-black text-[10px] uppercase tracking-wider">
                                <AlertTriangle size={13} className="text-red-600 shrink-0" />
                                🔴 OCCUPIED / அரசு நில ஆக்கிரமிப்பு
                            </span>
                            <span className="bg-red-100 text-red-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded border border-red-300">
                                {parcel.occupied_extent || 'Encroached Area'}
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-700 leading-tight">
                            Satellite change detection flagged unauthorized occupation into {parcel.classification} boundary.
                        </p>
                    </div>
                ) : (
                    <div className="bg-emerald-50 border-l-4 border-emerald-500 p-2.5 rounded border border-emerald-200">
                        <div className="flex items-center gap-1 text-emerald-800 font-black text-[10px] uppercase tracking-wider">
                            <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                            🟢 VACANT / ஆக்கிரமிப்பு இல்லை (Protected State Asset)
                        </div>
                        <p className="text-[10px] text-slate-600 mt-0.5">
                            Total Area: <span className="font-bold text-slate-800">{parcel.area_extent || '12.40 Acres'}</span> — Zero boundary breach detected.
                        </p>
                    </div>
                )}

                {/* Adjacent Private Neighbors with Patta Numbers */}
                {neighbors.length > 0 && (
                    <div className="bg-amber-50/60 border border-amber-200 rounded p-2.5">
                        <div
                            onClick={() => setShowNeighbors(!showNeighbors)}
                            className="flex items-center justify-between cursor-pointer select-none pb-1 border-b border-amber-200/80"
                        >
                            <span className="flex items-center gap-1 text-amber-900 font-black text-[10px] uppercase tracking-wider">
                                <Users size={12} className="text-amber-700" />
                                Adjacent Private Neighbors (பக்கத்து பட்டாக்கள்)
                            </span>
                            <span className="text-amber-800">
                                {showNeighbors ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                            </span>
                        </div>

                        {showNeighbors && (
                            <div className="mt-2 space-y-2">
                                {neighbors.map((n, idx) => (
                                    <div
                                        key={idx}
                                        className={`p-2 rounded text-[11px] border ${
                                            n.encroachment_status?.includes('Encroacher') || n.encroachment_status?.includes('Overlap')
                                                ? 'bg-red-50/70 border-red-300 text-red-900'
                                                : 'bg-white border-slate-200 text-slate-800'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-slate-900">
                                                Survey {n.survey_number}
                                            </span>
                                            <span className="bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded text-[9px] font-mono font-black border border-amber-300">
                                                Patta No. {n.patta_number}
                                            </span>
                                        </div>
                                        <div className="text-[10px] text-slate-600 mt-0.5">
                                            Owner: <span className="font-bold text-slate-800">{n.owner_name}</span> ({n.direction})
                                        </div>
                                        <div className={`text-[10px] mt-1 font-semibold flex items-center gap-1 ${
                                            n.encroachment_status?.includes('Encroacher') ? 'text-red-700' : 'text-emerald-700'
                                        }`}>
                                            {n.encroachment_status?.includes('Encroacher') ? '⚠️' : '✓'} {n.encroachment_status}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ─── 3. PINNED DOCKED FOOTER: Always 100% Visible Across All Dashboards ─── */}
            <div className="shrink-0 bg-white border-t border-slate-200 p-2.5 shadow-md">
                <div className="text-[9px] text-teal-900 uppercase font-black tracking-wider block mb-2 text-center bg-teal-50/80 border border-teal-200 py-1 px-2 rounded">
                    Click on the below icons to view more details
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                    {/* 1. Patta */}
                    <button
                        onClick={() => onOpenModal('patta')}
                        className="flex flex-col items-center justify-center p-1.5 rounded bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-500 shadow-sm transition group"
                        title="View Patta / Chitta Extract"
                    >
                        <Landmark size={17} className="text-teal-700 group-hover:scale-110 transition" />
                        <span className="text-[9px] font-bold text-slate-700 mt-0.5">Patta</span>
                    </button>

                    {/* 2. FMB */}
                    <button
                        onClick={() => onOpenModal('fmb')}
                        className="flex flex-col items-center justify-center p-1.5 rounded bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-500 shadow-sm transition group"
                        title="View Field Measurement Book (FMB) Sketch"
                    >
                        <Compass size={17} className="text-amber-600 group-hover:scale-110 transition" />
                        <span className="text-[9px] font-bold text-slate-700 mt-0.5">FMB</span>
                    </button>

                    {/* 3. Neighbors */}
                    <button
                        onClick={() => onOpenModal('neighbors')}
                        className="flex flex-col items-center justify-center p-1.5 rounded bg-white hover:bg-purple-50 border border-slate-200 hover:border-purple-500 shadow-sm transition group"
                        title="View Adjacent Private Patta Breakdown"
                    >
                        <Users size={17} className="text-purple-700 group-hover:scale-110 transition" />
                        <span className="text-[9px] font-bold text-slate-700 mt-0.5">Neighbors</span>
                    </button>

                    {/* 4. G-Value */}
                    <button
                        onClick={() => onOpenModal('gvalue')}
                        className="flex flex-col items-center justify-center p-1.5 rounded bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-500 shadow-sm transition group"
                        title="Guideline Valuation (TNREGINET)"
                    >
                        <span className="text-base font-black text-emerald-600 leading-none group-hover:scale-110 transition">₹</span>
                        <span className="text-[9px] font-bold text-slate-700 mt-0.5">G-Value</span>
                    </button>

                    {/* 5. Notice */}
                    <button
                        onClick={() => onOpenModal('notice')}
                        className="flex flex-col items-center justify-center p-1.5 rounded bg-white hover:bg-red-50 border border-slate-200 hover:border-red-500 shadow-sm transition group"
                        title="Issue Eviction Notice"
                    >
                        <Scale size={17} className="text-red-600 group-hover:scale-110 transition" />
                        <span className="text-[9px] font-bold text-slate-700 mt-0.5 truncate max-w-full">{noticeConfig.label}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
