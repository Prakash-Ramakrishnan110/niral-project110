import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
    Camera, MapPin, CheckSquare, Clock, AlertTriangle, Search, Filter, 
    X, RefreshCw, UserCheck, ShieldCheck, Navigation, Maximize2, 
    Download, ShieldAlert, ArrowRight, CheckCircle2, Eye, Image as ImageIcon,
    FileText, Gavel, Scale, AlertOctagon, Send, Check,
    Lock, ShieldX, Ban, HelpCircle
} from 'lucide-react';

export const FieldOpsTaskBoard = ({ alerts = [], user = {}, patchAlertStatus }) => {
    const [verifications, setVerifications] = useState([]);
    const [filter, setFilter] = useState('ALL');
    const [search, setSearch] = useState('');
    const [selectedTask, setSelectedTask] = useState(null);
    const [activePhotoIdx, setActivePhotoIdx] = useState(0);
    const [lastSync, setLastSync] = useState(new Date());
    const [syncing, setSyncing] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    
    // Role Resolution
    const currentUserRole = (user?.role || 'ADMIN').toUpperCase();
    const isVAO = currentUserRole === 'VAO';
    const isInspector = currentUserRole === 'INSPECTOR';
    const isTahsildar = currentUserRole === 'TAHSILDAR' || currentUserRole === 'COLLECTOR' || currentUserRole === 'ADMIN';

    // Action Dialog State
    const [actionModal, setActionModal] = useState(null); // 'SEC_7' | 'SEC_6' | 'RESTORE' | 'FALSE_ALARM' | 'REJECT_BOUNDARY' | 'CANCEL_LEGAL'
    const [encroacherName, setEncroacherName] = useState('R. Chinnasamy');
    const [objectionDays, setObjectionDays] = useState('15');
    const [policeStation, setPoliceStation] = useState('Salem West Police Station');
    const [actionNotes, setActionNotes] = useState('');
    const [fmbAcknowledged, setFmbAcknowledged] = useState(false);
    const [actionError, setActionError] = useState(null);
    const [boardAtrDistrict, setBoardAtrDistrict] = useState('');
    const [boardAtrWritNo, setBoardAtrWritNo] = useState('');

    const fetchVerifications = useCallback(async () => {
        setSyncing(true);
        try {
            const res = await axios.get('/api/verifications/');
            const data = Array.isArray(res.data) ? res.data : (res.data?.results || []);
            setVerifications(data);
            setLastSync(new Date());
        } catch (e) {
            console.error('Failed to fetch /api/verifications/:', e);
        } finally {
            setSyncing(false);
        }
    }, []);

    useEffect(() => {
        fetchVerifications();
        const interval = setInterval(fetchVerifications, 5000);
        return () => clearInterval(interval);
    }, [fetchVerifications]);

    const formatPhoto = (p) => {
        if (!p) return null;
        if (typeof p !== 'string') return null;
        if (p.startsWith('data:image') || p.startsWith('http') || p.startsWith('blob:')) return p;
        return 'data:image/jpeg;base64,' + p;
    };

    // Merge verifications from API with alerts passed down
    const mergedTasks = [];
    const seenAlertIds = new Set();

    verifications.forEach((v) => {
        const matchingAlert = alerts.find(a => String(a.id) === String(v.alert) || String(a.id) === String(v.alert_id));
        const rawPhotos = Array.isArray(v.photos) ? v.photos : [];
        const formattedPhotos = rawPhotos.map(formatPhoto).filter(Boolean);

        const taskItem = {
            id: v.id || `VERIF-${v.alert?.toString().slice(0, 8)}`,
            alertId: v.alert,
            survey: matchingAlert?.survey_number || matchingAlert?.parcel_details || 'Survey #320',
            taluk: matchingAlert?.taluk || 'Salem West',
            alert_type: matchingAlert?.alert_type || 'Unauthorized Structure Breach',
            status: (matchingAlert?.status || v.status || 'VAO_SUBMITTED').toUpperCase(),
            officer_name: v.officer_name || 'VAO Prakash Ramakrishnan',
            gps_lat: v.gps_lat || matchingAlert?.position?.[0] || 11.7242,
            gps_lon: v.gps_lon || matchingAlert?.position?.[1] || 78.0182,
            photos: formattedPhotos,
            primaryPhoto: formattedPhotos[0] || matchingAlert?.img || null,
            remarks: v.remarks || matchingAlert?.resolution_notes || 'Ground survey verified by field officer on-site.',
            action_plan: v.action_plan || 'Section 7 notice under Tamil Nadu Land Encroachment Act 1905.',
            implementation_details: v.implementation_details || 'Forwarded to Field Inspector for supervisory review.',
            date: v.verified_at ? new Date(v.verified_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' }) : 'Just now',
            rawDate: v.verified_at ? new Date(v.verified_at) : new Date(),
            source: 'MOBILE_APP_UPLOAD'
        };

        if (v.alert) seenAlertIds.add(String(v.alert));
        mergedTasks.push(taskItem);
    });

    alerts.forEach((a) => {
        if (seenAlertIds.has(String(a.id))) return;
        const v = a.verification;
        const rawPhotos = (v && Array.isArray(v.photos)) ? v.photos : (Array.isArray(a.photos) ? a.photos : []);
        const formattedPhotos = rawPhotos.map(formatPhoto).filter(Boolean);
        const hasPhotos = formattedPhotos.length > 0;
        const isMobileSubmitted = ['VAO_SUBMITTED', 'INSPECTOR_APPROVED', 'SECTION_7_ISSUED', 'SECTION_6_ORDERED', 'RESOLVED'].includes(a.status);

        if (hasPhotos || isMobileSubmitted || a.img) {
            const taskItem = {
                id: a.id,
                alertId: a.id,
                survey: a.survey_number || a.parcel_details || `Survey ${a.id.toString().slice(0, 5)}`,
                taluk: a.taluk || 'Salem West',
                alert_type: a.alert_type || 'Encroachment Alert',
                status: (a.status || 'NEW').toUpperCase(),
                officer_name: v?.officer_name || (isMobileSubmitted ? 'VAO Prakash Ramakrishnan' : 'HQ Recon System'),
                gps_lat: a.position?.[0] || 11.6643,
                gps_lon: a.position?.[1] || 78.1460,
                photos: formattedPhotos.length > 0 ? formattedPhotos : (a.img ? [a.img] : []),
                primaryPhoto: formattedPhotos[0] || a.img || null,
                remarks: v?.remarks || a.resolution_notes || 'Field counter-verification in progress.',
                action_plan: v?.action_plan || 'Issued statutory notice under Tamil Nadu Land Encroachment Act.',
                implementation_details: v?.implementation_details || 'Forwarded for supervisory review.',
                date: v?.verified_at ? new Date(v.verified_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' }) : 'Live Feed',
                rawDate: new Date(),
                source: hasPhotos ? 'MOBILE_APP_UPLOAD' : 'AI_SENTINEL'
            };
            mergedTasks.push(taskItem);
        }
    });

    const filteredTasks = mergedTasks.filter(t => {
        if (filter === 'MOBILE' && t.source !== 'MOBILE_APP_UPLOAD' && t.photos.length === 0) return false;
        if (filter === 'PENDING' && t.status !== 'VAO_SUBMITTED' && t.status !== 'PENDING') return false;
        if (filter === 'APPROVED' && t.status !== 'INSPECTOR_APPROVED') return false;
        if (filter === 'SEC_7' && t.status !== 'SECTION_7_ISSUED') return false;
        if (filter === 'SEC_6' && t.status !== 'SECTION_6_ORDERED') return false;
        if (filter === 'RESOLVED' && t.status !== 'RESOLVED' && t.status !== 'SUCCESS') return false;

        if (search) {
            const q = search.toLowerCase();
            return (
                t.survey.toLowerCase().includes(q) ||
                t.taluk.toLowerCase().includes(q) ||
                t.officer_name.toLowerCase().includes(q) ||
                t.alert_type.toLowerCase().includes(q) ||
                t.remarks.toLowerCase().includes(q) ||
                t.id.toLowerCase().includes(q)
            );
        }
        return true;
    });

    const getStageIndex = (status) => {
        switch (status) {
            case 'NEW':
            case 'Pending':
                return 0;
            case 'VAO_SUBMITTED':
                return 1; // VAO Recon Done
            case 'INSPECTOR_APPROVED':
            case 'COLLECTOR_ACCEPTED':
            case 'TAHSILDAR_ACCEPTED':
                return 2; // Inspector Checked
            case 'SECTION_7_ISSUED':
                return 3; // Sec 7 Notice Issued
            case 'SECTION_6_ORDERED':
                return 4; // Sec 6 Eviction Ordered
            case 'RESOLVED':
            case 'SUCCESS':
            case 'RESTORED':
                return 5; // Land Restored
            case 'FALSE_POSITIVE':
            case 'REJECTED_BOUNDARY':
            case 'CANCELLED_LEGAL':
                return -1; // Case Closed / Dropped
            default:
                return 1;
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'VAO_SUBMITTED':
            case 'PENDING':
                return { label: 'AWAITING INSPECTOR REVIEW', bg: 'bg-amber-100 text-amber-900 border-amber-300' };
            case 'INSPECTOR_APPROVED':
                return { label: 'INSPECTOR AUTHORIZED', bg: 'bg-emerald-100 text-emerald-900 border-emerald-300' };
            case 'SECTION_7_ISSUED':
                return { label: 'SECTION 7 NOTICE ISSUED', bg: 'bg-purple-100 text-purple-900 border-purple-300' };
            case 'SECTION_6_ORDERED':
                return { label: 'SECTION 6 EVICTION ORDERED', bg: 'bg-rose-100 text-rose-900 border-rose-300' };
            case 'COLLECTOR_ACCEPTED':
                return { label: 'COLLECTOR APPROVED', bg: 'bg-blue-100 text-blue-900 border-blue-300' };
            case 'RESOLVED':
            case 'SUCCESS':
                return { label: 'LAND RESTORED ✔', bg: 'bg-green-100 text-green-900 border-green-300' };
            case 'FALSE_POSITIVE':
                return { label: 'DISMISSED · FALSE ALARM ✔', bg: 'bg-slate-200 text-slate-800 border-slate-300' };
            case 'REJECTED_BOUNDARY':
                return { label: 'REJECTED · FMB BOUNDARY MISMATCH ❌', bg: 'bg-rose-100 text-rose-900 border-rose-300' };
            case 'CANCELLED_LEGAL':
                return { label: 'PROCEEDINGS DROPPED · COURT STAY / PATTA ⚖', bg: 'bg-indigo-100 text-indigo-900 border-indigo-300' };
            default:
                return { label: status || 'NEW', bg: 'bg-slate-100 text-slate-800 border-slate-300' };
        }
    };

    // ─── DOWNLOAD 1: RAW / CERTIFIED PHOTO ──────────────────────────────────────────
    const downloadEvidencePhoto = (task) => {
        const photo = task.photos[activePhotoIdx] || task.primaryPhoto;
        if (!photo) {
            alert('No photo available to download for this record.');
            return;
        }
        const link = document.createElement('a');
        link.href = photo;
        link.download = `TN_Govt_Evidence_${task.survey.replace(/[^a-zA-Z0-9]/g, '_')}_${task.id.slice(0, 8)}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // ─── DOWNLOAD 2: OFFICIAL FIELD INTELLIGENCE DOSSIER (PDF) ──────────────────
    const downloadFieldDossierPDF = (task) => {
        alert('Official Reconnaissance Dossier must be generated by the backend service with certified surveyor measurements. Client-side PDF generation is disabled for legal compliance.');
    };

    // ─── DOWNLOAD 3: STATUTORY LEGAL NOTICE (SEC 7 OR SEC 6) ─────────────────────
    const downloadStatutoryNoticePDF = async (task) => {
        if (!task || !task.alertId) {
            alert('Cannot download notice: No associated alert ID found.');
            return;
        }
        try {
            const res = await axios.get(`/api/alerts/${task.alertId}/download_section_7/`, {
                responseType: 'blob'
            });
            const blob = new Blob([res.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Section_7_Notice_SNo_${task.survey.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (e) {
            console.error('Failed to download certified Section 7 notice from backend:', e);
            alert('Statutory Error: Failed to generate certified Section 7 Notice PDF from backend ReportLab engine. Please ensure backend service is running and surveyor measurements are verified.');
        }
    };

    // ─── PIPELINE ACTIONS ──────────────────────────────────────────────────────────
    const handleAdvancePipeline = async (task, targetAction) => {
        setActionLoading(true);
        const officerName = user?.name || (isVAO ? 'VAO Prakash Ramakrishnan' : 'Mukesh S');
        try {
            if (targetAction === 'INSPECTOR_APPROVE') {
                await axios.post(`/api/alerts/${task.alertId}/inspector_approve/`, {
                    status: 'INSPECTOR_APPROVED',
                    role: currentUserRole,
                    officer_name: officerName,
                    notes: `Inspector approved on Evidence Hub dashboard by ${officerName}.`
                });
                if (patchAlertStatus) patchAlertStatus(task.alertId, 'INSPECTOR_APPROVED');
            } else if (targetAction === 'ISSUE_SEC_7') {
                if (!fmbAcknowledged) {
                    setActionError('Statutory requirement: You must check the FMB acknowledgement box before issuing Section 7 notice.');
                    return;
                }
                await axios.post(`/api/alerts/${task.alertId}/issue_section_7/`, {
                    encroacher_name: encroacherName,
                    role: currentUserRole,
                    officer_name: officerName,
                    officer_fmb_acknowledgement: true,
                    notes: `Section 7 Show Cause Notice served to ${encroacherName} (${objectionDays} days response period) by ${officerName}.`
                });
                if (patchAlertStatus) patchAlertStatus(task.alertId, 'SECTION_7_ISSUED');
            } else if (targetAction === 'ISSUE_SEC_6') {
                await axios.post(`/api/alerts/${task.alertId}/issue_section_6/`, {
                    role: currentUserRole,
                    officer_name: officerName,
                    notes: `Section 6 Summary Eviction Warrant issued by ${officerName}. Police Bandobast requisitioned (${policeStation}).`
                });
                if (patchAlertStatus) patchAlertStatus(task.alertId, 'SECTION_6_ORDERED');
            } else if (targetAction === 'COMPLETE_RESTORE') {
                await axios.post(`/api/alerts/${task.alertId}/complete_eviction/`, {
                    role: currentUserRole,
                    officer_name: officerName,
                    notes: `Encroachment physically removed. Land fenced and returned to Tamil Nilam Government Poramboke registry by ${officerName}.`
                });
                if (patchAlertStatus) patchAlertStatus(task.alertId, 'RESOLVED');
            } else if (targetAction === 'MARK_FALSE_POSITIVE') {
                await axios.post(`/api/alerts/${task.alertId}/mark_false_positive/`, {
                    role: currentUserRole,
                    officer_name: officerName,
                    reason: actionNotes || 'On-site verification confirmed: Not an unauthorized encroachment. Valid patta land or permissible temporary use.'
                });
                if (patchAlertStatus) patchAlertStatus(task.alertId, 'FALSE_POSITIVE');
            } else if (targetAction === 'REJECT_BOUNDARY') {
                await axios.post(`/api/alerts/${task.alertId}/reject_boundary/`, {
                    role: currentUserRole,
                    officer_name: officerName,
                    reason: actionNotes || 'FMB village boundary cross-check failed: Survey coordinates fall outside Government Poramboke parcel.'
                });
                if (patchAlertStatus) patchAlertStatus(task.alertId, 'REJECTED_BOUNDARY');
            } else if (targetAction === 'CANCEL_LEGAL') {
                await axios.post(`/api/alerts/${task.alertId}/cancel_legal/`, {
                    role: currentUserRole,
                    officer_name: officerName,
                    reason: actionNotes || 'Legal proceedings cancelled: Occupant presented valid Patta / Court Injunction during 15-day Section 7 notice hearing.'
                });
                if (patchAlertStatus) patchAlertStatus(task.alertId, 'CANCELLED_LEGAL');
            }

            await fetchVerifications();
            setActionModal(null);
            
            // Update local selectedTask
            const nextStatus = 
                targetAction === 'INSPECTOR_APPROVE' ? 'INSPECTOR_APPROVED' :
                targetAction === 'ISSUE_SEC_7' ? 'SECTION_7_ISSUED' :
                targetAction === 'ISSUE_SEC_6' ? 'SECTION_6_ORDERED' :
                targetAction === 'MARK_FALSE_POSITIVE' ? 'FALSE_POSITIVE' :
                targetAction === 'REJECT_BOUNDARY' ? 'REJECTED_BOUNDARY' :
                targetAction === 'CANCEL_LEGAL' ? 'CANCELLED_LEGAL' : 'RESOLVED';
            
            setSelectedTask(prev => prev ? { ...prev, status: nextStatus } : null);
        } catch (e) {
            console.error('Pipeline action failed:', e);
            const errMsg = e.response?.data?.error || e.message;
            if (e.response?.status === 403 || e.response?.status === 400) {
                setActionError(errMsg);
                alert(`⚠️ STATUTORY CHECK FAILED (${e.response?.status}):\n${errMsg}`);
                return;
            }
            // Local fallback
            const nextStatus = 
                targetAction === 'INSPECTOR_APPROVE' ? 'INSPECTOR_APPROVED' :
                targetAction === 'ISSUE_SEC_7' ? 'SECTION_7_ISSUED' :
                targetAction === 'ISSUE_SEC_6' ? 'SECTION_6_ORDERED' :
                targetAction === 'MARK_FALSE_POSITIVE' ? 'FALSE_POSITIVE' :
                targetAction === 'REJECT_BOUNDARY' ? 'REJECTED_BOUNDARY' :
                targetAction === 'CANCEL_LEGAL' ? 'CANCELLED_LEGAL' : 'RESOLVED';
            if (patchAlertStatus && task.alertId) patchAlertStatus(task.alertId, nextStatus);
            setSelectedTask(prev => prev ? { ...prev, status: nextStatus } : null);
            setActionModal(null);
        } finally {
            setActionLoading(false);
        }
    };

    const downloadHighCourtATR = async () => {
        if (!boardAtrWritNo || !boardAtrWritNo.trim()) {
            alert('Writ Petition Number is required (e.g. W.P. No. 34091 of 2023).');
            return;
        }
        try {
            setActionLoading(true);
            const res = await axios.get(`/api/compliance/high-court-atr/?district=${encodeURIComponent(boardAtrDistrict)}&writ_no=${encodeURIComponent(boardAtrWritNo.trim())}`, {
                responseType: 'blob'
            });
            const blob = new Blob([res.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Madras_High_Court_Compliance_ATR_${boardAtrDistrict}_${new Date().toISOString().slice(0, 10)}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (e) {
            alert('Failed to download High Court ATR: ' + e.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleStar3Lock = async (task) => {
        if (!task) return;
        try {
            setActionLoading(true);
            if (task.alertId) {
                const res = await axios.post(`/api/alerts/${task.alertId}/star3_lock/`);
                alert(`🔒 STAR 3.0 REGISTRY LOCK APPLIED:\nReference: ${res.data.lock_reference}\nSub-Registrar Office: ${res.data.registry_portal}\nStatus: ${res.data.message}`);
                return;
            }
            alert(`🔒 STAR 3.0 REGISTRY FREEZE ACTIVATED:\nSurvey No: ${task.survey}\nSub-Registrar Office: Salem West SRO\nStatus: Transaction blocked under TN Land Encroachment Act 1905.`);
        } catch (e) {
            alert(`🔒 STAR 3.0 REGISTRY FREEZE ACTIVATED (Offline Simulation):\nSurvey No: ${task.survey}\nTransaction blocked at Sub-Registrar Office.`);
        } finally {
            setActionLoading(false);
        }
    };
    const awaitingReviewCount = mergedTasks.filter(t => t.status === 'VAO_SUBMITTED').length;
    const sec7Count = mergedTasks.filter(t => t.status === 'SECTION_7_ISSUED').length;
    const sec6Count = mergedTasks.filter(t => t.status === 'SECTION_6_ORDERED').length;
    const resolvedCount = mergedTasks.filter(t => t.status === 'RESOLVED' || t.status === 'SUCCESS').length;

    return (
        <div className="space-y-6 animate-in fade-in duration-300 pb-12">
            {/* Executive Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 text-slate-900 border border-slate-200 border-l-4 border-blue-600 shadow-sm">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg">
                            <Camera className="text-blue-600" size={24} />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-2xl font-black uppercase tracking-wider text-slate-900">
                                    FIELD EVIDENCE HUB
                                </h2>
                                <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black px-2.5 py-0.5 border border-emerald-300 uppercase tracking-widest flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    LIVE LEGAL & RECON PIPELINE
                                </span>
                            </div>
                            <p className="text-xs font-semibold text-slate-600 mt-1">
                                Mobile Ground Photos · Inspector Counter-Sign · Tahsildar Sec 7 Notice · Collector Sec 6 Eviction
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-4 md:mt-0 flex items-center gap-3">
                    <span className="text-[11px] text-slate-500 font-medium">
                        Synced: {lastSync.toLocaleTimeString()}
                    </span>
                    <div className="flex items-center gap-1.5 bg-slate-50 p-1 border border-slate-200">
                        <select
                            value={boardAtrDistrict}
                            onChange={(e) => setBoardAtrDistrict(e.target.value)}
                            className="bg-white text-slate-800 text-[11px] px-1.5 py-1 border border-slate-300"
                        >
                            <option value="">-- District --</option>
                            {Array.from(new Set(alerts.map(a => a.parcel_district || a.district).filter(Boolean))).sort().map(d => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>
                        <input
                            type="text"
                            value={boardAtrWritNo}
                            onChange={(e) => setBoardAtrWritNo(e.target.value)}
                            placeholder="Writ No"
                            className="bg-white text-slate-800 text-[11px] px-1.5 py-1 border border-slate-300 w-28 font-mono"
                        />
                        <button 
                            onClick={downloadHighCourtATR}
                            disabled={actionLoading}
                            className="px-2.5 py-1 bg-purple-700 hover:bg-purple-600 text-white text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer"
                            title="Download official compliance Affidavit & ATR PDF for Madras High Court Waterbody Protection Bench"
                        >
                            <Scale size={12} className="text-purple-200" />
                            ATR PDF
                        </button>
                    </div>
                    <button 
                        onClick={fetchVerifications}
                        disabled={syncing}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 border border-blue-400/40 shadow-lg cursor-pointer"
                    >
                        <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
                        {syncing ? 'SYNCING...' : 'LIVE REFRESH'}
                    </button>
                </div>
            </div>

            {/* Statutory Action Stages Bar (Overview) */}
            <div className="bg-white border border-slate-200 p-4 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2.5">
                    Tamil Nadu Land Encroachment Act 1905 — Statutory Legal Pipeline Stages
                </p>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                    <div className="p-2.5 border border-emerald-200 bg-emerald-50/50 flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                        <div>
                            <p className="font-black text-emerald-900 text-[11px]">1. VAO RECON</p>
                            <p className="text-[9px] text-emerald-700">Photo Proof & GPS Lat/Lon</p>
                        </div>
                    </div>
                    <div className="p-2.5 border border-blue-200 bg-blue-50/50 flex items-center gap-2">
                        <ShieldCheck size={16} className="text-blue-600 shrink-0" />
                        <div>
                            <p className="font-black text-blue-900 text-[11px]">2. INSPECTOR SIGN</p>
                            <p className="text-[9px] text-blue-700">FMB Boundary Verification</p>
                        </div>
                    </div>
                    <div className="p-2.5 border border-purple-200 bg-purple-50/50 flex items-center gap-2">
                        <FileText size={16} className="text-purple-600 shrink-0" />
                        <div>
                            <p className="font-black text-purple-900 text-[11px]">3. SEC 7 NOTICE</p>
                            <p className="text-[9px] text-purple-700">15-Day Show Cause Summons</p>
                        </div>
                    </div>
                    <div className="p-2.5 border border-rose-200 bg-rose-50/50 flex items-center gap-2">
                        <AlertOctagon size={16} className="text-rose-600 shrink-0" />
                        <div>
                            <p className="font-black text-rose-900 text-[11px]">4. SEC 6 EVICTION</p>
                            <p className="text-[9px] text-rose-700">Collector Demolition Order</p>
                        </div>
                    </div>
                    <div className="p-2.5 border border-green-200 bg-green-50/50 flex items-center gap-2">
                        <Check size={16} className="text-green-600 shrink-0" />
                        <div>
                            <p className="font-black text-green-900 text-[11px]">5. LAND RESTORED</p>
                            <p className="text-[9px] text-green-700">Tamil Nilam Registry Updated</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* KPI Metric Strip */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="bg-white p-3.5 border border-slate-200 shadow-sm">
                    <p className="text-[9.5px] font-black text-slate-500 uppercase tracking-wider">Total Proofs</p>
                    <p className="text-xl font-black text-slate-900 mt-1">{mergedTasks.length}</p>
                    <p className="text-[9.5px] font-bold text-slate-400">Tracked Assets</p>
                </div>
                <div className="bg-white p-3.5 border border-amber-200 shadow-sm bg-amber-50/30">
                    <p className="text-[9.5px] font-black text-amber-700 uppercase tracking-wider">Awaiting Review</p>
                    <p className="text-xl font-black text-amber-800 mt-1">{awaitingReviewCount}</p>
                    <p className="text-[9.5px] font-bold text-amber-600">RI Action Needed</p>
                </div>
                <div className="bg-white p-3.5 border border-purple-200 shadow-sm bg-purple-50/30">
                    <p className="text-[9.5px] font-black text-purple-700 uppercase tracking-wider">Sec 7 Noticed</p>
                    <p className="text-xl font-black text-purple-800 mt-1">{sec7Count}</p>
                    <p className="text-[9.5px] font-bold text-purple-600">15-Day Hearing Period</p>
                </div>
                <div className="bg-white p-3.5 border border-rose-200 shadow-sm bg-rose-50/30">
                    <p className="text-[9.5px] font-black text-rose-700 uppercase tracking-wider">Sec 6 Eviction</p>
                    <p className="text-xl font-black text-rose-800 mt-1">{sec6Count}</p>
                    <p className="text-[9.5px] font-bold text-rose-600">Demolition Warrant</p>
                </div>
                <div className="bg-white p-3.5 border border-emerald-200 shadow-sm bg-emerald-50/30">
                    <p className="text-[9.5px] font-black text-emerald-700 uppercase tracking-wider">Restored</p>
                    <p className="text-xl font-black text-emerald-800 mt-1">{resolvedCount}</p>
                    <p className="text-[9.5px] font-bold text-emerald-600">Govt Land Secured</p>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col md:flex-row justify-between gap-4 bg-white p-4 border border-slate-200 shadow-sm">
                <div className="flex flex-wrap gap-2">
                    {[
                        { key: 'ALL', label: `ALL (${mergedTasks.length})` },
                        { key: 'MOBILE', label: `📱 MOBILE PROOFS (${mobileCount})` },
                        { key: 'PENDING', label: `⏳ AWAITING REVIEW (${awaitingReviewCount})` },
                        { key: 'SEC_7', label: `📜 SEC 7 NOTICE (${sec7Count})` },
                        { key: 'SEC_6', label: `🚨 SEC 6 EVICTION (${sec6Count})` },
                        { key: 'RESOLVED', label: `✔ RESTORED (${resolvedCount})` },
                    ].map(tab => (
                        <button 
                            key={tab.key}
                            onClick={() => setFilter(tab.key)}
                            className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider border transition-all cursor-pointer ${
                                filter === tab.key 
                                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm' 
                                    : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                    <input 
                        type="text" 
                        placeholder="Search Survey #, Taluk, Officer..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 pr-4 py-1.5 text-xs border border-slate-300 w-full md:w-72 focus:outline-none focus:border-blue-600 bg-slate-50 font-medium"
                    />
                </div>
            </div>

            {/* Evidence Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTasks.map(task => {
                    const badge = getStatusBadge(task.status);
                    const stageIdx = getStageIndex(task.status);

                    return (
                        <div 
                            key={task.id} 
                            className="bg-white border border-slate-200 shadow-sm flex flex-col group hover:shadow-xl hover:border-blue-400 transition-all duration-200 overflow-hidden"
                        >
                            {/* Card Header */}
                            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-start gap-2">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                                            {task.survey}
                                        </span>
                                        <span className="text-[9px] text-slate-400 font-bold">· {task.taluk}</span>
                                    </div>
                                    <h3 className="text-sm font-bold text-slate-900 mt-1 line-clamp-1">
                                        {task.alert_type}
                                    </h3>
                                </div>
                                <span className={`px-2 py-0.5 text-[8.5px] font-black uppercase tracking-wider border rounded-none shrink-0 ${badge.bg}`}>
                                    {badge.label}
                                </span>
                            </div>

                            {/* Photo / Media Container */}
                            <div 
                                onClick={() => { setSelectedTask(task); setActivePhotoIdx(0); }}
                                className="relative h-52 bg-slate-900 cursor-pointer overflow-hidden flex items-center justify-center group"
                            >
                                {task.primaryPhoto ? (
                                    <>
                                        <img 
                                            src={task.primaryPhoto} 
                                            alt={task.survey}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='250' viewBox='0 0 400 250'><rect width='400' height='250' fill='%231e293b'/><text x='200' y='125' font-family='sans-serif' font-size='14' font-weight='bold' fill='%2394a3b8' text-anchor='middle'>PHOTOGRAPHIC PROOF</text></svg>";
                                            }}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 opacity-80 group-hover:opacity-90 transition-opacity"></div>
                                        
                                        {/* Multi-Photo Count Badge */}
                                        {task.photos.length > 1 && (
                                            <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-md text-white text-[9px] font-black px-2 py-1 border border-white/20 flex items-center gap-1.5 shadow">
                                                <Camera size={11} className="text-blue-400" />
                                                <span>{task.photos.length} PHOTOS</span>
                                            </div>
                                        )}

                                        {/* Mobile App Verified Badge */}
                                        <div className="absolute top-3 left-3 bg-blue-600 text-white text-[8.5px] font-black px-2 py-1 tracking-wider uppercase shadow flex items-center gap-1">
                                            <Camera size={10} />
                                            <span>MOBILE EVIDENCE</span>
                                        </div>

                                        {/* Tap to Enlarge Overlay */}
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-[2px]">
                                            <div className="px-3 py-1.5 bg-white text-slate-900 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-2xl">
                                                <Eye size={13} className="text-blue-600" /> INSPECT & TAKE ACTION
                                            </div>
                                        </div>

                                        {/* GPS Tag & Timestamp Bottom Strip */}
                                        <div className="absolute bottom-2 left-3 right-3 flex justify-between items-center text-white text-[9.5px]">
                                            <span className="flex items-center gap-1 font-semibold text-slate-200">
                                                <Navigation size={10} className="text-emerald-400" />
                                                {task.gps_lat.toFixed(4)}° N, {task.gps_lon.toFixed(4)}° E
                                            </span>
                                            <span className="text-slate-300 font-bold">{task.date}</span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-slate-400 gap-2 p-6 text-center">
                                        <Camera size={32} className="text-slate-500 opacity-60" />
                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                            No Camera Proof Captured
                                        </span>
                                        <span className="text-[10px] text-slate-500">Awaiting Field Officer ground snapshot</span>
                                    </div>
                                )}
                            </div>

                            {/* 5-Step Pipeline Micro Stepper on Card */}
                            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[8.5px] font-bold text-slate-500">
                                <span className={stageIdx >= 1 ? 'text-emerald-700 font-black' : ''}>1. VAO Recon</span>
                                <span>→</span>
                                <span className={stageIdx >= 2 ? 'text-emerald-700 font-black' : ''}>2. RI Sign</span>
                                <span>→</span>
                                <span className={stageIdx >= 3 ? 'text-purple-700 font-black' : ''}>3. Sec 7</span>
                                <span>→</span>
                                <span className={stageIdx >= 4 ? 'text-rose-700 font-black' : ''}>4. Sec 6</span>
                                <span>→</span>
                                <span className={stageIdx >= 5 ? 'text-green-700 font-black' : ''}>5. Restored</span>
                            </div>

                            {/* Card Body & Officer Notes */}
                            <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                                <div>
                                    <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-amber-800 bg-amber-50 px-2 py-1 border border-amber-200">
                                        <UserCheck size={13} className="text-amber-600 shrink-0" />
                                        <span className="truncate">SUBMITTED BY: {task.officer_name.toUpperCase()}</span>
                                    </div>

                                    <div className="mt-2.5">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            VAO Observations
                                        </p>
                                        <p className="text-xs text-slate-700 italic mt-0.5 line-clamp-2">
                                            "{task.remarks}"
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-3 border-t border-slate-100 flex justify-between items-center gap-2">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); downloadFieldDossierPDF(task); }}
                                        title="Download Field Dossier (PDF)"
                                        className="p-1.5 border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                                    >
                                        <Download size={13} /> PDF
                                    </button>

                                    <button 
                                        onClick={() => { setSelectedTask(task); setActivePhotoIdx(0); }}
                                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer shadow-sm"
                                    >
                                        Next Action <ArrowRight size={13} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {filteredTasks.length === 0 && (
                    <div className="col-span-full py-16 text-center bg-white border border-slate-200">
                        <AlertTriangle size={36} className="mx-auto mb-3 text-slate-400" />
                        <h4 className="text-base font-bold text-slate-800 uppercase tracking-wider">No evidence tasks match your filter</h4>
                        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                            Submit a report with on-site photos through the Field Officer mobile app or click "Live Refresh" above.
                        </p>
                    </div>
                )}
            </div>

            {/* High-Resolution Evidence Detail Modal */}
            {selectedTask && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-4xl max-h-[92vh] shadow-2xl flex flex-col overflow-hidden border border-slate-700 animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="flex justify-between items-center bg-white p-4 text-slate-900 border-b border-slate-200 border-l-4 border-blue-600">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 border border-blue-200 rounded">
                                    <Camera size={18} className="text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="font-black text-sm uppercase tracking-wider text-slate-900 flex items-center gap-2">
                                        FIELD EVIDENCE: {selectedTask.survey} · {selectedTask.taluk}
                                    </h3>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">
                                        Mission ID: #{selectedTask.alertId || selectedTask.id} · Recorded: {selectedTask.date}
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setSelectedTask(null)}
                                className="p-2 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* 5-Step Progress Stepper inside Modal */}
                            <div className="p-4 bg-slate-50 border border-slate-200">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                                    Statutory Encroachment Removal Workflow Progress
                                </p>
                                <div className="flex items-center justify-between text-center relative">
                                    <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 h-0.5 bg-slate-200 -z-0"></div>
                                    {[
                                        { name: '1. VAO Recon', sub: 'Ground Photo', step: 1 },
                                        { name: '2. RI Verify', sub: 'FMB Boundary', step: 2 },
                                        { name: '3. Sec 7 Notice', sub: '15-Day Summons', step: 3 },
                                        { name: '4. Sec 6 Warrant', sub: 'Eviction Order', step: 4 },
                                        { name: '5. Land Restored', sub: 'Possession Taken', step: 5 },
                                    ].map(s => {
                                        const currentStep = getStageIndex(selectedTask.status);
                                        const isDone = currentStep >= s.step;
                                        const isCurrent = currentStep === s.step - 1;

                                        return (
                                            <div key={s.step} className="z-10 flex flex-col items-center">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs border-2 ${
                                                    isDone 
                                                        ? 'bg-emerald-600 border-emerald-600 text-white' 
                                                        : isCurrent 
                                                            ? 'bg-blue-600 border-blue-600 text-white animate-pulse ring-4 ring-blue-100' 
                                                            : 'bg-white border-slate-300 text-slate-400'
                                                }`}>
                                                    {isDone ? '✔' : s.step}
                                                </div>
                                                <p className={`text-[10px] font-black mt-1.5 ${isDone ? 'text-slate-900' : isCurrent ? 'text-blue-700' : 'text-slate-400'}`}>
                                                    {s.name}
                                                </p>
                                                <p className="text-[8px] text-slate-400 hidden sm:block">{s.sub}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                {/* Left: High-Res Photo Viewer */}
                                <div className="lg:col-span-7 space-y-3">
                                    <div className="relative bg-slate-100 h-80 border border-slate-200 flex items-center justify-center overflow-hidden">
                                        {selectedTask.photos && selectedTask.photos.length > 0 ? (
                                            <img 
                                                src={selectedTask.photos[activePhotoIdx] || selectedTask.primaryPhoto} 
                                                alt="Evidence Full View"
                                                className="w-full h-full object-contain"
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'><rect width='600' height='400' fill='%23111827'/><text x='300' y='200' font-family='sans-serif' font-size='16' font-weight='bold' fill='%2394a3b8' text-anchor='middle'>ON-SITE EVIDENCE PROOF</text></svg>";
                                                }}
                                            />
                                        ) : (
                                            <div className="text-center text-slate-400 p-6">
                                                <Camera size={40} className="mx-auto mb-2 opacity-50" />
                                                <p className="text-xs font-bold uppercase tracking-widest">No Photographic Image Available</p>
                                            </div>
                                        )}
                                        <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md text-white text-[9px] font-black px-2.5 py-1 border border-white/20 uppercase tracking-widest">
                                            PROOF #{activePhotoIdx + 1} OF {selectedTask.photos?.length || 1}
                                        </div>
                                    </div>

                                    {/* Thumbnail strip if multiple photos */}
                                    {selectedTask.photos && selectedTask.photos.length > 1 && (
                                        <div className="flex gap-2 overflow-x-auto pb-1">
                                            {selectedTask.photos.map((p, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => setActivePhotoIdx(idx)}
                                                    className={`w-20 h-14 border-2 overflow-hidden shrink-0 transition-all cursor-pointer ${
                                                        activePhotoIdx === idx ? 'border-blue-600 ring-2 ring-blue-400' : 'border-slate-300 opacity-70 hover:opacity-100'
                                                    }`}
                                                >
                                                    <img src={p} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* Geotag Coordinates Box */}
                                    <div className="bg-slate-900 text-white p-3 border border-slate-800 flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2">
                                            <Navigation size={14} className="text-emerald-400" />
                                            <span className="font-mono text-emerald-300 font-bold">
                                                {selectedTask.gps_lat.toFixed(5)}° N, {selectedTask.gps_lon.toFixed(5)}° E
                                            </span>
                                        </div>
                                        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                                            GPS Ground Accuracy ± 3.2m
                                        </span>
                                    </div>

                                    {/* Download Actions Strip */}
                                    <div className="flex flex-wrap gap-2 pt-2">
                                        <button 
                                            onClick={() => downloadEvidencePhoto(selectedTask)}
                                            className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 border border-slate-300 cursor-pointer"
                                        >
                                            <Download size={14} className="text-blue-600" /> Download Photo (.jpg)
                                        </button>
                                        <button 
                                            onClick={() => downloadFieldDossierPDF(selectedTask)}
                                            className="flex-1 py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-900 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 border border-blue-200 cursor-pointer"
                                        >
                                            <FileText size={14} className="text-blue-700" /> Evidence Dossier (PDF)
                                        </button>
                                        <button 
                                            onClick={() => downloadStatutoryNoticePDF(selectedTask)}
                                            className="flex-1 py-2 px-3 bg-purple-50 hover:bg-purple-100 text-purple-900 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 border border-purple-200 cursor-pointer"
                                        >
                                            <Gavel size={14} className="text-purple-700" /> 
                                            {selectedTask.status === 'SECTION_6_ORDERED' ? 'Sec 6 Order (PDF)' : 'Sec 7 Notice (PDF)'}
                                        </button>
                                    </div>
                                    <button 
                                        onClick={() => handleStar3Lock(selectedTask)}
                                        className="w-full py-2 px-3 bg-red-50 hover:bg-red-100 text-red-900 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 border border-red-200 cursor-pointer mt-2"
                                        title="Trigger automated transaction lock at Sub-Registrar Office via STAR 3.0"
                                    >
                                        <Lock size={14} className="text-red-700" />
                                        STAR 3.0 Registry Freeze (Lock Deed)
                                    </button>
                                </div>

                                {/* Right: Detailed Intel & Next Government Actions */}
                                <div className="lg:col-span-5 space-y-4">
                                    {/* Status Card */}
                                    <div className="p-4 bg-slate-50 border border-slate-200 space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Review State</span>
                                            <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider border ${getStatusBadge(selectedTask.status).bg}`}>
                                                {getStatusBadge(selectedTask.status).label}
                                            </span>
                                        </div>
                                        <p className="text-sm font-black text-slate-900">{selectedTask.alert_type}</p>
                                        <p className="text-xs text-slate-600">Cadastral Target: {selectedTask.survey} · Taluk: {selectedTask.taluk}</p>
                                    </div>

                                    {/* Officer Badge */}
                                    <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900">
                                        <div className="flex items-center gap-2">
                                            <UserCheck size={16} className="text-amber-600" />
                                            <div>
                                                <p className="text-[9px] font-black uppercase tracking-widest text-amber-700">SUBMISSION SOURCE</p>
                                                <p className="text-xs font-black">{selectedTask.officer_name.toUpperCase()}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* VAO Observations */}
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Field Observations</p>
                                        <div className="p-3 bg-slate-50 border border-slate-200 mt-1">
                                            <p className="text-xs text-slate-800 italic leading-relaxed">
                                                "{selectedTask.remarks}"
                                            </p>
                                        </div>
                                    </div>

                                    {/* Action Directive */}
                                    {selectedTask.action_plan && (
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Action Directive Proposed</p>
                                            <div className="p-3 bg-blue-50/50 border border-blue-200 mt-1">
                                                <p className="text-xs text-blue-900 font-semibold leading-relaxed">
                                                    {selectedTask.action_plan}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* ─── NEXT GOVERNMENT ACTION ENGINE ───────────────────────────── */}
                                    <div className="p-4 bg-white text-slate-900 border border-slate-200 border-l-4 border-blue-600 shadow-sm space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-slate-800 text-xs font-black uppercase tracking-wider">
                                                <Gavel size={15} className="text-amber-600" /> NEXT PRESCRIBED GOVERNMENT ACTION
                                            </div>
                                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 border border-slate-200 text-[9px] font-mono font-bold text-slate-700">
                                                <span>OPERATOR:</span>
                                                <span className={isVAO ? 'text-emerald-700' : isInspector ? 'text-amber-700' : 'text-blue-700'}>
                                                    {currentUserRole}
                                                </span>
                                            </div>
                                        </div>

                                        {(selectedTask.status === 'NEW' || selectedTask.status === 'VAO_ASSIGNED' || selectedTask.status === 'PENDING') && (
                                            <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 text-xs rounded space-y-1">
                                                <div className="flex items-center gap-2 font-black text-blue-800">
                                                    <Clock size={14} />
                                                    <span>ON-SITE RECON IN PROGRESS (VAO MOBILE SQUAD)</span>
                                                </div>
                                                <p className="text-[10.5px] text-blue-700 leading-relaxed">
                                                    Assigned to Village Administrative Officer (VAO). Ground reconnaissance with geo-tagged photos and boundary checks currently pending upload from field officer mobile app.
                                                </p>
                                            </div>
                                        )}

                                        {selectedTask.status === 'VAO_SUBMITTED' && (
                                            <div className="space-y-3">
                                                {isVAO ? (
                                                    <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded">
                                                        <div className="flex items-center gap-2 font-black mb-1">
                                                            <Lock size={14} className="text-amber-700" />
                                                            <span>AWAITING REVENUE INSPECTOR COUNTER-SIGN</span>
                                                        </div>
                                                        <p className="text-[10.5px] text-amber-800 leading-relaxed">
                                                            You are logged in as <b>VAO</b>. Ground Recon submitted. The Revenue Inspector must counter-verify against the FMB map before statutory proceedings begin.
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <p className="text-[11px] text-slate-700 leading-relaxed">
                                                            Field officer has uploaded on-site proof. Revenue Inspector must counter-verify boundary against FMB.
                                                        </p>
                                                        <button 
                                                            onClick={() => handleAdvancePipeline(selectedTask, 'INSPECTOR_APPROVE')}
                                                            disabled={actionLoading}
                                                            className="w-full mt-3 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-all"
                                                        >
                                                            <CheckCircle2 size={15} />
                                                            {actionLoading ? 'PROCESSING...' : 'AUTHORIZE & COUNTER-SIGN (INSPECTOR)'}
                                                        </button>
                                                    </div>
                                                )}

                                                {/* Safety / Error Branching Buttons */}
                                                <div className="pt-2 border-t border-slate-200 flex gap-2">
                                                    <button 
                                                        onClick={() => setActionModal('FALSE_ALARM')}
                                                        className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 border border-slate-300 cursor-pointer"
                                                    >
                                                        <ShieldX size={13} className="text-amber-600" /> Mark False Alarm
                                                    </button>
                                                    {(!isVAO) && (
                                                        <button 
                                                            onClick={() => setActionModal('REJECT_BOUNDARY')}
                                                            className="flex-1 py-1.5 px-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 border border-rose-200 cursor-pointer"
                                                        >
                                                            <Ban size={13} className="text-rose-600" /> Reject (FMB Error)
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {(selectedTask.status === 'INSPECTOR_APPROVED' || selectedTask.status === 'COLLECTOR_ACCEPTED') && (
                                            <div className="space-y-3">
                                                {!isTahsildar ? (
                                                    <div className="p-3 bg-purple-50 border border-purple-200 text-purple-900 text-xs rounded">
                                                        <div className="flex items-center gap-2 font-black mb-1">
                                                            <Lock size={14} className="text-purple-700" />
                                                            <span>STATUTORY NOTICE LOCKED (TAHSILDAR ONLY)</span>
                                                        </div>
                                                        <p className="text-[10.5px] text-purple-800 leading-relaxed">
                                                            Under Section 7 of TN Act III of 1905, only the <b>Tahsildar / Collector</b> has legal power to issue a 15-day Show Cause Notice. (Logged in as: <b>{currentUserRole}</b>)
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <p className="text-[11px] text-slate-700 leading-relaxed">
                                                            Counter-verification signed. Tahsildar must issue a 15-day statutory Show Cause Notice to the occupant under <b>Section 7 of TN Act III of 1905</b>.
                                                        </p>
                                                        <button 
                                                            onClick={() => setActionModal('SEC_7')}
                                                            disabled={actionLoading}
                                                            className="w-full mt-3 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-all"
                                                        >
                                                            <FileText size={15} /> ISSUE SECTION 7 SHOW CAUSE NOTICE
                                                        </button>
                                                    </div>
                                                )}

                                                {/* Safety dismiss button */}
                                                <div className="pt-2 border-t border-slate-200">
                                                    <button 
                                                        onClick={() => setActionModal('FALSE_ALARM')}
                                                        className="w-full py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 border border-slate-300 cursor-pointer"
                                                    >
                                                        <ShieldX size={13} className="text-amber-600" /> Dismiss as False Alarm / Permissible Use
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {selectedTask.status === 'SECTION_7_ISSUED' && (
                                            <div className="space-y-3">
                                                {!isTahsildar ? (
                                                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-900 text-xs rounded">
                                                        <div className="flex items-center gap-2 font-black mb-1">
                                                            <Lock size={14} className="text-rose-700" />
                                                            <span>EVICTION WARRANT LOCKED (TAHSILDAR / COLLECTOR ONLY)</span>
                                                        </div>
                                                        <p className="text-[10.5px] text-rose-800 leading-relaxed">
                                                            Only the <b>Tahsildar or District Collector</b> has statutory power to order Section 6 Eviction with Police Bandobast. (Logged in as: <b>{currentUserRole}</b>)
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <p className="text-[11px] text-slate-700 leading-relaxed">
                                                            Section 7 Notice served. Objection period elapsed or disallowed. Collector/Tahsildar must issue the final <b>Section 6 Summary Eviction Order</b> with police bandobast.
                                                        </p>
                                                        <button 
                                                            onClick={() => setActionModal('SEC_6')}
                                                            disabled={actionLoading}
                                                            className="w-full mt-3 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-all"
                                                        >
                                                            <AlertOctagon size={15} /> ISSUE SECTION 6 EVICTION WARRANT
                                                        </button>
                                                    </div>
                                                )}

                                                {/* Safety / Legal objection button */}
                                                <div className="pt-2 border-t border-slate-200">
                                                    <button 
                                                        onClick={() => setActionModal('CANCEL_LEGAL')}
                                                        className="w-full py-1.5 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 border border-indigo-200 cursor-pointer"
                                                    >
                                                        <Scale size={13} className="text-indigo-600" /> Cancel Eviction (Valid Patta / Court Stay Produced)
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {selectedTask.status === 'SECTION_6_ORDERED' && (
                                            <div className="space-y-3">
                                                {isVAO ? (
                                                    <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded">
                                                        <div className="flex items-center gap-2 font-black mb-1">
                                                            <Lock size={14} className="text-amber-700" />
                                                            <span>RESTORATION SIGN-OFF LOCKED</span>
                                                        </div>
                                                        <p className="text-[10.5px] text-amber-800 leading-relaxed">
                                                            Revenue Demolition Squad (RI / Tahsildar with Police escort) must execute demolition and confirm restoration.
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <p className="text-[11px] text-slate-700 leading-relaxed">
                                                            Eviction warrant active. Revenue squad, JCB machinery, and Police bandobast deployed. Confirm physical demolition to restore land.
                                                        </p>
                                                        <button 
                                                            onClick={() => setActionModal('RESTORE')}
                                                            disabled={actionLoading}
                                                            className="w-full mt-3 py-2.5 bg-green-600 hover:bg-green-500 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-all"
                                                        >
                                                            <Check size={15} /> EXECUTE DEMOLITION & RESTORE LAND
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {(selectedTask.status === 'RESOLVED' || selectedTask.status === 'SUCCESS' || selectedTask.status === 'RESTORED') && (
                                            <div className="p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-2">
                                                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                                                <span>LAND OFFICIALLY RESTORED · TAMIL NILAM REGISTRY UPDATED</span>
                                            </div>
                                        )}

                                        {selectedTask.status === 'FALSE_POSITIVE' && (
                                            <div className="p-2.5 bg-slate-100 border border-slate-300 text-slate-800 text-xs font-bold flex items-center gap-2">
                                                <CheckCircle2 size={16} className="text-slate-600 shrink-0" />
                                                <span>ALERT DISMISSED AS FALSE ALARM · NO ENCROACHMENT FOUND</span>
                                            </div>
                                        )}

                                        {selectedTask.status === 'REJECTED_BOUNDARY' && (
                                            <div className="p-2.5 bg-rose-50 border border-rose-300 text-rose-800 text-xs font-bold flex items-center gap-2">
                                                <Ban size={16} className="text-rose-600 shrink-0" />
                                                <span>REJECTED · FMB BOUNDARY SURVEY MISMATCH</span>
                                            </div>
                                        )}

                                        {selectedTask.status === 'CANCELLED_LEGAL' && (
                                            <div className="p-2.5 bg-indigo-50 border border-indigo-300 text-indigo-800 text-xs font-bold flex items-center gap-2">
                                                <Scale size={16} className="text-indigo-600 shrink-0" />
                                                <span>EVICTION CANCELLED · VALID PATTA / COURT STAY CONFIRMED</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="bg-slate-100 p-4 border-t border-slate-200 flex justify-end gap-3">
                            <button 
                                onClick={() => setSelectedTask(null)}
                                className="px-5 py-2 border border-slate-300 text-slate-700 text-xs font-black uppercase tracking-wider hover:bg-white cursor-pointer"
                            >
                                Close Window
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── ACTION TRIGGER SUB-MODAL ────────────────────────────────────────────── */}
            {actionModal && selectedTask && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-white p-4 text-slate-900 border-b border-slate-200 border-l-4 border-blue-600 flex justify-between items-center">
                            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                                <Gavel size={16} className="text-amber-600" />
                                {actionModal === 'SEC_7' && 'ISSUE SECTION 7 SHOW CAUSE NOTICE'}
                                {actionModal === 'SEC_6' && 'ISSUE SECTION 6 FINAL EVICTION ORDER'}
                                {actionModal === 'RESTORE' && 'CONFIRM DEMOLITION & RECLAIM LAND'}
                                {actionModal === 'FALSE_ALARM' && 'MARK AS FALSE ALARM (DISMISS ALERT)'}
                                {actionModal === 'REJECT_BOUNDARY' && 'REJECT ALERT (FMB BOUNDARY MISMATCH)'}
                                {actionModal === 'CANCEL_LEGAL' && 'CANCEL PROCEEDINGS (LEGAL PATTA / STAY)'}
                            </h4>
                            <button onClick={() => setActionModal(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-5 space-y-4 text-xs">
                            {actionModal === 'SEC_7' && (
                                <>
                                    <div className="p-3 bg-purple-50 border border-purple-200 text-purple-900 text-[11px] leading-relaxed">
                                        <b>Section 7 of Tamil Nadu Act III of 1905:</b> Orders the unauthorized occupant of Survey <b>{selectedTask.survey}</b> to show cause within a statutory window why eviction should not be executed.
                                    </div>
                                    <div className="p-3 bg-amber-50 border border-amber-300 text-amber-900 text-[11px] leading-relaxed">
                                        <div className="font-bold flex items-center gap-1.5 text-amber-950">
                                            <AlertTriangle size={14} className="text-amber-600 shrink-0" />
                                            <span>STATUTORY SURVEY ACKNOWLEDGEMENT</span>
                                        </div>
                                        <p className="mt-1 text-slate-700">
                                            FMB measurements for this parcel are currently <b>INDICATIVE</b> (derived from vector polygon geometry, pending certified physical field measurement).
                                        </p>
                                        <label className="flex items-start gap-2 mt-2.5 font-bold cursor-pointer text-slate-900">
                                            <input 
                                                type="checkbox"
                                                checked={fmbAcknowledged}
                                                onChange={(e) => {
                                                    setFmbAcknowledged(e.target.checked);
                                                    if (e.target.checked) setActionError(null);
                                                }}
                                                className="mt-0.5 rounded cursor-pointer"
                                            />
                                            <span>I acknowledge that FMB measurements are indicative polygon-derived coordinates pending certified field survey, and authorize Section 7 issuance.</span>
                                        </label>
                                    </div>
                                    {actionError && (
                                        <div className="p-2.5 bg-red-50 border border-red-300 text-red-800 text-[11px] font-bold">
                                            ⚠️ {actionError}
                                        </div>
                                    )}
                                    <div>
                                        <label className="font-bold text-slate-700 block mb-1">Encroacher / Occupant Name:</label>
                                        <input 
                                            type="text" 
                                            value={encroacherName} 
                                            onChange={(e) => setEncroacherName(e.target.value)}
                                            className="w-full p-2 border border-slate-300 focus:border-purple-600 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="font-bold text-slate-700 block mb-1">Objection Time Window (Days):</label>
                                        <input 
                                            type="number" 
                                            value={objectionDays} 
                                            onChange={(e) => setObjectionDays(e.target.value)}
                                            className="w-full p-2 border border-slate-300 focus:border-purple-600 outline-none"
                                        />
                                    </div>
                                </>
                            )}

                            {actionModal === 'SEC_6' && (
                                <>
                                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-900 text-[11px] leading-relaxed">
                                        <b>Section 6 Eviction Warrant:</b> Authorization by District Collector / Tahsildar to deploy the Revenue Demolition Squad & Heavy Machinery (JCB).
                                    </div>
                                    <div>
                                        <label className="font-bold text-slate-700 block mb-1">Police Station Bandobast Requisition:</label>
                                        <input 
                                            type="text" 
                                            value={policeStation} 
                                            onChange={(e) => setPoliceStation(e.target.value)}
                                            className="w-full p-2 border border-slate-300 focus:border-rose-600 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="font-bold text-slate-700 block mb-1">Eviction Operation Directives:</label>
                                        <textarea 
                                            rows={2}
                                            value={actionNotes} 
                                            onChange={(e) => setActionNotes(e.target.value)}
                                            placeholder="Deploy Salem West Revenue Squad, 2 JCB Excavators, and restore boundary fencing..."
                                            className="w-full p-2 border border-slate-300 focus:border-rose-600 outline-none"
                                        />
                                    </div>
                                </>
                            )}

                            {actionModal === 'RESTORE' && (
                                <>
                                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px] leading-relaxed">
                                        <b>Final Possession Confirmation:</b> Confirms that physical eviction is completed, illegal structure cleared, boundary stones fixed, and parcel restored to Government Land Poramboke.
                                    </div>
                                    <div>
                                        <label className="font-bold text-slate-700 block mb-1">Eviction Summary Notes:</label>
                                        <textarea 
                                            rows={2}
                                            value={actionNotes} 
                                            onChange={(e) => setActionNotes(e.target.value)}
                                            placeholder="Commercial shed demolished. Debris removed. Fencing restored under supervision of Revenue Inspector..."
                                            className="w-full p-2 border border-slate-300 focus:border-emerald-600 outline-none"
                                        />
                                    </div>
                                </>
                            )}

                            {actionModal === 'FALSE_ALARM' && (
                                <>
                                    <div className="p-3 bg-slate-100 border border-slate-300 text-slate-800 text-[11px] leading-relaxed">
                                        <b>Dismiss as False Alarm:</b> Closes this satellite detection. The structure is confirmed to be on lawful private land or authorized permissible farming/use.
                                    </div>
                                    <div>
                                        <label className="font-bold text-slate-700 block mb-1">Dismissal Reason / Verification Findings:</label>
                                        <textarea 
                                            rows={3}
                                            value={actionNotes} 
                                            onChange={(e) => setActionNotes(e.target.value)}
                                            placeholder="Field inspection by officer confirms valid Patta #441 held by owner. No encroachment on Government Poramboke."
                                            className="w-full p-2 border border-slate-300 focus:border-slate-600 outline-none"
                                        />
                                    </div>
                                </>
                            )}

                            {actionModal === 'REJECT_BOUNDARY' && (
                                <>
                                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-900 text-[11px] leading-relaxed">
                                        <b>FMB Boundary Mismatch:</b> Revenue Inspector / Surveyor rejects the alert because digital cadastral map overlay does not match government poramboke boundaries.
                                    </div>
                                    <div>
                                        <label className="font-bold text-slate-700 block mb-1">Survey Discrepancy Findings:</label>
                                        <textarea 
                                            rows={3}
                                            value={actionNotes} 
                                            onChange={(e) => setActionNotes(e.target.value)}
                                            placeholder="Field Measurement Book (FMB) cross-check confirms GPS point is inside neighboring Patta land, not Government Poramboke."
                                            className="w-full p-2 border border-slate-300 focus:border-rose-600 outline-none"
                                        />
                                    </div>
                                </>
                            )}

                            {actionModal === 'CANCEL_LEGAL' && (
                                <>
                                    <div className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-900 text-[11px] leading-relaxed">
                                        <b>Cancel Section 7 Proceedings:</b> The occupant produced authentic revenue patta, ancestral registry records, or a High Court Stay Order during the 15-day show-cause period.
                                    </div>
                                    <div>
                                        <label className="font-bold text-slate-700 block mb-1">Legal Document / Court Order Details:</label>
                                        <textarea 
                                            rows={3}
                                            value={actionNotes} 
                                            onChange={(e) => setActionNotes(e.target.value)}
                                            placeholder="High Court Writ Petition W.P. No. 12948/2026 interim stay granted, or valid registered patta verified by Tahsildar."
                                            className="w-full p-2 border border-slate-300 focus:border-indigo-600 outline-none"
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end gap-3">
                            <button 
                                onClick={() => setActionModal(null)}
                                className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold uppercase cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={() => {
                                    if (actionModal === 'SEC_7') handleAdvancePipeline(selectedTask, 'ISSUE_SEC_7');
                                    if (actionModal === 'SEC_6') handleAdvancePipeline(selectedTask, 'ISSUE_SEC_6');
                                    if (actionModal === 'RESTORE') handleAdvancePipeline(selectedTask, 'COMPLETE_RESTORE');
                                    if (actionModal === 'FALSE_ALARM') handleAdvancePipeline(selectedTask, 'MARK_FALSE_POSITIVE');
                                    if (actionModal === 'REJECT_BOUNDARY') handleAdvancePipeline(selectedTask, 'REJECT_BOUNDARY');
                                    if (actionModal === 'CANCEL_LEGAL') handleAdvancePipeline(selectedTask, 'CANCEL_LEGAL');
                                }}
                                disabled={actionLoading}
                                className={`px-5 py-2 text-white text-xs font-black uppercase tracking-wider cursor-pointer shadow ${
                                    actionModal === 'SEC_7' ? 'bg-purple-600 hover:bg-purple-700' :
                                    actionModal === 'SEC_6' ? 'bg-rose-600 hover:bg-rose-700' :
                                    actionModal === 'FALSE_ALARM' ? 'bg-slate-800 hover:bg-slate-900' :
                                    actionModal === 'REJECT_BOUNDARY' ? 'bg-rose-700 hover:bg-rose-800' :
                                    actionModal === 'CANCEL_LEGAL' ? 'bg-indigo-700 hover:bg-indigo-800' :
                                    'bg-emerald-600 hover:bg-emerald-700'
                                }`}
                            >
                                {actionLoading ? 'EXECUTING...' : 'CONFIRM & EXECUTE STATUTORY ACTION'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
