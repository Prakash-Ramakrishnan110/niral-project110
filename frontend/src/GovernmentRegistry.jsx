import React, { useState, useEffect, useMemo } from 'react';
import {
    Landmark, ShieldCheck, MapPin, Search, Filter, Download,
    ArrowRight, AlertTriangle, FileText, RefreshCcw, ChevronDown,
    CheckCircle2, XCircle, AlertCircle, Truck, Eye, Globe, Navigation
} from 'lucide-react';

const API_BASE = 'http://localhost:8000/api';

// ─── Shared Badge ─────────────────────────────────────────────────────────────
const Badge = ({ children, variant = 'info', className = '' }) => {
    const styles = {
        info:    'bg-blue-100 text-blue-700 border-blue-200',
        success: 'bg-green-100 text-green-700 border-green-200',
        danger:  'bg-red-100 text-red-700 border-red-200',
        warning: 'bg-orange-100 text-orange-700 border-orange-200',
        roadside:'bg-amber-100 text-amber-800 border-amber-300',
        forest:  'bg-emerald-100 text-emerald-700 border-emerald-200',
        water:   'bg-sky-100 text-sky-700 border-sky-200',
    };
    return (
        <span className={`px-2 py-0.5 rounded-none border text-[8px] font-black uppercase tracking-widest ${styles[variant] || styles.info} ${className}`}>
            {children}
        </span>
    );
};

// ─── Classification config ────────────────────────────────────────────────────
const CLASS_CONFIG = {
    'Government': { badge: 'success', icon: '🏛️',  color: 'border-green-500'  },
    'Roadside':   { badge: 'roadside', icon: '🛣️', color: 'border-amber-500'  },
    'Waterbody':  { badge: 'water',   icon: '💧',  color: 'border-sky-500'    },
    'Forest':     { badge: 'forest',  icon: '🌲',  color: 'border-emerald-500'},
    'Temple':     { badge: 'info',    icon: '🛕',  color: 'border-purple-500' },
    'Private':    { badge: 'info',    icon: '🏠',  color: 'border-slate-400'  },
};

const ALL_CLASSIFICATIONS = ['All', 'Government', 'Roadside', 'Waterbody', 'Forest', 'Temple', 'Private'];

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, accent = 'blue', icon: Icon }) => {
    const accents = {
        blue:   'border-blue-600 bg-blue-600',
        red:    'border-red-600 bg-red-600',
        green:  'border-green-600 bg-green-600',
        amber:  'border-amber-500 bg-amber-500',
    };
    return (
        <div className={`bg-white border border-slate-200 border-l-4 ${accents[accent].split(' ')[0]} p-5 shadow-sm`}>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                    <p className="text-2xl font-black text-slate-900">{value}</p>
                    {sub && <p className="text-[9px] text-slate-500 font-bold mt-1 uppercase">{sub}</p>}
                </div>
                {Icon && (
                    <div className={`p-2 rounded-none text-white ${accents[accent].split(' ')[1]}`}>
                        <Icon size={18} />
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── Main Component ────────────────────────────────────────────────────────────
export const GovernmentLandRegistryView = ({ user }) => {
    const [parcels, setParcels] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [classFilter, setClassFilter] = useState('All');
    const [sortBy, setSortBy] = useState('survey_number');
    const [selectedParcel, setSelectedParcel] = useState(null);

    // Fetch parcels and alerts
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const hosts = ['http://localhost:8000', 'http://10.116.75.33:8000', 'http://10.0.2.2:8000'];
                let parcelData = null, alertData = null;
                for (const host of hosts) {
                    try {
                        const [pRes, aRes] = await Promise.all([
                            fetch(`${host}/api/parcels/`),
                            fetch(`${host}/api/alerts/`)
                        ]);
                        if (pRes.ok) {
                            parcelData = await pRes.json();
                            alertData = await aRes.json();
                            break;
                        }
                    } catch (e) { /* try next */ }
                }

                if (parcelData) {
                    const features = parcelData.features || (Array.isArray(parcelData) ? parcelData : []);
                    const parsed = features.map(f => {
                        const p = f.properties || f;
                        return {
                            id: f.id || p.id,
                            survey_number: p.survey_number || '—',
                            subdivision: p.subdivision || '',
                            patta_number: p.patta_number || '—',
                            owner_name: p.owner_name || 'Government of Tamil Nadu',
                            classification: p.classification || 'Government',
                            village_code: p.village_code || '—',
                            last_updated: p.last_updated || null,
                            taluk: p.taluk || '—',
                            district: p.district || '—',
                        };
                    });
                    setParcels(parsed);
                }
                if (alertData) {
                    const aFeatures = alertData.features || (Array.isArray(alertData) ? alertData : []);
                    setAlerts(aFeatures.map(f => ({ ...(f.properties || f), id: f.id || f.properties?.id })));
                }
            } catch (e) {
                console.error('Registry fetch error:', e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // ─── Jurisdictional Filter Logic ──────────────────────────────────────────
    const jurisdictionalParcels = useMemo(() => {
        if (!user || !user.jurisdiction || user.jurisdiction.level === 'STATE') return parcels;

        const { level, value } = user.jurisdiction;
        return parcels.filter(p => {
            if (level === 'DISTRICT') return p.district === value;
            if (level === 'TALUK') return p.taluk === value;
            if (level === 'VILLAGE') return p.village_code === value;
            return true;
        });
    }, [parcels, user]);

    const jurisdictionalAlerts = useMemo(() => {
        const parcelIds = new Set(jurisdictionalParcels.map(p => p.id));
        return alerts.filter(a => parcelIds.has(a.parcel));
    }, [alerts, jurisdictionalParcels]);

    // Derived stats
    const stats = useMemo(() => {
        const govtParcels = jurisdictionalParcels.filter(p => p.classification !== 'Private');
        const roadsideParcels = jurisdictionalParcels.filter(p => p.classification === 'Roadside');
        const activeAlertParcelIds = new Set(
            jurisdictionalAlerts.filter(a => a.status !== 'Resolved' && a.status !== 'RESOLVED').map(a => a.parcel)
        );
        const encroached = jurisdictionalParcels.filter(p => activeAlertParcelIds.has(p.id));
        return {
            total: govtParcels.length,
            roadside: roadsideParcels.length,
            encroached: encroached.length,
            safe: govtParcels.length - encroached.length,
        };
    }, [jurisdictionalParcels, jurisdictionalAlerts]);

    // Active alert lookup
    const alertsByParcel = useMemo(() => {
        const map = {};
        jurisdictionalAlerts.forEach(a => {
            if (!map[a.parcel]) map[a.parcel] = [];
            map[a.parcel].push(a);
        });
        return map;
    }, [jurisdictionalAlerts]);

    // Filtered & searched parcels
    const filtered = useMemo(() => {
        return jurisdictionalParcels
            .filter(p => classFilter === 'All' || p.classification === classFilter)
            .filter(p => {
                if (!search) return true;
                const q = search.toLowerCase();
                return (
                    p.survey_number?.toLowerCase().includes(q) ||
                    p.owner_name?.toLowerCase().includes(q) ||
                    p.village_code?.toLowerCase().includes(q) ||
                    p.patta_number?.toLowerCase().includes(q)
                );
            })
            .sort((a, b) => (a[sortBy] || '').toString().localeCompare((b[sortBy] || '').toString()));
    }, [jurisdictionalParcels, classFilter, search, sortBy]);

    const getAlertStatus = (parcel) => {
        const parcelAlerts = alertsByParcel[parcel.id] || [];
        const active = parcelAlerts.filter(a => a.status !== 'Resolved' && a.status !== 'RESOLVED');
        if (active.length > 0) return { variant: 'danger', label: `⚠ ${active.length} Active Alert${active.length > 1 ? 's' : ''}` };
        if (parcelAlerts.length > 0) return { variant: 'success', label: '✓ Resolved' };
        return { variant: 'success', label: 'Secure' };
    };

    const handleExportCSV = () => {
        const header = 'Survey No,Patta No,Owner,Classification,Village,Status';
        const rows = filtered.map(p => {
            const s = getAlertStatus(p);
            return `${p.survey_number},${p.patta_number},${p.owner_name},${p.classification},${p.village_code},${s.label}`;
        });
        const csv = [header, ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `land_registry_${user?.jurisdiction?.value || 'all'}.csv`;
        a.click();
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            {/* Header */}
            <div className="bg-white p-8 border border-slate-200 border-l-4 border-blue-600 shadow-sm relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-blue-600 p-2 rounded-none text-white shadow-sm"><Landmark size={24} /></div>
                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Official Government Land Registry</h2>
                        </div>
                        <div className="flex items-center gap-2">
                            <p className="text-slate-600 text-xs font-bold uppercase tracking-widest">
                                Jurisdiction: <span className="text-blue-700 bg-blue-50 px-2 py-0.5 border border-blue-200">{user?.jurisdiction?.level || 'STATE'} - {user?.jurisdiction?.value || 'All'}</span>
                            </p>
                            <Badge variant="info" className="ml-2 animate-pulse">Live Sync Active</Badge>
                        </div>
                    </div>
                    <div className="flex gap-4 flex-wrap">
                        <div className="bg-slate-50 border border-slate-200 p-4 rounded-none min-w-[120px]">
                            <p className="text-blue-600 text-[8px] font-black uppercase mb-1">Total Protected</p>
                            <p className="text-2xl font-black text-slate-900">{loading ? '...' : stats.total}</p>
                        </div>
                        <div className="bg-rose-50 border border-rose-200 p-4 rounded-none min-w-[120px]">
                            <p className="text-rose-700 text-[8px] font-black uppercase mb-1">Active Threats</p>
                            <p className="text-2xl font-black text-rose-700">{loading ? '...' : stats.encroached}</p>
                        </div>
                        <div className="bg-amber-50 border border-amber-200 p-4 rounded-none min-w-[120px]">
                            <p className="text-amber-700 text-[8px] font-black uppercase mb-1">Roadside Parcels</p>
                            <p className="text-2xl font-black text-amber-700">{loading ? '...' : stats.roadside}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Total Parcels" value={stats.total} sub={`${user?.jurisdiction?.level} Scope`} accent="blue" icon={FileText} />
                <StatCard label="Secure" value={stats.safe} sub="No active alerts" accent="green" icon={CheckCircle2} />
                <StatCard label="Under Threat" value={stats.encroached} sub="Active encroachment alerts" accent="red" icon={AlertTriangle} />
                <StatCard label="Roadside" value={stats.roadside} sub="Collector escalation priority" accent="amber" icon={Truck} />
            </div>

            <div className="grid grid-cols-12 gap-6">
                {/* Main Table Panel */}
                <div className="col-span-12 lg:col-span-9 space-y-4">
                    {/* Search & Filter Bar */}
                    <div className="bg-white border border-slate-200 p-4 flex flex-col md:flex-row gap-3 items-center shadow-sm">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder={`Search in ${user?.jurisdiction?.value}...`}
                                className="w-full bg-slate-50 border border-slate-200 pl-9 pr-4 py-2.5 text-[11px] font-bold uppercase tracking-tight focus:bg-white focus:border-blue-500 transition-all outline-none"
                            />
                        </div>
                        <select
                            value={sortBy}
                            onChange={e => setSortBy(e.target.value)}
                            className="bg-white border border-slate-200 px-3 py-2.5 text-[10px] font-black uppercase tracking-tight outline-none cursor-pointer"
                        >
                            <option value="survey_number">Sort: Survey No</option>
                            <option value="classification">Sort: Classification</option>
                            <option value="owner_name">Sort: Owner</option>
                            <option value="village_code">Sort: Village</option>
                        </select>
                        <button
                            onClick={handleExportCSV}
                            className="px-4 py-2.5 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 flex items-center gap-2 shadow-md transition-all whitespace-nowrap"
                        >
                            <Download size={12} /> Export CSV
                        </button>
                    </div>

                    {/* Classification Filter Tabs */}
                    <div className="flex gap-1 flex-wrap">
                        {ALL_CLASSIFICATIONS.map(cls => (
                            <button
                                key={cls}
                                onClick={() => setClassFilter(cls)}
                                className={`px-4 py-2 text-[9px] font-black uppercase tracking-widest transition-all border ${
                                    classFilter === cls
                                        ? 'bg-slate-900 text-white border-slate-900'
                                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                                }`}
                            >
                                {cls === 'All' ? 'All Records' : `${CLASS_CONFIG[cls]?.icon || ''} ${cls}`}
                            </button>
                        ))}
                    </div>

                    {/* Table */}
                    <div className="bg-white border border-slate-200 shadow-sm overflow-hidden">
                        {loading ? (
                            <div className="flex items-center justify-center py-16 gap-3">
                                <RefreshCcw size={18} className="animate-spin text-blue-600" />
                                <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">Loading Registry Data...</span>
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="text-center py-16 px-4">
                                <div className="w-12 h-12 bg-slate-50 rounded-none flex items-center justify-center mx-auto mb-4 text-slate-300 border border-slate-100">
                                    <Globe size={24} />
                                </div>
                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">No records found for this jurisdiction</p>
                                <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Scope: {user?.jurisdiction?.value}</p>
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b-2 border-slate-200">
                                        <th className="px-5 py-3 text-[9px] font-black text-slate-500 uppercase tracking-widest">Survey / Patta</th>
                                        <th className="px-5 py-3 text-[9px] font-black text-slate-500 uppercase tracking-widest">Owner</th>
                                        <th className="px-5 py-3 text-[9px] font-black text-slate-500 uppercase tracking-widest">Village</th>
                                        <th className="px-5 py-3 text-[9px] font-black text-slate-500 uppercase tracking-widest">Classification</th>
                                        <th className="px-5 py-3 text-[9px] font-black text-slate-500 uppercase tracking-widest text-right">Alert Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filtered.map(parcel => {
                                        const alertStatus = getAlertStatus(parcel);
                                        const cls = CLASS_CONFIG[parcel.classification] || CLASS_CONFIG['Private'];
                                        const isSelected = selectedParcel?.id === parcel.id;
                                        return (
                                            <tr
                                                key={parcel.id}
                                                onClick={() => setSelectedParcel(isSelected ? null : parcel)}
                                                className={`transition-all cursor-pointer group ${isSelected ? 'bg-blue-50 border-l-4 border-blue-600' : 'hover:bg-slate-50/70'}`}
                                            >
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-1.5 bg-slate-100 border-l-2 ${cls.color} group-hover:bg-blue-100 transition-all`}>
                                                            <FileText size={12} className="text-slate-500" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[11px] font-black text-slate-900">{parcel.survey_number}{parcel.subdivision ? `/${parcel.subdivision}` : ''}</p>
                                                            <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">Patta: {parcel.patta_number}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <p className="text-[11px] font-bold text-slate-800">{parcel.owner_name}</p>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <p className="text-[10px] font-bold text-slate-600 uppercase">{parcel.village_code}</p>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <Badge variant={cls.badge}>
                                                        {cls.icon} {parcel.classification}
                                                    </Badge>
                                                </td>
                                                <td className="px-5 py-4 text-right">
                                                    <Badge variant={alertStatus.variant}>{alertStatus.label}</Badge>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-right">
                        Showing {filtered.length} records in {user?.jurisdiction?.value} jurisdiction
                    </p>
                </div>

                {/* Sidebar */}
                <div className="col-span-12 lg:col-span-3 space-y-6">
                    {/* Selected Parcel Detail */}
                    {selectedParcel ? (
                        <div className="bg-white border border-slate-200 p-5 shadow-sm">
                            <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Eye size={14} className="text-blue-600" /> Parcel Detail
                            </h3>
                            <div className={`border-l-4 ${CLASS_CONFIG[selectedParcel.classification]?.color || 'border-slate-300'} pl-3 mb-4`}>
                                <p className="text-lg font-black text-slate-900">{selectedParcel.survey_number}</p>
                                <p className="text-[9px] text-slate-400 font-black uppercase">{selectedParcel.classification}</p>
                            </div>
                            {[
                                { label: 'Patta No', value: selectedParcel.patta_number },
                                { label: 'Owner', value: selectedParcel.owner_name },
                                { label: 'Village Code', value: selectedParcel.village_code },
                                { label: 'Taluk', value: selectedParcel.taluk },
                            ].map(row => (
                                <div key={row.label} className="flex justify-between items-center py-2 border-b border-slate-100">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{row.label}</span>
                                    <span className="text-[10px] font-bold text-slate-800">{row.value || '—'}</span>
                                </div>
                            ))}
                            <div className="mt-4 space-y-2">
                                {(alertsByParcel[selectedParcel.id] || []).length === 0 ? (
                                    <div className="p-3 bg-green-50 border border-green-100 text-[9px] font-black text-green-700 uppercase tracking-widest flex items-center gap-2">
                                        <CheckCircle2 size={12} /> No alerts recorded
                                    </div>
                                ) : (
                                    (alertsByParcel[selectedParcel.id] || []).map(a => (
                                        <div key={a.id} className={`p-3 border text-[9px] font-bold uppercase tracking-wide ${a.status === 'Resolved' || a.status === 'RESOLVED' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                                            {a.alert_type} — {a.status}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white border border-slate-200 p-5 shadow-sm">
                            <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <ShieldCheck size={14} className="text-blue-600" /> Protection Protocol
                            </h3>
                            <div className="space-y-3">
                                <div className="p-3 bg-slate-50 border-l-4 border-blue-600">
                                    <p className="text-[10px] font-black text-slate-800 uppercase tracking-tight">Scope Monitoring</p>
                                    <p className="text-[9px] text-slate-500 font-bold mt-1 leading-relaxed">You are currently monitoring {user?.jurisdiction?.value} at the {user?.jurisdiction?.level} level.</p>
                                </div>
                                <div className="p-3 bg-slate-50 border-l-4 border-red-600">
                                    <p className="text-[10px] font-black text-slate-800 uppercase tracking-tight">Auto-Enforcement</p>
                                    <p className="text-[9px] text-slate-500 font-bold mt-1 leading-relaxed">System identifies threats specifically within your jurisdiction only.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Navigation Shortcut */}
                    <div className="bg-white border border-slate-200 border-l-4 border-blue-600 p-6 text-slate-900 shadow-sm">
                        <h4 className="text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2"><Navigation size={14} className="text-blue-600" /> Operational Jump</h4>
                        <div className="space-y-2">
                            <button className="w-full py-2.5 bg-slate-50 border border-slate-200 text-slate-700 text-[9px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center justify-between px-3">
                                View District Map <ArrowRight size={12} />
                            </button>
                            <button className="w-full py-2.5 bg-slate-50 border border-slate-200 text-slate-700 text-[9px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center justify-between px-3">
                                AI Hub Monitor <ArrowRight size={12} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
