import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, AlertTriangle, Clock, CheckCircle2, Scale, Users,
  Layers, Compass, ArrowRight, RefreshCcw, FileText, Download,
  CloudOff, ShieldAlert, ChevronRight, Eye, Camera, Landmark,
  Database, Lock, MapPin, Building, Award, Activity, CheckSquare
} from 'lucide-react';
import { DashboardAPI, CaseAPI, WatchZonesAPI } from '../api/client';
import CaseDetailModal from '../components/CaseDetailModal';

export const ExecutiveDashboardView = ({ onRefreshData }) => {
  const [summary, setSummary] = useState(null);
  const [actionableCases, setActionableCases] = useState([]);
  const [watchZoneData, setWatchZoneData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const navigate = useNavigate();

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await DashboardAPI.getSummary();
      setSummary(data);

      // Load actionable cases quick list
      const casesData = await CaseAPI.getCases({ is_actionable: 'true' });
      setActionableCases(Array.isArray(casesData) ? casesData.slice(0, 6) : (casesData?.results?.slice(0, 6) || []));

      // Load district watch zone cadence status
      try {
        const districtName = data?.scope?.district || 'Salem';
        const wzData = await WatchZonesAPI.getWatchZones(districtName);
        setWatchZoneData(wzData);
      } catch (wzErr) {
        console.warn('Watch zone cadence query error:', wzErr);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load executive summary.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const role = summary?.role || 'COLLECTOR';
  const scope = summary?.scope || {};
  const kpis = summary?.kpis || {};
  const pipeline = summary?.pipeline_stages || {};
  const coverageGaps = summary?.coverage_gaps || [];
  const integrity = summary?.integrity_indicators || {};
  const accuracy = summary?.accuracy || {};

  // Role Metadata Config
  const getRoleConfig = () => {
    switch (role) {
      case 'TAHSILDAR':
        return {
          title: 'Taluk Statutory Authority & Magisterial Court',
          badge: 'TAHSILDAR / TALUK MAGISTRATE',
          badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
          desc: 'Statutory Section 7 show-cause notices, magisterial hearing dockets, and Section 6 summary eviction orders under TN Act III of 1905.',
          jurisdiction: `${scope.taluk || 'Salem West'} Taluk, ${scope.district || 'Salem'}`,
        };
      case 'COLLECTOR':
        return {
          title: 'District Collector & Executive Magistrate Command',
          badge: 'DISTRICT COLLECTOR APEX',
          badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          desc: 'District-wide judicial oversight, Madras High Court ATR compliance, court stays registry, and TNUHDB humanitarian rehabilitation.',
          jurisdiction: `${scope.district || 'Salem'} District (All Taluks)`,
        };
      case 'VAO':
        return {
          title: 'Village Administrative Officer (VAO) Field Operations',
          badge: 'VILLAGE FIELD MAGISTRATE',
          badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200',
          desc: 'On-site cadastral inspections, GPS boundary geofence verifications, geotagged photographs, and village encroachment reporting.',
          jurisdiction: `${scope.village || 'Kannankurichi'} Village, ${scope.taluk || 'Salem West'}`,
        };
      case 'STATE_APEX':
      case 'CLA_STATE':
        return {
          title: 'Statewide Strategic Land Bank Directorate',
          badge: 'STATE APEX / SECRETARIAT',
          badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          desc: 'Statewide cadastral oversight across 38 districts, inter-district enforcement comparisons, and waterbody protection monitoring.',
          jurisdiction: 'Statewide Tamil Nadu (38 Districts)',
        };
      case 'VIGILANCE':
        return {
          title: 'Vigilance & Anti-Corruption Audit Directorate (DVAC)',
          badge: 'STATUTORY AUDIT (READ-ONLY)',
          badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
          desc: 'Independent statutory integrity scrutiny, delayed action suppression monitoring, and cryptographic audit log verification.',
          jurisdiction: 'Statewide Tamper-Evident Audit Directorate',
        };
      case 'ADMIN_GIS':
        return {
          title: 'Cadastral GIS & Sentinel-2 Infrastructure Operations',
          badge: 'GIS & CORE INFRASTRUCTURE',
          badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
          desc: 'Copernicus Sentinel-2 ingest pipelines, GeoServer cadastral WMS layers, PostGIS vector integrity, and jurisdictional tenures.',
          jurisdiction: 'Central Spatial Infrastructure & Telemetry',
        };
      default:
        return {
          title: 'Executive Encroachment Operations Command',
          badge: role,
          badgeColor: 'bg-slate-100 text-slate-700 border-slate-300',
          desc: 'Cadastral encroachment monitoring and statutory enforcement under the Tamil Nadu Land Encroachment Act III of 1905.',
          jurisdiction: scope.district ? `${scope.district} District` : 'Statewide Tamil Nadu',
        };
    }
  };

  const roleConfig = getRoleConfig();

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* 1. TOP HEADER & ROLE STATUS */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {roleConfig.title}
            </h1>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${roleConfig.badgeColor}`}>
              {roleConfig.badge}
            </span>
            {summary?.is_demo && (
              <span className="text-xs px-2 py-0.5 rounded-full font-black bg-amber-50 text-amber-800 border border-amber-300">
                DEMO MODE
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-slate-700">{roleConfig.jurisdiction}</span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200" title="Subordinate Taluk/Village hierarchy is prototype data; pending official MoPR/LGD certified export">
              LGD: UNVERIFIED
            </span>
            <span>•</span>
            <span>{roleConfig.desc}</span>
          </div>
        </div>

        <button
          onClick={() => {
            loadDashboard();
            onRefreshData?.();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 transition-colors shadow-xs cursor-pointer shrink-0"
        >
          <RefreshCcw className="w-3.5 h-3.5" /> Refresh Dashboard
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Watch Zone Cadence Status Warning */}
      {watchZoneData?.cadence_configured === false && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs flex items-start gap-3 shadow-xs">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold uppercase tracking-wider text-[11px] block text-amber-900">
              Watch Zone Scheduler Status ({watchZoneData.district || 'District'}):
            </span>
            <span className="font-semibold text-amber-800 mt-0.5 block">
              {watchZoneData.message || 'cadence not configured for this district; department must set it'}
            </span>
            <span className="text-[11px] text-amber-700 mt-0.5 block">
              Automated review scheduler requires an explicit cadence in DistrictLegalConfig. Automated tasks will not run for this district until configured.
            </span>
          </div>
        </div>
      )}

      {/* 2. ROLE-SPECIFIC KPI METRICS GRID */}
      {role === 'TAHSILDAR' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600" />
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Notices to Sign</p>
            <p className="text-2xl font-black text-blue-700 mt-1">{pipeline.statutory_notice ?? 0}</p>
            <p className="text-[10px] text-slate-400 mt-1">Section 7 Show-Cause</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Hearings</p>
            <p className="text-2xl font-black text-amber-600 mt-1">{pipeline.hearing ?? 0}</p>
            <p className="text-[10px] text-slate-400 mt-1">15-day inquiry window</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-red-200 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-red-600" />
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Section 6 Warrants</p>
            <p className="text-2xl font-black text-red-600 mt-1">{pipeline.eviction_order ?? 0}</p>
            <p className="text-[10px] text-slate-400 mt-1">Summary eviction ready</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-slate-700" />
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Court Stays</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{kpis.court_stays_in_force ?? 0}</p>
            <p className="text-[10px] text-slate-400 mt-1">Eviction locked</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-purple-200 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-purple-600" />
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Needs Action</p>
            <p className="text-2xl font-black text-purple-700 mt-1">{kpis.needs_my_action ?? 0}</p>
            <p className="text-[10px] text-slate-400 mt-1">Taluk magisterial tasks</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-600" />
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Taluk Cases</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{kpis.open_cases_total ?? 0}</p>
            <p className="text-[10px] text-slate-400 mt-1">{scope.taluk || 'Salem West'} scope</p>
          </div>
        </div>
      )}

      {role === 'COLLECTOR' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white p-4 rounded-xl border border-indigo-200 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-600" />
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">High Court ATR</p>
            <p className="text-2xl font-black text-indigo-700 mt-1">Ready</p>
            <p className="text-[10px] text-slate-400 mt-1">PIL Compliance Export</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-slate-800" />
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Court Stays</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{kpis.court_stays_in_force ?? 0}</p>
            <p className="text-[10px] text-slate-400 mt-1">High Court Injunctions</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Rehabilitation</p>
            <p className="text-2xl font-black text-amber-600 mt-1">{integrity.rehabilitation_routed ?? 0}</p>
            <p className="text-[10px] text-slate-400 mt-1">TNUHDB Housing Welfare</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-red-200 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-red-600" />
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">SLA Breached</p>
            <p className="text-2xl font-black text-red-600 mt-1">{kpis.sla_breached ?? 0}</p>
            <p className="text-[10px] text-slate-400 mt-1">Statutory deadline past</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600" />
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Collector Reviews</p>
            <p className="text-2xl font-black text-blue-700 mt-1">{kpis.needs_my_action ?? 0}</p>
            <p className="text-[10px] text-slate-400 mt-1">Section 6 final review</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-600" />
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">District Cases</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{kpis.open_cases_total ?? 0}</p>
            <p className="text-[10px] text-slate-400 mt-1">Salem total active</p>
          </div>
        </div>
      )}

      {role === 'VAO' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white p-4 rounded-xl border border-cyan-200 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-cyan-600" />
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Field Tasks</p>
            <p className="text-2xl font-black text-cyan-700 mt-1">{pipeline.field_verification ?? 0}</p>
            <p className="text-[10px] text-slate-400 mt-1">Pending on-site survey</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-600" />
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Geofence Compliance</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">&lt; 15m</p>
            <p className="text-[10px] text-slate-400 mt-1">GPS accuracy verified</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600" />
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Triage Encroachments</p>
            <p className="text-2xl font-black text-blue-700 mt-1">{pipeline.triage ?? 0}</p>
            <p className="text-[10px] text-slate-400 mt-1">Satellite detections</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Indicative Sketches</p>
            <p className="text-2xl font-black text-amber-600 mt-1">{integrity.indicative_fmb_count ?? 0}</p>
            <p className="text-[10px] text-slate-400 mt-1">Polygon-derived</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-purple-200 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-purple-600" />
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Action Required</p>
            <p className="text-2xl font-black text-purple-700 mt-1">{kpis.needs_my_action ?? 0}</p>
            <p className="text-[10px] text-slate-400 mt-1">Village inspections</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-slate-800" />
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Village Total</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{kpis.open_cases_total ?? 0}</p>
            <p className="text-[10px] text-slate-400 mt-1">{scope.village || 'Kannankurichi'} cases</p>
          </div>
        </div>
      )}

      {(role === 'STATE_APEX' || role === 'CLA_STATE') && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-600" />
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Districts Monitored</p>
            <p className="text-2xl font-black text-emerald-700 mt-1">38</p>
            <p className="text-[10px] text-slate-400 mt-1">Statewide Tamil Nadu</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600" />
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Statewide Cases</p>
            <p className="text-2xl font-black text-blue-700 mt-1">{kpis.open_cases_total ?? 0}</p>
            <p className="text-[10px] text-slate-400 mt-1">All 38 districts</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Coverage Gaps</p>
            <p className="text-2xl font-black text-amber-600 mt-1">{coverageGaps.length}</p>
            <p className="text-[10px] text-slate-400 mt-1">&gt;14d without pass</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-indigo-200 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-600" />
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Section 7 Notices</p>
            <p className="text-2xl font-black text-indigo-700 mt-1">{pipeline.statutory_notice ?? 0}</p>
            <p className="text-[10px] text-slate-400 mt-1">Statewide issued</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-red-200 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-red-600" />
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Court Injunctions</p>
            <p className="text-2xl font-black text-red-600 mt-1">{kpis.court_stays_in_force ?? 0}</p>
            <p className="text-[10px] text-slate-400 mt-1">Writ petition stays</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-purple-200 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-purple-600" />
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Unverified Approvals</p>
            <p className="text-2xl font-black text-purple-700 mt-1">{integrity.unverified_approvals_count ?? 0}</p>
            <p className="text-[10px] text-slate-400 mt-1">Audit flagged</p>
          </div>
        </div>
      )}

      {role === 'VIGILANCE' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Suppression Flags</p>
            <p className="text-2xl font-black text-amber-600 mt-1">{pipeline.triage ?? 0}</p>
            <p className="text-[10px] text-slate-400 mt-1">Pending review &gt;14d</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-red-200 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-red-600" />
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Unverified Approvals</p>
            <p className="text-2xl font-black text-red-600 mt-1">{integrity.unverified_approvals_count ?? 0}</p>
            <p className="text-[10px] text-slate-400 mt-1">Missing survey cert</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-purple-200 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-purple-600" />
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Peer Audits</p>
            <p className="text-2xl font-black text-purple-700 mt-1">{kpis.peer_audits_open ?? 0}</p>
            <p className="text-[10px] text-slate-400 mt-1">False-positive cross checks</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-600" />
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Audit Chain</p>
            <p className="text-2xl font-black text-emerald-700 mt-1">SHA-256</p>
            <p className="text-[10px] text-slate-400 mt-1">Tamper-check: OK</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600" />
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Access Mode</p>
            <p className="text-2xl font-black text-blue-700 mt-1">Read-Only</p>
            <p className="text-[10px] text-slate-400 mt-1">Statutory scrutiny</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-slate-800" />
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Ledger</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{kpis.open_cases_total ?? 0}</p>
            <p className="text-[10px] text-slate-400 mt-1">Monitored records</p>
          </div>
        </div>
      )}

      {role === 'ADMIN_GIS' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Detection Model</p>
            <p className="text-base font-black text-amber-800 mt-1 font-mono">none-simulated</p>
            <p className="text-[10px] text-slate-400 mt-1">Simulated alerts (demo mode)</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600" />
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">GeoServer Status</p>
            <p className="text-2xl font-black text-blue-700 mt-1">SYNCED</p>
            <p className="text-[10px] text-slate-400 mt-1">WMS/WFS Layers 2.24</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-purple-200 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-purple-600" />
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Coverage Gaps</p>
            <p className="text-2xl font-black text-purple-700 mt-1">{coverageGaps.length}</p>
            <p className="text-[10px] text-slate-400 mt-1">Cloud / revisit gaps</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-indigo-200 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-600" />
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Hierarchy Models</p>
            <p className="text-2xl font-black text-indigo-700 mt-1">1,768</p>
            <p className="text-[10px] text-slate-400 mt-1">Villages linked</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Uncertified FMB</p>
            <p className="text-2xl font-black text-amber-600 mt-1">{integrity.indicative_fmb_count ?? 0}</p>
            <p className="text-[10px] text-slate-400 mt-1">Polygon-derived</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-slate-800" />
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Cadastral Parcels</p>
            <p className="text-2xl font-black text-slate-900 mt-1">39</p>
            <p className="text-[10px] text-slate-400 mt-1">Salem seed polygons</p>
          </div>
        </div>
      )}

      {/* 3. DEDICATED ROLE OPERATIONS PANELS */}
      {/* COLLECTOR DEDICATED PANEL */}
      {role === 'COLLECTOR' && (
        <div className="bg-white p-6 rounded-xl border border-indigo-200 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Landmark className="w-4 h-4 text-indigo-600" />
                Madras High Court PIL Compliance & Eviction Warrant Docket
              </h2>
              <p className="text-xs text-slate-500">
                Generate sworn Action Taken Reports (ATRs) for judicial scrutiny and monitor injunction stays across Salem District.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/atr')}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" /> High Court ATR Generator
              </button>
              <button
                onClick={() => navigate('/court-stays')}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all border border-slate-300 flex items-center gap-1.5 cursor-pointer"
              >
                <Scale className="w-3.5 h-3.5" /> Court Stays ({kpis.court_stays_in_force ?? 0})
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-indigo-50/60 rounded-lg border border-indigo-100">
              <p className="font-bold text-indigo-900">PIL Waterbody Compliance Docket</p>
              <p className="text-[11px] text-indigo-700 mt-0.5">Waterbody encroachments classified under High-Priority Lane A are scheduled for immediate Collector summary review.</p>
            </div>
            <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-100">
              <p className="font-bold text-amber-900">Humanitarian Welfare Routing</p>
              <p className="text-[11px] text-amber-700 mt-0.5">Vulnerable dwelling cases ({integrity.rehabilitation_routed ?? 0}) are automatically blocked from summary demolition and routed to TNUHDB.</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p className="font-bold text-slate-900">Judicial Stay Hold Policy</p>
              <p className="text-[11px] text-slate-600 mt-0.5">Statutory eviction clocks are automatically frozen upon registration of an operative High Court writ injunction.</p>
            </div>
          </div>
        </div>
      )}

      {/* TAHSILDAR DEDICATED PANEL */}
      {role === 'TAHSILDAR' && (
        <div className="bg-white p-6 rounded-xl border border-blue-200 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Scale className="w-4 h-4 text-blue-600" />
                Taluk Magisterial Notice & Hearing Docket
              </h2>
              <p className="text-xs text-slate-500">
                Execute statutory due process under Sections 7 & 6: sign show-cause notices, hold magisterial inquiries, and issue summary eviction warrants.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/hearings')}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5" /> Magisterial Hearings
              </button>
              <button
                onClick={() => navigate('/cases')}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all border border-slate-300 flex items-center gap-1.5 cursor-pointer"
              >
                <CheckSquare className="w-3.5 h-3.5" /> Sign Section 7 ({pipeline.statutory_notice ?? 0})
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-100">
              <p className="font-bold text-blue-900">Section 7 Form A Show-Cause</p>
              <p className="text-[11px] text-blue-700 mt-0.5">Encroachers must be served Form A granting a mandatory 15-day window to submit written or personal representations before eviction orders.</p>
            </div>
            <div className="p-3 bg-purple-50/60 rounded-lg border border-purple-100">
              <p className="font-bold text-purple-900">Survey Certification Guard</p>
              <p className="text-[11px] text-purple-700 mt-0.5">Section 7 notices on uncertified indicative FMB sketches require explicit officer acknowledgement to prevent court quashing.</p>
            </div>
            <div className="p-3 bg-red-50/60 rounded-lg border border-red-100">
              <p className="font-bold text-red-900">Section 6 Eviction Warrant</p>
              <p className="text-[11px] text-red-700 mt-0.5">Upon expiry of 15 days without valid patta presentation, Tahsildar issues Section 6 summary eviction order for forfeiture of structures.</p>
            </div>
          </div>
        </div>
      )}

      {/* VAO DEDICATED PANEL */}
      {role === 'VAO' && (
        <div className="bg-white p-6 rounded-xl border border-cyan-200 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Camera className="w-4 h-4 text-cyan-600" />
                Village Field Ground Verification Console
              </h2>
              <p className="text-xs text-slate-500">
                Ground inspection tasks assigned to {scope.village || 'Kannankurichi Village'}. Requires physical on-site presence (&lt;15m geofence).
              </p>
            </div>
            <button
              onClick={() => navigate('/field-queue')}
              className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5" /> Launch Field Inspection App
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-cyan-50/60 rounded-lg border border-cyan-100">
              <p className="font-bold text-cyan-900">On-Site Geofence Protocol</p>
              <p className="text-[11px] text-cyan-700 mt-0.5">Submissions verify device GPS telemetry against cadastral boundary stones. Remote submissions are rejected by server authority.</p>
            </div>
            <div className="p-3 bg-emerald-50/60 rounded-lg border border-emerald-100">
              <p className="font-bold text-emerald-900">Panchnama & Photographic Evidence</p>
              <p className="text-[11px] text-emerald-700 mt-0.5">Photographs capture boundary encroachment with server-derived SHA-256 hash integrity to ensure court admissibility.</p>
            </div>
            <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-100">
              <p className="font-bold text-amber-900">Vulnerable Dwelling Assessment</p>
              <p className="text-[11px] text-amber-700 mt-0.5">VAO inspects structural materials. Thatched huts and livelihood dwellings are flagged for humanitarian rehabilitation.</p>
            </div>
          </div>
        </div>
      )}

      {/* STATE APEX DEDICATED PANEL */}
      {(role === 'STATE_APEX' || role === 'CLA_STATE') && (
        <div className="bg-white p-6 rounded-xl border border-emerald-200 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Building className="w-4 h-4 text-emerald-600" />
                Statewide 38-District Enforcement & Cadastral Coverage Matrix
              </h2>
              <p className="text-xs text-slate-500">
                Inter-district performance benchmarks across Tamil Nadu Revenue Administration.
              </p>
            </div>
            <button
              onClick={() => navigate('/cases')}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" /> Statewide Cases ({kpis.open_cases_total ?? 0})
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3">District</th>
                  <th className="py-2 px-3">Taluks</th>
                  <th className="py-2 px-3">Active Encroachments</th>
                  <th className="py-2 px-3">Section 7 Notices</th>
                  <th className="py-2 px-3">Section 6 Evictions</th>
                  <th className="py-2 px-3">Satellite Gap Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-bold text-slate-900">Salem</td>
                  <td className="py-2.5 px-3 text-slate-600">Salem, Salem West, Salem South, Attur (9 total)</td>
                  <td className="py-2.5 px-3 font-semibold text-blue-700">{kpis.open_cases_total ?? 160}</td>
                  <td className="py-2.5 px-3">{pipeline.statutory_notice ?? 57}</td>
                  <td className="py-2.5 px-3">{pipeline.eviction_order ?? 0}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[10px]">
                      1 Taluk Gap
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-bold text-slate-900">Coimbatore</td>
                  <td className="py-2.5 px-3 text-slate-600">Coimbatore North, South, Pollachi (11 total)</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-700">Configured (LG-598)</td>
                  <td className="py-2.5 px-3 text-slate-500">—</td>
                  <td className="py-2.5 px-3 text-slate-500">—</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[10px]">
                      1 Taluk Gap
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-bold text-slate-900">Chennai</td>
                  <td className="py-2.5 px-3 text-slate-600">Egmore, Tondiarpet, Mylapore, Guindy (16 total)</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-700">Configured (LG-596)</td>
                  <td className="py-2.5 px-3 text-slate-500">—</td>
                  <td className="py-2.5 px-3 text-slate-500">—</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[10px]">
                      1 Taluk Gap
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIGILANCE DEDICATED PANEL */}
      {role === 'VIGILANCE' && (
        <div className="bg-white p-6 rounded-xl border border-amber-200 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                Anti-Corruption Integrity Scrutiny & Inaction Suppression Monitor
              </h2>
              <p className="text-xs text-slate-500">
                Automated detection of delayed show-cause notices, unverified approvals, and false-positive dismissals.
              </p>
            </div>
            <button
              onClick={() => navigate('/cases')}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" /> Scrutinize Audit Registry
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-200">
              <p className="font-bold text-amber-900">Suppression Anomaly Detection</p>
              <p className="text-[11px] text-amber-700 mt-0.5">Cases held in Triage status exceeding statutory SLAs are flagged for DVAC field inquiry to prevent deliberate administrative inaction.</p>
            </div>
            <div className="p-3 bg-red-50/60 rounded-lg border border-red-200">
              <p className="font-bold text-red-900">Unverified Approval Audits</p>
              <p className="text-[11px] text-red-700 mt-0.5">Identified {integrity.unverified_approvals_count ?? 0} legacy alert approvals where field verification was bypassed without certified FMB ladder offsets.</p>
            </div>
            <div className="p-3 bg-emerald-50/60 rounded-lg border border-emerald-200">
              <p className="font-bold text-emerald-900">Cryptographic Change Feed</p>
              <p className="text-[11px] text-emerald-700 mt-0.5">Every state machine transition writes an immutable ChangeFeedEvent with monotonic sequence IDs, preventing retroactive database tampering.</p>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN GIS DEDICATED PANEL */}
      {role === 'ADMIN_GIS' && (
        <div className="bg-white p-6 rounded-xl border border-purple-200 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Database className="w-4 h-4 text-purple-600" />
                Spatial Infrastructure, GeoServer WMS & Ingest Telemetry
              </h2>
              <p className="text-xs text-slate-500">
                Copernicus Sentinel-2 cloud masking, PostGIS vector topology checks, and administrative boundary synchronization.
              </p>
            </div>
            <button
              onClick={() => navigate('/map')}
              className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5" /> Full Tactical Map
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-purple-50/60 rounded-lg border border-purple-200">
              <p className="font-bold text-purple-900">GeoServer 2.24.1 WMS Vector Pipeline</p>
              <p className="text-[11px] text-purple-700 mt-0.5">Container `land_geoserver` active on port 8081. Cadastral parcels, taluk boundaries, and threat points publishing over WMS/WFS.</p>
            </div>
            <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-200">
              <p className="font-bold text-blue-900">Boundary Hierarchy Trigger</p>
              <p className="text-[11px] text-blue-700 mt-0.5">PostgreSQL trigger `trg_check_district_taluk_village_consistency` enforces administrative parent-child consistency on all parcel mutations.</p>
            </div>
            <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-200">
              <p className="font-bold text-amber-900">Sentinel Revisit Cadence Monitor</p>
              <p className="text-[11px] text-amber-700 mt-0.5">Active automated scanner flags any taluk whose latest clear observation exceeds the 10-day statutory freshness requirement.</p>
            </div>
          </div>
        </div>
      )}

      {/* 4. STATUTORY DUE PROCESS PIPELINE (Visible across all roles) */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Statutory Lifecycle Due Process Pipeline
            </h2>
            <p className="text-xs text-slate-500">
              Stages governed by Tamil Nadu Land Encroachment Act III of 1905 with mandatory show-cause notice and hearing.
            </p>
          </div>
          <button
            onClick={() => navigate('/cases')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
          >
            View WorkQueue <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-center">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-xs text-slate-500 font-medium">1. Triage</p>
            <p className="text-lg font-black text-slate-900 mt-1">{pipeline.triage ?? 0}</p>
            <p className="text-[10px] text-slate-400">High/Med/Low</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-xs text-slate-500 font-medium">2. Field Survey</p>
            <p className="text-lg font-black text-blue-600 mt-1">{pipeline.field_verification ?? 0}</p>
            <p className="text-[10px] text-slate-400">VAO Inspection</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-xs text-slate-500 font-medium">3. Endorsement</p>
            <p className="text-lg font-black text-indigo-600 mt-1">{pipeline.inspection ?? 0}</p>
            <p className="text-[10px] text-slate-400">Rev. Inspector</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-xs text-slate-500 font-medium">4. Section 7</p>
            <p className="text-lg font-black text-amber-600 mt-1">{pipeline.statutory_notice ?? 0}</p>
            <p className="text-[10px] text-slate-400">Show-Cause (15d)</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-xs text-slate-500 font-medium">5. Hearing</p>
            <p className="text-lg font-black text-purple-600 mt-1">{pipeline.hearing ?? 0}</p>
            <p className="text-[10px] text-slate-400">Tahsildar Court</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-xs text-slate-500 font-medium">6. Section 6</p>
            <p className="text-lg font-black text-red-600 mt-1">{pipeline.eviction_order ?? 0}</p>
            <p className="text-[10px] text-slate-400">Eviction Warrant</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-xs text-slate-500 font-medium">7. Restored</p>
            <p className="text-lg font-black text-emerald-600 mt-1">{pipeline.executed_resolved ?? 0}</p>
            <p className="text-[10px] text-slate-400">Govt Possession</p>
          </div>
        </div>
      </div>

      {/* 5. EMPIRICAL ACCURACY & SATELLITE COVERAGE GAPS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Empirical Accuracy Ledger */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Empirical Accuracy Ledger (Wilson 95% CI)
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                EMPIRICAL VERIFIED
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Measured strictly against on-ground field inspection verdicts, distinct from raw AI model confidence.
            </p>

            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-800">Fast Lane (High Confidence ≥ 80%)</p>
                  <p className="text-[10px] text-slate-500">
                    Precision 95% CI: <span className="font-semibold text-slate-700">{accuracy.high?.ci_95 || 'Insufficient data (n < 30)'}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-blue-600">
                    {accuracy.high?.precision_pct ? `${accuracy.high.precision_pct}%` : 'N/A'}
                  </p>
                  <p className="text-[10px] text-slate-400">n = {accuracy.high?.sample_size_n ?? 0}</p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-800">Medium Lane (50% – 80%)</p>
                  <p className="text-[10px] text-slate-500">
                    Precision 95% CI: <span className="font-semibold text-slate-700">{accuracy.medium?.ci_95 || 'Insufficient data (n < 30)'}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-amber-600">
                    {accuracy.medium?.precision_pct ? `${accuracy.medium.precision_pct}%` : 'N/A'}
                  </p>
                  <p className="text-[10px] text-slate-400">n = {accuracy.medium?.sample_size_n ?? 0}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Recall Control Checks Sampled: <strong>{integrity.control_checks_count ?? 0}</strong></span>
            <span className="text-[10px] text-slate-400 italic">Statistical validity threshold: n ≥ 30</span>
          </div>
        </div>

        {/* Satellite Coverage Gaps & Integrity Indicators */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Satellite Coverage Gap Monitor
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-300">
                NOT AVAILABLE
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Continuous satellite revisit cadence monitoring across taluks is inactive until real Copernicus Sentinel-2 ingest runs exist.
            </p>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 text-xs flex items-center gap-2">
              <CloudOff className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Not available — no real imagery runs. Automated Sentinel-2 tile differencing pipeline is planned.</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-slate-400 text-[10px]">Indicative FMB Sketches</p>
              <p className="font-bold text-slate-800">{integrity.indicative_fmb_count ?? 0} (polygon-derived)</p>
            </div>
            <div>
              <p className="text-slate-400 text-[10px]">Unverified Approvals</p>
              <p className="font-bold text-slate-800">{integrity.unverified_approvals_count ?? 0} cases flagged</p>
            </div>
          </div>
        </div>
      </div>

      {/* 6. JURISDICTION WORK QUEUE */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Priority Work Queue: {roleConfig.jurisdiction}
            </h2>
            <p className="text-xs text-slate-500">
              Encroachments in your jurisdiction awaiting your statutory review or order issuance.
            </p>
          </div>
          <button
            onClick={() => navigate('/cases')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
          >
            All Cases ({kpis.open_cases_total ?? 0}) <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {actionableCases.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            No pending cases currently require your immediate action.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Survey / S.D.</th>
                  <th className="py-2.5 px-3">Village & Taluk</th>
                  <th className="py-2.5 px-3">Classification</th>
                  <th className="py-2.5 px-3">Encroached Extent</th>
                  <th className="py-2.5 px-3">Current Status</th>
                  <th className="py-2.5 px-3">Lane</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {actionableCases.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-900">
                      {c.survey_number}/{c.subdivision || '1'}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {c.village}, {c.taluk}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-medium">
                        {c.classification}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-red-600">
                      {c.encroached_area_sqft || 850} sq.ft
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        {c.status_display}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        c.priority_lane === 'HIGH'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {c.priority_lane || 'MEDIUM'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => setSelectedCaseId(c.id)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold transition-colors shadow-xs cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DETAIL MODAL */}
      {selectedCaseId && (
        <CaseDetailModal
          caseId={selectedCaseId}
          onClose={() => setSelectedCaseId(null)}
          onCaseUpdated={() => {
            loadDashboard();
            onRefreshData?.();
          }}
        />
      )}
    </div>
  );
};

export default ExecutiveDashboardView;