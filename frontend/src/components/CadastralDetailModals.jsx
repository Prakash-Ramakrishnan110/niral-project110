import React, { useState } from 'react';
import {
    X, Printer, Download, CheckCircle2, AlertTriangle, ShieldCheck,
    QrCode, Scale, FileText, Compass, ExternalLink, UserCheck, Landmark
} from 'lucide-react';

export const CadastralDetailModals = ({
    modalType,
    parcel,
    onClose,
    userRole = 'ADMIN'
}) => {
    const [showGLine, setShowGLine] = useState(true);
    const [showOffsets, setShowOffsets] = useState(true);
    const [highlightEncroachment, setHighlightEncroachment] = useState(true);

    if (!modalType || !parcel) return null;

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white border border-slate-300 shadow-2xl rounded-lg w-full max-w-2xl text-slate-800 overflow-hidden relative font-sans animate-in fade-in zoom-in-95 duration-150">
                
                {/* ─── MODAL HEADER: Official Tamil Nadu Government Theme ─── */}
                <div className="bg-gradient-to-r from-teal-800 via-teal-900 to-cyan-900 px-6 py-3.5 border-b border-teal-700 flex items-center justify-between text-white">
                    <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
                        <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-cyan-100">
                            {modalType === 'patta' && 'Tamil Nadu e-Chitta / இ-பட்டா நில உரிமைச் சான்று'}
                            {modalType === 'fmb' && 'Field Measurement Book (FMB) / புல வரைபடம்'}
                            {modalType === 'neighbors' && 'Adjacent Private Neighbors / பக்கத்து பட்டா விபரங்கள்'}
                            {modalType === 'gvalue' && 'TNREGINET Guideline Valuation / வழிகாட்டி மதிப்பு'}
                            {modalType === 'notice' && 'TN Land Encroachment Act — Eviction Notice'}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-cyan-200 hover:text-white p-1 hover:bg-white/20 rounded transition"
                        title="Close Modal"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* ─── MODAL BODY: Crisp Pure White Theme ─── */}
                <div className="p-6 max-h-[80vh] overflow-y-auto custom-scrollbar text-xs bg-slate-50/60 text-slate-800">
                    
                    {/* ────────────────── 1. PATTA / CHITTA EXTRACT ────────────────── */}
                    {modalType === 'patta' && (
                        <div className="bg-white text-slate-900 p-6 border-2 border-slate-300 font-serif shadow-sm rounded">
                            {/* Tamil Nadu State Emblem Header */}
                            <div className="text-center pb-4 border-b-2 border-slate-800">
                                <div className="text-2xl font-black text-slate-900 tracking-wider">
                                    தமிழ்நாடு அரசு (GOVERNMENT OF TAMIL NADU)
                                </div>
                                <div className="text-xs font-bold text-slate-700 tracking-widest uppercase mt-0.5">
                                    வருவாய்த்துறை — நில உரிமை பட்டா / சிட்டா நகல் (REVENUE DEPARTMENT)
                                </div>
                                <div className="text-[10px] text-slate-600 font-mono mt-1">
                                    CollabLand TN Electronic Land Records Service | ULPIN: {parcel.ulpin || '608W14201A9876'}
                                </div>
                            </div>

                            {/* Revenue Metadata Table */}
                            <div className="grid grid-cols-2 gap-4 my-4 text-xs font-sans">
                                <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                                    <span className="text-[10px] uppercase font-bold text-slate-500 block">மாவட்டம் / District:</span>
                                    <span className="font-black text-slate-900">{parcel.district_ta || 'சேலம்'} ({parcel.district || 'Salem'})</span>
                                </div>
                                <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                                    <span className="text-[10px] uppercase font-bold text-slate-500 block">வட்டம் / Taluk:</span>
                                    <span className="font-black text-slate-900">{parcel.taluk_ta || 'சேலம் மேற்கு'} ({parcel.taluk || 'Salem West'})</span>
                                </div>
                                <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                                    <span className="text-[10px] uppercase font-bold text-slate-500 block">கிராமம் / Village:</span>
                                    <span className="font-black text-slate-900">{parcel.village_ta || 'கன்னங்குறிச்சி'} ({parcel.village_name || parcel.village_code})</span>
                                </div>
                                <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                                    <span className="text-[10px] uppercase font-bold text-slate-500 block">கிராம LGD குறியீடு / Village LGD:</span>
                                    <span className="font-mono font-bold text-slate-900">{parcel.village_lgd_code || '608142'}</span>
                                </div>
                            </div>

                            {/* Land Particulars Table */}
                            <table className="w-full text-left border border-slate-300 font-sans my-4 rounded overflow-hidden">
                                <thead className="bg-slate-100 text-[10px] font-black uppercase border-b border-slate-300 text-slate-700">
                                    <tr>
                                        <th className="p-2 border-r border-slate-300">புல எண் / Survey</th>
                                        <th className="p-2 border-r border-slate-300">உட்பிரிவு / Sub Div</th>
                                        <th className="p-2 border-r border-slate-300">நில வகைப்பாடு / Classification</th>
                                        <th className="p-2 border-r border-slate-300">விஸ்தீரணம் / Extent</th>
                                        <th className="p-2">பயன்பாடு / Status</th>
                                    </tr>
                                </thead>
                                <tbody className="text-xs bg-white">
                                    <tr className="border-b border-slate-200">
                                        <td className="p-2 border-r border-slate-200 font-black text-slate-900">{parcel.survey_number || '142'}</td>
                                        <td className="p-2 border-r border-slate-200 font-black text-teal-800">{parcel.subdivision || '1A'}</td>
                                        <td className="p-2 border-r border-slate-200 font-bold text-slate-800">
                                            {parcel.classification === 'Waterbody' ? 'அரசு நஞ்சை நீர்நிலை புறம்போக்கு' : (parcel.classification === 'Roadside' ? 'நெடுஞ்சாலை புறம்போக்கு' : 'அரசு தரிசு / புறம்போக்கு')}
                                        </td>
                                        <td className="p-2 border-r border-slate-200 font-mono font-bold text-slate-900">{parcel.area_extent || '12.40 Acres'}</td>
                                        <td className="p-2 font-bold text-red-700">
                                            {parcel.is_occupied ? '⚠️ ஆக்கிரமிப்பு பதிவு செய்யப்பட்டுள்ளது' : '✓ பாதுகாக்கப்பட்ட அரசு நிலம்'}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            {/* Owner & Department */}
                            <div className="bg-slate-50 p-3 border border-slate-200 font-sans mb-4 rounded">
                                <span className="text-[10px] uppercase font-bold text-slate-500 block">உரிமையாளர் பெயர் / Registered Authority:</span>
                                <span className="text-sm font-black text-slate-900">
                                    {parcel.owner_name || 'நீர்வளத்துறை (TN Water Resources Dept - PWD)'}
                                </span>
                            </div>

                            {/* Footer Seals & QR */}
                            <div className="flex items-center justify-between pt-4 border-t-2 border-slate-800 font-sans">
                                <div className="flex items-center gap-3">
                                    <div className="w-14 h-14 bg-white border border-slate-300 flex items-center justify-center p-1 rounded">
                                        <QrCode size={48} className="text-slate-800" />
                                    </div>
                                    <div className="text-[9px] text-slate-600">
                                        <div className="font-bold text-slate-800">Digitally Verified Document</div>
                                        <div>CollabLand Server Hash: #TN608-FMB-{parcel.survey_number}</div>
                                        <div>Issued by: வட்டாட்சியர் அலுவலகம், சேலம் மேற்கு</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="w-20 h-10 border border-dashed border-slate-400 flex items-center justify-center text-[9px] text-slate-500 font-bold uppercase mb-1">
                                        [ SEAL ]
                                    </div>
                                    <span className="text-[9px] font-bold text-slate-700 block">வட்டாட்சியர் / Tahsildar</span>
                                    <span className="text-[8px] text-slate-500">சேலம் மேற்கு வட்டம்</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ────────────────── 2. DIGITAL FMB SKETCH ────────────────── */}
                    {modalType === 'fmb' && (
                        <div className="space-y-4">
                            {/* Toolbar */}
                            <div className="flex items-center justify-between bg-white p-2.5 border border-slate-200 rounded shadow-xs">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setShowGLine(!showGLine)}
                                        className={`px-2.5 py-1 text-[10px] font-bold rounded border transition ${
                                            showGLine ? 'bg-cyan-700 text-white border-cyan-700 shadow-xs' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                                        }`}
                                    >
                                        G-Line ({showGLine ? 'ON' : 'OFF'})
                                    </button>
                                    <button
                                        onClick={() => setShowOffsets(!showOffsets)}
                                        className={`px-2.5 py-1 text-[10px] font-bold rounded border transition ${
                                            showOffsets ? 'bg-amber-600 text-white border-amber-600 shadow-xs' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                                        }`}
                                    >
                                        Offsets ({showOffsets ? 'ON' : 'OFF'})
                                    </button>
                                    <button
                                        onClick={() => setHighlightEncroachment(!highlightEncroachment)}
                                        className={`px-2.5 py-1 text-[10px] font-bold rounded border transition ${
                                            highlightEncroachment ? 'bg-red-600 text-white border-red-600 shadow-xs' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                                        }`}
                                    >
                                        Encroached Area ({highlightEncroachment ? 'SHOWN' : 'HIDDEN'})
                                    </button>
                                </div>
                                <span className="text-[10px] text-slate-600 font-mono font-bold">
                                    FMB Sheet: Survey {parcel.survey_number}/{parcel.subdivision || '1A'}
                                </span>
                            </div>

                            {/* Interactive SVG FMB Canvas on Crisp White Surface */}
                            <div className="bg-white border border-slate-300 p-4 rounded shadow-xs flex flex-col items-center justify-center relative">
                                <svg viewBox="0 0 500 360" className="w-full max-w-lg h-72">
                                    {/* Light Background Grid */}
                                    <defs>
                                        <pattern id="fmbGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                                            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f1f5f9" strokeWidth="1"/>
                                        </pattern>
                                        <pattern id="encroachHatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                                            <line x1="0" y1="0" x2="0" y2="8" stroke="#ef4444" strokeWidth="2.5" />
                                        </pattern>
                                    </defs>
                                    <rect width="500" height="360" fill="url(#fmbGrid)" />

                                    {/* Main Parcel Boundary (A -> B -> C -> D) */}
                                    <polygon
                                        points="80,70 420,60 400,280 110,290"
                                        fill="#0d9488"
                                        fillOpacity="0.12"
                                        stroke="#0f766e"
                                        strokeWidth="3.5"
                                    />

                                    {/* Encroached Overlap Zone in Red Hatch */}
                                    {highlightEncroachment && (
                                        <polygon
                                            points="80,70 190,67 175,150 95,140"
                                            fill="url(#encroachHatch)"
                                            stroke="#ef4444"
                                            strokeWidth="2.5"
                                        />
                                    )}

                                    {/* G-Line (Diagonal tie line A -> C) */}
                                    {showGLine && (
                                        <line
                                            x1="80" y1="70" x2="400" y2="280"
                                            stroke="#0284c7"
                                            strokeWidth="2"
                                            strokeDasharray="5,5"
                                        />
                                    )}

                                    {/* Ladder Offsets */}
                                    {showOffsets && (
                                        <>
                                            <line x1="160" y1="120" x2="190" y2="67" stroke="#d97706" strokeWidth="1.5" strokeDasharray="3,3" />
                                            <line x1="260" y1="180" x2="290" y2="65" stroke="#d97706" strokeWidth="1.5" strokeDasharray="3,3" />
                                        </>
                                    )}

                                    {/* Corner Stone Labels */}
                                    <circle cx="80" cy="70" r="5" fill="#0f766e" />
                                    <text x="65" y="65" fill="#0f766e" fontSize="12" fontWeight="bold">A</text>

                                    <circle cx="420" cy="60" r="5" fill="#0f766e" />
                                    <text x="430" y="60" fill="#0f766e" fontSize="12" fontWeight="bold">B</text>

                                    <circle cx="400" cy="280" r="5" fill="#0f766e" />
                                    <text x="410" y="295" fill="#0f766e" fontSize="12" fontWeight="bold">C</text>

                                    <circle cx="110" cy="290" r="5" fill="#0f766e" />
                                    <text x="95" y="305" fill="#0f766e" fontSize="12" fontWeight="bold">D</text>

                                    {/* Boundary Measurement Text (F-Lines) */}
                                    <text x="240" y="52" fill="#1e293b" fontSize="11" fontWeight="bold">142.5 m (North)</text>
                                    <text x="415" y="175" fill="#1e293b" fontSize="11" fontWeight="bold">88.2 m (East)</text>
                                    <text x="240" y="305" fill="#1e293b" fontSize="11" fontWeight="bold">135.0 m (South)</text>
                                    <text x="50" y="185" fill="#1e293b" fontSize="11" fontWeight="bold">94.6 m (West)</text>

                                    {/* G-Line Label */}
                                    {showGLine && (
                                        <text x="210" y="155" fill="#0284c7" fontSize="11" fontWeight="bold" transform="rotate(30 210,155)">
                                            G-Line: 166.4 m
                                        </text>
                                    )}

                                    {/* Encroachment Warning Label */}
                                    {highlightEncroachment && (
                                        <g>
                                            <rect x="90" y="85" width="134" height="34" fill="#fef2f2" rx="3" stroke="#ef4444" strokeWidth="1.5" />
                                            <text x="96" y="99" fill="#991b1b" fontSize="9" fontWeight="black">⚠️ ENCROACHED: 2,400 sq.ft</text>
                                            <text x="96" y="112" fill="#b45309" fontSize="8" fontWeight="bold">Neighbor Patta 340 (Wall)</text>
                                        </g>
                                    )}

                                    {/* Center Parcel ID */}
                                    <text x="220" y="220" fill="#0f766e" fontSize="16" fontWeight="900" opacity="0.6">
                                        {parcel.survey_number} / {parcel.subdivision || '1A'}
                                    </text>
                                </svg>

                                <div className="text-[10px] text-slate-500 mt-2 text-center">
                                    CollabLand Survey Standards | Scale 1:1000 | Official Revenue Department Cadastral Record
                                </div>
                            </div>

                            {/* Measurement Ledger */}
                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div className="bg-white p-3.5 rounded border border-slate-200 shadow-xs">
                                    <span className="text-[10px] text-teal-800 font-bold uppercase block mb-1.5">Field Boundaries (F-Lines):</span>
                                    <div className="space-y-1 font-mono text-[11px] text-slate-700">
                                        <div className="flex justify-between"><span>A - B (North Bund):</span><span className="font-bold text-slate-900">142.50 meters</span></div>
                                        <div className="flex justify-between"><span>B - C (East Bund):</span><span className="font-bold text-slate-900">88.20 meters</span></div>
                                        <div className="flex justify-between"><span>C - D (South Channel):</span><span className="font-bold text-slate-900">135.00 meters</span></div>
                                        <div className="flex justify-between"><span>D - A (West Margin):</span><span className="font-bold text-slate-900">94.60 meters</span></div>
                                    </div>
                                </div>
                                <div className="bg-red-50/70 p-3.5 rounded border border-red-200 shadow-xs">
                                    <span className="text-[10px] text-red-700 font-bold uppercase block mb-1.5">Encroachment Survey Finding:</span>
                                    <div className="space-y-1 text-[11px] text-slate-700">
                                        <div><strong className="text-slate-900">Breach:</strong> 18.2m compound wall overlap</div>
                                        <div><strong className="text-slate-900">Encroached Area:</strong> {parcel.occupied_extent || '2,400 sq.ft (5.5 Cents)'}</div>
                                        <div><strong className="text-slate-900">Suspected Encroacher:</strong> Adjacent Patta No. 340</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ────────────────── 3. ADJACENT NEIGHBORS BREAKDOWN ────────────────── */}
                    {modalType === 'neighbors' && (
                        <div className="space-y-4">
                            <div className="bg-amber-50 border border-amber-200 p-3.5 rounded shadow-xs">
                                <h3 className="text-xs font-black text-amber-900 uppercase tracking-wider mb-1">
                                    Adjacent Private Patta Analysis (பக்கத்து நில உரிமையாளர்கள்)
                                </h3>
                                <p className="text-[11px] text-amber-900/90 leading-relaxed">
                                    When government land is occupied, revenue officers cross-reference neighboring private survey numbers to identify which owner crossed their boundary.
                                </p>
                            </div>

                            <div className="space-y-3">
                                {(parcel.adjacent_neighbors || []).map((n, idx) => (
                                    <div
                                        key={idx}
                                        className={`p-4 border rounded shadow-xs ${
                                            n.encroachment_status?.includes('Encroacher') || n.encroachment_status?.includes('Overlap')
                                                ? 'bg-red-50/60 border-red-300'
                                                : 'bg-white border-slate-200'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-black text-slate-900">Survey {n.survey_number}</span>
                                                    <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded text-[10px] font-mono font-bold border border-amber-300">
                                                        Patta No: {n.patta_number}
                                                    </span>
                                                    {n.encroachment_status?.includes('Encroacher') && (
                                                        <span className="bg-red-600 text-white px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider">
                                                            Suspected Encroacher
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-slate-700 mt-1">
                                                    Owner: <span className="font-bold text-slate-900 text-sm">{n.owner_name}</span>
                                                </div>
                                            </div>
                                            <div className="text-right text-[11px]">
                                                <span className="text-slate-500 block">Boundary Direction</span>
                                                <span className="font-bold text-teal-800">{n.direction}</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-200 text-xs">
                                            <div>
                                                <span className="text-slate-500 block text-[10px]">Registered Extent:</span>
                                                <span className="font-bold text-slate-900">{n.extent || '1.20 Acres'} ({n.land_type || 'நஞ்சை'})</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-500 block text-[10px]">Field Status:</span>
                                                <span className={`font-bold ${
                                                    n.encroachment_status?.includes('Encroacher') ? 'text-red-700' : 'text-emerald-700'
                                                }`}>
                                                    {n.encroachment_status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ────────────────── 4. GUIDELINE VALUE MODAL ────────────────── */}
                    {modalType === 'gvalue' && (
                        <div className="space-y-4">
                            <div className="bg-white p-4 border border-slate-200 rounded shadow-xs">
                                <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
                                    <span className="text-xs font-bold uppercase text-slate-600">Registration Department Valuation (TNREGINET)</span>
                                    <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-200">
                                        Effective: 2026-2027
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-xs">
                                    <div>
                                        <span className="text-slate-500 block text-[10px]">Zone / Street:</span>
                                        <span className="font-bold text-slate-900 text-sm">Kannankurichi Main / Mookaneri Waterfront</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 block text-[10px]">Rate per Sq.Ft:</span>
                                        <span className="font-black text-emerald-700 text-lg">{parcel.g_value || '₹2,100 / sq.ft'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-red-50/70 p-4 border border-red-200 rounded shadow-xs">
                                <span className="text-xs font-black text-red-800 uppercase tracking-wider block mb-2">
                                    Financial Asset at Risk (Encroached Portion Valuation)
                                </span>
                                <div className="space-y-2 text-xs">
                                    <div className="flex justify-between border-b border-red-200 pb-1 text-slate-700">
                                        <span>Encroached Land Extent:</span>
                                        <span className="font-mono font-bold text-slate-900">{parcel.occupied_extent || '2,400 sq.ft'}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-red-200 pb-1 text-slate-700">
                                        <span>Guideline Rate:</span>
                                        <span className="font-mono font-bold text-slate-900">₹2,100 / sq.ft</span>
                                    </div>
                                    <div className="flex justify-between pt-1 text-sm font-black">
                                        <span className="text-red-900">Total Government Asset Value at Risk:</span>
                                        <span className="text-emerald-700">₹50,40,000 (₹50.40 Lakhs)</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ────────────────── 5. EVICTION NOTICE MODAL ────────────────── */}
                    {modalType === 'notice' && (
                        <div className="bg-white text-slate-900 p-6 border-2 border-red-600 font-serif shadow-md rounded">
                            {parcel.classification === 'Roadside' ? (
                                <>
                                    <div className="text-center pb-3 border-b-2 border-slate-900">
                                        <div className="text-base font-black text-red-700 tracking-wide uppercase">
                                            தமிழ்நாடு நெடுஞ்சாலைகள் சட்டம், 2001 (TAMIL NADU HIGHWAYS ACT, 2001)
                                        </div>
                                        <div className="text-xs font-bold text-slate-800">
                                            பிரிவு 28(2) இன் கீழ் சாலையோர ஆக்கிரமிப்பு அகற்றும் உத்தரவு (NOTICE UNDER SECTION 28)
                                        </div>
                                        <div className="text-[10px] text-slate-600 font-mono mt-0.5">
                                            கோட்டப் பொறியாளர் அலுவலகம் (நெடுஞ்சாலை நபார்டு & கிராமச் சாலைகள்) / வட்டாட்சியர், சேலம் மாவட்டம்
                                        </div>
                                    </div>

                                    <div className="my-4 text-xs font-sans space-y-2">
                                        <div>
                                            <span className="font-bold text-slate-700">பெறுநர் (To):</span>
                                            <div className="font-black text-slate-900 text-sm">
                                                {parcel.adjacent_neighbors?.[0]?.owner_name || 'திரு. ஆர். சின்னசாமி (R. Chinnasamy)'}
                                            </div>
                                            <div className="text-slate-600">
                                                புல எண்: {parcel.adjacent_neighbors?.[0]?.survey_number || '119/3'}, பட்டா எண்: {parcel.adjacent_neighbors?.[0]?.patta_number || '488'}, {parcel.village_name || 'Omalur'}, {parcel.taluk || 'Salem'}.
                                            </div>
                                        </div>

                                        <div className="bg-amber-50 p-3 border border-amber-300 text-xs leading-relaxed text-slate-800 rounded">
                                            தாங்கள் நெடுஞ்சாலைத்துறைக்கு பாத்தியப்பட்ட எல்லைப் புறம்போக்கு நிலமான 
                                            <strong> புல எண் {parcel.survey_number}/{parcel.subdivision || '4'} ({parcel.village_name || 'Salem'})</strong> இல் 
                                            சுமார் <strong>{parcel.occupied_extent || '850 சதுர அடி'}</strong> நிலப்பரப்பில் சாலையோர Right-of-Way (RoW) மற்றும் நடைபாதை எல்லையை ஆக்கிரமித்து 
                                            {parcel.adjacent_neighbors?.[0]?.encroachment_status || 'அனுமதியற்ற கட்டுமானங்கள் / பட்டறை அமைத்து'} வாகனப் போக்குவரத்து மற்றும் பொதுமக்களுக்கு பெரும் இடையூறு ஏற்படுத்தியுள்ளீர்கள்.
                                        </div>

                                        <div className="font-bold text-red-700 text-xs">
                                            எனவே, தமிழ்நாடு நெடுஞ்சாலைகள் சட்டம் 2001 பிரிவு 28 இன் கீழ், இவ்வறிவிப்பு கிடைத்த 7 நாட்களுக்குள் மேற்படி சாலையோர ஆக்கிரமிப்பினை தாங்களாகவே அப்புறப்படுத்த உத்தரவிடப்படுகிறது. தவறும் பட்சத்தில் காவல்துறை பாதுகாப்புடன் அரசு இயந்திரங்கள் மூலம் ஆக்கிரமிப்பு இடித்து அகற்றப்படும்.
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t-2 border-slate-900 font-sans">
                                        <div className="text-[10px] text-slate-600">
                                            தேதி: 11-10-2026 | இடம்: சேலம்
                                        </div>
                                        <div className="text-right">
                                            <div className="w-24 h-8 border border-dashed border-slate-400 flex items-center justify-center text-[9px] text-slate-400 font-bold uppercase mb-1">
                                                [ OFFICIAL SEAL ]
                                            </div>
                                            <span className="text-xs font-black text-slate-900 block">கோட்டப் பொறியாளர் / வட்டாட்சியர்</span>
                                            <span className="text-[9px] text-slate-600">{parcel.taluk || 'Salem'} கோட்டம், நெடுஞ்சாலைத்துறை.</span>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="text-center pb-3 border-b-2 border-slate-900">
                                        <div className="text-base font-black text-red-700 tracking-wide uppercase">
                                            தமிழ்நாடு நில ஆக்கிரமிப்பு சட்டம், 1905 (TAMIL NADU LAND ENCROACHMENT ACT, 1905)
                                        </div>
                                        <div className="text-xs font-bold text-slate-800">
                                            பிரிவு 6 இன் கீழ் ஆக்கிரமிப்பு அகற்றும் இறுதி உத்தரவு (NOTICE UNDER SECTION 6)
                                        </div>
                                        <div className="text-[10px] text-slate-600 font-mono mt-0.5">
                                            வட்டாட்சியர் அலுவலகம், {parcel.taluk_ta || 'சேலம் மேற்கு'} வட்டம், சேலம் மாவட்டம்.
                                        </div>
                                    </div>

                                    <div className="my-4 text-xs font-sans space-y-2">
                                        <div>
                                            <span className="font-bold text-slate-700">பெறுநர் (To):</span>
                                            <div className="font-black text-slate-900 text-sm">
                                                {parcel.adjacent_neighbors?.[0]?.owner_name || 'திரு. ஏ. செல்வம் (A. Selvam)'}
                                            </div>
                                            <div className="text-slate-600">
                                                புல எண்: {parcel.adjacent_neighbors?.[0]?.survey_number || '141/2'}, பட்டா எண்: {parcel.adjacent_neighbors?.[0]?.patta_number || '340'}, {parcel.village_name || 'Kannankurichi'}.
                                            </div>
                                        </div>

                                        <div className="bg-slate-100 p-3 border border-slate-300 text-xs leading-relaxed text-slate-800 rounded">
                                            தாங்கள் {parcel.village_ta || 'சேலம்'} கிராமத்தில் அமைந்துள்ள அரசு {parcel.classification === 'Waterbody' ? 'நீர்நிலை புறம்போக்கு' : 'புறம்போக்கு'} நிலமான 
                                            <strong> புல எண் {parcel.survey_number}/{parcel.subdivision || '1A'}</strong> இல் சுமார் <strong>{parcel.occupied_extent || '2,400 சதுர அடி'}</strong> நிலப்பரப்பை 
                                            அத்துமீறி மதில்சுவர் அமைத்து ஆக்கிரமிப்பு செய்துள்ளதாக செயற்கைக்கோள் தரவு மற்றும் கிராம நிர்வாக அலுவலர் கள ஆய்வில் உறுதி செய்யப்பட்டுள்ளது.
                                        </div>

                                        <div className="font-bold text-red-700 text-xs">
                                            எனவே, இவ்வறிவிப்பு கிடைத்த 14 நாட்களுக்குள் மேற்படி ஆக்கிரமிப்பினை தாங்களாகவே அகற்றிக் கொள்ள உத்தரவிடப்படுகிறது. தவறினால் அரசு இயந்திரங்கள் மூலம் ஆக்கிரமிப்பு அகற்றப்பட்டு அதற்கான செலவுத் தொகை தங்களிடமிருந்து வசூலிக்கப்படும்.
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t-2 border-slate-900 font-sans">
                                        <div className="text-[10px] text-slate-600">
                                            தேதி: 11-10-2026 | இடம்: சேலம்
                                        </div>
                                        <div className="text-right">
                                            <div className="w-24 h-8 border border-dashed border-slate-400 flex items-center justify-center text-[9px] text-slate-400 font-bold uppercase mb-1">
                                                [ SIGNATURE ]
                                            </div>
                                            <span className="text-xs font-black text-slate-900 block">வட்டாட்சியர் (Tahsildar)</span>
                                            <span className="text-[9px] text-slate-600">{parcel.taluk_ta || 'சேலம் மேற்கு'} வட்டம், சேலம் மாவட்டம்.</span>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                </div>

                {/* ─── MODAL FOOTER ─── */}
                <div className="bg-white px-6 py-3.5 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-mono">
                        GEOMMAND Cadastral Intelligence Engine • Salem District Command
                    </span>
                    <button
                        onClick={onClose}
                        className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-5 py-2 rounded text-xs transition shadow-sm"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
