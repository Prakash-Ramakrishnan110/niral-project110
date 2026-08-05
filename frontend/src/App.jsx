import React, { useState, useEffect, useCallback, useMemo } from 'react';
import MapView from './components/Map';
import { AIDetectionLogicView, FieldOpsMonitorView } from './TacticalViews';
import { GovernmentLandRegistryView } from './GovernmentRegistry';
import { RegistryApprovalsHub, RegistryProposalForm, RegistryCorrectionWizard } from './components/RegistryWorkflow';

import {
   ShieldAlert, LayoutDashboard, Map as MapIcon, AlertTriangle, Gavel, FileText, Settings, Bell, LogOut, Search,
   AlertCircle, Navigation, Download, Filter, CheckCircle2, Globe, Cpu, History, Users, Layers, Terminal, RefreshCcw,
   Activity, BarChart3, Scale, ClipboardCheck, CheckSquare, MapPin, Lock, BookOpen, PieChart, HardHat, Monitor, Cloud,
   HeartPulse, Key, MessageSquare, Camera, ChevronRight, ChevronLeft, Clock, MoreVertical, PlusCircle, UserPlus, TrendingUp, Zap, Edit3, FileEdit,
   Briefcase, Landmark, Book, HelpCircle, UserCheck, Image, ShieldCheck, Database, Link, Menu, X, Trash2, Eye, Shield, Award,
   Truck, Target, Upload, Fingerprint, Sun, Wind, Compass, Send
} from 'lucide-react';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import { toJpeg } from 'html-to-image';
import './index.css';

// Importing generated images
import img1 from './assets/encroachment_1_1776786774942.png';
import img2 from './assets/encroachment_2_1776786789882.png';
import img3 from './assets/encroachment_3_1776786808071.png';
import img4 from './assets/encroachment_4_1776786823398.png';
import site1 from './assets/site1.png';
import site2 from './assets/site2.png';
import site3 from './assets/site3.png';
import site4 from './assets/site4.png';
import field1 from './assets/field1.png';
import field2 from './assets/field2.png';
import field3 from './assets/field3.png';
import field4 from './assets/field4.png';
import field5 from './assets/field5.png';
import field6 from './assets/field6.png';
import field7 from './assets/field7.png';
import field8 from './assets/field8.png';

const fieldPhotos = [field1, field2, field3, field4, field5, field6, field7, field8];

const API_BASE = '/api';

const TN_DISTRICTS = [
   'Ariyalur', 'Chengalpattu', 'Chennai', 'Coimbatore', 'Cuddalore', 'Dharmapuri', 'Dindigul', 'Erode', 
   'Kallakurichi', 'Kancheepuram', 'Kanniyakumari', 'Karur', 'Krishnagiri', 'Madurai', 'Mayiladuthurai', 
   'Nagapattinam', 'Namakkal', 'Nilgiris', 'Perambalur', 'Pudukkottai', 'Ramanathapuram', 'Ranipet', 
   'Salem', 'Sivagangai', 'Tenkasi', 'Thanjavur', 'Theni', 'Thoothukudi', 'Tiruchirappalli', 'Tirunelveli', 
   'Tirupathur', 'Tiruppur', 'Tiruvallur', 'Tiruvannamalai', 'Tiruvarur', 'Vellore', 'Viluppuram', 'Virudhunagar'
];

const TN_TALUKS = {
   'Salem': ['Salem West', 'Salem South', 'Mettur', 'Omalur', 'Attur', 'Edappadi', 'Yercaud'],
   'Chennai': ['Egmore', 'Mylapore', 'T. Nagar', 'Ambattur', 'Alandur'],
   'Coimbatore': ['Coimbatore North', 'Coimbatore South', 'Pollachi', 'Mettupalayam'],
};

const ROLES = {
   ADMIN: { name: 'System Administrator', icon: ShieldAlert, color: 'text-blue-600', cat: 'Core' },
   COLLECTOR: { name: 'District Collector', icon: Monitor, color: 'text-blue-900', cat: 'Core' },
   TAHSILDAR: { name: 'Tahsildar', icon: Gavel, color: 'text-blue-700', cat: 'Core' },
   VAO: { name: 'Village Admin Officer', icon: Globe, color: 'text-green-600', cat: 'Core' },
   INSPECTOR: { name: 'Field Inspector', icon: Navigation, color: 'text-orange-600', cat: 'Core' },
   GIS: { name: 'GIS Analyst', icon: Layers, color: 'text-blue-500', cat: 'Technical' },
   SURVEYOR: { name: 'Surveyor', icon: HardHat, color: 'text-amber-600', cat: 'Technical' },
   AI: { name: 'AI Monitoring Officer', icon: Cpu, color: 'text-indigo-600', cat: 'Technical' },
   DATA_ENTRY: { name: 'Data Entry Operator', icon: Terminal, color: 'text-slate-500', cat: 'Technical' },
   LEGAL: { name: 'Legal Officer', icon: Scale, color: 'text-red-600', cat: 'Legal' },
   ENFORCEMENT: { name: 'Enforcement Officer', icon: ShieldAlert, color: 'text-red-700', cat: 'Legal' },
   ANALYTICS: { name: 'Analytics Officer', icon: PieChart, color: 'text-purple-600', cat: 'Intelligence' },
   PLANNING: { name: 'Planning Officer', icon: MapIcon, color: 'text-teal-600', cat: 'Intelligence' },
   HEAD: { name: 'Department Head', icon: Monitor, color: 'text-blue-800', cat: 'Intelligence' },
   SECURITY: { name: 'Security Officer', icon: Lock, color: 'text-slate-800', cat: 'Support' },
   API: { name: 'API Manager', icon: Key, color: 'text-sky-600', cat: 'Support' },
   TRAINING: { name: 'Training Officer', icon: BookOpen, color: 'text-lime-600', cat: 'Support' },
};

const CATEGORIES = ['Core', 'Technical', 'Legal', 'Intelligence', 'Support'];

const MENU_STRUCTURE = {
   ADMIN: [
      { type: 'header', label: 'COMMAND HUB' },
      { id: 'dashboard', icon: LayoutDashboard, label: 'Systems Overview' },
      { id: 'users', icon: Users, label: 'Node Management' },
      { id: 'field-monitor', icon: Monitor, label: 'Field Ops Monitor' },
      { id: 'government-registry', icon: Landmark, label: 'Govt Land Registry', badge: 'PROTECTED' },
      { id: 'gis-sentinel', icon: ShieldCheck, label: 'GIS Sentinel Mapping' },
      { id: 'directives', icon: Zap, label: 'Broadcast Orders' },
      { type: 'header', label: 'DATA & STORAGE' },
      { id: 'database', icon: Database, label: 'Database Hub' },
      { id: 'api-sync', icon: Link, label: 'API Node Sync' },
      { id: 'storage', icon: Cloud, label: 'Storage Metrics' },
      { type: 'header', label: 'SECURITY & PROTOCOLS' },
      { id: 'security', icon: Lock, label: 'Access Control' },
      { id: 'threats', icon: ShieldAlert, label: 'Threat Registry' },
      { id: 'audit', icon: History, label: 'Operational Audit' },
      { type: 'header', label: 'RESOURCES' },
      { id: 'satellites', icon: Globe, label: 'Satellite Feeds' },
      { id: 'liaison', icon: Briefcase, label: 'Inter-Agency Liaison' },
      { type: 'header', label: 'INTELLIGENCE' },
      { id: 'health', icon: HeartPulse, label: 'System Health' },
      { id: 'ai-monitoring', icon: Cpu, label: 'AI Engine Status' },
      { id: 'detection-logic', icon: Zap, label: 'Satellite Timeline', badge: 'LIVE' },
      { id: 'reports', icon: BarChart3, label: 'Strategic Reports' },
      { type: 'header', label: 'SYSTEM' },
      { id: 'system-config', icon: Settings, label: 'Advanced Config' },
      { id: 'settings', icon: Settings, label: 'Global Settings' },
   ],
   COLLECTOR: [
      { type: 'header', label: 'STRATEGIC COMMAND' },
      { id: 'dashboard', icon: LayoutDashboard, label: 'Executive Hub' },
      { id: 'map', icon: Globe, label: 'District Tactical Hub' },
      { id: 'detection-logic', icon: Zap, label: 'Satellite Timeline', badge: 'LIVE' },
      { id: 'analytics', icon: BarChart3, label: 'Operational Analytics' },
      { type: 'header', label: 'TACTICAL OPERATIONS' },
      { id: 'field-ops', icon: Monitor, label: 'Tactical Operations Hub' },
      { id: 'alerts', icon: AlertTriangle, label: 'Threat Intelligence', badge: 'CRITICAL' },
      { type: 'header', label: 'REGISTRY & GOVERNANCE' },
      { id: 'recovery', icon: Landmark, label: 'Revenue Recovery' },
      { id: 'legal', icon: Gavel, label: 'Legal Oversight' },
      { id: 'approvals', icon: CheckSquare, label: 'Executive Approvals' },
      { id: 'government-registry', icon: Landmark, label: 'Govt Land Registry', badge: 'PROTECTED' },
      { type: 'header', label: 'SYSTEM & SUPPORT' },
      { id: 'directives', icon: Zap, label: 'Issue Directives' },
      { id: 'settings', icon: Settings, label: 'Node Settings' },
   ],
   TAHSILDAR: [
      { type: 'header', label: 'TALUK COMMAND' },
      { id: 'dashboard', icon: LayoutDashboard, label: 'Taluk Intelligence' },
      { id: 'map', icon: Globe, label: 'GIS Zoning Matrix' },
      { id: 'detection-logic', icon: Zap, label: 'Satellite Timeline', badge: 'LIVE' },
      { type: 'header', label: 'TACTICAL OPERATIONS' },
      { id: 'field-monitor', icon: Monitor, label: 'Village Ops Monitor' },
      { id: 'alerts', icon: AlertTriangle, label: 'Tactical Queue' },
      { id: 'analytics', icon: BarChart3, label: 'Taluk Performance' },
      { type: 'header', label: 'EVIDENCE HUB' },
      { id: 'camera', icon: Camera, label: 'Intelligence Hub' },
      { type: 'header', label: 'REGISTRY & GOVERNANCE' },
      { id: 'recovery', icon: Landmark, label: 'Revenue Matrix' },
      { id: 'approvals', icon: CheckSquare, label: 'Registry Approvals Hub' },
      { id: 'government-registry', icon: Landmark, label: 'Govt Land Registry', badge: 'PROTECTED' },
      { type: 'header', label: 'SYSTEM & SUPPORT' },
      { id: 'directives', icon: Zap, label: 'Active Orders' },
      { id: 'settings', icon: Settings, label: 'Command Settings' },
   ],
   VAO: [
      { type: 'header', label: 'VILLAGE NODE' },
      { id: 'dashboard', icon: LayoutDashboard, label: 'Village Overview' },
      { id: 'map', icon: Globe, label: 'Village Map Hub' },
      { type: 'header', label: 'TACTICAL OPERATIONS' },
      { id: 'tasks', icon: ClipboardCheck, label: 'Field Tasks' },
      { id: 'alerts', icon: AlertTriangle, label: 'Encroachment Alerts', badge: '2' },
      { id: 'grievances', icon: MessageSquare, label: 'Public Grievances' },
      { type: 'header', label: 'REGISTRY & GOVERNANCE' },
      { id: 'government-registry', icon: Landmark, label: 'Govt Land Registry', badge: 'PROTECTED' },
      { id: 'updation', icon: RefreshCcw, label: 'Registry Updation Form' },
      { id: 'correction', icon: Edit3, label: 'Registry Correction Form' },
      { type: 'header', label: 'SYSTEM & SUPPORT' },
      { id: 'directives', icon: Zap, label: 'Executive Directives' },
      { id: 'settings', icon: Settings, label: 'Node Settings' },
   ],
   INSPECTOR: [
      { type: 'header', label: 'FIELD OPERATIONS' },
      { id: 'dashboard', icon: LayoutDashboard, label: 'Inspector Hub' },
      { id: 'tasks', icon: ClipboardCheck, label: 'Assigned Surveys' },
      { id: 'map', icon: Navigation, label: 'Field Navigation' },
      { type: 'header', label: 'EVIDENCE HUB' },
      { id: 'camera', icon: Camera, label: 'Evidence Capture' },
      { id: 'field-reports', icon: FileText, label: 'Submit Reports' },
      { id: 'government-registry', icon: Landmark, label: 'Govt Land Registry', badge: 'PROTECTED' },
      { type: 'header', label: 'SYSTEM & SUPPORT' },
      { id: 'directives', icon: Zap, label: 'Field Orders' },
      { id: 'settings', icon: Settings, label: 'Profile' },
   ],
   GIS: [
      { type: 'header', label: 'GIS TECHNICAL' },
      { id: 'dashboard', icon: LayoutDashboard, label: 'Spatial Analysis' },
      { id: 'map', icon: Globe, label: 'Layer Management' },
      { id: 'analytics', icon: BarChart3, label: 'GIS Analytics' },
      { id: 'settings', icon: Settings, label: 'Node Settings' },
   ],
   LEGAL: [
      { type: 'header', label: 'LEGAL GOVERNANCE' },
      { id: 'dashboard', icon: LayoutDashboard, label: 'Legal Hub' },
      { id: 'legal', icon: Gavel, label: 'Court Registry' },
      { id: 'cases', icon: Scale, label: 'Case Matrix' },
      { id: 'settings', icon: Settings, label: 'Node Settings' },
   ],
};

// Safety loop to ensure every role has a menu structure
Object.keys(ROLES).forEach(role => {
   if (!MENU_STRUCTURE[role]) {
      MENU_STRUCTURE[role] = [
         { type: 'header', label: 'General' },
         { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
         { id: 'settings', icon: Settings, label: 'Settings' },
      ];
   }
});

const Badge = ({ children, variant = 'info', className = '' }) => {
   const styles = {
      info: 'bg-blue-50 text-blue-600 border-blue-100',
      success: 'bg-green-50 text-green-600 border-green-100',
      danger: 'bg-red-50 text-red-600 border-red-100',
      warning: 'bg-orange-50 text-orange-600 border-orange-100',
      purple: 'bg-purple-50 text-purple-600 border-purple-100',
   };
   return <span className={`px-2 py-0.5 rounded-none border text-[9px] font-black uppercase tracking-wider ${styles[variant] || styles.info} ${className}`}>{children}</span>;
};

const OfficerAssignmentModal = ({ isOpen, onClose, onAssign, type, alertId, alerts = [] }) => {
   const currentAlert = alerts.find(a => String(a.id) === String(alertId));
   const getOfficers = () => {
      if (type === 'TAHSILDAR') return [{n: 'Tahsildar - Mettur', id: 'OFF-01', p: 'HIGH'}, {n: 'Tahsildar - Omalur', id: 'OFF-02', p: 'STABLE'}, {n: 'Tahsildar - Salem West', id: 'OFF-03', p: 'BUSY'}, {n: 'Tahsildar - Attur', id: 'OFF-04', p: 'HIGH'}];
      if (type === 'VAO') return [{n: 'VAO - Mettur Node', id: 'OFF-11', p: 'HIGH'}, {n: 'VAO - Salem West 44', id: 'OFF-12', p: 'HIGH'}, {n: 'VAO - Omalur North', id: 'OFF-13', p: 'STABLE'}, {n: 'VAO - Attur East', id: 'OFF-14', p: 'HIGH'}];
      return [{n: 'Inspector - Rajesh', id: 'OFF-21', p: 'HIGH'}, {n: 'Inspector - Senthil', id: 'OFF-22', p: 'HIGH'}, {n: 'Inspector - Anitha', id: 'OFF-23', p: 'BUSY'}, {n: 'Inspector - Kumar', id: 'OFF-24', p: 'HIGH'}];
   };
   const officers = getOfficers();

   if (!isOpen) return null;

   return (
      <div className="fixed inset-0 z-[5000] flex justify-end bg-black/5 backdrop-blur-[1px]">
         <div className="bg-white w-full max-w-lg h-full shadow-2xl flex flex-col border-l border-slate-300 animate-in slide-in-from-right duration-200">
            
            {/* Header: Zero-Margin Tactical Identity */}
            <div className="px-4 py-3 border-b border-slate-300 flex justify-between items-center bg-slate-50">
               <div className="flex items-center gap-3">
                  <div className="bg-blue-600 w-10 h-10 flex items-center justify-center text-white"><ShieldCheck size={20} /></div>
                  <div>
                     <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest leading-none">MISSION_AUTHORIZATION</h2>
                     <p className="text-[8px] text-blue-600 font-bold uppercase mt-1 tracking-widest">SIGNAL_UPLINK: ACTIVE • NODE_{alertId?.substring(0, 4)}</p>
                  </div>
               </div>
               <button onClick={onClose} className="p-2 border border-slate-300 hover:bg-red-50 hover:text-red-600 transition-all text-slate-400"><X size={16} /></button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
               {/* Intel Matrix: High-Density Recon */}
               {currentAlert && (
                  <div className="border-b border-slate-300">
                     <div className="grid grid-cols-12">
                        <div className="col-span-5 aspect-square bg-slate-200 border-r border-slate-300">
                           <img src={currentAlert.img || img1} className="w-full h-full object-cover brightness-90 hover:brightness-100 transition-all" alt="Recon" />
                        </div>
                        <div className="col-span-7 p-3 flex flex-col justify-between bg-white">
                           <div>
                              <div className="flex justify-between items-start">
                                 <Badge variant="danger" className="rounded-none bg-red-600 text-white border-none text-[8px] font-black px-2 py-0.5">CRITICAL_THREAT</Badge>
                                 <p className="text-[8px] font-mono font-black text-slate-400">{currentAlert.position ? `${currentAlert.position[0].toFixed(4)}N / ${currentAlert.position[1].toFixed(4)}E` : 'GPS_LOCKED'}</p>
                              </div>
                              <h3 className="text-lg font-black text-slate-900 uppercase leading-none mt-3 tracking-tighter">SURVEY_{currentAlert.parcel_details}</h3>
                              <p className="text-blue-600 text-[9px] font-black uppercase mt-1 tracking-widest">{currentAlert.alert_type}</p>
                           </div>
                           <div className="pt-3 border-t border-slate-100 flex gap-4">
                              <div><p className="text-[7px] font-black text-slate-400 uppercase">TALUK</p><p className="text-[9px] font-black text-slate-800 uppercase">{currentAlert.taluk || 'SALEM_W'}</p></div>
                              <div><p className="text-[7px] font-black text-slate-400 uppercase">ACCURACY</p><p className="text-[9px] font-black text-slate-800 uppercase">98.2%</p></div>
                           </div>
                        </div>
                     </div>

                     {/* Tactical Intel Grid */}
                     <div className="grid grid-cols-4 bg-slate-300 gap-px border-t border-slate-300">
                        {[
                           { l: 'VALUE', v: `₹${(Math.random() * 20 + 5).toFixed(1)}Cr` },
                           { l: 'GRADE', v: 'PERMANENT' },
                           { l: 'DENSITY', v: 'HIGH' },
                           { l: 'RISK', v: 'LVL_5' }
                        ].map((stat, i) => (
                           <div key={i} className="bg-white p-2">
                              <p className="text-[7px] font-black text-slate-400 uppercase mb-0.5">{stat.l}</p>
                              <p className="text-[10px] font-black text-slate-900 uppercase leading-none">{stat.v}</p>
                           </div>
                        ))}
                     </div>
                  </div>
               )}

               {/* Officer Tactical Selection: Command List */}
               <div className="bg-slate-50 p-3 border-b border-slate-300">
                  <h4 className="text-[9px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                     <Target size={12} className="text-blue-600" /> DISPATCH_QUEUE_AVAILABILITY
                  </h4>
               </div>
               
               <div className="bg-white">
                  {officers.map(off => (
                     <button 
                        key={off.id}
                        onClick={() => onAssign(off.n)}
                        className="w-full px-4 py-3 border-b border-slate-100 hover:bg-blue-50/50 flex items-center justify-between group transition-all"
                     >
                        <div className="flex items-center gap-4">
                           <div className="w-8 h-8 bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all font-mono text-[10px] font-black">
                              {off.id}
                           </div>
                           <div className="text-left">
                              <p className="text-xs font-black text-slate-900 uppercase tracking-tight leading-none">{off.n}</p>
                              <div className="flex items-center gap-3 mt-1.5">
                                 <div className="flex items-center gap-1.5">
                                    <div className={`w-1.5 h-1.5 ${off.p === 'HIGH' ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                                    <p className="text-[8px] font-black text-slate-400 uppercase">{off.p}_READINESS</p>
                                 </div>
                                 <p className="text-[8px] font-bold text-blue-600 uppercase">LIVE_GPS_ACTIVE</p>
                              </div>
                           </div>
                        </div>
                        <div className="flex items-center gap-3">
                           <div className="text-right hidden group-hover:block animate-in slide-in-from-right-1">
                              <p className="text-[7px] font-black text-blue-600 uppercase">AUTHORIZE</p>
                           </div>
                           <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-600 transition-all" />
                        </div>
                     </button>
                  ))}
               </div>

               {/* Operational Directives */}
               <div className="p-4 bg-white">
                  <h5 className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-3">MISSION_DIRECTIVES</h5>
                  <div className="space-y-2">
                     {[
                        '1. PHYSICAL_ON_SITE_VERIFICATION',
                        '2. CAPTURE_GEOTAGGED_EVIDENCE_NODE',
                        '3. INITIATE_RESOLUTION_PROTOCOL_V4'
                     ].map((d, i) => (
                        <p key={i} className="text-[9px] font-bold text-slate-600 uppercase tracking-tight">{d}</p>
                     ))}
                  </div>
               </div>
            </div>

            {/* Footer: Command Summary */}
            <div className="p-3 bg-slate-900 flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-blue-600 text-white"><Monitor size={16} /></div>
                  <div>
                     <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">COMMAND_HUB</p>
                     <p className="text-[10px] font-black text-white uppercase mt-1">SECURE_CHANNEL_SLM</p>
                  </div>
               </div>
               <div className="text-right">
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">UPLINK_STRENGTH</p>
                  <div className="flex gap-0.5 justify-end mt-1">
                     {[1,1,1,1,0.3].map((v, i) => <div key={i} className={`w-3 h-1 ${v === 1 ? 'bg-green-500' : 'bg-slate-700'}`}></div>)}
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
};

// --- MINI COMPONENTS ---

const Card = ({ children, title, icon: Icon, badge }) => (
   <div className="bg-white border border-slate-200 rounded-none p-4 shadow-sm flex flex-col h-full animate-in fade-in duration-300">
      {(title || Icon) && (
         <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
               {Icon && <div className="p-2 bg-slate-50 text-blue-600 rounded-none"><Icon size={18} /></div>}
               {title && <h3 className="font-bold text-slate-800 uppercase text-[10px] tracking-widest">{title}</h3>}
            </div>
            {badge && <Badge variant={badge.variant}>{badge.text}</Badge>}
         </div>
      )}
      <div className="flex-1">{children}</div>
   </div>
);

const ProgressBar = ({ progress, color = 'bg-blue-600' }) => (
   <div className="w-full bg-slate-100 h-1.5 rounded-none overflow-hidden">
      <div className={`h-full ${color} transition-all duration-1000`} style={{ width: `${progress}%` }}></div>
   </div>
);

// --- ADMIN SPECIFIC VIEWS ---

const DistrictAnalyticsView = () => (
   <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* Executive Overview KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         {[
            { t: 'Total Area Scanned', v: '14,242 Ha', i: Globe, c: 'text-blue-600' },
            { t: 'Encroachment Vol', v: '₹24.2 Cr', i: TrendingUp, c: 'text-red-600' },
            { t: 'Resolution Rate', v: '92.4%', i: Activity, c: 'text-green-600' },
            { t: 'Avg Field Response', v: '4.2 Hrs', i: Zap, c: 'text-indigo-600' }
         ].map((k, i) => (
            <div key={i} className="bg-white p-4 rounded-none border border-slate-200 shadow-sm flex items-center gap-4">
               <div className={`p-3 rounded-none bg-slate-50 ${k.c}`}><k.i size={20} /></div>
               <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{k.t}</p>
                  <h4 className="text-xl font-black text-slate-900 tracking-tighter">{k.v}</h4>
               </div>
            </div>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
         {/* Taluk-wise Performance Matrix */}
         <div className="lg:col-span-2 space-y-6">
            <Card title="Taluk-wise Encroachment Trends" icon={BarChart3}>
               <div className="h-64 flex items-end gap-3 px-4 pt-8">
                  {[
                     { t: 'Salem West', v: 85, c: 'bg-blue-600' },
                     { t: 'Salem East', v: 45, c: 'bg-slate-200' },
                     { t: 'Mettur', v: 92, c: 'bg-blue-600' },
                     { t: 'Attur', v: 30, c: 'bg-slate-200' },
                     { t: 'Omalur', v: 75, c: 'bg-blue-600' },
                     { t: 'Yercaud', v: 15, c: 'bg-slate-200' },
                     { t: 'Valapady', v: 55, c: 'bg-blue-600' }
                  ].map((d, i) => (
                     <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                        <div className="w-full relative">
                           <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] px-2 py-1 rounded-none opacity-0 group-hover:opacity-100 transition-all font-black">{d.v}%</div>
                           <div className={`${d.c} w-full rounded-none transition-all duration-700`} style={{ height: `${d.v * 1.8}px` }}></div>
                        </div>
                        <span className="text-[8px] font-black text-slate-400 uppercase rotate-45 lg:rotate-0 truncate w-full text-center">{d.t}</span>
                     </div>
                  ))}
               </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <Card title="Area Distribution Matrix" icon={PieChart}>
                  <div className="space-y-4 py-2">
                     {[
                        { l: 'Residential Encroachment', v: 42, c: 'bg-red-500' },
                        { l: 'Commercial Structures', v: 28, c: 'bg-orange-400' },
                        { l: 'Agricultural Incursion', v: 18, c: 'bg-green-500' },
                        { l: 'Industrial Encroachment', v: 12, c: 'bg-blue-500' }
                     ].map((item, i) => (
                        <div key={i} className="space-y-2">
                           <div className="flex justify-between text-[9px] font-black uppercase">
                              <span className="text-slate-500">{item.l}</span>
                              <span className="text-slate-900">{item.v}%</span>
                           </div>
                           <div className="h-1.5 w-full bg-slate-50 rounded-none overflow-hidden">
                              <div className={`h-full ${item.c}`} style={{ width: `${item.v}%` }}></div>
                           </div>
                        </div>
                     ))}
                  </div>
               </Card>
               <Card title="Monthly Resolution Speed" icon={Clock}>
                  <div className="flex flex-col items-center justify-center py-6">
                     <div className="w-32 h-32 rounded-none border-[10px] border-slate-50 relative flex items-center justify-center">
                        <div className="absolute inset-0 rounded-none border-[10px] border-indigo-600 border-r-transparent border-b-transparent animate-spin-slow"></div>
                        <div className="text-center">
                           <p className="text-2xl font-black text-slate-900">4.2h</p>
                           <p className="text-[8px] font-bold text-slate-400 uppercase">AVG SPEED</p>
                        </div>
                     </div>
                     <p className="mt-6 text-[9px] text-slate-400 font-bold uppercase text-center">Fastest: Salem West (1.8h)</p>
                  </div>
               </Card>
            </div>
         </div>

         {/* Tactical Intelligence Sidebar */}
         <div className="space-y-6">
            <Card title="Critical TALUK Risk" icon={ShieldAlert}>
               <div className="space-y-3">
                  {[
                     { n: 'Mettur Node', r: 'HIGH', l: 92, c: 'text-red-600' },
                     { n: 'Salem East', r: 'MEDIUM', l: 54, c: 'text-orange-500' },
                     { n: 'Attur North', r: 'STABLE', l: 12, c: 'text-green-600' }
                  ].map((t, i) => (
                     <div key={i} className="p-6 bg-slate-50 rounded-none border border-slate-100">
                        <div className="flex justify-between items-center mb-3">
                           <span className="text-[10px] font-black text-slate-800 uppercase">{t.n}</span>
                           <Badge variant={t.r === 'HIGH' ? 'danger' : 'info'}>{t.r}</Badge>
                        </div>
                        <div className="flex items-center gap-3">
                           <div className="flex-1 h-1 bg-slate-200 rounded-none overflow-hidden"><div className={`h-full ${t.c.replace('text', 'bg')}`} style={{ width: `${t.l}%` }}></div></div>
                           <span className={`text-[10px] font-black ${t.c}`}>{t.l}%</span>
                        </div>
                     </div>
                  ))}
               </div>
            </Card>

            <div className="bg-slate-900 rounded-none p-6 text-white text-center shadow-xl shadow-slate-200">
               <div className="w-12 h-12 bg-blue-600 rounded-none flex items-center justify-center mx-auto mb-4"><Download size={24} /></div>
               <h5 className="text-[11px] font-black uppercase tracking-widest mb-2">Quarterly Report</h5>
               <p className="text-[9px] text-slate-400 font-bold uppercase mb-6 leading-relaxed">Full district spatial audit for Q1 2026 is ready for download.</p>
               <button className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-none text-[9px] font-black uppercase tracking-widest transition-all">Export PDF Audit</button>
            </div>
         </div>
      </div>
   </div>
);

const SystemHealthView = () => (

   <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <Card title="CPU Core Load" icon={Activity} badge={{ text: 'Stable', variant: 'info' }}>
            <div className="mt-2">
               <div className="flex justify-between items-end mb-2">
                  <span className="text-2xl font-black text-slate-900">24%</span>
                  <span className="text-[10px] font-bold text-slate-400">8 CORES</span>
               </div>
               <ProgressBar progress={24} />
               <div className="flex gap-1 mt-4 h-12 items-end">
                  {[40, 20, 35, 45, 20, 15, 30, 25, 40, 50, 30, 20].map((h, i) => (
                     <div key={i} className="flex-1 bg-blue-100 rounded-none-t-none animate-in slide-in-from-bottom duration-500" style={{ height: `${h}%`, animationDelay: `${i * 50}ms` }}></div>
                  ))}
               </div>
            </div>
         </Card>
         <Card title="Memory Node" icon={Database} badge={{ text: 'Optimized', variant: 'success' }}>
            <div className="mt-2">
               <div className="flex justify-between items-end mb-2">
                  <span className="text-2xl font-black text-slate-900">4.2 GB</span>
                  <span className="text-[10px] font-bold text-slate-400">OF 16GB</span>
               </div>
               <ProgressBar progress={30} color="bg-indigo-500" />
               <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-[10px] font-bold uppercase"><span className="text-slate-400">Database</span><span className="text-slate-800">1.2 GB</span></div>
                  <div className="flex justify-between text-[10px] font-bold uppercase"><span className="text-slate-400">Cache</span><span className="text-slate-800">0.8 GB</span></div>
               </div>
            </div>
         </Card>
         <Card title="Network Traffic" icon={RefreshCcw} badge={{ text: 'High Speed', variant: 'info' }}>
            <div className="mt-2">
               <div className="flex justify-between items-end mb-2">
                  <span className="text-2xl font-black text-slate-900">142 Mbps</span>
                  <span className="text-[10px] font-bold text-slate-400">INBOUND</span>
               </div>
               <div className="relative h-20 w-full mt-2">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 100 20">
                     <path d="M0 20 L0 10 L10 15 L20 5 L30 12 L40 2 L50 8 L60 0 L70 10 L80 4 L90 12 L100 5 L100 20 Z" fill="url(#grad1)" className="animate-in fade-in duration-1000" />
                     <defs><linearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" style={{ stopColor: 'rgb(59, 130, 246)', stopOpacity: 0.5 }} /><stop offset="100%" style={{ stopColor: 'rgb(59, 130, 246)', stopOpacity: 0 }} /></linearGradient></defs>
                  </svg>
               </div>
            </div>
         </Card>
         <Card title="Storage Node" icon={HardHat} badge={{ text: '84% Free', variant: 'success' }}>
            <div className="mt-2">
               <div className="flex justify-between items-end mb-2">
                  <span className="text-2xl font-black text-slate-900">1.4 TB</span>
                  <span className="text-[10px] font-bold text-slate-400">GIS DATA</span>
               </div>
               <ProgressBar progress={16} color="bg-orange-500" />
               <p className="text-[9px] text-slate-400 uppercase font-bold mt-4 tracking-tighter">Connected: Salem-HQ-Storage-01</p>
            </div>
         </Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
         <div className="lg:col-span-2 space-y-6">
            <Card title="Global Node Latency" icon={Globe}>
               <div className="space-y-4">
                  {[
                     { n: 'Salem HQ', l: '12ms', s: 'OPTIMAL' },
                     { n: 'Mettur Node', l: '45ms', s: 'STABLE' },
                     { n: 'Chennai Cloud', l: '122ms', s: 'LAG' },
                     { n: 'Omalur Edge', l: '22ms', s: 'OPTIMAL' }
                  ].map((n, i) => (
                     <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-none border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">{n.n}</span>
                        <div className="flex items-center gap-4">
                           <div className="h-1 w-24 bg-slate-200 rounded-none overflow-hidden"><div className="h-full bg-blue-600" style={{ width: n.s === 'LAG' ? '80%' : '20%' }}></div></div>
                           <span className={`text-[9px] font-black ${n.s === 'LAG' ? 'text-orange-500' : 'text-green-600'}`}>{n.l}</span>
                        </div>
                     </div>
                  ))}
               </div>
            </Card>
            <Card title="Service Health Matrix" icon={ShieldCheck}>
               <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {['Database', 'Auth Node', 'GIS Engine', 'AI Pipeline', 'GeoServer', 'API Gateway', 'CDN Node', 'Audit Engine', 'Search'].map((s, i) => (
                     <div key={i} className="p-4 bg-slate-50 border border-slate-100 rounded-none flex items-center gap-3">
                        <div className="w-2 h-2 rounded-none bg-green-500 animate-pulse"></div>
                        <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">{s}</span>
                        <span className="ml-auto text-[9px] font-bold text-green-600">UP</span>
                     </div>
                  ))}
               </div>
            </Card>
         </div>
         <div className="space-y-6">
            <Card title="Security Firewall" icon={Lock}>
               <div className="text-center py-4">
                  <div className="w-20 h-20 bg-green-50 rounded-none flex items-center justify-center text-green-600 mx-auto mb-4 border-4 border-white shadow-sm"><Shield size={32} /></div>
                  <h4 className="text-xs font-black uppercase tracking-tight text-slate-900">Shield Active</h4>
                  <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Blocked: 1,442 Ingress Threats</p>
               </div>
               <div className="mt-4 pt-4 border-t border-slate-50 space-y-2">
                  <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase"><span>SQL Injection</span><span>0 detected</span></div>
                  <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase"><span>Brute Force</span><span>Locked (IP: 14.x)</span></div>
               </div>
            </Card>
            <Card title="Live Server Logs" icon={Terminal}>
               <div className="space-y-3 font-mono">
                  {[
                     { t: '15:22:01', m: 'Auth: User login successful', s: 'info' },
                     { t: '15:21:44', m: 'GIS: Tile rendered in 42ms', s: 'success' },
                     { t: '15:20:12', m: 'AI: New detection high conf', s: 'warning' }
                  ].map((l, i) => (
                     <div key={i} className="flex gap-3 text-[10px] border-b border-slate-50 pb-2">
                        <span className="text-slate-400">{l.t}</span>
                        <span className="text-slate-700 truncate">{l.m}</span>
                     </div>
                  ))}
               </div>
            </Card>
         </div>
      </div>
      <Card title="Uptime Reliability Heatmap" icon={History}>
         <div className="grid grid-cols-12 sm:grid-cols-24 gap-1 h-20">
            {Array.from({ length: 48 }).map((_, i) => (
               <div key={i} className={`flex-1 rounded-none ${i === 12 || i === 40 ? 'bg-orange-400' : 'bg-green-500'}`} title={`Hour ${i}: 99.9%`}></div>
            ))}
         </div>
         <div className="flex justify-between mt-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">
            <span>48 Hours Ago</span>
            <span>Today (Live)</span>
         </div>
      </Card>
   </div>
);



const CameraView = ({ alerts = [] }) => {
   const [selectedEvidence, setSelectedEvidence] = useState(null);

   const evidenceItems = alerts.filter(a => a.img);

   return (
      <div className="space-y-8 animate-in fade-in duration-1000">
         {/* Premium Header */}
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
               <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic flex items-center gap-4">
                  Intelligence Hub
                  <span className="text-[10px] bg-blue-600 text-white px-3 py-1 rounded-none not-italic tracking-[0.3em] font-black shadow-lg shadow-blue-200">SECURE_CHANNEL</span>
               </h2>
               <div className="flex items-center gap-3 mt-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-none animate-ping"></div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.4em]">Active Field Synchronization · {evidenceItems.length} Tactical Records</p>
               </div>
            </div>
            <div className="flex bg-slate-900 p-2 rounded-none shadow-2xl border border-white/10">
               <button className="px-8 py-4 bg-blue-600 text-white rounded-none text-[10px] font-black uppercase tracking-[0.3em] hover:bg-blue-500 transition-all flex items-center gap-3 shadow-xl group">
                  <Camera size={16} className="group-hover:rotate-12 transition-transform" /> START_RECON_CAPTURE
               </button>
            </div>
         </div>

         <div className="grid grid-cols-12 gap-8">
            <div className="col-span-12 lg:col-span-8">
               <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {evidenceItems.map(alert => (
                           <div 
                              key={alert.id} 
                              onClick={() => setSelectedEvidence(alert)}
                              className={`group relative rounded-none overflow-hidden border-2 cursor-pointer transition-all duration-500 bg-white shadow-sm hover:shadow-2xl hover:-translate-y-2 ${selectedEvidence?.id === alert.id ? 'border-blue-600 neon-glow ring-8 ring-blue-50/50' : 'border-slate-100'}`}
                           >
                              {/* High-Tech Image Container */}
                              <div className="relative aspect-[4/3] overflow-hidden bg-slate-900">
                                 <img src={alert.img} className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-110 opacity-90 group-hover:opacity-100" />
                                 
                                 {/* HUD Elements */}
                                 <div className="hud-corner hud-tl"></div>
                                 <div className="hud-corner hud-tr"></div>
                                 <div className="hud-corner hud-bl"></div>
                                 <div className="hud-corner hud-br"></div>
                                 <div className="digital-grain"></div>
                                 <div className="scanline opacity-0 group-hover:opacity-100"></div>

                                 {/* Status Badge */}
                                 <div className="absolute top-4 left-4 flex gap-2">
                                    <div className="bg-blue-600 text-white text-[7px] font-black px-2 py-1 rounded-none tracking-[0.2em] uppercase">Secured</div>
                                    <div className="bg-black/60 backdrop-blur-md text-white text-[7px] font-black px-2 py-1 rounded-none tracking-[0.2em] uppercase border border-white/10">TN-RECON</div>
                                 </div>

                                 {/* Confidence Meter */}
                                 <div className="absolute bottom-4 left-4 right-4">
                                    <div className="flex justify-between items-end mb-1">
                                       <p className="text-[7px] font-black text-white/70 uppercase tracking-widest italic">Match_Confidence</p>
                                       <p className="text-[10px] font-black text-blue-400 italic">{(alert.confidence_score * 100).toFixed(0)}%</p>
                                    </div>
                                    <div className="h-[2px] bg-white/20 rounded-none overflow-hidden">
                                       <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${alert.confidence_score * 100}%` }}></div>
                                    </div>
                                 </div>
                              </div>

                              {/* Detailed Intel Footer */}
                              <div className="p-5">
                                 <div className="flex items-center gap-3 mb-4">
                                    <div className={`w-10 h-10 rounded-none flex items-center justify-center border-2 ${selectedEvidence?.id === alert.id ? 'bg-blue-600 border-blue-400 text-white animate-pulse' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                                       <Shield size={18} />
                                    </div>
                                    <div>
                                       <h4 className="text-xs font-black text-slate-900 uppercase tracking-tighter truncate w-32">{alert.alert_type}</h4>
                                       <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Asset_ID: #882-{alert.id}</p>
                                    </div>
                                 </div>

                                 <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                                    <div>
                                       <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">Survey Node</p>
                                       <p className="text-[10px] font-black text-slate-900">{alert.parcel_details}</p>
                                    </div>
                                    <div className="text-right">
                                       <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">Taluk Sector</p>
                                       <p className="text-[10px] font-black text-slate-900">{alert.taluk}</p>
                                    </div>
                                 </div>
                              </div>

                              {/* Selection Glow */}
                              {selectedEvidence?.id === alert.id && (
                                 <div className="absolute inset-x-0 bottom-0 h-1.5 bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.8)]"></div>
                              )}
                           </div>
                        ))}
                     </div>
                  </div>

            {/* Strategic Intelligence Sidebar */}
            <div className="col-span-12 lg:col-span-4">
               {selectedEvidence ? (
                  <div className="bg-white rounded-none p-6 shadow-2xl border border-slate-100 sticky top-6 animate-in slide-in-from-right-10 duration-700 max-h-[calc(100vh-12rem)] overflow-y-auto custom-scrollbar">
                     <div className="flex justify-between items-center mb-8">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-slate-50 rounded-none flex items-center justify-center text-blue-600 border border-slate-100"><Layers size={20} /></div>
                           <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Intelligence_Record</p>
                        </div>
                        <button onClick={() => setSelectedEvidence(null)} className="text-slate-300 hover:text-red-500 transition-all"><X size={20} /></button>
                     </div>

                     <div className="rounded-none overflow-hidden shadow-xl mb-8 group relative">
                        <img src={selectedEvidence.img} className="w-full object-cover aspect-square transition-all duration-700" />
                        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-none border border-white/10">
                           <p className="text-[7px] font-black text-white uppercase tracking-[0.3em]">Live_Feed_Static</p>
                        </div>
                     </div>

                     <div className="space-y-6">
                        <div>
                           <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-1">{selectedEvidence.alert_type}</h3>
                           <p className="text-[9px] font-bold text-blue-600 uppercase tracking-widest">Salem West Node · Priority Sector</p>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                           {[
                              { l: 'Administrative Zone', v: `${selectedEvidence.village || 'N/A'} Village, ${selectedEvidence.taluk || 'N/A'} Taluk`, i: MapPin },
                              { l: 'Survey Coordinate', v: `Section ${selectedEvidence.parcel_details}`, i: Target },
                              { l: 'Geo-spatial Lock', v: `${selectedEvidence.position[0].toFixed(6)}° N, ${selectedEvidence.position[1].toFixed(6)}° E`, i: Navigation },
                              { l: 'Mission Status', v: selectedEvidence.status, i: AlertCircle },
                              { l: 'AI Match Accuracy', v: `${(selectedEvidence.confidence_score * 100).toFixed(1)}% Confidence`, i: Cpu },
                           ].map((item, i) => (
                              <div key={i} className="flex items-center gap-4 p-6 bg-slate-50 rounded-none border border-slate-100 hover:border-blue-100 transition-all group">
                                 <div className="p-2 bg-white rounded-none text-slate-400 group-hover:text-blue-600 transition-all shadow-sm"><item.i size={14} /></div>
                                 <div>
                                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">{item.l}</p>
                                    <p className="text-[10px] font-black text-slate-800">{item.v}</p>
                                 </div>
                              </div>
                           ))}
                        </div>

                        {selectedEvidence.verification && (
                           <div className="p-6 bg-green-50/50 rounded-none border border-green-100 space-y-4 shadow-sm">
                              <p className="text-[8px] font-black uppercase tracking-widest text-green-700">Field Evidence Submitted</p>
                              <div className="grid grid-cols-2 gap-4">
                                 <div>
                                    <p className="text-[6px] text-slate-400 uppercase font-bold mb-1">Field Officer</p>
                                    <p className="text-[10px] font-black text-slate-900">{selectedEvidence.verification.officer_name}</p>
                                 </div>
                                 <div>
                                    <p className="text-[6px] text-slate-400 uppercase font-bold mb-1">Time of Submission</p>
                                    <p className="text-[10px] font-black text-slate-900">{new Date(selectedEvidence.verification.verified_at).toLocaleString()}</p>
                                 </div>
                              </div>
                              <div className="pt-2">
                                 <p className="text-[6px] text-slate-400 uppercase font-bold mb-1">Officer Notes</p>
                                 <p className="text-[9px] leading-relaxed text-slate-700 italic">"{selectedEvidence.verification.remarks}"</p>
                              </div>
                           </div>
                        )}

                        {/* Tactical Analysis Suite */}
                        <div className="p-6 bg-slate-900 rounded-none text-white space-y-4 shadow-xl border border-white/5">
                           <div className="flex justify-between items-center">
                              <p className="text-[8px] font-black uppercase tracking-widest text-blue-400">Tactical Analysis</p>
                              <div className="flex gap-1">
                                 {[1,2,3,4,5].map(x => <div key={x} className="w-1 h-1 bg-blue-500 rounded-none animate-pulse" style={{animationDelay: `${x*200}ms`}}></div>)}
                              </div>
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                              <div>
                                 <p className="text-[6px] text-slate-400 uppercase font-bold mb-1">Latency</p>
                                 <p className="text-[10px] font-black">24ms</p>
                              </div>
                              <div>
                                 <p className="text-[6px] text-slate-400 uppercase font-bold mb-1">Encryption</p>
                                 <p className="text-[10px] font-black">AES-256</p>
                              </div>
                           </div>
                           <div className="pt-2">
                              <p className="text-[6px] text-slate-400 uppercase font-bold mb-1">Observation Summary</p>
                              <p className="text-[9px] leading-relaxed text-slate-300">Unauthorized footprint detected within buffer zone. Thermal signature indicates recent activity. Geo-fencing alerts triggered at node level.</p>
                           </div>
                        </div>

                        <div className="pt-6 border-t border-slate-50 flex gap-3">
                           <button className="flex-1 py-4 bg-blue-600 text-white rounded-none font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-blue-700 transition-all">Submit Evidence</button>
                           <button 
                              onClick={() => {
                                 const pdf = new jsPDF('p', 'mm', 'a4');
                                 pdf.setFont("helvetica", "bold");
                                 pdf.setFontSize(22);
                                 pdf.text("GOVERNMENT OF TAMIL NADU", 105, 20, { align: "center" });
                                 pdf.setFontSize(14);
                                 pdf.text("Department of Revenue and Disaster Management", 105, 28, { align: "center" });
                                 
                                 pdf.setLineWidth(0.5);
                                 pdf.line(20, 35, 190, 35);
                                 
                                 pdf.setFontSize(16);
                                 pdf.text("FIELD INTELLIGENCE DOSSIER", 105, 45, { align: "center" });
                                 
                                 pdf.setFont("helvetica", "normal");
                                 pdf.setFontSize(10);
                                 pdf.text(`Dossier ID: TN-GEOM-${selectedEvidence.id.slice(0, 8).toUpperCase()}`, 20, 60);
                                 pdf.text(`Date Generated: ${new Date().toLocaleString('en-GB')}`, 20, 67);
                                 pdf.text(`Classification: CONFIDENTIAL`, 20, 74);
                                 
                                 pdf.setFont("helvetica", "bold");
                                 pdf.text("PART I: THREAT INTELLIGENCE", 20, 90);
                                 pdf.setFont("helvetica", "normal");
                                 pdf.text(`Threat Classification : ${selectedEvidence.alert_type}`, 25, 100);
                                 pdf.text(`Detection Confidence: ${(selectedEvidence.confidence_score * 100).toFixed(2)}%`, 25, 107);
                                 pdf.text(`Current Status      : ${selectedEvidence.status}`, 25, 114);
                                 
                                 pdf.setFont("helvetica", "bold");
                                 pdf.text("PART II: GEOSPATIAL DATA", 20, 130);
                                 pdf.setFont("helvetica", "normal");
                                 pdf.text(`District      : Salem`, 25, 140);
                                 pdf.text(`Taluk         : ${selectedEvidence.taluk || 'Unknown'}`, 25, 147);
                                 pdf.text(`Village       : ${selectedEvidence.village || 'Unknown'}`, 25, 154);
                                 pdf.text(`Survey Number : ${selectedEvidence.parcel_details || 'Unsurveyed Land'}`, 25, 161);
                                 pdf.text(`Coordinates   : ${selectedEvidence.position?.[0]?.toFixed(6) || 'N/A'} N, ${selectedEvidence.position?.[1]?.toFixed(6) || 'N/A'} E`, 25, 168);

                                 if (selectedEvidence.verification) {
                                    pdf.setFont("helvetica", "bold");
                                    pdf.text("PART III: FIELD VERIFICATION", 20, 185);
                                    pdf.setFont("helvetica", "normal");
                                    pdf.text(`Officer Name: ${selectedEvidence.verification.officer_name}`, 25, 195);
                                    pdf.text(`Verified On: ${new Date(selectedEvidence.verification.verified_at).toLocaleString()}`, 25, 202);
                                    pdf.text(`Remarks: ${selectedEvidence.verification.remarks}`, 25, 209);
                                 }
                                 
                                 pdf.setFont("helvetica", "italic");
                                 pdf.setFontSize(8);
                                 pdf.text("This is a system-generated document. Unauthorized distribution is prohibited.", 105, 280, { align: "center" });
                                 
                                 pdf.save(`Intelligence_Record_TN_${selectedEvidence.id.slice(0, 8)}.pdf`);
                              }}
                              className="p-4 bg-slate-100 text-slate-600 rounded-none hover:bg-slate-200 transition-all"
                           >
                              <Download size={18} />
                           </button>
                        </div>
                     </div>
                </div>
             ) : (
                  <div className="bg-slate-50 rounded-none h-[500px] flex flex-col items-center justify-center p-12 text-center border-4 border-dotted border-slate-200">
                     <div className="w-24 h-24 bg-white rounded-none flex items-center justify-center shadow-2xl mb-8 text-slate-200 animate-pulse"><Monitor size={40} /></div>
                     <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight">Node Offline</h4>
                     <p className="text-[10px] text-slate-400 font-bold uppercase mt-3 leading-loose max-w-[200px]">Select a reconnaissance site to initialize intelligence processing</p>
                  </div>
               )}
            </div>
         </div>
      </div>
   );
};

const AIMonitoringView = ({ alerts = [], setAlerts, user, parcels = [], onMapClick, selectedPosition }) => {
   const [selectedDistrict, setSelectedDistrict] = useState('Salem');
   const [selectedAlert, setSelectedAlert] = useState(null);
   const [filterStatus, setFilterStatus] = useState('ACTIVE');
   const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

   useEffect(() => {
      if (selectedAlert) {
         const updated = alerts.find(a => String(a.id) === String(selectedAlert.id));
         if (updated) setSelectedAlert(updated);
      }
   }, [alerts]);

   const activeDetections = alerts.filter(a => a.status !== 'RESOLVED' && a.status !== 'Resolved');

   const filteredDetections = alerts.filter(a => {
      if (filterStatus === 'ACTIVE') return a.status !== 'RESOLVED' && a.status !== 'Resolved';
      if (filterStatus === 'RESOLVED') return a.status === 'RESOLVED' || a.status === 'Resolved';
      return true; // 'ALL'
   }).sort((a, b) => {
      // Prioritize Roadside alerts at the top
      const aIsRoadside = a.parcel_classification === 'Roadside' || a.alert_type?.includes('Roadside');
      const bIsRoadside = b.parcel_classification === 'Roadside' || b.alert_type?.includes('Roadside');
      if (aIsRoadside && !bIsRoadside) return -1;
      if (!aIsRoadside && bIsRoadside) return 1;
      return (b.confidence_score || 0) - (a.confidence_score || 0);
   });

   return (
      <div className="space-y-6 animate-in fade-in duration-700 relative">
         {/* Top KPI Dashboard Row */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
               { t: 'AI Precision', v: '98.4% Acc', i: Target, c: 'text-blue-600', bg: 'bg-blue-50', l: 'Global Confidence Mean', b: 'success' },
               { t: 'Inferences', v: '1,442', i: Zap, c: 'text-indigo-600', bg: 'bg-indigo-50', l: 'Per Minute', b: 'info' },
               { t: 'Auto-Forward', v: '100%', i: RefreshCcw, c: 'text-green-600', bg: 'bg-green-50', l: 'Rate Active', b: 'success' },
               { t: 'Critical Alerts', v: activeDetections.length, i: AlertTriangle, c: 'text-red-600', bg: 'bg-red-50', l: 'Priority Detections', b: 'danger' }
            ].map((kpi, i) => (
               <div key={i} className="bg-white p-6 rounded-none border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                  <div className="flex justify-between items-start mb-4">
                     <div className={`p-3 rounded-none ${kpi.bg} ${kpi.c}`}><kpi.i size={20} /></div>
                     <Badge variant={kpi.b}>{kpi.v}</Badge>
                  </div>
                  <h4 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">{kpi.t}</h4>
                  <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 tracking-widest">{kpi.l}</p>
               </div>
            ))}
         </div>

         {/* Main Dashboard Body */}
         <div className="grid grid-cols-12 gap-6 items-start">
            {/* Left Side: Map Explorer */}
            <div className="col-span-12 lg:col-span-8">
               <div className="bg-white border border-slate-200 rounded-none shadow-sm h-[600px] overflow-hidden relative">
                  <div className="absolute top-6 left-6 z-[1000] flex gap-2">
                     <Badge variant="info" className="bg-white/95 backdrop-blur shadow-lg border-slate-200 text-slate-900 rounded-none">AI LIVE GIS STREAM</Badge>
                     <div className="flex items-center gap-2 px-3 py-1 bg-green-500/90 backdrop-blur rounded-none text-[8px] font-black text-white uppercase tracking-widest shadow-lg animate-pulse">● Node Active</div>
                  </div>
                  <MapView 
                     parcels={parcels} 
                     alerts={alerts} 
                     onParcelClick={() => {}} 
                     onMapClick={onMapClick} 
                     selectedPosition={selectedPosition} 
                  />
                  

               </div>
            </div>

            {/* Right Side: Detection Intelligence Stream */}
            <div className="col-span-12 lg:col-span-4 space-y-6">
               <div className="bg-white border border-slate-200 rounded-none shadow-sm flex flex-col h-[600px] overflow-hidden">
                  <div className="p-6 border-b border-slate-100 bg-white">
                     <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2"><Cpu size={14} className="text-blue-600" /> Tactical Queue</h3>
                        <Badge variant="danger">{filteredDetections.length}</Badge>
                     </div>
                     <div className="flex bg-slate-100 p-1 rounded-none gap-1">
                        {['ACTIVE', 'RESOLVED', 'ALL'].map(s => (
                           <button 
                              key={s} 
                              onClick={() => setFilterStatus(s)}
                              className={`flex-1 py-2 rounded-none text-[8px] font-black uppercase tracking-widest transition-all ${filterStatus === s ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                           >
                              {s}
                           </button>
                        ))}
                     </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50/50">
                     {filteredDetections.map(d => (
                        <div 
                           key={d.id} 
                           onClick={() => setSelectedAlert(d)}
                           className="p-4 bg-white border border-slate-200 rounded-none transition-all cursor-pointer group shadow-sm hover:border-blue-500 border-l-4 border-l-red-500"
                        >
                           <div className="flex items-center gap-4">
                              <div className="w-20 h-20 rounded-none overflow-hidden shrink-0 border border-slate-100 shadow-inner">
                                 <img src={d.img || img1} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                              </div>
                              <div className="flex-1 min-w-0">
                                 <div className="flex justify-between items-center mb-1">
                                    <Badge variant="danger" className="text-[7px]">{(d.confidence_score * 100).toFixed(0)}% AI CONF</Badge>
                                    <span className="text-[8px] text-slate-400 font-bold uppercase">ID: {d.id.slice(0, 4)}</span>
                                 </div>
                                 <p className="text-[11px] font-black text-slate-800 uppercase truncate leading-tight tracking-tight">{d.alert_type}</p>
                                 <p className="text-[9px] text-slate-500 font-bold uppercase mt-1 flex items-center gap-1"><MapPin size={8} className="text-blue-600" /> {d.parcel_details || '142/A'}</p>
                              </div>
                           </div>
                           <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                              <span className="text-[8px] font-black text-green-600 uppercase tracking-widest flex items-center gap-1"><RefreshCcw size={8} /> LIVE SYNC</span>
                              <div className="flex gap-2">
                                 <button className="p-2 bg-slate-100 text-slate-600 rounded-none hover:bg-slate-200 transition-all"><Eye size={14} /></button>
                                 <button className="px-4 py-1.5 bg-blue-600 text-white rounded-none text-[8px] font-black uppercase tracking-widest shadow-md hover:bg-blue-700 transition-all">Review</button>
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
         </div>

         {/* Highly Detailed PDF-Ready Report Modal */}
         {selectedAlert && (
            <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 sm:p-8 animate-in fade-in zoom-in-95 duration-300">
               <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setSelectedAlert(null)}></div>
               
               <div id="pdf-modal-wrapper" className="w-full max-w-[1000px] h-full max-h-[95vh] relative z-[5001] flex flex-col overflow-hidden bg-slate-100 shadow-2xl rounded-none border border-slate-400">
                  
                  {/* Top Actions Bar (Not printed) */}
                  <div className="bg-slate-900 px-6 py-4 flex justify-between items-center shrink-0 border-b-4 border-blue-600">
                     <p className="text-[10px] text-white font-black uppercase tracking-[0.2em] flex items-center gap-2">
                        <FileText size={14} /> Official Report Preview
                     </p>
                     <div className="flex gap-4">
                        <button 
                           onClick={async () => {
                              try {
                                 setIsDownloadingPdf(true);
                                 const el = document.getElementById('pdf-report-content');
                                 const wrapper = document.getElementById('pdf-modal-wrapper');
                                 const scroll = document.getElementById('pdf-scroll-container');
                                 if(!el || !wrapper || !scroll) return;
                                 
                                 // Temporarily expand containers to bypass scroll clipping
                                 const origWrapperMaxH = wrapper.style.maxHeight;
                                 const origWrapperOverflow = wrapper.style.overflow;
                                 const origScrollOverflow = scroll.style.overflow;
                                 
                                 wrapper.style.maxHeight = 'none';
                                 wrapper.style.overflow = 'visible';
                                 scroll.style.overflow = 'visible';
                                 
                                 // We use html-to-image to avoid Tailwind oklch color parsing errors
                                 const dataUrl = await toJpeg(el, { 
                                    quality: 0.95, 
                                    backgroundColor: '#ffffff',
                                    pixelRatio: 2
                                 });
                                 
                                 // Restore styles
                                 wrapper.style.maxHeight = origWrapperMaxH;
                                 wrapper.style.overflow = origWrapperOverflow;
                                 scroll.style.overflow = origScrollOverflow;
                                 
                                 // Get actual dimensions
                                 const img = new window.Image();
                                 img.src = dataUrl;
                                 await new Promise((resolve) => { img.onload = resolve; });
                                 
                                 const pdf = new jsPDF('p', 'mm', 'a4');
                                 const pdfWidth = pdf.internal.pageSize.getWidth();
                                 const pageHeight = pdf.internal.pageSize.getHeight();
                                 
                                 const pdfHeight = (img.height * pdfWidth) / img.width;
                                 let finalWidth = pdfWidth;
                                 let finalHeight = pdfHeight;
                                 
                                 // Scale down to fit exactly on one A4 page if it exceeds page height
                                 if (pdfHeight > pageHeight) {
                                    const ratio = pageHeight / pdfHeight;
                                    finalHeight = pageHeight;
                                    finalWidth = pdfWidth * ratio;
                                 }
                                 
                                 const xOffset = (pdfWidth - finalWidth) / 2;
                                 
                                 pdf.addImage(dataUrl, 'JPEG', xOffset, 0, finalWidth, finalHeight);
                                 
                                 pdf.save(`Dossier_TN_${selectedAlert.id.slice(0, 8)}.pdf`);
                              } catch (err) {
                                 console.error("PDF Generation Error: ", err);
                                 alert("Failed to generate PDF. Check console for details. (This may be a CORS issue with the images)");
                              } finally {
                                 setIsDownloadingPdf(false);
                              }
                           }}
                           disabled={isDownloadingPdf}
                           className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white font-black uppercase tracking-[0.1em] text-[10px] hover:bg-blue-700 transition-all shadow-sm disabled:opacity-50"
                        >
                           {isDownloadingPdf ? (
                              <><RefreshCcw size={14} className="animate-spin" /> Processing...</>
                           ) : (
                              <><Download size={14} /> Download PDF</>
                           )}
                        </button>
                        <button onClick={() => setSelectedAlert(null)} className="text-slate-400 hover:text-white transition-all"><X size={20} /></button>
                     </div>
                  </div>

                  {/* Scrollable Printable Area */}
                  <div id="pdf-scroll-container" className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center custom-scrollbar bg-slate-200">
                     
                     {/* The A4 Page Container */}
                     <div id="pdf-report-content" className="bg-white w-full max-w-[800px] shadow-sm border border-slate-200 p-8 md:p-12 shrink-0 relative">
                        
                        {/* Report Header */}
                        <div className="border-b-4 border-slate-900 pb-6 mb-8 flex justify-between items-start">
                           <div className="flex items-center gap-4">
                              <div className="w-16 h-16 bg-slate-900 flex items-center justify-center">
                                 <Shield size={32} className="text-white" />
                              </div>
                              <div>
                                 <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-1">Government of Tamil Nadu</h1>
                                 <h2 className="text-xs font-black text-blue-600 uppercase tracking-[0.2em]">Official Encroachment Intelligence Dossier</h2>
                              </div>
                           </div>
                           <div className="text-right space-y-1">
                              <p className="text-[10px] font-black text-slate-900 uppercase">Target ID: <span className="font-mono text-slate-600">TN-{selectedAlert.id.toUpperCase().slice(0, 12)}</span></p>
                              <p className="text-[10px] font-black text-slate-900 uppercase">Date Generated: <span className="font-mono text-slate-600">{new Date().toLocaleDateString('en-GB')}</span></p>
                              <p className="text-[10px] font-black text-slate-900 uppercase">Status: <span className={`font-mono ${selectedAlert.status === 'RESOLVED' ? 'text-green-600' : 'text-red-600'}`}>{selectedAlert.status}</span></p>
                           </div>
                        </div>

                        <div className="space-y-6">
                           
                           {/* Part I: Spatial Intelligence */}
                           <div className="border border-slate-300 break-inside-avoid">
                              <div className="bg-slate-100 border-b border-slate-300 px-4 py-2">
                                 <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">Part I: Spatial & Telemetry Data</h3>
                              </div>
                              <div className="grid grid-cols-2">
                                 <div className="p-3 border-r border-b border-slate-200">
                                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">GPS Coordinates</p>
                                    <p className="text-xs font-black text-slate-900 font-mono">{selectedAlert.position?.[0]?.toFixed(6) || 'N/A'} N, {selectedAlert.position?.[1]?.toFixed(6) || 'N/A'} E</p>
                                 </div>
                                 <div className="p-3 border-b border-slate-200">
                                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Survey Details</p>
                                    <p className="text-xs font-black text-slate-900 uppercase">{selectedAlert.parcel_details || 'Unsurveyed Land'}</p>
                                 </div>
                                 <div className="p-3 border-r border-slate-200">
                                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Detection Zone</p>
                                    <p className="text-xs font-black text-slate-900 uppercase">Government Protected Area</p>
                                 </div>
                                 <div className="p-3">
                                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Estimated Area Impact</p>
                                    <p className="text-xs font-black text-slate-900 uppercase">Approx. 1.2 Acres</p>
                                 </div>
                              </div>
                           </div>

                           {/* Part II: AI Diagnostics */}
                           <div className="border border-slate-300 break-inside-avoid">
                              <div className="bg-slate-100 border-b border-slate-300 px-4 py-2 flex justify-between items-center">
                                 <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">Part II: Automated AI Diagnostics</h3>
                                 <span className="text-[8px] font-black text-blue-600 bg-blue-100 px-2 py-0.5 rounded-none uppercase">GEOMMAND v4.2</span>
                              </div>
                              <div className="grid grid-cols-3">
                                 <div className="p-3 border-r border-slate-200">
                                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Threat Classification</p>
                                    <p className="text-xs font-black text-slate-900 uppercase">{selectedAlert.alert_type}</p>
                                 </div>
                                 <div className="p-3 border-r border-slate-200">
                                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Algorithm Confidence</p>
                                    <p className="text-xs font-black text-slate-900 uppercase">{(selectedAlert.confidence_score * 100).toFixed(2)}%</p>
                                 </div>
                                 <div className="p-3">
                                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Initial Detection</p>
                                    <p className="text-xs font-black text-slate-900 font-mono">{new Date(selectedAlert.detection_date || Date.now()).toLocaleString('en-GB')}</p>
                                 </div>
                              </div>
                           </div>

                           {/* Part III: Photographic Evidence Annex */}
                           <div className="border border-slate-300 break-inside-avoid">
                              <div className="bg-slate-100 border-b border-slate-300 px-4 py-2">
                                 <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">Part III: Change Detection Analysis (Before vs After)</h3>
                              </div>
                                                             <div className="p-4 bg-white">
                                  <div className="grid grid-cols-2 gap-8">
                                     {/* BEFORE: Satellite Archive */}
                                     <div className="space-y-3">
                                        <div className="bg-slate-900 text-white p-2 flex justify-between items-center shadow-lg border-l-4 border-red-600">
                                           <span className="text-[8px] font-black uppercase tracking-[0.2em]">SATELLITE ARCHIVE (BEFORE)</span>
                                           <span className="text-[7px] font-mono text-slate-400">ARCHIVE_REF: 2025</span>
                                        </div>
                                        <div className="aspect-video bg-slate-200 border-2 border-slate-900 relative overflow-hidden group shadow-inner">
                                           <img 
                                              src={fieldPhotos[String(selectedAlert.id).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % fieldPhotos.length]} 
                                              className="w-full h-full object-cover filter grayscale contrast-200 brightness-50" 
                                              alt="Satellite Baseline" 
                                           />
                                           <div className="absolute inset-0 bg-blue-900/5 mix-blend-overlay"></div>
                                           <div className="absolute top-2 left-2 bg-slate-900/90 text-white px-2 py-0.5 text-[7px] font-black uppercase italic border border-white/10">Base_Scan_T1</div>
                                        </div>
                                        <p className="text-[7px] text-slate-500 font-bold uppercase tracking-widest leading-tight">Historical Baseline Archive</p>
                                     </div>

                                     {/* AFTER: Field Evidence (Up to 3 Images) */}
                                     <div className="space-y-3">
                                        <div className="bg-blue-600 text-white p-2 flex justify-between items-center shadow-lg border-l-4 border-white">
                                           <span className="text-[8px] font-black uppercase tracking-[0.2em]">FIELD EVIDENCE (AFTER)</span>
                                           <div className="flex items-center gap-2">
                                              <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                                              <span className="text-[7px] font-black uppercase">LIVE_UPLINK</span>
                                           </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 gap-2">
                                           {selectedAlert.verification?.photos?.length > 0 ? (
                                              <div className={`grid ${selectedAlert.verification.photos.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}>
                                                 {selectedAlert.verification.photos.slice(0, 3).map((photo, pIdx) => (
                                                    <div key={pIdx} className={`aspect-video bg-slate-50 border-2 border-blue-600 relative overflow-hidden group shadow-md ${selectedAlert.verification.photos.length === 3 && pIdx === 0 ? 'col-span-2' : ''}`}>
                                                       <img 
                                                          src={photo} 
                                                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" 
                                                          alt={`Field Evidence ${pIdx + 1}`} 
                                                       />
                                                       <div className="absolute top-1 left-1 bg-blue-600/90 text-white px-1.5 py-0.5 text-[6px] font-black uppercase italic">Frame_{pIdx + 1}</div>
                                                    </div>
                                                 ))}
                                              </div>
                                           ) : (
                                              <div className="aspect-video bg-slate-900 border-2 border-blue-600 flex flex-col items-center justify-center gap-2 group">
                                                 <Camera size={24} className="text-blue-500 animate-pulse" />
                                                 <p className="text-[7px] font-black text-blue-400 uppercase tracking-[0.3em] animate-pulse">Waiting for Field Node...</p>
                                                 <div className="absolute inset-0 bg-gradient-to-t from-blue-900/20 to-transparent pointer-events-none"></div>
                                              </div>
                                           )}
                                        </div>
                                        <p className="text-[7px] text-blue-600 font-black uppercase tracking-widest leading-tight">{selectedAlert.verification ? `Evidence Captured: ${selectedAlert.verification.photos?.length || 0} Frames` : 'Status: Pending Mission Execution'}</p>
                                     </div>
                                  </div>

                                  <div className="bg-slate-50 border border-slate-200 p-3 mt-6 flex justify-between items-center">
                                     <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-blue-100 flex items-center justify-center text-blue-600"><Navigation size={16} /></div>
                                        <div>
                                           <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Delta Coordinates</p>
                                           <p className="text-[10px] font-black text-slate-900">{(selectedAlert.verification?.gps_lat || selectedAlert.position?.[0])?.toFixed(6)}N, {(selectedAlert.verification?.gps_lon || selectedAlert.position?.[1])?.toFixed(6)}E</p>
                                        </div>
                                     </div>
                                     <div className="text-right">
                                        <Badge variant="info" className="text-[8px] py-1">Mission Hash: 0x{selectedAlert.id?.toString().slice(0, 8)}</Badge>
                                     </div>
                                  </div>
                               </div>
                           </div>

                           {/* Part IV: Field Officer Inspection */}
                           <div className="border border-slate-300 break-inside-avoid">
                              <div className="bg-slate-100 border-b border-slate-300 px-4 py-2 flex justify-between items-center">
                                 <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">Part IV: Official Field Inspection Log</h3>
                                 {selectedAlert.verification && <span className="text-[8px] font-black text-green-600 bg-green-100 px-2 py-0.5 rounded-none uppercase flex items-center gap-1"><CheckCircle2 size={10} /> Verified</span>}
                              </div>
                              {selectedAlert.verification ? (
                                 <div className="grid grid-cols-1">
                                    <div className="p-4 border-b border-slate-200 bg-white flex justify-between items-center">
                                       <div>
                                          <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Inspecting Officer</p>
                                          <p className="text-sm font-black text-slate-900 uppercase">{selectedAlert.verification.officer_name}</p>
                                       </div>
                                       <div className="text-right">
                                          <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Time of Inspection</p>
                                          <p className="text-xs font-black text-slate-900 font-mono">{new Date(selectedAlert.verification.verified_at || Date.now()).toLocaleString('en-GB')}</p>
                                       </div>
                                    </div>
                                    <div className="p-4 border-b border-slate-200 bg-white">
                                       <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">Officer Remarks</p>
                                       <p className="text-sm text-slate-800 leading-relaxed font-serif italic border-l-4 border-slate-300 pl-4 py-1">"{selectedAlert.verification.remarks}"</p>
                                    </div>
                                    <div className="grid grid-cols-2 bg-white">
                                       <div className="p-4 border-r border-slate-200">
                                          <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">Proposed Action Plan</p>
                                          <p className="text-xs text-slate-800 font-medium">{selectedAlert.verification.action_plan || 'No action plan recorded.'}</p>
                                       </div>
                                       <div className="p-4">
                                          <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">Implementation Details</p>
                                          <p className="text-xs text-slate-800 font-medium">{selectedAlert.verification.implementation_details || 'N/A'}</p>
                                       </div>
                                    </div>
                                 </div>
                              ) : (
                                 <div className="p-8 text-center bg-white">
                                    <Clock size={24} className="mx-auto text-slate-300 mb-2" />
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Inspection Pending</p>
                                    <p className="text-xs text-slate-500 mt-1 italic">Field verification has not yet been executed for this target.</p>
                                 </div>
                              )}
                           </div>

                           {/* Part V: Final Resolution */}
                           <div className="border border-slate-300 break-inside-avoid">
                              <div className="bg-slate-100 border-b border-slate-300 px-4 py-2">
                                 <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">Part V: Executive Resolution</h3>
                              </div>
                              <div className="p-4 bg-white">
                                 <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">Administrative Notes</p>
                                 <p className="text-sm text-slate-800 leading-relaxed font-serif">{selectedAlert.resolution_notes || 'No final administrative notes appended. Case is currently under active review by the Taluk administration.'}</p>
                              </div>
                           </div>
                           
                           {/* Signatures placeholder */}
                           <div className="pt-8 grid grid-cols-3 gap-8 text-center break-inside-avoid">
                              <div>
                                 <div className="border-b border-slate-400 h-12 flex items-end justify-center pb-1">
                                    {selectedAlert.verification && <span className="font-serif text-blue-800 italic opacity-70" style={{ fontSize: '18px' }}>{selectedAlert.verification.officer_name.split(' ')[0]}</span>}
                                 </div>
                                 <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-2">Field Officer Signature</p>
                              </div>
                              <div>
                                 <div className="border-b border-slate-400 h-12"></div>
                                 <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-2">Tahsildar Verification</p>
                              </div>
                              <div>
                                 <div className="border-b border-slate-400 h-12 flex items-end justify-center pb-1">
                                    <span className="font-serif text-red-800 italic opacity-70" style={{ fontSize: '20px' }}>Seal Pending</span>
                                 </div>
                                 <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-2">Collector Approval</p>
                              </div>
                           </div>

                        </div>
                        
                        {/* Print Footer */}
                        <div className="mt-8 pt-4 border-t border-slate-300 text-center flex justify-between items-center">
                           <p className="text-[7px] font-black text-slate-400 uppercase tracking-[0.2em]">GEOMMAND AI Engine • Highly Confidential</p>
                           <p className="text-[7px] font-black text-slate-400 uppercase tracking-[0.2em]">Page 1 of 1</p>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         )}

         {/* Bottom Row: State-wide District Grid or Taluk Grid for Collector */}
         <div className="bg-white border border-slate-200 rounded-none p-8 shadow-sm">
            <div className="flex justify-between items-center mb-8">
               <div>
                  <h3 className="font-black text-slate-900 uppercase tracking-tight text-lg leading-none">
                     {user.role === 'COLLECTOR' ? 'Taluk Surveillance Matrix' : 
                      (user.role === 'VAO' || user.role === 'TAHSILDAR') ? 'Village Surveillance Matrix' : 
                      'District Surveillance Matrix'}
                  </h3>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-2">
                     {user.role === 'COLLECTOR' ? 'Real-time sub-division monitoring for Salem District' : 
                      (user.role === 'VAO' || user.role === 'TAHSILDAR') ? `Monitoring local nodes in ${user.jurisdiction?.value || 'Assigned Area'}` : 
                      'Real-time node monitoring across Tamil Nadu'}
                  </p>
               </div>
               <Badge variant="info" className="rounded-none">
                  {user.role === 'COLLECTOR' ? 'Salem Node Cluster' : 
                   (user.role === 'VAO' || user.role === 'TAHSILDAR') ? 'Village Edge Cluster' : 
                   'Global Node Cluster'}
               </Badge>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-10 gap-3">
               {(user.role === 'COLLECTOR' ? 
                  ['Salem West', 'Salem South', 'Mettur', 'Omalur', 'Attur', 'Edappadi', 'Sankari', 'Vazhapadi', 'Yercaud'] : 
                  (user.role === 'VAO' || user.role === 'TAHSILDAR') ? 
                  (user.role === 'VAO' ? ['Omalur North', 'Omalur South', 'Tharamangalam'] : 
                   ['Kandhampatty', 'Suramangalam', 'Jagir Ammapalayam', 'Dadagapatty', 'Linemedu']) :
                  TN_DISTRICTS
               ).map(d => (
                  <button 
                     key={d} 
                     onClick={() => setSelectedDistrict(d)} 
                     className={`p-4 rounded-none border transition-all text-center group ${selectedDistrict === d ? 'bg-blue-600 border-blue-600 text-white shadow-xl scale-105' : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-white hover:border-slate-200'}`}
                  >
                     <p className="text-[9px] font-black uppercase truncate group-hover:tracking-widest transition-all">{d}</p>
                     <div className="flex justify-center gap-1 mt-2">
                        <div className={`w-1.5 h-1.5 rounded-none ${activeDetections.length > 0 && (d === 'Salem' || d === 'Salem West') ? 'bg-red-400 animate-pulse' : 'bg-green-400 opacity-20'}`}></div>
                     </div>
                  </button>
               ))}
            </div>
         </div>
      </div>
   );
};

const InspectorDashboardView = ({ parcels = [], alerts = [], onTabChange }) => {
   const activeAlerts = alerts.filter(a => a.status === 'VAO_ASSIGNED');
   const resolvedAlerts = alerts.filter(a => a.status === 'RESOLVED' || a.status === 'Resolved');
   
   return (
      <div className="space-y-4 animate-in fade-in duration-500 max-h-[calc(100vh-140px)] flex flex-col overflow-hidden">
         {/* Strategic Greeting */}
         <div className="bg-slate-900 text-white p-6 flex justify-between items-center shadow-xl">
            <div>
               <h2 className="text-xl font-black uppercase tracking-tighter italic">Operational Hub</h2>
               <p className="text-[9px] font-bold text-blue-400 uppercase tracking-[0.4em] mt-1">Field Node Inspector · Online</p>
            </div>
            <button 
               onClick={() => onTabChange('tasks')}
               className="px-8 py-3 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg"
            >
               View Active Missions ({activeAlerts.length})
            </button>
         </div>

         {/* Compact Grid Layout */}
         <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-hidden">
            {/* KPI Column */}
            {/* KPI Column - Redesigned Telemetry Grid */}
            <div className="grid grid-cols-1 gap-4">
               {[
                  { label: 'Active Missions', value: activeAlerts.length, icon: ClipboardCheck, color: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: 'Completed', value: resolvedAlerts.length, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
                  { label: 'Detection Rate', value: '94%', icon: Activity, color: 'text-indigo-600', bg: 'bg-indigo-50' }
               ].map((stat, i) => (
                  <div key={i} className="bg-white border border-slate-200 p-6 flex items-center justify-between group hover:shadow-md transition-all">
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                        <p className={`text-3xl font-black ${stat.color} tracking-tighter`}>{stat.value}</p>
                     </div>
                     <div className={`p-4 ${stat.bg} ${stat.color} rounded-none`}>
                        <stat.icon size={24} />
                     </div>
                  </div>
               ))}
               <div className="bg-slate-900 p-6 flex flex-col justify-center">
                  <p className="text-[8px] font-black text-blue-400 uppercase tracking-[0.3em] mb-2">FIELD_COMMAND_STATUS</p>
                  <p className="text-xs font-bold text-white uppercase italic leading-tight">Salem West sector currently under 24/7 GIS surveillance.</p>
               </div>
            </div>

            {/* Visual Intel Column */}
            <div className="md:col-span-2 bg-slate-900 relative group overflow-hidden border border-slate-200">
               <img src={site1} className="w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-all duration-700" />
               <div className="absolute inset-0 p-6 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                     <div className="bg-blue-600/20 backdrop-blur-md border border-blue-500/30 p-2">
                        <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Live_Terrain_Preview</p>
                     </div>
                     <div className="flex gap-2">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                        <p className="text-[8px] font-black text-white uppercase tracking-widest">GPS_Active</p>
                     </div>
                  </div>
                  <div className="bg-white/90 backdrop-blur p-4 border-l-4 border-blue-600 max-w-xs shadow-2xl">
                     <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Node: Salem_West</h4>
                     <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 italic">Scan reveals 4 active ENC anomalies within 5km radius.</p>
                  </div>
               </div>
            </div>
         </div>

         {/* Compact Telemetry Bar */}
         <div className="bg-slate-50 border border-slate-200 p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
               <Sun size={18} className="text-orange-500" />
               <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase">Temp</p>
                  <p className="text-xs font-black text-slate-900">32°C</p>
               </div>
            </div>
            <div className="flex items-center gap-3">
               <Wind size={18} className="text-blue-500" />
               <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase">Wind</p>
                  <p className="text-xs font-black text-slate-900">12km/h</p>
               </div>
            </div>
            <div className="flex items-center gap-3 border-l border-slate-200 pl-4 hidden md:flex">
               <Activity size={18} className="text-indigo-500" />
               <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase">Battery</p>
                  <p className="text-xs font-black text-slate-900">84%</p>
               </div>
            </div>
            <div className="flex items-center gap-3 border-l border-slate-200 pl-4 hidden md:flex">
               <Globe size={18} className="text-green-500" />
               <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase">Sync</p>
                  <p className="text-xs font-black text-slate-900">100%</p>
               </div>
            </div>
         </div>
      </div>
   );
};

const InspectorExecutiveView = ({ parcels = [], alerts = [], patchAlertStatus }) => {
   const [resolutionModal, setResolutionModal] = useState({ open: false, alertId: null });
   const [fieldPhotos, setFieldPhotos] = useState([]);
   const activeAlerts = alerts.filter(a => a.status === 'VAO_ASSIGNED');
   const resolvedAlerts = alerts.filter(a => a.status === 'RESOLVED' || a.status === 'Resolved');

   const handleFileChange = (e) => {
      const files = Array.from(e.target.files);
      const newPhotos = files.map(file => URL.createObjectURL(file));
      setFieldPhotos(prev => [...prev, ...newPhotos].slice(0, 3));
   };

   const startResolution = (id) => {
      setResolutionModal({ open: true, alertId: id });
      setFieldPhotos([]);
   };

   const submitResolution = () => {
      patchAlertStatus(resolutionModal.alertId, 'RESOLVED', { 
         resolution_notes: `Field verification successful. ${fieldPhotos.length} site photos captured.`,
         resolution_images: fieldPhotos 
      });
      setResolutionModal({ open: false, alertId: null });
   };

   return (
      <div className="space-y-4 animate-in fade-in duration-500 max-h-[calc(100vh-140px)] flex flex-col overflow-hidden relative">
         {/* Resolution Modal Overlay */}
         {resolutionModal.open && (
            <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4">
               <div className="bg-white w-full max-w-md border-t-8 border-blue-600 shadow-2xl p-6">
                  <div className="flex justify-between items-start mb-6">
                     <div>
                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Mission Evidence Capture</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">Authorized Field Reporting · Node 442</p>
                     </div>
                     <button onClick={() => setResolutionModal({ open: false, alertId: null })} className="text-slate-400 hover:text-red-500"><AlertCircle size={20} /></button>
                  </div>

                  <div className="space-y-6">
                     {/* Photo Upload Zone */}
                     <div className="border-2 border-dashed border-slate-200 p-8 text-center bg-slate-50 relative group transition-all hover:border-blue-300">
                        <input 
                           type="file" 
                           accept="image/*" 
                           capture="environment" 
                           multiple 
                           onChange={handleFileChange}
                           className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        <div className="space-y-2">
                           <div className="w-12 h-12 bg-white rounded-none shadow-sm flex items-center justify-center mx-auto text-blue-600 border border-slate-100 group-hover:scale-110 transition-transform">
                              <Camera size={24} />
                           </div>
                           <p className="text-[10px] font-black text-slate-900 uppercase">Tap to Capture Field Proof</p>
                           <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Supports up to 3 high-res captures</p>
                        </div>
                     </div>

                     {/* Preview Matrix */}
                     {fieldPhotos.length > 0 && (
                        <div className="grid grid-cols-3 gap-3">
                           {fieldPhotos.map((url, i) => (
                              <div key={i} className="aspect-square bg-slate-100 border border-slate-200 overflow-hidden relative">
                                 <img src={url} className="w-full h-full object-cover" />
                                 <div className="absolute top-0 right-0 p-1 bg-green-500 text-white"><CheckCircle2 size={10} /></div>
                              </div>
                           ))}
                        </div>
                     )}

                     <button 
                        disabled={fieldPhotos.length === 0}
                        onClick={submitResolution}
                        className={`w-full py-4 font-black uppercase tracking-[0.2em] text-[10px] transition-all shadow-xl flex items-center justify-center gap-3 ${
                           fieldPhotos.length > 0 
                           ? 'bg-slate-900 text-white hover:bg-blue-600' 
                           : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                     >
                        {fieldPhotos.length > 0 ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                        Finalize & Submit Report
                     </button>
                  </div>
               </div>
            </div>
         )}

         {/* Simple Tactical Header */}
         <div className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-xl">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 bg-blue-600 flex items-center justify-center"><Navigation size={20} /></div>
               <div>
                  <h2 className="text-sm font-black uppercase tracking-widest">FIELD_MISSIONS_MATRIX</h2>
                  <p className="text-[8px] font-bold text-blue-400 uppercase tracking-[0.3em] mt-0.5">Active_Node: RAJESH_022</p>
               </div>
            </div>
            <div className="flex gap-4">
               <div className="text-right">
                  <p className="text-[7px] font-black text-slate-500 uppercase">Pending</p>
                  <p className="text-sm font-black text-blue-400">{activeAlerts.length}</p>
               </div>
               <div className="text-right">
                  <p className="text-[7px] font-black text-slate-500 uppercase">Resolved</p>
                  <p className="text-sm font-black text-green-400">{resolvedAlerts.length}</p>
               </div>
            </div>
         </div>

         {/* Compact High-Density Task List */}
         <div className="flex-1 bg-white border border-slate-200 shadow-sm flex flex-col overflow-hidden">
            <div className="grid grid-cols-12 bg-slate-50 border-b border-slate-100 p-3 text-[8px] font-black text-slate-400 uppercase tracking-widest">
               <div className="col-span-1">Recon</div>
               <div className="col-span-3">Survey Identification</div>
               <div className="col-span-3">Alert Classification</div>
               <div className="col-span-2">Telemetry</div>
               <div className="col-span-3 text-right">Operational Action</div>
            </div>
            
            <div className="flex-1 overflow-y-auto divide-y divide-slate-50 scrollbar-hide">
               {activeAlerts.map(alert => (
                  <div key={alert.id} className="grid grid-cols-12 p-3 items-center hover:bg-slate-50 transition-all group">
                     <div className="col-span-1">
                        <div className="w-10 h-10 bg-slate-100 border border-slate-200 overflow-hidden">
                           <img src={alert.img} className="w-full h-full object-cover grayscale group-hover:grayscale-0" />
                        </div>
                     </div>
                     <div className="col-span-3 pl-2">
                        <h4 className="text-[11px] font-black text-slate-900 uppercase">S-{alert.parcel_details}</h4>
                        <p className="text-[7px] font-mono text-slate-400 mt-0.5">ID:{alert.id.substring(0,8)}</p>
                     </div>
                     <div className="col-span-3">
                        <p className="text-[9px] font-bold text-slate-600 uppercase tracking-tight">{alert.alert_type}</p>
                        <Badge variant={alert.confidence_score > 0.9 ? 'danger' : 'warning'} className="mt-1 transform scale-75 origin-left">CRITICAL</Badge>
                     </div>
                     <div className="col-span-2">
                        <p className="text-[8px] font-black text-slate-400 uppercase">DIST: 2.4km</p>
                        <p className="text-[8px] font-black text-blue-500 uppercase mt-0.5">GPS: LOCKED</p>
                     </div>
                     <div className="col-span-3 flex justify-end gap-2">
                        <button className="p-2 bg-slate-100 text-slate-400 hover:text-blue-600 transition-all"><Eye size={14} /></button>
                        <button 
                           onClick={() => startResolution(alert.id)}
                           className="px-6 py-2 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-md"
                        >
                           Resolve
                        </button>
                     </div>
                  </div>
               ))}
               
               {activeAlerts.length === 0 && (
                  <div className="p-20 text-center">
                     <CheckCircle2 size={32} className="text-slate-100 mx-auto mb-4" />
                     <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">All Field Missions Complete</p>
                  </div>
               )}
            </div>
         </div>

         {/* Compact Footer Sync Bar */}
         <div className="bg-slate-50 border border-slate-200 p-3 flex justify-between items-center">
            <div className="flex items-center gap-6">
               <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest italic">Mobile_Link_Stable</span>
               </div>
               <div className="flex items-center gap-2 border-l border-slate-200 pl-6">
                  <Activity size={12} className="text-blue-500" />
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest italic">Sync_Integrity: 100%</span>
               </div>
            </div>
            <p className="text-[8px] font-black text-slate-400 uppercase">Last Server Update: {new Date().toLocaleTimeString()}</p>
         </div>
      </div>
   );
};


const VillageExecutiveView = ({ parcels = [], alerts = [], patchAlertStatus }) => {
   const [assignmentModal, setAssignmentModal] = useState({ open: false, alertId: null });
   const activeAlerts = alerts.filter(a => a.status === 'TAHSILDAR_ACCEPTED');

   const handleAction = (id) => {
      setAssignmentModal({ open: true, alertId: id });
   };

   const confirmAssignment = (officer) => {
      patchAlertStatus(assignmentModal.alertId, 'VAO_ASSIGNED', { assignedTo: officer });
      alert(`FIELD DISPATCH: Mission #${assignmentModal.alertId} officially assigned to ${officer}.\n\nDirective: CAPTURE_GPS_EVIDENCE\nPriority: IMMEDIATE`);
      setAssignmentModal({ open: false, alertId: null });
   };

   return (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
         <div className="flex justify-between items-center mb-2">
            <div><h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Village Command Hub</h2><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">VAO Node • Salem West Zone</p></div>
            <Badge variant="info">{activeAlerts.length} Active Alerts</Badge>
         </div>
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
               <Card title="Immediate Tactical Field Tasks" icon={ClipboardCheck}>
                  <div className="max-h-[500px] overflow-y-auto custom-scrollbar space-y-3 p-1">
                     {activeAlerts.map(alert => (
                        <div key={alert.id} className="p-4 bg-slate-50 rounded-none flex items-center justify-between group hover:bg-white border border-transparent hover:border-slate-100 transition-all shadow-sm relative overflow-hidden">
                           <div className="absolute left-0 top-0 h-full w-1 bg-blue-500"></div>
                           <div className="flex items-center gap-5">
                              <div className="w-16 h-16 rounded-none overflow-hidden border border-slate-200 shadow-sm shrink-0">
                                 <img src={alert.img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                              </div>
                              <div>
                                 <div className="flex items-center gap-2 mb-1">
                                    <p className="text-xs font-black text-slate-800 uppercase tracking-tight">Survey {alert.parcel_details}</p>
                                    <Badge variant="info" className="text-[7px] py-0 px-1.5">NODE_VILLAGE</Badge>
                                 </div>
                                 <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest">{alert.alert_type}</p>
                                 <div className="flex items-center gap-4 mt-2">
                                    <div className="flex flex-col">
                                       <span className="text-[7px] font-black text-slate-400 uppercase">Priority</span>
                                       <span className="text-[8px] font-black text-red-500 uppercase">HIGH_IMPACT</span>
                                    </div>
                                    <div className="flex flex-col">
                                       <span className="text-[7px] font-black text-slate-400 uppercase">Auth_Code</span>
                                       <span className="text-[8px] font-black text-slate-600 uppercase">V-SLM-{alert.id.substring(0,4)}</span>
                                    </div>
                                 </div>
                              </div>
                           </div>
                           <button onClick={() => handleAction(alert.id)} className="px-6 py-2.5 bg-slate-900 text-white rounded-none text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-md flex items-center gap-2">
                              <UserPlus size={14} className="text-blue-400" /> Dispatch Inspector
                           </button>
                        </div>
                     ))}
                     {activeAlerts.length === 0 && (
                        <div className="p-12 text-center bg-slate-50 border border-dashed border-slate-200">
                           <div className="w-12 h-12 bg-white rounded-none flex items-center justify-center text-slate-300 mx-auto mb-4 shadow-sm border border-slate-100"><CheckCircle2 size={24} /></div>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic opacity-60">Strategic Security Maintained • No Active Tasks</p>
                        </div>
                     )}
                  </div>
               </Card>
            </div>
            <div className="space-y-6">
               <Card title="Village Alerts" icon={ShieldAlert}>
                  <div className="space-y-4">
                     {activeAlerts.slice(0, 2).map((a, i) => (
                        <div key={i} className="p-3 bg-red-50 rounded-none border border-red-100">
                           <p className="text-[10px] font-black text-red-800 uppercase mb-1">Encroachment Alert</p>
                           <p className="text-[9px] text-red-600 leading-tight">New structure detected at Survey {a.parcel_details}.</p>
                        </div>
                     ))}
                  </div>
               </Card>
               <div className="bg-blue-600 p-6 text-white shadow-xl shadow-blue-100 flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                     <div className="p-2 bg-white/20 rounded-none"><Globe size={18} /></div>
                     <p className="text-[10px] font-black uppercase tracking-widest">Village Map Sync</p>
                  </div>
                  <p className="text-[11px] font-bold opacity-80 leading-relaxed uppercase">Real-time GIS uplink active for Suramangalam node.</p>
                  <button className="w-full py-3 bg-white text-blue-600 font-black text-[9px] uppercase tracking-widest hover:bg-blue-50 transition-all shadow-lg">Refresh GIS Data</button>
               </div>
            </div>
         </div>
         <div className="bg-white border border-slate-200 h-[450px] overflow-hidden relative shadow-sm group">
            <div className="absolute top-4 left-4 z-[1000] bg-white/90 backdrop-blur px-3 py-1.5 border border-slate-200 shadow-xl flex items-center gap-3">
               <div className="w-2 h-2 bg-green-500 animate-pulse"></div>
               <p className="text-[10px] font-black uppercase text-slate-800 tracking-widest">Tactical Village Overview • Suramangalam Grid</p>
            </div>

            <MapView parcels={parcels} alerts={alerts} onMapClick={() => {}} />
         </div>
         <OfficerAssignmentModal isOpen={assignmentModal.open} alertId={assignmentModal.alertId} type="FIELD_OFFICER" onClose={() => setAssignmentModal({ open: false, alertId: null })} onAssign={confirmAssignment} />
      </div>
   );
};

const VillageMapHubView = ({ parcels = [], alerts = [] }) => {
   return (
      <div className="space-y-6 animate-in fade-in duration-700">
         <div className="bg-white border border-slate-200 p-6 rounded-none flex justify-between items-center shadow-sm">
            <div>
               <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Village Map Hub</h2>
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Authorized GIS Node: Suramangalam Village</p>
            </div>
            <div className="flex gap-4">
               <div className="text-right">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Local Resolution</p>
                  <p className="text-xs font-black text-blue-600 uppercase">High Precision (0.3m)</p>
               </div>
               <div className="w-px h-10 bg-slate-100"></div>
               <div className="text-right">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Last Sync</p>
                  <p className="text-xs font-black text-green-600 uppercase">2m Ago</p>
               </div>
            </div>
         </div>

         <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-9 h-[700px] border border-slate-200 bg-white relative group">
               <div className="absolute top-4 left-4 z-[1000] p-3 bg-white/90 backdrop-blur shadow-xl border border-white/20">
                   <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2"><MapPin size={12} className="text-blue-600" /> Suramangalam Tactical Grid</p>
               </div>
               <MapView parcels={parcels} alerts={alerts} onMapClick={() => {}} />
               

            </div>

            <div className="col-span-12 lg:col-span-3 space-y-6">
               <Card title="Village Parcel Matrix" icon={Layers}>
                  <div className="space-y-4">
                     {[
                        { s: '142/A', t: 'Government', h: '1.24' },
                        { s: '88/4', t: 'Waterbody', h: '0.45' },
                        { s: '21/C', t: 'Panchayat', h: '2.10' }
                     ].map((p, i) => (
                        <div key={i} className="p-4 bg-slate-50 border border-slate-100 flex justify-between items-center group hover:bg-white hover:border-blue-200 transition-all cursor-pointer">
                           <div>
                              <p className="text-[10px] font-black text-slate-900 uppercase">Survey {p.s}</p>
                              <p className="text-[8px] text-slate-400 font-bold uppercase mt-1">{p.t}</p>
                           </div>
                           <div className="text-right">
                              <p className="text-xs font-black text-slate-700">{p.h} Ha</p>
                              <p className="text-[8px] text-blue-600 font-black uppercase">Active</p>
                           </div>
                        </div>
                     ))}
                  </div>
               </Card>
               <div className="bg-blue-600 p-6 text-white shadow-xl shadow-blue-100 flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                     <div className="p-2 bg-white/20 rounded-none"><Download size={18} /></div>
                     <p className="text-[10px] font-black uppercase tracking-widest">Village Extract</p>
                  </div>
                  <p className="text-[11px] font-bold opacity-80 leading-relaxed uppercase">Download latest village map extract with FMB overlays for field verification.</p>
                  <button className="w-full py-3 bg-white text-blue-600 font-black text-[9px] uppercase tracking-widest hover:bg-blue-50 transition-all mt-2 shadow-lg">Download FMB Hub</button>
               </div>
            </div>
         </div>
      </div>
   );
};

const TalukExecutiveView = ({ user, parcels = [], alerts = [], patchAlertStatus }) => {
   const [assignmentModal, setAssignmentModal] = useState({ open: false, alertId: null });
   
   // Filtering alerts assigned by the Collector
   const activeAlerts = alerts.filter(a => a.status === 'COLLECTOR_ACCEPTED');

   const handleAction = (id) => {
      setAssignmentModal({ open: true, alertId: id });
   };

   const confirmAssignment = (officer) => {
      patchAlertStatus(assignmentModal.alertId, 'TAHSILDAR_ACCEPTED', { assignedTahsildar: officer });
      alert(`TACTICAL DISPATCH: Alert #${assignmentModal.alertId} forwarded to VAO node for Village Assignment.\n\nPriority: HIGH\nStatus: FORWARDED`);
      setAssignmentModal({ open: false, alertId: null });
   };

   return (
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-5 duration-500">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-5 rounded-none border border-slate-200 shadow-sm mb-2">
            <div>
               <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none">Taluk Command Hub</h2>
               <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-1">Officer Identity: {user?.name || 'Tahsildar Node'}</p>
            </div>
            <div className="flex items-center gap-2">
               <Badge variant="info">{activeAlerts.length} Collector Assignments</Badge>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
               <Card title="Immediate Tactical Queue" icon={ShieldAlert}>
                  <div className="space-y-3">
                     {activeAlerts.map(alert => (
                        <div key={alert.id} className="p-4 bg-slate-50 rounded-none flex items-center justify-between group hover:bg-white border border-transparent hover:border-slate-100 transition-all">
                           <div className="flex items-center gap-4">
                              <div className="w-16 h-16 rounded-none overflow-hidden border border-slate-200 shadow-sm"><img src={alert.img} className="w-full h-full object-cover" /></div>
                              <div>
                                 <p className="text-[11px] font-black text-slate-800 uppercase leading-none">Survey {alert.parcel_details}</p>
                                 <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">{alert.alert_type}</p>
                                 <div className="flex items-center gap-2 mt-2">
                                    <div className="w-1.5 h-1.5 bg-blue-600"></div>
                                    <p className="text-[8px] font-black text-blue-600 uppercase">Assigned by Collector</p>
                                    {(alert.verification?.photos?.length > 0 || alert.resolution_images?.length > 0) && (
                                       <Badge variant="success" className="ml-2 py-0 px-1.5 text-[7px]">📷 Live Evidence</Badge>
                                    )}
                                 </div>
                              </div>
                           </div>
                           <button onClick={() => handleAction(alert.id)} className="px-5 py-2.5 bg-slate-900 text-white rounded-none text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-md">Assign VAO</button>
                        </div>
                     ))}
                     {activeAlerts.length === 0 && (
                        <div className="p-12 text-center">
                           <div className="w-12 h-12 bg-slate-50 rounded-none flex items-center justify-center text-slate-300 mx-auto mb-4"><CheckCircle2 size={24} /></div>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No Active Missions from Collector</p>
                        </div>
                     )}
                  </div>
               </Card>
            </div>
            <div className="space-y-4">
               <Card title="Taluk Operational Readiness" icon={Activity}>
                  <div className="space-y-4">
                     {[
                        {n: 'VAO Node: Mettur', s: 'Online'},
                        {n: 'VAO Node: West-44', s: 'Online'},
                        {n: 'Field Inspect Node', s: 'Deployment'}
                     ].map((node, i) => (
                        <div key={i} className="p-3 bg-slate-50 rounded-none flex justify-between items-center border border-slate-100">
                           <span className="text-[9px] font-black text-slate-800 uppercase">{node.n}</span>
                           <Badge variant={node.s === 'Online' ? 'success' : 'info'} className="text-[8px]">{node.s}</Badge>
                        </div>
                     ))}
                  </div>
               </Card>
            </div>
         </div>
         <OfficerAssignmentModal isOpen={assignmentModal.open} alertId={assignmentModal.alertId} type="VAO" onClose={() => setAssignmentModal({ open: false, alertId: null })} onAssign={confirmAssignment} />
      </div>
   );
};

const CollectorExecutiveView = ({ parcels = [], alerts = [], patchAlertStatus, onTabChange }) => {
   const [assignmentModal, setAssignmentModal] = useState({ open: false, alertId: null });
   const [selectedTaluk, setSelectedTaluk] = useState('All');
   const [filterStatus, setFilterStatus] = useState('ACTIVE');
   
   const salemTaluks = TN_TALUKS['Salem'] || [];

   const handleAction = (id) => {
      setAssignmentModal({ open: true, alertId: id });
   };

   const confirmAssignment = (officer) => {
      patchAlertStatus(assignmentModal.alertId, 'COLLECTOR_ACCEPTED', { assignedCollector: officer });
      alert(`EXECUTIVE ORDER: Mission #${assignmentModal.alertId} officially authorized.\n\nCommand: SECURE_PROPERTY\nStatus: TRANSMITTED_TO_TALUK_NODE`);
      setAssignmentModal({ open: false, alertId: null });
   };

   const filteredAlerts = alerts.filter(a => {
      const matchesTaluk = selectedTaluk === 'All' || (a.taluk === selectedTaluk);
      if (!matchesTaluk) return false;

      // REMOVE COMPLETED: Only show unresolved alerts in the primary action queue
      if (filterStatus === 'ACTIVE') return ['NEW', 'WAITING', 'PENDING', 'COLLECTOR_ACCEPTED'].includes((a.status || 'NEW').toUpperCase());
      if (filterStatus === 'RESOLVED') return ['RESOLVED', 'SUCCESS'].includes((a.status || '').toUpperCase());
      return true;
   }).sort((a, b) => {
      const aIsRoadside = a.parcel_classification === 'Roadside' || (a.alert_type && a.alert_type.includes('Roadside'));
      const bIsRoadside = b.parcel_classification === 'Roadside' || (b.alert_type && b.alert_type.includes('Roadside'));
      if (aIsRoadside && !bIsRoadside) return -1;
      if (!aIsRoadside && bIsRoadside) return 1;
      return 0;
   });

   const activeCount = alerts.filter(a => ['NEW', 'WAITING', 'PENDING'].includes((a.status || 'NEW').toUpperCase())).length;

   return (
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-6 duration-700">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-none border border-slate-200 shadow-sm">
            <div>
               <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Executive Command Matrix</h2>
               <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Salem District • Strategic Node</p>
            </div>
            <div className="flex items-center gap-3">
               <Badge variant="danger">{activeCount} Unresolved Threats</Badge>
            </div>
         </div>

         <div className="bg-white border border-slate-200 rounded-none p-4 shadow-sm">
            <div className="flex justify-between items-center mb-6">
               <div><h3 className="font-black text-slate-900 uppercase tracking-tight text-lg">District-wide Taluk Surveillance</h3><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Salem District • {salemTaluks.length} Taluk Nodes</p></div>
               <div className="flex gap-2">
                  <button onClick={() => setSelectedTaluk('All')} className={`px-3 py-1 rounded-none text-[8px] font-black uppercase tracking-widest transition-all ${selectedTaluk === 'All' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>All Taluks</button>
                  <Badge variant="info">Live Feed</Badge>
               </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2">
               {salemTaluks.map(t => (
                  <button key={t} onClick={() => setSelectedTaluk(t)} className={`p-3 rounded-none border transition-all text-center ${selectedTaluk === t ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100'}`}>
                     <p className="text-[8px] font-black uppercase truncate">{t}</p>
                     <div className="flex justify-center gap-1 mt-1">
                        <div className={`w-1 h-1 rounded-none ${alerts.some(a => (a.status !== 'RESOLVED' && a.status !== 'Resolved') && ((a.taluk === t) || (a.parcel_details && a.parcel_details.includes(t)))) ? 'bg-red-400 animate-pulse' : 'bg-green-400 opacity-20'}`}></div>
                     </div>
                  </button>
               ))}
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-8 space-y-4">
               <Card title={`Tactical Threat Queue: ${selectedTaluk}`} icon={ShieldAlert}>
                   <div className="p-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                      <div className="flex bg-white p-1 rounded-none gap-1 border border-slate-200">
                         {['ACTIVE', 'RESOLVED', 'ALL'].map(s => (
                            <button 
                               key={s} 
                               onClick={() => setFilterStatus(s)}
                               className={`px-4 py-1.5 rounded-none text-[8px] font-black uppercase tracking-widest transition-all ${filterStatus === s ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                               {s}
                            </button>
                         ))}
                      </div>
                      <Badge variant="info">{filteredAlerts.length} Nodes</Badge>
                   </div>
                  <div className="max-h-[580px] overflow-y-auto custom-scrollbar p-2 space-y-3 bg-slate-50/30">
                     {filteredAlerts.map(alert => (
                        <div key={alert.id} className="p-5 bg-white rounded-none flex items-center justify-between group hover:bg-indigo-50/30 border border-slate-100 hover:border-indigo-200 transition-all shadow-sm relative overflow-hidden">
                           {/* Color Accent Strip */}
                           <div className={`absolute left-0 top-0 h-full w-1 ${alert.confidence_score > 0.8 ? 'bg-rose-500' : 'bg-amber-500'}`}></div>
                           
                           <div className="flex items-center gap-6">
                              <div className="w-20 h-20 rounded-none overflow-hidden border border-slate-200 shadow-sm relative shrink-0 bg-slate-100 group-hover:border-indigo-300 transition-all">
                                 <img src={alert.img || img1} alt="Node" className="w-full h-full object-cover transition-all duration-700 scale-110 group-hover:scale-100" />
                                 <div className="absolute inset-0 bg-indigo-600/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                              </div>
                              <div>
                                 <div className="flex items-center gap-3 mb-2">
                                    <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight leading-none">Survey {alert.parcel_details || alert.survey_number}</p>
                                    <div className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-widest border ${alert.confidence_score > 0.8 ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                                       {(alert.confidence_score * 100).toFixed(0)}% AI_THREAT_CONF
                                    </div>
                                    {(alert.parcel_classification === 'Roadside' || alert.status === 'COLLECTOR_ACCEPTED') && (
                                       <div className="px-2 py-0.5 text-[8px] font-black uppercase tracking-widest border bg-amber-500 text-white border-amber-600 animate-pulse">
                                          ⚠ ROADSIDE PRIORITY
                                       </div>
                                    )}
                                 </div>
                                 <p className="text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
                                    {alert.alert_type}
                                 </p>
                                 <div className="flex gap-4 mt-3">
                                    <div className="flex flex-col">
                                       <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Detection_Node</span>
                                       <span className="text-[9px] font-bold text-slate-700 uppercase flex items-center gap-1"><Cpu size={10} className="text-indigo-500" /> SAT_SENTINEL_4</span>
                                    </div>
                                    <div className="flex flex-col">
                                       <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Regional_Hub</span>
                                       <span className="text-[9px] font-bold text-slate-700 uppercase flex items-center gap-1"><MapIcon size={10} className="text-emerald-500" /> {alert.taluk || 'SALEM_CORE'}</span>
                                    </div>
                                 </div>
                              </div>
                           </div>
                           <div className="flex flex-col items-end gap-3">
                              <div className="text-right">
                                 <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Protocol_State</p>
                                 <p className="text-[9px] font-black text-rose-500 uppercase flex items-center justify-end gap-1">
                                    <AlertTriangle size={10} /> CRITICAL_AWAITING_ORDER
                                 </p>
                              </div>
                              <button onClick={() => handleAction(alert.id)} className="px-8 py-3 bg-slate-900 text-white rounded-none text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg hover:shadow-indigo-100 flex items-center gap-2 border-b-2 border-indigo-500">
                                 <Zap size={14} className="text-amber-400" /> Authorize Executive Mission
                              </button>
                           </div>
                        </div>
                     ))}
                     {filteredAlerts.length === 0 && (
                        <div className="py-20 text-center bg-white border border-dashed border-slate-200">
                           <div className="w-16 h-16 bg-slate-50 rounded-none flex items-center justify-center mx-auto mb-4 text-slate-300 shadow-sm border border-slate-100"><ShieldCheck size={32} /></div>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic">No Strategic Detections Required in Local Node</p>
                        </div>
                      )}
                  </div>
               </Card>
            </div>

            <div className="lg:col-span-4 space-y-6">
               <div className="bg-slate-900 rounded-none p-6 text-white relative overflow-hidden shadow-xl">
                  <h4 className="text-[10px] font-black uppercase tracking-widest mb-6 flex items-center gap-2 text-blue-400"><Activity size={14} /> Operational Oversight</h4>
                  <div className="space-y-3">
                     <div className="p-4 bg-white/5 border border-white/10 rounded-none mb-4">
                        <div className="flex justify-between items-center mb-2">
                           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Field Missions</span>
                           <span className="text-blue-400 font-black text-xs">03</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/10 rounded-none overflow-hidden">
                           <div className="h-full bg-blue-500 w-2/3"></div>
                        </div>
                        <p className="text-[8px] text-slate-400 font-bold uppercase mt-2">Team Alpha: ON SITE (SW-142)</p>
                     </div>
                     <button onClick={() => onTabChange('enforcement')} className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-none text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3"><Monitor size={14} /> Monitor Live Work</button>
                     <button onClick={() => alert("ISSUE: District-wide Encroachment Sweep initiated.")} className="w-full py-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-none text-[9px] font-black uppercase tracking-widest transition-all">Mobilize All Taluks</button>
                  </div>
               </div>
               <Card title="Departmental Readiness" icon={Activity}>
                  <div className="space-y-4">{[ { d: 'Revenue', p: 88, c: 'bg-green-500' }, { d: 'Police', p: 65, c: 'bg-blue-500' }, { d: 'GIS Node', p: 100, c: 'bg-indigo-500' } ].map((dep, i) => (
                     <div key={i}><div className="flex justify-between text-[8px] font-black uppercase mb-1"><span>{dep.d}</span><span>{dep.p}%</span></div><ProgressBar progress={dep.p} color={dep.c} /></div>
                  ))}</div>
               </Card>
            </div>
         </div>
         <OfficerAssignmentModal isOpen={assignmentModal.open} alertId={assignmentModal.alertId} type="TAHSILDAR" onClose={() => setAssignmentModal({ open: false, alertId: null })} onAssign={confirmAssignment} />
      </div>
   );
};

const RevenueRecoveryView = () => (
   <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="bg-white border border-slate-200 rounded-none p-4 shadow-sm">
         <div className="flex justify-between items-center mb-8">
            <div>
               <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Revenue Recovery Matrix</h3>
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Financial Intelligence • Salem District</p>
            </div>
            <button onClick={() => alert('Generating Comprehensive Audit Report (PDF)...\nCompiling data from Revenue, Police, and GIS nodes.')} className="px-6 py-2.5 bg-green-600 text-white rounded-none text-[9px] font-black uppercase tracking-widest shadow-lg shadow-green-100 flex items-center gap-2 transition-all hover:bg-green-700"><Download size={16} /> Export Audit</button>
         </div>
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
               <div className="h-64 flex items-end gap-6 px-4">
                  {[
                     { t: 'Salem West', v: 85, c: 'bg-green-500' }, { t: 'Salem South', v: 60, c: 'bg-green-400' },
                     { t: 'Mettur', v: 92, c: 'bg-green-600' }, { t: 'Omalur', v: 45, c: 'bg-emerald-400' },
                     { t: 'Attur', v: 70, c: 'bg-green-700' }, { t: 'Edappadi', v: 55, c: 'bg-emerald-500' }
                  ].map((d, i) => (
                     <div key={i} className="flex-1 flex flex-col items-center gap-4 group cursor-pointer">
                        <div className="w-full relative">
                           <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] px-2 py-1 rounded-none opacity-0 group-hover:opacity-100 transition-all font-black">₹{d.v}L</div>
                           <div className={`${d.c} w-full rounded-none group-hover:scale-105 transition-all duration-1000 animate-in slide-in-from-bottom`} style={{ height: `${d.v * 2.5}px`, animationDelay: `${i * 100}ms` }}></div>
                        </div>
                        <span className="text-[9px] font-black text-slate-500 uppercase rotate-45 lg:rotate-0 mt-2">{d.t}</span>
                     </div>
                  ))}
               </div>
            </div>
            <div className="space-y-6">
               <div className="p-6 bg-slate-50 rounded-none border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-4">Recovery Efficiency</p>
                  <div className="flex items-center justify-between mb-2">
                     <span className="text-2xl font-black text-slate-900">92.4%</span>
                     <span className="text-green-600 font-bold text-[10px]">+4.2%</span>
                  </div>
                  <ProgressBar progress={92} color="bg-green-600" />
               </div>
               <div className="p-6 bg-slate-50 rounded-none border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-4">Target Variance</p>
                  <div className="flex items-center justify-between mb-2">
                     <span className="text-2xl font-black text-slate-900">₹12.2 Cr</span>
                     <span className="text-orange-500 font-bold text-[10px]">REMAINING</span>
                  </div>
                  <ProgressBar progress={78} color="bg-orange-500" />
               </div>
            </div>
         </div>

         {/* Detailed Recovery List */}
         <div className="mt-8">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Detailed Recovery Targets</h4>
            <div className="bg-white border border-slate-200">
               <div className="grid grid-cols-5 text-[9px] font-black uppercase text-slate-400 p-4 border-b border-slate-100 bg-slate-50 tracking-widest">
                  <div>Target ID & Entity</div>
                  <div>Taluk / Location</div>
                  <div>Amount Due</div>
                  <div>Recovered</div>
                  <div>Current Status</div>
               </div>
               {[
                  { id: 'REC-901', entity: 'Mettur Chemical Works', loc: 'Mettur', due: '₹45.5L', rec: '₹0.0L', status: 'NOTICE_SERVED', color: 'text-orange-500' },
                  { id: 'REC-902', entity: 'Salem Steel Allied', loc: 'Salem West', due: '₹12.0L', rec: '₹4.0L', status: 'PARTIAL_RECOVERY', color: 'text-blue-600' },
                  { id: 'REC-903', entity: 'KRS Constructions', loc: 'Omalur', due: '₹22.0L', rec: '₹22.0L', status: 'RECOVERED_FULL', color: 'text-green-600' },
                  { id: 'REC-904', entity: 'Illegal Godown - Ward 4', loc: 'Attur', due: '₹5.5L', rec: '₹1.0L', status: 'ATTACHMENT_PENDING', color: 'text-blue-600' },
                  { id: 'REC-905', entity: 'National Textiles Ltd', loc: 'Salem South', due: '₹88.2L', rec: '₹0.0L', status: 'LEGAL_STAY', color: 'text-red-600' },
                  { id: 'REC-906', entity: 'Priya Spinning Mills', loc: 'Edappadi', due: '₹14.3L', rec: '₹14.3L', status: 'RECOVERED_FULL', color: 'text-green-600' },
                  { id: 'REC-907', entity: 'Srinivasa Layouts', loc: 'Yercaud', due: '₹31.0L', rec: '₹10.0L', status: 'PARTIAL_RECOVERY', color: 'text-blue-600' },
                  { id: 'REC-908', entity: 'MVR Logistics Hub', loc: 'Sankagiri', due: '₹9.5L', rec: '₹0.0L', status: 'NOTICE_SERVED', color: 'text-orange-500' }
               ].map((item, idx) => (
                  <div key={idx} className="grid grid-cols-5 text-xs font-bold text-slate-800 p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors items-center">
                     <div>
                        <span className="text-blue-600 font-black">{item.id}</span>
                        <div className="text-[10px] text-slate-500 uppercase mt-1">{item.entity}</div>
                     </div>
                     <div className="uppercase">{item.loc}</div>
                     <div className="text-red-600 font-black">{item.due}</div>
                     <div className="text-green-600 font-black">{item.rec}</div>
                     <div className={`text-[9px] font-black tracking-widest uppercase ${item.color}`}>
                        <span className={`px-2 py-1 bg-slate-100 border border-slate-200`}>{item.status}</span>
                     </div>
                  </div>
               ))}
            </div>
         </div>
      </div>
   </div>
);

const LegalCoordinationView = () => (
   <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         {[
            { t: 'Active Cases', v: '142', i: Scale, c: 'text-blue-600' },
            { t: 'Stay Orders', v: '14', i: ShieldAlert, c: 'text-red-600' },
            { t: 'Won / Settled', v: '89', i: CheckCircle2, c: 'text-green-600' },
            { t: 'Pending Review', v: '39', i: Clock, c: 'text-orange-500' }
         ].map((k, i) => (
            <div key={i} className="bg-white p-4 rounded-none border border-slate-200 shadow-sm">
               <div className="flex justify-between items-start mb-3">
                  <div className={`p-2 rounded-none bg-slate-50 ${k.c}`}><k.i size={18} /></div>
                  <Badge variant="info" className="text-[8px]">District Hub</Badge>
               </div>
               <h4 className="text-2xl font-black text-slate-900 tracking-tighter">{k.v}</h4>
               <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 tracking-widest">{k.t}</p>
            </div>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
         <div className="lg:col-span-2 space-y-6">
            <Card title="Tactical Court Case Registry" icon={Gavel}>
               <div className="space-y-4">
                  {[
                     { id: 'HC-2024-44', t: 'Stay Order: Mettur Survey 142/A', d: 'High Court', s: 'STAY ACTIVE', p: 'CRITICAL' },
                     { id: 'DC-2024-88', t: 'Encroachment Appeal: Salem West', d: 'District Court', s: 'HEARING SET', p: 'HIGH' },
                     { id: 'HC-2024-12', t: 'Public Land Reclaim: Attur', d: 'High Court', s: 'NOTICE ISSUED', p: 'MEDIUM' }
                  ].map((c, i) => (
                     <div key={i} className="p-4 bg-slate-50 rounded-none hover:bg-white border border-transparent hover:border-slate-200 transition-all flex items-center justify-between group cursor-pointer">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-none bg-white border border-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">{c.id.split('-')[0]}</div>
                           <div>
                              <p className="text-xs font-black text-slate-800 uppercase">{c.t}</p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">{c.d} • {c.id}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-4">
                           <Badge variant={c.p === 'CRITICAL' ? 'danger' : 'info'}>{c.s}</Badge>
                           <button className="p-2 bg-white border border-slate-200 rounded-none text-slate-400 group-hover:text-blue-600 transition-all"><ChevronRight size={14} /></button>
                        </div>
                     </div>
                  ))}
               </div>
            </Card>
         </div>
         <div className="space-y-6">
            <Card title="Legal Intelligence Feed" icon={FileText}>
               <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-none border border-blue-100">
                     <p className="text-[10px] font-black text-blue-900 uppercase mb-2">Upcoming Hearing</p>
                     <p className="text-[11px] text-blue-700 leading-relaxed font-bold">Survey 142/A stay order review scheduled for April 24th in Madras High Court.</p>
                  </div>
                  <div className="space-y-3">
                     <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase"><span>Document Uploads</span><span>12 Today</span></div>
                     <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase"><span>Legal Notices</span><span className="text-red-600">4 Urgent</span></div>
                  </div>
               </div>
            </Card>
            <div className="bg-slate-900 rounded-none p-4 text-white text-center shadow-xl shadow-slate-200">
               <div className="w-12 h-12 bg-blue-600 rounded-none flex items-center justify-center mx-auto mb-4"><Gavel size={24} /></div>
               <h5 className="text-[11px] font-black uppercase tracking-widest mb-2">Legal Coordination</h5>
               <p className="text-[9px] text-slate-400 font-bold uppercase mb-6 leading-relaxed">Request special legal counsel for complex encroachment stays in Mettur.</p>
               <button className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-none text-[9px] font-black uppercase tracking-widest transition-all">Assign Counsel</button>
            </div>
         </div>
      </div>
   </div>
);

const RegistryUpdationView = ({ requests = [], onSubmit, user }) => {
   const updationRequests = requests.filter(r => r.type === 'UPDATION');
   const [showSignature, setShowSignature] = useState(false);
   const [formData, setFormData] = useState({ 
      loc: 'Suramangalam', 
      taluk: 'Salem West', 
      survey: '', 
      subdivision: '',
      owner: '', 
      cls: '', 
      ext: '', 
      applicantName: '',
      aadhaar: '',
      mobile: '',
      relationType: 'S/O',
      relativeName: '',
      address: '',
      blockNo: '',
      wardNo: '',
      pattaNo: '',
      reason: 'TRANS_OWNER',
      courtRef: '',
      status: 'PENDING_TAHSILDAR' 
   });

   const handleSubmit = (e) => {
      e.preventDefault();
      setShowSignature(true);
      if (onSubmit) onSubmit({ ...formData, type: 'UPDATION' });
   };

   if (showSignature) {
      return (
         <div className="flex items-center justify-center min-h-[60vh] animate-in fade-in zoom-in duration-500">
            <div className="bg-white p-12 text-center border border-slate-200 shadow-2xl max-w-xl w-full relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1.5 bg-emerald-500"></div>
               <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <ShieldCheck size={40} className="text-emerald-600 animate-bounce" />
               </div>
               <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">Protocol Initiated</h3>
               <p className="text-slate-500 font-bold text-[11px] uppercase tracking-widest mb-8">Token Auth: TN-VAO-{user?.name?.slice(0,3) || 'SLM'}-SECURE</p>
               
               <div className="bg-slate-50 border border-slate-100 p-6 text-left mb-8 space-y-3">
                  <div className="flex justify-between items-center"><span className="text-[10px] font-black text-slate-400 uppercase">Current Status</span><Badge variant="warning">Awaiting Approval</Badge></div>
                  <div className="flex justify-between items-center"><span className="text-[10px] font-black text-slate-400 uppercase">Tracking ID</span><span className="text-xs font-black text-slate-900">REQ-{Math.floor(Math.random()*10000)}</span></div>
                  <div className="flex justify-between items-center"><span className="text-[10px] font-black text-slate-400 uppercase">Uplink Code</span><span className="text-xs font-mono text-blue-600">0x8842_SECURE</span></div>
               </div>
               
               <button onClick={() => setShowSignature(false)} className="w-full py-4 bg-slate-900 text-white font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg">Submit Another Request</button>
            </div>
         </div>
      );
   }


   return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
         {/* Premium Header */}
         <div className="bg-white border border-slate-200 p-8 shadow-sm relative overflow-hidden">
            <div className="absolute right-0 top-0 h-full w-1/3 bg-blue-50/50 -skew-x-12 translate-x-1/4"></div>
            <div className="relative z-10 flex justify-between items-center">
               <div>
                  <div className="flex items-center gap-3 mb-2">
                     <div className="bg-blue-600 p-2.5 text-white shadow-lg shadow-blue-100"><Layers size={24} /></div>
                     <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Land Registry Updation Terminal</h2>
                  </div>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">Tamil Nadu Revenue Department • Secure Node: {formData.loc}</p>
               </div>
               <div className="hidden md:flex gap-4">
                  <div className="px-6 py-3 bg-slate-900 text-white text-center min-w-[150px] border-b-4 border-blue-500">
                     <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Service Status</p>
                     <p className="text-xs font-black text-blue-400 uppercase tracking-widest">LIVE_SYNC</p>
                  </div>
               </div>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3">
               <form className="space-y-8" onSubmit={handleSubmit}>
                  {/* Section 1: Applicant Information */}
                  <div className="bg-white border border-slate-200 shadow-sm overflow-hidden">
                     <div className="px-8 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                        <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                           <Users size={14} className="text-blue-600" /> [01] Applicant Profile Information
                        </h3>
                     </div>
                     <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-2">
                           <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 italic">Full Name of Applicant</label>
                           <input type="text" className="w-full p-3 border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-600 outline-none transition-all" placeholder="Enter as per Aadhaar" value={formData.applicantName} onChange={e => setFormData({...formData, applicantName: e.target.value})} required />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 italic">ID Reference (Aadhaar / EPIC)</label>
                           <input type="text" className="w-full p-3 border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-600 outline-none transition-all" placeholder="XXXX XXXX XXXX" value={formData.aadhaar} onChange={e => setFormData({...formData, aadhaar: e.target.value})} required />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 italic">Verified Mobile Uplink</label>
                           <input type="text" className="w-full p-3 border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-600 outline-none transition-all" placeholder="+91 XXXX XXXX XX" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} required />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 italic">Relation Type</label>
                           <select className="w-full p-3 border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-600 outline-none transition-all" value={formData.relationType} onChange={e => setFormData({...formData, relationType: e.target.value})}>
                              <option value="S/O">Son of (S/O)</option>
                              <option value="D/O">Daughter of (D/O)</option>
                              <option value="W/O">Wife of (W/O)</option>
                              <option value="Guardian">Guardian</option>
                           </select>
                        </div>
                        <div className="space-y-2">
                           <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 italic">Father / Husband Name</label>
                           <input type="text" className="w-full p-3 border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-600 outline-none transition-all" value={formData.relativeName} onChange={e => setFormData({...formData, relativeName: e.target.value})} />
                        </div>
                        <div className="md:col-span-2 lg:col-span-1 space-y-2">
                           <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 italic">Permanent Correspondence Address</label>
                           <input type="text" className="w-full p-3 border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-600 outline-none transition-all" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                        </div>
                     </div>
                  </div>

                  {/* Section 2: Property Location Details */}
                  <div className="bg-white border border-slate-200 shadow-sm overflow-hidden">
                     <div className="px-8 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                        <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                           <MapPin size={14} className="text-blue-600" /> [02] Official Property Geospatial Context
                        </h3>
                     </div>
                     <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="space-y-2">
                           <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 italic">Revenue District</label>
                           <input type="text" className="w-full p-3 border border-slate-200 bg-slate-100 text-xs font-bold text-slate-500 outline-none" value="Salem" readOnly />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 italic">Revenue Taluk</label>
                           <input type="text" className="w-full p-3 border border-slate-200 bg-slate-100 text-xs font-bold text-slate-500 outline-none" value={formData.taluk} readOnly />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 italic">Village / Town Node</label>
                           <input type="text" className="w-full p-3 border border-slate-200 bg-slate-100 text-xs font-bold text-slate-500 outline-none" value={formData.loc} readOnly />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 italic">Ward / Block Number</label>
                           <input type="text" className="w-full p-3 border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-600 outline-none transition-all" placeholder="e.g. Ward 04" value={formData.wardNo} onChange={e => setFormData({...formData, wardNo: e.target.value})} />
                        </div>
                     </div>
                  </div>

                  {/* Section 3: Registry Metadata */}
                  <div className="bg-white border border-slate-200 shadow-sm overflow-hidden">
                     <div className="px-8 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                        <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                           <FileText size={14} className="text-blue-600" /> [03] A-Register / Patta Metadata
                        </h3>
                     </div>
                     <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="space-y-2">
                           <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 italic">Survey Number</label>
                           <input type="text" className="w-full p-3 border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-600 outline-none transition-all" placeholder="e.g. 142" value={formData.survey} onChange={e => setFormData({...formData, survey: e.target.value})} required />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 italic">Sub-Division Number</label>
                           <input type="text" className="w-full p-3 border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-600 outline-none transition-all" placeholder="e.g. A1" value={formData.subdivision} onChange={e => setFormData({...formData, subdivision: e.target.value})} required />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 italic">Existing Patta Number</label>
                           <input type="text" className="w-full p-3 border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-600 outline-none transition-all" placeholder="e.g. 1024" value={formData.pattaNo} onChange={e => setFormData({...formData, pattaNo: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 italic">Land Classification</label>
                           <select className="w-full p-3 border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-600 outline-none transition-all appearance-none" value={formData.cls} onChange={e => setFormData({...formData, cls: e.target.value})} required>
                              <option value="">Select Classification</option>
                              <option value="Poramboke">Government - Poramboke</option>
                              <option value="Natham">Village - Natham</option>
                              <option value="Waterbody">Protected - Waterbody</option>
                              <option value="Forest">Reserved - Forest</option>
                              <option value="Ryotwari">Ryotwari - Private</option>
                           </select>
                        </div>
                     </div>
                  </div>

                  {/* Section 4: Modification Parameters */}
                  <div className="bg-white border border-slate-200 shadow-sm overflow-hidden">
                     <div className="px-8 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                        <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                           <Zap size={14} className="text-blue-600" /> [04] Modification Vector & Justification
                        </h3>
                     </div>
                     <div className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="space-y-2">
                              <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 italic">Primary Reason for Update</label>
                              <select className="w-full p-3 border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-600 outline-none transition-all" value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})}>
                                 <option value="TRANS_OWNER">Transfer of Ownership (Succession/Sale)</option>
                                 <option value="AREA_VERI">Area Verification / FMB Alignment</option>
                                 <option value="CLASS_CHANGE">Land Classification Update</option>
                                 <option value="SUB_DIV">New Sub-Division Initiation</option>
                                 <option value="COURT_ORDER">Court Directed Amendment</option>
                              </select>
                           </div>
                           <div className="space-y-2">
                              <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 italic">Total Extent to be Updated (Hec)</label>
                              <input type="text" className="w-full p-3 border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-600 outline-none transition-all" placeholder="e.g. 0.25.00" value={formData.ext} onChange={e => setFormData({...formData, ext: e.target.value})} required />
                           </div>
                        </div>
                        <div className="space-y-2">
                           <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 italic">Administrative Justification / Detailed Notes</label>
                           <textarea className="w-full p-4 border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-600 outline-none transition-all h-32 resize-none" placeholder="Provide detailed administrative justification including document references and field survey remarks..."></textarea>
                        </div>
                     </div>
                  </div>

                  {/* Declaration & Submission */}
                  <div className="bg-slate-900 p-8 flex flex-col md:flex-row justify-between items-center gap-8 border-t-8 border-blue-600">
                     <div className="flex gap-4 items-center max-w-md">
                        <div className="p-3 bg-blue-600/20 border border-blue-500/30 text-blue-400"><Shield size={24} /></div>
                        <div>
                           <p className="text-[10px] font-black uppercase tracking-widest text-white">Registry Integrity Declaration</p>
                           <p className="text-[8px] font-bold text-slate-500 uppercase mt-1 leading-relaxed">I hereby certify that the information provided is verified against field records and complies with the Tamil Nadu Land Revenue Act protocols.</p>
                        </div>
                     </div>
                     <button type="submit" className="w-full md:w-auto px-12 py-4 bg-white text-slate-900 font-black text-xs uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                        Authenticate & Transmit <Fingerprint size={18} />
                     </button>
                  </div>
               </form>
            </div>

            <div className="space-y-6">
               <div className="bg-white border border-slate-200 p-6 shadow-sm">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                     <History size={14} className="text-blue-500" /> Protocol Log
                  </h4>
                  <div className="space-y-6">
                     {[
                        { t: '14:20:01', a: 'Geospatial Node Sync', s: 'SUCCESS' },
                        { t: '14:18:45', a: 'Aadhaar Auth Node', s: 'VERIFIED' },
                        { t: '14:15:22', a: 'Mainframe Uplink', s: 'STANDBY' }
                     ].map((log, i) => (
                        <div key={i} className="flex gap-3">
                           <div className="text-[8px] font-black text-blue-600 w-12 pt-0.5">{log.t}</div>
                           <div>
                              <p className="text-[9px] font-black text-slate-800 uppercase">{log.a}</p>
                              <p className="text-[7px] font-bold text-slate-400 uppercase">{log.s}</p>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>

               <div className="bg-slate-50 border border-slate-200 p-6 shadow-sm">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                     <Download size={14} className="text-emerald-500" /> Required Artifacts
                  </h4>
                  <div className="space-y-3">
                     {[
                        'FMB Sketch Extract',
                        'Old Patta / Chitta',
                        'Aadhaar / ID Proof',
                        'Sale Deed / Heirship Cert'
                     ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-white border border-slate-100">
                           <div className="w-1.5 h-1.5 bg-emerald-500"></div>
                           <span className="text-[9px] font-black text-slate-600 uppercase">{item}</span>
                        </div>
                     ))}
                  </div>
               </div>

               <div className="bg-blue-600 p-8 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10"><Landmark size={120} /></div>
                  <h5 className="text-[11px] font-black uppercase tracking-widest mb-4">VAO/RI Notice</h5>
                  <p className="text-xs font-bold leading-relaxed mb-6 opacity-90">
                     All registry updates must be mirrored in the Taluk Mainframe within 48 hours of VAO submission. Ensure all spatial boundary drifts are documented.
                  </p>
                  <button className="w-full py-3 bg-white text-blue-600 text-[9px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all">View State Guidelines</button>
               </div>
            </div>
         </div>

         {/* Transaction History Section */}
         <div className="bg-white border border-slate-200 shadow-sm">
            <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
               <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <Database size={16} className="text-blue-600" /> Strategic Registry Transaction Hub
               </h3>
               <Badge variant="info">Sync Active</Badge>
            </div>
            <div className="overflow-x-auto">
               <table className="w-full border-collapse">
                  <thead>
                     <tr className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 tracking-widest">
                        <th className="px-8 py-4 text-left border-b border-slate-100">Protocol ID</th>
                        <th className="px-8 py-4 text-left border-b border-slate-100">Survey Context</th>
                        <th className="px-8 py-4 text-left border-b border-slate-100">Classification</th>
                        <th className="px-8 py-4 text-left border-b border-slate-100">Extent Delta</th>
                        <th className="px-8 py-4 text-left border-b border-slate-100">Auth Timestamp</th>
                        <th className="px-8 py-4 text-right border-b border-slate-100">Lifecycle Phase</th>
                     </tr>
                  </thead>
                  <tbody>
                     {updationRequests.map((row, i) => (
                        <tr key={i} className="group hover:bg-slate-50/50 transition-colors">
                           <td className="px-8 py-4 border-b border-slate-50"><span className="text-xs font-black text-blue-600 font-mono">#{row.id}</span></td>
                           <td className="px-8 py-4 border-b border-slate-50">
                              <span className="text-xs font-bold text-slate-800">{row.survey}</span>
                              <p className="text-[8px] font-black text-slate-400 uppercase mt-0.5">{row.loc}</p>
                           </td>
                           <td className="px-8 py-4 border-b border-slate-50"><Badge variant="info" className="text-[8px]">{row.cls}</Badge></td>
                           <td className="px-8 py-4 border-b border-slate-50"><span className="text-xs font-bold text-slate-700">{row.ext} Hec</span></td>
                           <td className="px-8 py-4 border-b border-slate-50"><span className="text-[10px] font-medium text-slate-500 uppercase">{row.timestamp}</span></td>
                           <td className="px-8 py-4 border-b border-slate-50 text-right">
                              <span className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-widest ${row.status === 'VERIFIED_DB' ? 'text-emerald-600 bg-emerald-50 border border-emerald-100' : 'text-amber-600 bg-amber-50 border border-amber-100'}`}>{row.status}</span>
                           </td>
                        </tr>
                     ))}
                     {updationRequests.length === 0 && (
                        <tr><td colSpan="6" className="px-8 py-20 text-center text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] italic">No active updation protocols detected in local node.</td></tr>
                     )}
                  </tbody>
               </table>
            </div>
         </div>
      </div>
   );
};

const RegistryCorrectionView = ({ requests = [], onSubmit, user }) => {
   const correctionRequests = requests.filter(r => r.type === 'CORRECTION');
   const [showSignature, setShowSignature] = useState(false);
   const [formData, setFormData] = useState({ 
      loc: 'Suramangalam', 
      taluk: 'Salem West', 
      survey: '', 
      subdivision: '',
      errorType: '', 
      proposed: '', 
      recorded: '',
      caseRef: '',
      applicantName: '',
      applicantID: '',
      status: 'PENDING_TAHSILDAR' 
   });

   const handleSubmit = (e) => {
      e.preventDefault();
      setShowSignature(true);
      if (onSubmit) onSubmit({ ...formData, type: 'CORRECTION' });
   };

   if (showSignature) {
      return (
         <div className="flex items-center justify-center min-h-[60vh] animate-in fade-in zoom-in duration-500">
            <div className="bg-white p-12 text-center border border-slate-200 shadow-2xl max-w-xl w-full relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1.5 bg-rose-500"></div>
               <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6 text-rose-500">
                  <ShieldCheck size={40} className="animate-bounce" />
               </div>
               <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">Correction Logged</h3>
               <p className="text-slate-500 font-bold text-[11px] uppercase tracking-widest mb-8">Auth Node: TN-COR-{user?.name?.slice(0,3) || 'SLM'}-SECURE</p>
               
               <div className="bg-slate-50 border border-slate-100 p-6 text-left mb-8 space-y-3">
                  <div className="flex justify-between items-center"><span className="text-[10px] font-black text-slate-400 uppercase">Phase</span><Badge variant="warning">Verification Stage</Badge></div>
                  <div className="flex justify-between items-center"><span className="text-[10px] font-black text-slate-400 uppercase">Evidence</span><span className="text-xs font-black text-slate-900">Digital Affidavits Attached</span></div>
               </div>
               
               <button onClick={() => setShowSignature(false)} className="w-full py-4 bg-slate-900 text-white font-black text-xs uppercase tracking-widest hover:bg-rose-600 transition-all shadow-lg">Return to Terminal</button>
            </div>
         </div>
      );
   }


   return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
         {/* Premium Header */}
         <div className="bg-white border border-slate-200 p-8 shadow-sm relative overflow-hidden">
            <div className="absolute right-0 top-0 h-full w-1/3 bg-rose-50/50 -skew-x-12 translate-x-1/4"></div>
            <div className="relative z-10 flex justify-between items-center">
               <div>
                  <div className="flex items-center gap-3 mb-2">
                     <div className="bg-rose-600 p-2.5 text-white shadow-lg shadow-rose-100"><Edit3 size={24} /></div>
                     <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">A-Register Correction Protocol</h2>
                  </div>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">Official Amendment Request • TN-REV Compliance Node</p>
               </div>
               <Badge variant="danger" className="py-2 px-6">CRITICAL DISCREPANCY MATRIX</Badge>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3">
               <form className="space-y-8" onSubmit={handleSubmit}>
                  {/* Section 1: Discrepancy Context */}
                  <div className="bg-white border border-slate-200 shadow-sm overflow-hidden">
                     <div className="px-8 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                        <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                           <AlertTriangle size={14} className="text-rose-600" /> [01] Discrepancy Origin & ID Context
                        </h3>
                     </div>
                     <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-2">
                           <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 italic">Reported By (Entity/Dept)</label>
                           <input type="text" className="w-full p-3 border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-600 outline-none transition-all" placeholder="e.g. Field Inspector" value={formData.applicantName} onChange={e => setFormData({...formData, applicantName: e.target.value})} required />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 italic">Officer ID / Auth Ref</label>
                           <input type="text" className="w-full p-3 border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-600 outline-none transition-all" placeholder="e.g. SLM-VAO-88" value={formData.applicantID} onChange={e => setFormData({...formData, applicantID: e.target.value})} required />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 italic">Legal / Case Reference</label>
                           <input type="text" className="w-full p-3 border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-600 outline-none transition-all" placeholder="e.g. W.P. No 122/2024" value={formData.caseRef} onChange={e => setFormData({...formData, caseRef: e.target.value})} />
                        </div>
                        <div className="space-y-2 lg:col-span-2">
                           <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 italic">Error Classification</label>
                           <select className="w-full p-3 border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-600 outline-none transition-all" value={formData.errorType} onChange={e => setFormData({...formData, errorType: e.target.value})} required>
                              <option value="">Select Category</option>
                              <option value="extent">Area Measurement Discrepancy (Extent)</option>
                              <option value="class">Wrongful Land Classification</option>
                              <option value="boundary">Spatial Boundary Drift (FMB Mismatch)</option>
                              <option value="title">Clerical Error in Ownership Title</option>
                              <option value="survey">Missing / Incorrect Survey Number Mapping</option>
                           </select>
                        </div>
                        <div className="space-y-2">
                           <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 italic">Discrepancy Severity</label>
                           <Badge variant="danger" className="w-full py-3 flex justify-center">HIGH_PRIORITY_ACTION</Badge>
                        </div>
                     </div>
                  </div>

                  {/* Section 2: Property Identification */}
                  <div className="bg-white border border-slate-200 shadow-sm overflow-hidden">
                     <div className="px-8 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                        <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                           <MapPin size={14} className="text-blue-600" /> [02] Target Property Identification
                        </h3>
                     </div>
                     <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="space-y-2">
                           <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 italic">Survey Number</label>
                           <input type="text" className="w-full p-3 border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-600 outline-none transition-all" value={formData.survey} onChange={e => setFormData({...formData, survey: e.target.value})} required />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 italic">Sub-Division</label>
                           <input type="text" className="w-full p-3 border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-600 outline-none transition-all" value={formData.subdivision} onChange={e => setFormData({...formData, subdivision: e.target.value})} required />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 italic">Taluk Node</label>
                           <input type="text" className="w-full p-3 border border-slate-200 bg-slate-100 text-xs font-bold text-slate-500" value={formData.taluk} readOnly />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 italic">Village Context</label>
                           <input type="text" className="w-full p-3 border border-slate-200 bg-slate-100 text-xs font-bold text-slate-500" value={formData.loc} readOnly />
                        </div>
                     </div>
                  </div>

                  {/* Section 3: Data Reconciliation Matrix */}
                  <div className="bg-white border border-slate-200 shadow-sm overflow-hidden">
                     <div className="px-8 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                        <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                           <Cpu size={14} className="text-blue-600" /> [03] Tactical Data Reconciliation Matrix
                        </h3>
                     </div>
                     <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="space-y-4">
                           <div className="flex items-center gap-2 text-rose-600 border-b border-rose-100 pb-2 mb-4">
                              <X size={16} /><span className="text-[10px] font-black uppercase tracking-[0.2em]">Recorded Registry State (INVALID)</span>
                           </div>
                           <textarea className="w-full p-5 border border-rose-100 bg-rose-50/20 text-xs font-bold text-slate-800 h-48 resize-none outline-none focus:ring-4 focus:ring-rose-500/10 transition-all" placeholder="Enter exactly as per current A-Register / Patta records..." value={formData.recorded} onChange={e => setFormData({...formData, recorded: e.target.value})} required></textarea>
                           <p className="text-[8px] font-bold text-rose-400 uppercase tracking-widest">Metadata Hash: 0x992B_ERROR</p>
                        </div>
                        <div className="space-y-4">
                           <div className="flex items-center gap-2 text-emerald-600 border-b border-emerald-100 pb-2 mb-4">
                              <CheckCircle2 size={16} /><span className="text-[10px] font-black uppercase tracking-[0.2em]">Verified Field State (PROPOSED)</span>
                           </div>
                           <textarea className="w-full p-5 border border-emerald-100 bg-emerald-50/20 text-xs font-bold text-slate-800 h-48 resize-none outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all" placeholder="Enter verified parameters as per field survey and document audit..." value={formData.proposed} onChange={e => setFormData({...formData, proposed: e.target.value})} required></textarea>
                           <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Uplink Status: AUTH_PENDING</p>
                        </div>
                     </div>
                  </div>

                  {/* Section 4: Evidence & Authorization */}
                  <div className="bg-white border border-slate-200 shadow-sm overflow-hidden">
                     <div className="px-8 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                        <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                           <Database size={14} className="text-blue-600" /> [04] Digital Evidence & Protocol Authorization
                        </h3>
                     </div>
                     <div className="p-8">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                           {[
                              { icon: MapIcon, label: 'FMB Sketch', desc: 'Spatial Audit' },
                              { icon: Camera, label: 'Drone Scan', desc: 'Remote Sensing' },
                              { icon: Book, label: 'Archive Review', desc: 'Archive Review' },
                              { icon: Gavel, label: 'Affidavits', desc: 'Legal Proof' }
                           ].map((item, i) => (
                              <div key={i} className="group cursor-pointer border-2 border-dashed border-slate-200 p-6 text-center hover:border-blue-600 hover:bg-blue-50 transition-all">
                                 <item.icon size={28} className="mx-auto mb-3 text-slate-300 group-hover:text-blue-600 transition-all group-hover:scale-110" />
                                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-800">{item.label}</p>
                                 <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Upload Archive</p>
                              </div>
                           ))}
                        </div>
                        
                        <div className="p-6 bg-slate-900 text-white flex flex-col md:flex-row justify-between items-center gap-8">
                           <div className="flex items-center gap-5">
                              <div className="w-12 h-12 bg-white/5 border border-white/10 flex items-center justify-center text-blue-400"><Fingerprint size={24} /></div>
                              <div>
                                 <p className="text-[11px] font-black uppercase tracking-widest">Correction Authenticator</p>
                                 <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1">Digital Signature Node: TN-CORR-0x112</p>
                              </div>
                           </div>
                           <button type="submit" className="w-full md:w-auto px-12 py-4 bg-rose-600 text-white font-black text-xs uppercase tracking-widest hover:bg-rose-700 transition-all shadow-xl shadow-rose-900/20">
                              Sign & Log Correction Protocol
                           </button>
                        </div>
                     </div>
                  </div>
               </form>
            </div>

            <div className="space-y-6">
               <Card title="Amendment Policy" icon={Scale}>
                  <div className="space-y-4 text-slate-600">
                     <p className="text-[10px] font-bold leading-relaxed uppercase">Corrections must follow G.O. (Ms) No. 122/2024. All extent changes &gt; 5% require RDO counter-sign.</p>
                     <div className="p-4 bg-slate-50 border border-slate-200">
                        <p className="text-[8px] font-black text-slate-400 uppercase mb-2">Policy Uplink</p>
                        <p className="text-[10px] font-black text-slate-900 uppercase">Rev-Act Sec 12-A Compliant</p>
                     </div>
                  </div>
               </Card>
               <Card title="System Intelligence" icon={Cpu}>
                  <div className="flex items-center gap-3 mb-4">
                     <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                     <span className="text-[10px] font-black uppercase tracking-widest">Database Sync: ACTIVE</span>
                  </div>
                  <ProgressBar progress={100} color="bg-emerald-500" />
                  <p className="text-[8px] font-bold text-slate-400 uppercase mt-2 text-right italic">Mirroring to Chennai Mainframe...</p>
               </Card>
            </div>
         </div>

         {/* Resolution Log Section */}
         <div className="bg-white border border-slate-200 shadow-sm">
            <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
               <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <Database size={16} className="text-rose-600" /> Discrepancy Resolution Lifecycle Hub
               </h3>
               <Badge variant="info">Sync Active</Badge>
            </div>
            <div className="overflow-x-auto">
               <table className="w-full border-collapse">
                  <thead>
                     <tr className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 tracking-widest">
                        <th className="px-8 py-4 text-left border-b border-slate-100">Token ID</th>
                        <th className="px-8 py-4 text-left border-b border-slate-100">Target Context</th>
                        <th className="px-8 py-4 text-left border-b border-slate-100">Discrepancy Nature</th>
                        <th className="px-8 py-4 text-left border-b border-slate-100">Proposed Delta</th>
                        <th className="px-8 py-4 text-left border-b border-slate-100">Timestamp</th>
                        <th className="px-8 py-4 text-right border-b border-slate-100">Phase Status</th>
                     </tr>
                  </thead>
                  <tbody>
                     {correctionRequests.map((row, i) => (
                        <tr key={i} className="group hover:bg-slate-50/50 transition-colors">
                           <td className="px-8 py-4 border-b border-slate-50"><span className="text-xs font-black text-rose-600 font-mono">#{row.id}</span></td>
                           <td className="px-8 py-4 border-b border-slate-50">
                              <span className="text-xs font-bold text-slate-800">{row.survey}</span>
                              <p className="text-[8px] font-black text-slate-400 uppercase mt-0.5">{row.loc}</p>
                           </td>
                           <td className="px-8 py-4 border-b border-slate-50"><Badge variant="warning" className="text-[8px]">{row.error}</Badge></td>
                           <td className="px-8 py-4 border-b border-slate-50"><span className="text-xs font-bold text-slate-700 truncate max-w-[200px] block">{row.proposed}</span></td>
                           <td className="px-8 py-4 border-b border-slate-50"><span className="text-[10px] font-medium text-slate-500 uppercase">{row.timestamp}</span></td>
                           <td className="px-8 py-4 border-b border-slate-50 text-right">
                              <span className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-widest ${row.status === 'VERIFIED_DB' ? 'text-emerald-600 bg-emerald-50 border border-emerald-100' : 'text-amber-600 bg-amber-50 border border-amber-100'}`}>{row.status}</span>
                           </td>
                        </tr>
                     ))}
                     {correctionRequests.length === 0 && (
                        <tr><td colSpan="6" className="px-8 py-20 text-center text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] italic">No critical corrections detected in regional pipeline.</td></tr>
                     )}
                  </tbody>
               </table>
            </div>
         </div>
      </div>
   );
};
const ApprovalsHubView = ({ user, alerts = [], patchAlertStatus, registryRequests = [], onRegistryAction }) => {
   const isCollector = user?.role === 'COLLECTOR';
   const isTahsildar = user?.role === 'TAHSILDAR';
   const [assignmentModal, setAssignmentModal] = useState({ open: false, alertId: null });
   
   const pendingApprovals = alerts.filter(a => {
      if (isCollector) return ['NEW', 'WAITING', 'PENDING', 'INITIATED'].includes((a.status || 'NEW').toUpperCase());
      const status = (a.status || '').toUpperCase();
      return ['COLLECTOR_ACCEPTED', 'NEW', 'ACTIVE', 'INITIATED', 'WAITING', 'PENDING'].includes(status) && status !== 'RESOLVED';
   });

   const pendingRegistry = registryRequests.filter(r => r.status === 'PENDING_TAHSILDAR');

   const handleAction = (id) => {
      setAssignmentModal({ open: true, alertId: id });
   };

   const confirmAssignment = (officer) => {
      const newStatus = isCollector ? 'COLLECTOR_ACCEPTED' : 'TAHSILDAR_ACCEPTED';
      const assignField = isCollector ? 'assignedCollector' : 'assignedTahsildar';
      
      patchAlertStatus(assignmentModal.alertId, newStatus, { [assignField]: officer });
      alert(`MISSION_DISPATCH: ${officer} authorized for Node ${assignmentModal.alertId}`);
      setAssignmentModal({ open: false, alertId: null });
   };

   return (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
         <div className="flex justify-between items-center bg-white p-6 rounded-none border border-slate-200 shadow-sm">
            <div>
               <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{isCollector ? 'Executive Authorization Pipeline' : 'Taluk Dispatch Matrix'}</h2>
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Pending Actions • {isCollector ? 'Salem District Hub' : 'Taluk Command'}</p>
            </div>
            <div className="flex gap-4">
               <Badge variant="danger">{pendingApprovals.length} Encroachment Tasks</Badge>
               {isTahsildar && <Badge variant="info">{pendingRegistry.length} Registry Requests</Badge>}
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
               <Card title="Decision Pipeline (Field Ops)" icon={ShieldAlert}>
                  <div className="space-y-3">
                     {pendingApprovals.map(alert => (
                        <div key={alert.id} className="p-5 bg-slate-50 rounded-none flex items-center justify-between group hover:bg-white border border-transparent hover:border-slate-100 transition-all">
                           <div className="flex items-center gap-5">
                              <div className="w-16 h-16 rounded-none overflow-hidden border border-slate-200 shadow-sm">
                                 <img src={alert.img || img1} className="w-full h-full object-cover" alt="Node" />
                              </div>
                              <div>
                                 <div className="flex items-center gap-2 mb-1">
                                    <p className="text-[11px] font-black text-slate-900 uppercase leading-none">Survey {alert.parcel_details}</p>
                                    <Badge variant="danger" className="text-[8px] px-2">CRITICAL</Badge>
                                 </div>
                                 <p className="text-[9px] text-slate-500 font-bold uppercase">{alert.alert_type} • {alert.taluk || 'SALEM_W'}</p>
                                 <p className="text-[8px] text-blue-600 font-black uppercase mt-1.5 tracking-widest">{isCollector ? 'Awaiting Tahsildar Authorization' : 'Awaiting VAO Assignment'}</p>
                              </div>
                           </div>
                           <div className="flex items-center gap-3">
                              <button onClick={() => handleAction(alert.id)} className="px-6 py-3 bg-slate-900 text-white rounded-none text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg hover:shadow-blue-100 flex items-center gap-2">
                                 <Zap size={14} /> Authorize Now
                              </button>
                           </div>
                        </div>
                     ))}
                     {pendingApprovals.length === 0 && (
                        <div className="py-10 text-center">
                           <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">No pending field missions</p>
                        </div>
                     )}
                  </div>
               </Card>

               {isTahsildar && (
                  <Card title="Registry Updation Queue" icon={Layers}>
                     <div className="space-y-3">
                        {pendingRegistry.map(req => (
                           <div key={req.id} className="p-5 bg-slate-50 rounded-none flex items-center justify-between group hover:bg-white border border-transparent hover:border-slate-100 transition-all">
                              <div>
                                 <div className="flex items-center gap-2 mb-1">
                                    <p className="text-[11px] font-black text-slate-900 uppercase leading-none">{req.type}: Survey {req.survey}</p>
                                    <Badge variant="info" className="text-[8px] px-2">VAO_SUBMITTED</Badge>
                                 </div>
                                 <p className="text-[9px] text-slate-500 font-bold uppercase">Village: {req.loc} • Owner: {req.owner || 'N/A'}</p>
                                 {req.error && <p className="text-[8px] text-red-500 font-bold uppercase mt-1">Error: {req.error} → {req.proposed}</p>}
                                 <p className="text-[8px] text-slate-400 font-black uppercase mt-1 tracking-widest">Received: {req.timestamp}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                 <button onClick={() => onRegistryAction(req.id, 'VERIFIED_DB')} className="px-4 py-2 bg-green-600 text-white text-[9px] font-black uppercase tracking-widest hover:bg-green-700">Approve</button>
                                 <button onClick={() => onRegistryAction(req.id, 'REJECTED')} className="px-4 py-2 bg-red-600 text-white text-[9px] font-black uppercase tracking-widest hover:bg-red-700">Reject</button>
                              </div>
                           </div>
                        ))}
                        {pendingRegistry.length === 0 && (
                           <div className="py-10 text-center">
                              <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">No pending registry requests</p>
                           </div>
                        )}
                     </div>
                  </Card>
               )}
            </div>

            <div className="space-y-6">
               <Card title="Operational Directives" icon={FileText}>
                  <div className="space-y-4">
                     <div className="p-5 bg-blue-600 rounded-none text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10"><Scale size={100} /></div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-80">Legal Priority</h4>
                        <p className="text-xs font-bold leading-relaxed mb-6">Immediate survey required for Mettur Survey 142/A to counter pending stay order.</p>
                        <button className="w-full py-3 bg-white text-blue-600 rounded-none text-[9px] font-black uppercase tracking-widest shadow-xl">Review Legal Case</button>
                     </div>
                     
                     <div className="p-4 border border-slate-200 rounded-none">
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">Uplink Status</p>
                        <div className="flex items-center justify-between mb-2">
                           <span className="text-[10px] font-black text-slate-900 uppercase">District HQ</span>
                           <div className="flex gap-1">
                              {[1,1,1,0.5].map((v, i) => <div key={i} className="w-2 h-2 bg-green-500 rounded-none" style={{ opacity: v }}></div>)}
                           </div>
                        </div>
                        <p className="text-[8px] font-bold text-slate-400 uppercase">Secure Channel: AES-256 Active</p>
                     </div>
                  </div>
               </Card>
            </div>
         </div>
         <OfficerAssignmentModal isOpen={assignmentModal.open} alertId={assignmentModal.alertId} type={isCollector ? 'TAHSILDAR' : 'VAO'} onClose={() => setAssignmentModal({ open: false, alertId: null })} onAssign={confirmAssignment} alerts={alerts} />
      </div>
   );
};

const AdminAIDetectionView = ({ alerts }) => (
   <div className="space-y-6 animate-in fade-in duration-700">
      <div className="bg-slate-900 p-10 rounded-none text-white mb-8 border border-white/5 relative overflow-hidden group">
         <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-none -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
         <h2 className="text-4xl font-black uppercase tracking-tighter italic">AI Detection Matrix</h2>
         <p className="text-[10px] text-blue-400 font-bold uppercase tracking-[0.4em] mt-4 flex items-center gap-2"><div className="w-2 h-2 bg-blue-500 animate-pulse"></div> Advanced Neural Network Encroachment Analysis Node</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <Card title="Neural Confidence Metrics" icon={Cpu}>
            <div className="space-y-6 py-2">
               {[
                  { n: 'Structure Detection', c: 98.4, s: 'OPTIMAL' },
                  { n: 'Land Class Change', c: 92.1, s: 'OPTIMAL' },
                  { n: 'Boundary Drift', c: 84.5, s: 'STABLE' }
               ].map((m, i) => (
                  <div key={i}>
                     <div className="flex justify-between text-[10px] font-black uppercase mb-2"><span>{m.n}</span><span className="text-blue-600">{m.c}%</span></div>
                     <ProgressBar progress={m.c} />
                  </div>
               ))}
            </div>
         </Card>
         <Card title="Latest AI Verifications" icon={CheckCircle2}>
            <div className="space-y-4">
               {alerts.slice(0, 3).map(a => (
                  <div key={a.id} className="p-4 bg-slate-50 border border-slate-100 rounded-none flex justify-between items-center group hover:border-blue-200 transition-all">
                     <div>
                        <p className="text-[10px] font-black text-slate-900 uppercase">Survey {a.parcel_details}</p>
                        <p className="text-[8px] text-slate-400 font-bold uppercase mt-1">{a.alert_type}</p>
                     </div>
                     <Badge variant="success">Verified</Badge>
                  </div>
               ))}
            </div>
         </Card>
      </div>
   </div>
);

const CollectorAnalyticsView = ({ alerts }) => (
   <div className="space-y-6 animate-in fade-in duration-700">
      <div className="bg-white border border-slate-200 p-10 rounded-none mb-8 flex justify-between items-center shadow-sm relative overflow-hidden group">
         <div className="absolute -left-10 -bottom-10 opacity-5 group-hover:scale-110 transition-all duration-700"><BarChart3 size={200} /></div>
         <div className="relative z-10">
            <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Operational Analytics</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.4em] mt-4">Executive District Strategic Overview</p>
         </div>
         <div className="p-6 bg-blue-600 text-white rounded-none text-center shadow-xl shadow-blue-100 min-w-[120px]">
            <p className="text-3xl font-black">92%</p>
            <p className="text-[8px] font-bold uppercase opacity-60">Efficiency</p>
         </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card title="Recovery Trends" icon={TrendingUp}>
            <div className="h-40 flex items-end gap-2 px-2 pb-2">
               {[40, 60, 45, 80, 55, 90, 70].map((h, i) => (
                  <div key={i} className="flex-1 bg-blue-600/20 group-hover:bg-blue-600 rounded-none-t-sm transition-all duration-500" style={{ height: `${h}%` }}></div>
               ))}
            </div>
         </Card>
         <Card title="Resource Allocation" icon={Users}>
            <div className="space-y-4">
               {['Salem West', 'Mettur', 'Omalur'].map(t => (
                  <div key={t} className="flex justify-between items-center p-3.5 bg-slate-50 rounded-none border border-slate-100">
                     <span className="text-[10px] font-bold text-slate-700 uppercase">{t}</span>
                     <span className="text-xs font-black text-slate-900">12 Officers</span>
                  </div>
               ))}
            </div>
         </Card>
         <Card title="Budget Utilization" icon={Database}>
            <div className="text-center py-4 flex flex-col items-center">
               <p className="text-4xl font-black text-slate-900 tracking-tighter">₹4.2 Cr</p>
               <p className="text-[9px] text-slate-400 font-bold uppercase mt-2 tracking-widest">Spent of ₹10 Cr Budget</p>
               <div className="mt-8 w-full"><ProgressBar progress={42} color="bg-indigo-600" /></div>
            </div>
         </Card>
      </div>
   </div>
);

const EnforcementTrackingView = ({ alerts = [], user, selectedRegion, setSelectedRegion }) => {
   const getMissions = () => {
      const baseMissions = [
         { id: 'MIS-771', target: 'Survey 142/A', officer: 'Tahsildar - Salem West', status: 'ON_SITE', progress: 65, startTime: '09:00 AM', location: 'Salem West', img: field1, level: 'TAHSILDAR' },
         { id: 'MIS-772', target: 'Survey 88/C', officer: 'Tahsildar - Mettur', status: 'EN_ROUTE', progress: 25, startTime: '10:30 AM', location: 'Mettur', img: field3, level: 'TAHSILDAR' },
         { id: 'MIS-773', target: 'Survey 55/D', officer: 'VAO - Attur East', status: 'COMPLETED', progress: 100, startTime: '08:15 AM', location: 'Attur', img: field4, level: 'VAO' },
         { id: 'MIS-774', target: 'Survey 10/E', officer: 'Field Inspector - Salem South', status: 'ON_SITE', progress: 15, startTime: '11:15 AM', location: 'Salem South', img: field1, level: 'INSPECTOR' }
      ];

      let filteredMissions = baseMissions;
      
      if (user?.role === 'TAHSILDAR') {
         filteredMissions = baseMissions.filter(m => m.level === 'VAO' || m.level === 'INSPECTOR');
      } else if (user?.role !== 'ADMIN' && user?.role !== 'COLLECTOR') {
         filteredMissions = baseMissions.filter(m => m.level === user?.role);
      }

      // Deep Integration: Filter by selected region from the Map view
      if (selectedRegion) {
         filteredMissions = filteredMissions.filter(m => m.location.includes(selectedRegion));
      }

      return filteredMissions;
   };

   const activeMissions = getMissions();
   const [selectedMission, setSelectedMission] = useState(activeMissions[0] || null);

   // Update selected mission if activeMissions changes and current selection is no longer valid
   useEffect(() => {
      if (activeMissions.length > 0 && (!selectedMission || !activeMissions.find(m => m.id === selectedMission.id))) {
         setSelectedMission(activeMissions[0]);
      }
   }, [activeMissions, selectedMission]);

   if (!selectedMission && activeMissions.length === 0) {
      return (
         <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4">
            <Activity size={48} className="text-slate-300" />
            <p className="text-sm font-black uppercase tracking-widest">No active missions in {selectedRegion || 'this district'}</p>
         </div>
      );
   }

   return (
      <div className="space-y-6 animate-in fade-in duration-700 h-full flex flex-col">
         {/* Top Stats: Force Readiness */}
         <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
               { t: 'Active Missions', v: activeMissions.length, i: Activity, c: 'text-blue-600' },
               { t: 'Officers in Field', v: '14', i: Users, c: 'text-indigo-600' },
               { t: 'Units Dispatched', v: '8', i: Truck, c: 'text-orange-600' },
               { t: 'Resolution Rate', v: '94%', i: CheckCircle2, c: 'text-green-600' }
            ].map((k, i) => (
               <div key={i} className="bg-white p-4 border border-slate-200 rounded-none flex items-center gap-4 shadow-sm">
                  <div className={`p-3 bg-slate-50 ${k.c}`}><k.i size={20} /></div>
                  <div>
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{k.t}</p>
                     <h4 className="text-xl font-black text-slate-900 tracking-tighter">{k.v}</h4>
                  </div>
               </div>
            ))}
         </div>

         <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
            {/* Left: Mission Queue */}
            <div className="lg:col-span-4 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
               <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] mb-2 flex items-center gap-2"><div className="w-2 h-2 bg-blue-600"></div> Active Operational Queue</h3>
               {activeMissions.map(m => (
                  <button 
                     key={m.id} 
                     onClick={() => setSelectedMission(m)}
                     className={`p-6 border-2 transition-all text-left flex flex-col gap-4 ${selectedMission.id === m.id ? 'border-blue-600 bg-blue-50/30' : 'border-slate-200 bg-white hover:border-slate-400'}`}
                  >
                     <div className="flex justify-between items-start">
                        <div>
                           <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{m.id}</p>
                           <h4 className="text-sm font-black text-slate-900 uppercase mt-1">{m.target}</h4>
                        </div>
                        <Badge variant={m.status === 'COMPLETED' ? 'success' : (m.status === 'ON_SITE' ? 'danger' : 'info')} className="rounded-none font-black text-[8px]">{m.status}</Badge>
                     </div>
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200"><UserCheck size={16} /></div>
                        <div>
                           <p className="text-[9px] font-bold text-slate-800 uppercase">{m.officer}</p>
                           <p className="text-[8px] font-bold text-slate-400 uppercase">Started: {m.startTime}</p>
                        </div>
                     </div>
                     <div className="space-y-1.5">
                        <div className="flex justify-between text-[8px] font-black uppercase"><span>Mission Progress</span><span>{m.progress}%</span></div>
                        <div className="h-1 bg-slate-100 overflow-hidden"><div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${m.progress}%` }}></div></div>
                     </div>
                  </button>
               ))}
            </div>

            {/* Middle: Tactical Monitoring */}
            <div className="lg:col-span-5 flex flex-col gap-6">
               <div className="flex-1 bg-white border border-slate-200 p-8 flex flex-col relative overflow-hidden">
                  <div className="flex justify-between items-start mb-8 border-b border-slate-100 pb-6">
                     <div>
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Mission Tracking: {selectedMission.id}</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 flex items-center gap-2"><MapPin size={12} className="text-blue-600" /> {selectedMission.location}</p>
                     </div>
                     <div className="flex flex-col items-end gap-2">
                        <button 
                           onClick={() => {
                              setSelectedRegion(selectedMission.location);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                           }}
                           className="px-3 py-1.5 bg-slate-900 text-white font-black text-[9px] uppercase tracking-widest flex items-center gap-2 hover:bg-slate-800 transition-all"
                        >
                           <MapIcon size={12} /> Sync Map To Mission
                        </button>
                        <div className="text-right mt-2">
                           <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Satellite Link</p>
                           <p className="text-xs font-black text-green-600 uppercase">ACTIVE_SECURE</p>
                        </div>
                     </div>
                  </div>

                  {/* Tactical Map Mockup */}
                  <div className="flex-1 bg-slate-50 border border-slate-200 relative overflow-hidden group">
                     <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px] opacity-40"></div>
                     <div className="absolute inset-0 flex items-center justify-center">
                        {/* Static Path Mockup */}
                        <svg className="w-full h-full absolute inset-0 opacity-20" viewBox="0 0 400 300">
                           <path d="M50,250 Q150,50 350,150" fill="none" stroke="black" strokeWidth="2" strokeDasharray="8 4" />
                        </svg>
                        {/* Target Marker */}
                        <div className="absolute top-[100px] left-[300px] flex flex-col items-center">
                           <div className="w-8 h-8 bg-red-600/20 border-2 border-red-600 flex items-center justify-center animate-pulse"><Target size={16} className="text-red-600" /></div>
                           <p className="text-[8px] font-black text-red-600 mt-2 uppercase bg-white px-2 py-0.5 border border-red-600 shadow-sm">Target Site</p>
                        </div>
                        {/* Officer Marker */}
                        <div className="absolute top-[140px] left-[160px] flex flex-col items-center transition-all duration-1000">
                           <div className="w-8 h-8 bg-blue-600 border-2 border-black flex items-center justify-center shadow-lg"><Navigation size={16} className="text-white" /></div>
                           <p className="text-[8px] font-black text-blue-600 mt-2 uppercase bg-white px-2 py-0.5 border border-blue-600 shadow-sm">Officer Position</p>
                        </div>
                     </div>
                     <div className="absolute bottom-4 left-4 right-4 flex justify-between">
                        <div className="bg-black/90 p-3 text-white">
                           <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Current Velocity</p>
                           <p className="text-xs font-mono font-black">42 KM/H</p>
                        </div>
                        <div className="bg-black/90 p-3 text-white text-right">
                           <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">ETA to Target</p>
                           <p className="text-xs font-mono font-black">08 MIN 44 SEC</p>
                        </div>
                     </div>
                  </div>

                  <div className="mt-8 grid grid-cols-2 gap-6">
                     <button className="py-4 bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-3"><Monitor size={16} /> Open Drone Stream</button>
                     <button className="py-4 border-2 border-slate-900 text-slate-900 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-3"><MessageSquare size={16} /> Comms Uplink</button>
                  </div>
               </div>
            </div>

            {/* Right: Field Evidence & Log */}
            <div className="lg:col-span-3 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
               <Card title="Field Evidence Stream" icon={Camera}>
                  <div className="space-y-4">
                     <div className="aspect-video bg-slate-100 border border-slate-200 overflow-hidden relative group">
                        <img src={selectedMission.img} className="w-full h-full object-cover transition-all" alt="Field Photo" />
                        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[8px] px-2 py-1 font-black uppercase">Live_Rec_01</div>
                     </div>
                     <div className="grid grid-cols-2 gap-2">
                        {[img1, img2].map((im, i) => (
                           <div key={i} className="aspect-square bg-slate-100 border border-slate-200 overflow-hidden"><img src={im} className="w-full h-full object-cover opacity-80" /></div>
                        ))}
                     </div>
                     <p className="text-[9px] font-bold text-slate-500 leading-relaxed uppercase tracking-tight">Geotagged evidence uploaded by Tahsildar node at 12:44:01. Verification signature SLM-771-V.</p>
                  </div>
               </Card>

               <Card title="Operational Log" icon={History}>
                  <div className="space-y-6">
                     {[
                        { t: '12:44', a: 'Evidence Uploaded', s: 'Photo ID: 8821' },
                        { t: '12:30', a: 'Arrived at Target', s: 'GPS Verified' },
                        { t: '12:10', a: 'Dispatch Confirmed', s: 'En route' },
                        { t: '12:00', a: 'Mission Created', s: 'Authorized' }
                     ].map((log, i) => (
                        <div key={i} className="flex gap-4 group">
                           <div className="flex flex-col items-center">
                              <div className="w-1.5 h-1.5 bg-blue-600 group-hover:scale-150 transition-transform"></div>
                              <div className="w-px h-full bg-slate-200 my-1"></div>
                           </div>
                           <div className="pb-4">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{log.t}</p>
                              <p className="text-[10px] font-black text-slate-900 uppercase mt-0.5">{log.a}</p>
                              <p className="text-[8px] font-bold text-slate-500 uppercase mt-0.5">{log.s}</p>
                           </div>
                        </div>
                     ))}
                  </div>
               </Card>
            </div>
         </div>
      </div>
   );
};

const CombinedTacticalOpsView = ({ alerts = [], user }) => {
   const [selectedRegion, setSelectedRegion] = useState(null);

   return (
      <div className="flex flex-col h-full animate-in fade-in duration-500 overflow-auto custom-scrollbar bg-slate-50">
         {/* Top Section: Map */}
         <div className="p-6">
            <FieldOpsMonitorView user={user} selectedRegion={selectedRegion} setSelectedRegion={setSelectedRegion} />
         </div>
         
         {/* Divider */}
         <div className="flex items-center gap-4 px-6 py-2 opacity-50">
            <div className="flex-1 h-px bg-slate-300"></div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Tactical Synchronization Link</p>
            <div className="flex-1 h-px bg-slate-300"></div>
         </div>

         {/* Bottom Section: Missions */}
         <div className="p-6 h-[800px]">
            <EnforcementTrackingView alerts={alerts} user={user} selectedRegion={selectedRegion} setSelectedRegion={setSelectedRegion} />
         </div>
      </div>
   );
};

const ReportsView = ({ parcels = [], alerts = [] }) => (
   <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <Card title="District Health Matrix" icon={PieChart}>
            <div className="flex flex-col items-center justify-center py-8">
               <div className="w-40 h-40 rounded-none border-[12px] border-slate-50 relative flex items-center justify-center">
                  <div className="absolute inset-0 rounded-none border-[12px] border-blue-500 border-r-transparent border-b-transparent"></div>
                  <div className="text-center">
                     <p className="text-3xl font-black text-slate-900">84%</p>
                     <p className="text-[9px] font-bold text-slate-400 uppercase">Overall Goal</p>
                  </div>
               </div>
               <div className="mt-8 grid grid-cols-2 gap-x-8 gap-y-4 w-full px-4">
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-none bg-blue-500"></div><span className="text-[10px] font-bold text-slate-600 uppercase">Cleared</span></div>
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-none bg-slate-200"></div><span className="text-[10px] font-bold text-slate-600 uppercase">Pending</span></div>
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-none bg-red-400"></div><span className="text-[10px] font-bold text-slate-600 uppercase">Legal</span></div>
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-none bg-green-400"></div><span className="text-[10px] font-bold text-slate-600 uppercase">Verified</span></div>
               </div>
            </div>
         </Card>
         <div className="lg:col-span-2">
            <Card title="Operational Performance" icon={TrendingUp}>
               <div className="h-[300px] flex items-end gap-4 px-4 pb-4">
                  {[
                     { label: 'JAN', val: 40 }, { label: 'FEB', val: 65 }, { label: 'MAR', val: 50 },
                     { label: 'APR', val: 80 }, { label: 'MAY', val: 70 }, { label: 'JUN', val: 95 },
                     { label: 'JUL', val: 85 }, { label: 'AUG', val: 60 }, { label: 'SEP', val: 75 },
                     { label: 'OCT', val: 90 }, { label: 'NOV', val: 85 }, { label: 'DEC', val: 100 }
                  ].map((d, i) => (
                     <div key={i} className="flex-1 flex flex-col items-center gap-4 group">
                        <div className="relative w-full">
                           <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] px-2 py-1 rounded-none opacity-0 group-hover:opacity-100 transition-all font-bold tracking-widest">{d.val}%</div>
                           <div className="bg-blue-600/10 rounded-none group-hover:bg-blue-600/20 transition-all h-60 flex flex-col justify-end overflow-hidden">
                              <div className="bg-blue-600 w-full animate-in slide-in-from-bottom duration-1000" style={{ height: `${d.val}%`, animationDelay: `${i * 50}ms` }}></div>
                           </div>
                        </div>
                        <span className="text-[9px] font-black text-slate-400 tracking-tighter">{d.label}</span>
                     </div>
                  ))}
               </div>
            </Card>
         </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <Card title="Top Performing Taluks" icon={Award}>
            <div className="space-y-4">
               {[
                  { name: 'Salem West', score: 98, status: '+2.4%' },
                  { name: 'Mettur', score: 92, status: '+1.8%' },
                  { name: 'Omalur', score: 88, status: '-0.5%' },
                  { name: 'Attur', score: 85, status: '+0.2%' }
               ].map((t, i) => (
                  <div key={i} className="p-4 bg-slate-50 border border-slate-100 rounded-none flex items-center gap-4">
                     <div className="w-10 h-10 bg-white border border-slate-100 rounded-none flex items-center justify-center font-black text-slate-400 text-xs">#{i + 1}</div>
                     <div className="flex-1">
                        <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight">{t.name}</p>
                        <div className="mt-2 h-1.5 w-full bg-slate-200 rounded-none overflow-hidden"><div className="h-full bg-blue-600" style={{ width: `${t.score}%` }}></div></div>
                     </div>
                     <div className="text-right">
                        <p className="text-[11px] font-black text-slate-900">{t.score}%</p>
                        <p className={`text-[9px] font-bold ${t.status.startsWith('+') ? 'text-green-600' : 'text-red-500'}`}>{t.status}</p>
                     </div>
                  </div>
               ))}
            </div>
         </Card>
         <Card title="Audit Summary & Forecast" icon={ClipboardCheck}>
            <div className="grid grid-cols-2 gap-4 mb-6">
               <div className="p-6 bg-blue-50 rounded-none text-center">
                  <p className="text-[9px] font-bold text-blue-600 uppercase tracking-widest mb-2">Total Inspections</p>
                  <h4 className="text-4xl font-black text-blue-900">14,202</h4>
               </div>
               <div className="p-6 bg-green-50 rounded-none text-center">
                  <p className="text-[9px] font-bold text-green-600 uppercase tracking-widest mb-2">Resolution Rate</p>
                  <h4 className="text-4xl font-black text-green-900">92%</h4>
               </div>
            </div>
            <div className="p-6 bg-slate-50 rounded-none border border-slate-100">
               <h5 className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-4">Recovery Forecast (Q3)</h5>
               <div className="flex items-center gap-6">
                  <div className="flex-1">
                     <div className="flex justify-between text-[9px] font-bold uppercase mb-2"><span>Target Confidence</span><span className="text-blue-600">High (88%)</span></div>
                     <ProgressBar progress={88} />
                  </div>
                  <div className="text-right">
                     <p className="text-lg font-black text-slate-900">₹142.2 Cr</p>
                     <p className="text-[8px] font-bold text-green-600 uppercase">PROJECTED</p>
                  </div>
               </div>
            </div>
         </Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="lg:col-span-2">
            <Card title="Strategic District Node Performance" icon={Globe}>
               <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                     <thead>
                        <tr className="border-b border-slate-100">
                           {['Sub-division Node', 'Operational Status', 'Detection Accuracy', 'Authorized Actions'].map(h => <th key={h} className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">{h}</th>)}
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                        {[
                           { d: 'Salem West (HQ)', s: 'OPTIMAL', e: '98.2%', b: '142' },
                           { d: 'Salem South', s: 'STABLE', e: '94.5%', b: '88' },
                           { d: 'Omalur Node', s: 'OPTIMAL', e: '96.1%', b: '112' },
                           { d: 'Mettur Division', s: 'STABLE', e: '92.4%', b: '56' }
                        ].map((row, i) => (
                           <tr key={i}>
                              <td className="px-6 py-4 text-xs font-black text-slate-800 uppercase tracking-tight">{row.d}</td>
                              <td className="px-6 py-4"><Badge variant={row.s === 'OPTIMAL' ? 'success' : 'info'}>{row.s}</Badge></td>
                              <td className="px-6 py-4 text-xs font-black text-blue-600">{row.e}</td>
                              <td className="px-6 py-4 text-xs font-bold text-slate-700">{row.b} Approved</td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </Card>
         </div>
         <Card title="Comparative Performance Matrix" icon={TrendingUp}>
            <div className="space-y-4">
               {[
                  { n: 'Revenue Collection', v: 92, c: 'text-green-600' },
                  { n: 'Encroachment Clearance', v: 78, c: 'text-blue-600' },
                  { n: 'GIS Audit Accuracy', v: 98, c: 'text-indigo-600' }
               ].map((m, i) => (
                  <div key={i} className="p-4 bg-slate-50 rounded-none border border-slate-100">
                     <div className="flex justify-between text-[10px] font-black uppercase mb-2"><span>{m.n}</span><span className={m.c}>{m.v}%</span></div>
                     <ProgressBar progress={m.v} color={m.c.replace('text-', 'bg-')} />
                  </div>
               ))}
            </div>
         </Card>
      </div>
   </div>
);

const SettingsView = () => {
   const [activeTab, setActiveTab] = useState('general');
   return (
      <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
         <div className="bg-white border border-slate-200 rounded-none overflow-hidden shadow-sm">
            <div className="flex border-b border-slate-100 bg-slate-50/50">
               {['general', 'security', 'integration', 'notifications', 'advanced'].map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)} className={`px-8 py-5 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-700'}`}>{tab}</button>
               ))}
            </div>
            <div className="p-10 space-y-8">
               {activeTab === 'general' && (
                  <div className="space-y-6">
                     <div className="grid grid-cols-2 gap-8">
                        <div><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Platform Name</label><input type="text" defaultValue="GEOMMAND District Node" className="w-full bg-slate-50 border border-slate-200 rounded-none px-4 py-3 text-xs font-bold text-slate-800 focus:border-blue-500 outline-none" /></div>
                        <div><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">District ID</label><input type="text" defaultValue="SLM-781" className="w-full bg-slate-50 border border-slate-200 rounded-none px-4 py-3 text-xs font-bold text-slate-800 focus:border-blue-500 outline-none" /></div>
                     </div>
                     <div><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Operational Timezone</label><select className="w-full bg-slate-50 border border-slate-200 rounded-none px-4 py-3 text-xs font-bold text-slate-800 focus:border-blue-500 outline-none"><option>IST (UTC +5:30)</option><option>UTC</option></select></div>
                     <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                        <div><p className="text-[11px] font-black text-slate-800 uppercase tracking-tight">Maintenance Mode</p><p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Suspend all field operations for node update</p></div>
                        <div className="w-12 h-6 bg-slate-200 rounded-none relative cursor-pointer"><div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-none transition-all"></div></div>
                     </div>
                  </div>
               )}
               {activeTab === 'security' && (
                  <div className="space-y-6">
                     <div className="p-6 bg-blue-50 rounded-none border border-blue-100 flex items-center gap-4">
                        <div className="p-3 bg-blue-600 text-white rounded-none"><Shield size={24} /></div>
                        <div><h4 className="text-[11px] font-black text-blue-900 uppercase tracking-widest">Enhanced Encryption Active</h4><p className="text-[9px] text-blue-700 font-bold uppercase mt-1">AES-256 Protocol securing all land registry data</p></div>
                     </div>
                     <div className="space-y-4">
                        <div className="flex justify-between items-center py-4 border-b border-slate-50"><div><p className="text-[11px] font-black text-slate-800 uppercase">Two-Factor Authentication</p><p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Require SMS/Email OTP for officer login</p></div><div className="w-12 h-6 bg-blue-600 rounded-none relative cursor-pointer"><div className="absolute top-1 right-1 w-4 h-4 bg-white rounded-none transition-all"></div></div></div>
                        <div className="flex justify-between items-center py-4 border-b border-slate-50"><div><p className="text-[11px] font-black text-slate-800 uppercase">IP Whitelisting</p><p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Restrict access to official gov IP ranges</p></div><div className="w-12 h-6 bg-slate-200 rounded-none relative cursor-pointer"><div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-none transition-all"></div></div></div>
                     </div>
                  </div>
               )}
               {activeTab === 'notifications' && (
                  <div className="space-y-6">
                     <div className="grid grid-cols-2 gap-4">
                        {['New Detection', 'Critical Alert', 'User Activity', 'System Status', 'Monthly Reports', 'Legal Notice Response'].map(n => (
                           <div key={n} className="p-4 bg-slate-50 border border-slate-100 rounded-none flex items-center justify-between">
                              <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">{n}</span>
                              <div className="w-10 h-5 bg-blue-600 rounded-none relative"><div className="absolute top-1 right-1 w-3 h-3 bg-white rounded-none"></div></div>
                           </div>
                        ))}
                     </div>
                  </div>
               )}
               <div className="flex gap-4 pt-4">
                  <button className="flex-1 py-4 bg-blue-600 text-white rounded-none font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">Save Global Configuration</button>
                  <button className="px-8 py-4 bg-slate-50 text-slate-400 rounded-none font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all border border-slate-200">Reset</button>
               </div>
            </div>
         </div>
      </div>
   );
};

// --- SHARED COMPONENTS ---

const OperationalListView = React.memo(({ title, icon: Icon, columns, data, actionLabel, onActionClick, showActions = true }) => {
   const [selectedItem, setSelectedItem] = useState(null);

   return (
      <div className="space-y-6 animate-in fade-in duration-500 relative">
         {selectedItem && (
            <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
               <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedItem(null)}></div>
               <div className="bg-white rounded-none w-full max-w-lg p-8 shadow-2xl relative animate-in zoom-in-95 duration-200">
                  <button className="absolute top-6 right-6 text-slate-400 hover:text-slate-800" onClick={() => setSelectedItem(null)}><X size={24} /></button>
                  <div className="flex items-center gap-4 mb-6">
                     <div className="p-3 bg-blue-600 text-white rounded-none shadow-lg shadow-blue-100"><Shield size={24} /></div>
                     <h3 className="text-xl font-black text-slate-900 uppercase">Operational Detail</h3>
                  </div>
                  <div className="space-y-6">
                     {Object.entries(selectedItem).map(([key, val], idx) => (
                        <div key={idx} className="flex justify-between items-center py-3 border-b border-slate-50 last:border-0">
                           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{key}</span>
                           <span className="text-xs font-black text-slate-800">{val}</span>
                        </div>
                     ))}
                  </div>
                  <div className="mt-8 grid grid-cols-2 gap-4">
                     <button className="py-3 bg-blue-600 text-white rounded-none text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all">Modify Status</button>
                     <button className="py-3 bg-slate-50 text-slate-400 border border-slate-100 rounded-none text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all">Audit History</button>
                  </div>
               </div>
            </div>
         )}

         <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-6 rounded-none border border-slate-200 shadow-sm gap-6">
            <div className="flex items-center gap-4">
               <div className="p-3 bg-blue-50 text-blue-600 rounded-none"><Icon size={24} /></div>
               <div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-tight">{title}</h2>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Salem Node • Active Dataset</p>
               </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
               <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input type="text" placeholder="Search..." className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-none text-xs outline-none focus:border-blue-500" />
               </div>
               {actionLabel && <button onClick={onActionClick} className="px-6 py-2 bg-blue-600 text-white rounded-none text-[9px] font-bold uppercase tracking-widest shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2"><PlusCircle size={16} /> {actionLabel}</button>}
            </div>
         </div>
         <div className="bg-white border border-slate-200 rounded-none shadow-sm overflow-hidden overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
               <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                     {columns.map((col, i) => <th key={i} className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">{col}</th>)}
                     {showActions && <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest text-right">Operations</th>}
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {data.map((item, i) => (
                     <tr key={i} className="hover:bg-slate-50/50 transition-all group">
                        {Object.values(item).map((val, j) => <td key={j} className="px-6 py-4 text-xs font-bold text-slate-700">{val}</td>)}
                        {showActions && (
                           <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-2">
                                 <button onClick={() => setSelectedItem(item)} className="p-2 text-slate-400 hover:text-blue-600 transition-all"><Eye size={16} /></button>
                                 <button onClick={() => alert('Launching Tactical Action...')} className="p-2 text-slate-400 hover:text-orange-600 transition-all opacity-0 group-hover:opacity-100"><Zap size={16} /></button>
                                 <button onClick={() => alert('Restricting Account Access...')} className="p-2 text-slate-400 hover:text-red-600 transition-all"><MoreVertical size={16} /></button>
                              </div>
                           </td>
                        )}
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
   );
});

const DistrictMapView = React.memo(({ parcels, alerts, onExport, onMapClick, selectedPosition }) => {
   const [selectedTaluk, setSelectedTaluk] = useState('All');
   const talukStats = [
      { name: 'Salem West', total: 1420, encroached: 120, recovered: 45, risk: 'HIGH' },
      { name: 'Mettur', total: 2100, encroached: 85, recovered: 30, risk: 'MEDIUM' },
      { name: 'Omalur', total: 980, encroached: 15, recovered: 12, risk: 'STABLE' },
      { name: 'Attur', total: 1850, encroached: 44, recovered: 10, risk: 'MEDIUM' }
   ];

   return (
      <div className="space-y-4 animate-in fade-in duration-700 pb-2">
         {/* Strategic Inventory Hub */}
         <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-none border border-slate-200 shadow-sm">
               <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-none"><Globe size={18} /></div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Surveyed Area</p>
               </div>
               <h2 className="text-3xl font-black text-slate-900 tracking-tighter">14,242 <span className="text-sm text-slate-400 font-bold uppercase ml-1">Ha</span></h2>
               <p className="text-[9px] text-green-600 font-bold uppercase mt-2">● 98.2% GIS Coverage</p>
            </div>
            <div className="bg-white p-4 rounded-none border border-slate-200 shadow-sm">
               <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-none"><Landmark size={18} /></div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Poramboke Inventory</p>
               </div>
               <h2 className="text-3xl font-black text-slate-900 tracking-tighter">8,142 <span className="text-sm text-slate-400 font-bold uppercase ml-1">Parcels</span></h2>
               <p className="text-[9px] text-amber-600 font-bold uppercase mt-2">● 14% Under Legal Review</p>
            </div>
            <div className="bg-white p-4 rounded-none border border-slate-200 shadow-sm">
               <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-50 text-green-600 rounded-none"><ShieldCheck size={18} /></div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reclaimed Zone</p>
               </div>
               <h2 className="text-3xl font-black text-slate-900 tracking-tighter">412.5 <span className="text-sm text-slate-400 font-bold uppercase ml-1">Ha</span></h2>
               <p className="text-[9px] text-blue-600 font-bold uppercase mt-2">● Recovery Rate +12% YoY</p>
            </div>
            <div className="bg-blue-600 p-4 rounded-none text-white shadow-xl shadow-blue-100 flex flex-col justify-between">
               <div>
                  <h3 className="text-xs font-black uppercase tracking-widest mb-1">Administrative Report</h3>
                  <p className="text-[9px] text-blue-100 font-bold uppercase">Generate Monthly Land Audit</p>
               </div>
               <button onClick={onExport} className="w-full py-2.5 bg-white text-blue-600 rounded-none text-[9px] font-black uppercase tracking-widest hover:bg-blue-50 transition-all">Download Audit</button>
            </div>
         </div>

         <div className="grid grid-cols-12 gap-4 items-start">
            {/* GIS & Statistics Hub */}
            <div className="col-span-12 lg:col-span-8 space-y-4">
               {/* GIS Audit Node */}
               <div className="bg-white border border-slate-200 rounded-none shadow-sm h-[600px] overflow-hidden relative group">
                  <div className="absolute top-6 left-6 z-[1000] flex gap-2">
                     <Badge variant="info" className="bg-white/90 backdrop-blur shadow-lg border-white/20">DISTRICT CLASSIFICATION MAP</Badge>
                     <div className="flex items-center gap-2 px-3 py-1 bg-blue-600/90 backdrop-blur rounded-none text-[8px] font-black text-white uppercase tracking-widest shadow-lg">● Zoning Live</div>
                  </div>
                  <MapView parcels={parcels} alerts={alerts} onParcelClick={() => { }} onMapClick={onMapClick} selectedPosition={selectedPosition} />
                  

               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card title="Land Tenure Matrix" icon={Layers}>
                     <div className="space-y-4 py-2">
                        {[
                           { label: 'Revenue Department', p: 42, c: 'bg-blue-600' },
                           { label: 'Forest Department', p: 28, c: 'bg-green-600' },
                           { label: 'Local Bodies / Panchayats', p: 18, c: 'bg-amber-500' },
                           { label: 'Unclassified / Waste', p: 12, c: 'bg-slate-300' }
                        ].map((item, i) => (
                           <div key={i} className="space-y-2">
                              <div className="flex justify-between text-[9px] font-black uppercase">
                                 <span className="text-slate-500">{item.label}</span>
                                 <span className="text-slate-900">{item.p}%</span>
                              </div>
                              <ProgressBar progress={item.p} color={item.c} />
                           </div>
                        ))}
                     </div>
                  </Card>
                  <Card title="Audit Synchronization" icon={RefreshCcw}>
                     <div className="flex flex-col items-center justify-center py-6">
                        <div className="w-32 h-32 rounded-none border-[10px] border-slate-50 relative flex items-center justify-center">
                           <div className="absolute inset-0 rounded-none border-[10px] border-blue-600 border-r-transparent border-b-transparent animate-spin-slow"></div>
                           <div className="text-center">
                              <p className="text-2xl font-black text-slate-900">94%</p>
                              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">DATA SYNC</p>
                           </div>
                        </div>
                        <p className="mt-6 text-[9px] text-slate-400 font-bold uppercase text-center">Last Sync: 2 Mins Ago</p>
                     </div>
                  </Card>
               </div>
            </div>

            {/* Administrative Sidebar */}
            <div className="col-span-12 lg:col-span-4 space-y-4">
               <Card title="Revenue Leakage Matrix" icon={TrendingUp}>
                  <div className="space-y-4">
                     {[
                        { t: 'Salem West', v: '₹42.4 Cr', p: 85, c: 'bg-red-500' },
                        { t: 'Mettur', v: '₹28.1 Cr', p: 42, c: 'bg-orange-500' },
                        { t: 'Omalur', v: '₹12.2 Cr', p: 15, c: 'bg-green-500' }
                     ].map((item, i) => (
                        <div key={i} className="space-y-2">
                           <div className="flex justify-between text-[10px] font-black uppercase">
                              <span className="text-slate-600">{item.t}</span>
                              <span className="text-red-600">{item.v}</span>
                           </div>
                           <ProgressBar progress={item.p} color={item.c} />
                        </div>
                     ))}
                     <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                        <span className="text-[11px] font-black uppercase text-slate-900">Recovery Pot.</span>
                        <span className="text-blue-600 font-black">₹842.4 Cr</span>
                     </div>
                  </div>
               </Card>
               <Card title="Taluk Audit Performance" icon={TrendingUp}>
                  <div className="space-y-4">
                     <select onChange={(e) => setSelectedTaluk(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-none px-4 py-3 text-[10px] font-black text-slate-800 uppercase tracking-widest focus:border-blue-500 outline-none">
                        <option>All Taluks</option>
                        {TN_TALUKS['Salem'].map(t => <option key={t}>{t}</option>)}
                     </select>
                     
                     <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {talukStats.map(t => (
                           <div key={t.name} className="p-4 bg-slate-50 rounded-none border border-slate-100 hover:border-blue-200 transition-all group">
                              <div className="flex justify-between items-center mb-4">
                                 <p className="text-[11px] font-black text-slate-900 uppercase">{t.name}</p>
                                 <Badge variant={t.risk === 'HIGH' ? 'danger' : 'info'}>{t.risk} RISK</Badge>
                              </div>
                              <div className="grid grid-cols-3 gap-2 text-center mb-4">
                                 <div className="p-2 bg-white rounded-none border border-slate-100">
                                    <p className="text-[8px] font-bold text-slate-400 uppercase mb-1">Total</p>
                                    <p className="text-[10px] font-black text-slate-800">{t.total}</p>
                                 </div>
                                 <div className="p-2 bg-white rounded-none border border-slate-100">
                                    <p className="text-[8px] font-bold text-red-400 uppercase mb-1">Encr.</p>
                                    <p className="text-[10px] font-black text-red-600">{t.encroached}</p>
                                 </div>
                                 <div className="p-2 bg-white rounded-none border border-slate-100">
                                    <p className="text-[8px] font-bold text-green-400 uppercase mb-1">Recov.</p>
                                    <p className="text-[10px] font-black text-green-600">{t.recovered}</p>
                                 </div>
                              </div>
                              <div className="space-y-1">
                                 <div className="flex justify-between text-[8px] font-black uppercase text-slate-400"><span>Recovery Efficiency</span><span>{((t.recovered/t.encroached)*100).toFixed(0)}%</span></div>
                                 <ProgressBar progress={(t.recovered/t.encroached)*100} color="bg-green-500" />
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               </Card>

               <div className="bg-slate-900 rounded-none p-8 text-white relative overflow-hidden group shadow-2xl">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-none -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-blue-600/40 transition-all duration-700"></div>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-8 flex items-center gap-2"><History size={16} className="text-blue-400" /> Strategic Timeline</h3>
                  <div className="space-y-6">
                     {[
                        { t: '13:02', m: 'Drone Stream Alpha Connected', s: 'SUCCESS' },
                        { t: '10:15', m: 'New Encroachment Detected', s: 'ALERT' },
                        { t: '08:44', m: 'Mettur Node Sync Failure', s: 'RETRY' }
                     ].map((item, i) => (
                        <div key={i} className="flex gap-4 group">
                           <div className="flex flex-col items-center">
                              <div className="w-2 h-2 rounded-none bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.8)]"></div>
                              {i < 2 && <div className="w-px h-10 bg-slate-800"></div>}
                           </div>
                           <div>
                              <p className="text-[9px] font-black text-slate-500 uppercase">{item.t}</p>
                              <p className="text-[10px] font-bold text-slate-200 mt-1">{item.m}</p>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
});

const DashboardView = React.memo(({ parcels, alerts, setAlerts, onExport, onMapClick, gisAttributes, selectedPosition, onTabChange, activeTab }) => {
   const [assignmentModal, setAssignmentModal] = useState({ open: false, alertId: null });
   const [isScanning, setIsScanning] = useState(false);
   const [scanResults, setScanResults] = useState(null);

   const activeAlerts = alerts.filter(a => a.status === 'NEW' || a.status === 'TAHSILDAR_ACCEPTED');

   const handleScan = () => {
      setIsScanning(true);
      setScanResults(null);
      setTimeout(() => {
         setIsScanning(false);
         const encroachmentCount = alerts.filter(a => a.status === 'NEW' || a.status === 'PENDING').length;
         setScanResults(encroachmentCount);
      }, 3000);
   };

   return (
      <div className="space-y-6 animate-in fade-in duration-700 pb-10">
         {/* COMMAND CENTER STATUS BAR */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-slate-900 text-white px-5 py-3 flex items-center border-l-4 border-blue-600 shadow-lg">
               <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-white/5 flex items-center justify-center text-blue-400 shrink-0"><Globe size={18} /></div>
                  <div>
                     <p className="text-[7px] font-black text-blue-400 uppercase tracking-[0.2em]">Surveillance Range</p>
                     <p className="text-base font-black tracking-tighter italic leading-none mt-0.5">14,242.8 <span className="text-[8px] text-slate-400 not-italic uppercase ml-1">Ha</span></p>
                  </div>
               </div>
            </div>
            <div className="bg-white border border-slate-200 px-5 py-3 flex items-center shadow-sm">
               <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-slate-50 flex items-center justify-center text-slate-400 shrink-0"><RefreshCcw size={18} /></div>
                  <div>
                     <p className="text-[7px] font-black text-slate-400 uppercase tracking-[0.2em]">Sentinel-2 Uplink</p>
                     <p className="text-base font-black text-slate-900 tracking-tighter flex items-center gap-2 leading-none mt-0.5">
                        <span className="w-2 h-2 bg-green-500 rounded-none animate-pulse"></span>
                        LIVE_FEED
                     </p>
                  </div>
               </div>
            </div>
            <div className="bg-blue-600 text-white px-5 py-3 flex items-center shadow-xl">
               <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-white/10 flex items-center justify-center text-white shrink-0"><ShieldCheck size={18} /></div>
                  <div>
                     <p className="text-[7px] font-black text-blue-100 uppercase tracking-[0.2em]">Protection Index</p>
                     <p className="text-base font-black tracking-tighter leading-none mt-0.5">98.4% <span className="text-[8px] text-blue-200 uppercase font-bold ml-1 tracking-widest">Secured</span></p>
                  </div>
               </div>
            </div>
         </div>


         {gisAttributes && (
            <div className="bg-white border-2 border-blue-600 p-6 rounded-none shadow-xl animate-in slide-in-from-top-4 duration-500">
               <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                     <div className="p-2 bg-blue-600 text-white rounded-none"><Globe size={18} /></div>
                     <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">GIS Tactical Insight</h3>
                  </div>
                  <div className="flex items-center gap-3">
                     {activeTab === 'gis-sentinel' && (
                        <button 
                           onClick={handleScan}
                           disabled={isScanning}
                           className={`px-4 py-2 ${isScanning ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 text-white hover:bg-black'} text-[9px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2`}
                        >
                           {isScanning ? <RefreshCcw size={12} className="animate-spin" /> : <Zap size={12} />} 
                           {isScanning ? 'SCANNING_MATRIX...' : 'SCAN_FOR_ENCROACHMENTS'}
                        </button>
                     )}
                     <div className="flex items-center gap-2">
                        <Badge variant={gisAttributes.status === 1 ? 'success' : 'danger'}>
                           {gisAttributes.status === 1 ? 'GIS Sync' : 'Link Offline'}
                        </Badge>
                     </div>
                  </div>
               </div>
               
               {scanResults !== null && (
                  <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 animate-in slide-in-from-left duration-500">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-red-600 text-white flex items-center justify-center shadow-lg"><AlertTriangle size={20} /></div>
                        <div>
                           <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">Automated Scan Complete</p>
                           <h4 className="text-lg font-black text-slate-900 uppercase">{scanResults} CRITICAL INCURSIONS DETECTED</h4>
                           <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Cross-referenced against 14,204 Government Records · Salem District Sector</p>
                        </div>
                     </div>
                  </div>
               )}
               {gisAttributes.gis_attributes?.Districts ? (
                  <div className="space-y-6">
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div>
                           <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">District</p>
                           <p className="text-xs font-black text-slate-800">{gisAttributes.gis_attributes.Districts.district_name}</p>
                        </div>
                        <div>
                           <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status</p>
                           <p className={`text-xs font-black ${gisAttributes.is_government_land ? 'text-red-600' : 'text-green-600'}`}>
                              {gisAttributes.is_government_land ? 'GOVERNMENT LAND' : 'PRIVATE LAND'}
                           </p>
                        </div>
                        <div className="col-span-2">
                           <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tactical Analysis</p>
                           <p className="text-xs font-bold text-slate-700">{gisAttributes.message}</p>
                        </div>
                     </div>
                     {gisAttributes.recommended_action === 'GENERATE_ALERT' && (
                        <button onClick={() => alert('Generating Official Encroachment Alert...')} className="w-full py-3 bg-red-600 text-white rounded-none text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-200 animate-bounce">
                           Generate Encroachment Alert
                        </button>
                     )}
                  </div>
               ) : (
                  <p className="text-xs font-bold text-slate-500 uppercase">{gisAttributes.message || "Initializing GIS Probe..."}</p>
               )}
            </div>
         )}

         <div className="grid grid-cols-12 gap-6 items-start flex-1">
            <div className="col-span-12 lg:col-span-9 space-y-6">
               <div className="bg-white border border-slate-200 rounded-none shadow-sm h-[650px] overflow-hidden relative group">
                  <div className="absolute top-6 left-6 z-[1000] flex gap-2">
                     <Badge variant="info" className="bg-white/90 backdrop-blur shadow-lg border-white/20">LIVE GIS STREAM</Badge>
                     <div className="flex items-center gap-2 px-3 py-1 bg-green-500/90 backdrop-blur rounded-none text-[8px] font-black text-white uppercase tracking-widest shadow-lg animate-pulse">● System Online</div>
                  </div>
                  
                  {isScanning && (
                     <div className="absolute inset-0 z-[1005] bg-blue-600/5 backdrop-blur-[1px] pointer-events-none flex items-center justify-center">
                        <div className="w-full h-1 bg-blue-500 absolute top-0 animate-scan"></div>
                        <div className="relative">
                           <div className="w-48 h-48 border-4 border-blue-600/20 rounded-full animate-ping"></div>
                           <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.4em] animate-pulse">PROBING_NODES</p>
                              <div className="flex gap-1 mt-2">
                                 {[1,2,3].map(i => <div key={i} className="w-1.5 h-1.5 bg-blue-600 rounded-none animate-bounce" style={{animationDelay: `${i*200}ms`}}></div>)}
                              </div>
                           </div>
                        </div>
                     </div>
                  )}

                  <MapView parcels={parcels} alerts={alerts} onParcelClick={() => { }} onMapClick={onMapClick} selectedPosition={selectedPosition} />


               </div>


            </div>

            {/* Strategic Intelligence Hub */}
            <div className="col-span-12 lg:col-span-3 space-y-6 flex flex-col h-full sticky top-6">
               {/* GOVERNMENT ASSET SUMMARY */}
               <div className="bg-white border border-slate-200 p-4 rounded-none shadow-sm">
                  <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2"><Landmark size={12} className="text-blue-600" /> Govt Asset Registry</h3>
                  <div className="grid grid-cols-2 gap-2">
                     <div className="p-3 bg-slate-50 border border-slate-100">
                        <p className="text-[7px] font-black text-slate-400 uppercase mb-1">Total Parcels</p>
                        <p className="text-lg font-black text-slate-900">12,482</p>
                     </div>
                     <div className="p-3 bg-slate-50 border border-slate-100">
                        <p className="text-[7px] font-black text-slate-400 uppercase mb-1">Verified Clear</p>
                        <p className="text-lg font-black text-green-600">94.2%</p>
                     </div>
                  </div>
                  <div className="mt-3 space-y-2">
                     {[
                        { label: 'Revenue Land', count: 8142, color: 'bg-blue-600' },
                        { label: 'Forest Reserve', count: 2104, color: 'bg-emerald-600' },
                        { label: 'Water Bodies', count: 1845, color: 'bg-cyan-500' },
                        { label: 'Common Poramboke', count: 391, color: 'bg-amber-500' }
                     ].map((asset, i) => (
                        <div key={i} className="flex items-center justify-between">
                           <div className="flex items-center gap-2">
                              <div className={`w-1.5 h-1.5 ${asset.color}`}></div>
                              <span className="text-[9px] font-bold text-slate-600 uppercase">{asset.label}</span>
                           </div>
                           <span className="text-[10px] font-black text-slate-900">{asset.count}</span>
                        </div>
                     ))}
                  </div>
               </div>

               <div className="bg-slate-900 rounded-none p-5 text-white shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/20 rounded-none -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-blue-600/40 transition-all"></div>
                  <h3 className="text-[9px] font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2 text-blue-400"><TrendingUp size={14} /> Equity at Risk</h3>
                  <div className="space-y-1">
                     <h2 className="text-3xl font-black tracking-tighter italic leading-none">₹842.4 Cr</h2>
                     <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest leading-tight mt-1">Est. Land Value Impacted</p>
                  </div>
                  <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-2 gap-3">
                     <div><p className="text-[7px] font-bold text-slate-500 uppercase">Recovery</p><p className="text-xs font-black text-green-400">+12.4%</p></div>
                     <div><p className="text-[7px] font-bold text-slate-500 uppercase">Audit</p><p className="text-xs font-black text-blue-400">94/100</p></div>
                  </div>
               </div>

               <div className="bg-white border border-slate-200 rounded-none shadow-sm flex flex-col max-h-[600px]">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                     <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2"><Target size={14} className="text-red-600" /> Tactical Dispatch</h3>
                     <Badge variant="danger">{alerts.filter(a => a.status === 'NEW').length} NEW</Badge>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                     {alerts.filter(a => a.status === 'NEW').map(alert => (
                        <div key={alert.id} className="p-4 bg-slate-50 hover:bg-white border border-transparent hover:border-slate-100 rounded-none transition-all cursor-pointer group shadow-sm" onClick={() => setAssignmentModal({ open: true, alertId: alert.id })}>
                           <div className="flex justify-between items-center mb-3">
                               <Badge variant={alert.confidence_score > 0.8 ? 'danger' : 'warning'} className="text-[8px] px-2 py-0.5">{(alert.confidence_score * 100).toFixed(0)}% AI CONFIDENCE</Badge>
                               <span className="text-[9px] text-slate-300 font-bold">#{alert.id.slice(0, 6)}</span>
                           </div>
                           
                           <div className="flex gap-3 mb-4">
                              <div className="w-16 h-16 rounded-none overflow-hidden border border-slate-200 shadow-sm shrink-0">
                                 <img src={alert.img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                              </div>
                              <div className="flex-1 min-w-0">
                                 <p className="text-[11px] font-black text-slate-800 uppercase leading-tight mb-1 truncate">{alert.alert_type}</p>
                                 <p className="text-[9px] text-slate-400 font-bold uppercase mb-1">Survey: {alert.parcel_details}</p>
                                 <div className="flex items-center gap-1.5 text-blue-600">
                                    <MapPin size={10} />
                                    <p className="text-[9px] font-black uppercase tracking-tight">{alert.taluk}</p>
                                 </div>
                              </div>
                           </div>

                           <button className="w-full py-3 bg-slate-900 text-white rounded-none text-[8px] font-black uppercase tracking-widest shadow-lg shadow-slate-100 hover:bg-blue-600 transition-all flex items-center justify-center gap-2">
                              <Zap size={12} /> Assign Tahsildar Dispatch
                           </button>
                        </div>
                     ))}
                     {alerts.filter(a => a.status === 'NEW').length === 0 && (
                        <div className="py-12 text-center text-slate-300">
                           <ShieldCheck size={32} className="mx-auto mb-3 opacity-20" />
                           <p className="text-[10px] font-black uppercase tracking-widest">All Threats Mobilized</p>
                        </div>
                     )}
                  </div>
               </div>


            </div>
         </div>

         <OfficerAssignmentModal 
            isOpen={assignmentModal.open} 
            alertId={assignmentModal.alertId} 
            type="TAHSILDAR" 
            alerts={alerts}
            onClose={() => setAssignmentModal({ open: false, alertId: null })} 
            onAssign={(officer) => {
               setAlerts(prev => prev.map(a => a.id === assignmentModal.alertId ? { ...a, status: 'COLLECTOR_ACCEPTED', assignedTahsildar: officer } : a));
               alert(`EXECUTIVE ORDER: Mission #${assignmentModal.alertId} officially dispatched to Tahsildar ${officer}.\n\nDirective: FULL_FIELD_OCCUPATION_AUDIT`);
               setAssignmentModal({ open: false, alertId: null });
            }} 
         />


      </div>
   );
});


const ProfileView = React.memo(({ user }) => (
   <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
      <div className="bg-white border border-slate-200 rounded-none p-4 sm:p-5 shadow-sm flex flex-col sm:row items-center sm:items-start gap-6 sm:gap-8 text-center sm:text-left">
         <div className="w-20 h-20 sm:w-24 sm:h-24 bg-blue-600 rounded-none sm:rounded-none flex items-center justify-center text-white text-3xl sm:text-4xl font-extrabold shadow-lg shrink-0">{user.avatar}</div>
         <div className="flex-1">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 uppercase tracking-tight">{user.name}</h2>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] sm:text-xs mt-1">{user.role} • Salem District Node</p>
            <div className="flex justify-center sm:justify-start gap-3 mt-4"><Badge variant="success">Active</Badge><Badge variant="info">Level 4</Badge></div>
         </div>
         <button className="w-full sm:w-auto px-6 py-3 bg-slate-50 border border-slate-200 rounded-none text-[10px] font-bold uppercase hover:bg-slate-100 transition-all">Security Protocol</button>
      </div>
   </div>
));

const FormView = React.memo(({ title, icon: Icon, fields, onBack }) => {
   const [district, setDistrict] = useState('Salem');
   return (
      <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-500">
         <div className="bg-white p-4 sm:p-6 rounded-none border border-slate-200 shadow-sm relative">
            {onBack && <button onClick={onBack} className="absolute top-8 right-8 text-slate-400 hover:text-slate-800 transition-all"><X size={20} /></button>}
            <div className="flex items-center gap-4 mb-8">
               <div className="p-3 bg-blue-50 text-blue-600 rounded-none"><Icon size={24} /></div>
               <h2 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-tight">{title}</h2>
            </div>
            <div className="space-y-6">
               {fields.map((f, i) => (
                  <div key={i}>
                     <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2">{f.label}</label>
                     {f.type === 'tn-district' ? (
                        <select onChange={(e) => setDistrict(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-none px-4 py-3 text-xs font-black text-slate-800 focus:border-blue-500 outline-none uppercase tracking-tighter">
                           {TN_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                     ) : f.type === 'tn-taluk' ? (
                        <select className="w-full bg-slate-50 border border-slate-200 rounded-none px-4 py-3 text-xs font-black text-slate-800 focus:border-blue-500 outline-none uppercase tracking-tighter">
                           {(TN_TALUKS[district] || []).map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                     ) : (
                        <input type={f.type || 'text'} className="w-full bg-slate-50 border border-slate-200 rounded-none px-4 py-3 text-xs font-bold text-slate-800 focus:border-blue-500 transition-all outline-none" placeholder={f.placeholder} />
                     )}
                  </div>
               ))}
               <div className="flex gap-4">
                  <button onClick={() => { alert("Operation Executed Successfully!"); if (onBack) onBack(); }} className="flex-1 bg-blue-600 text-white py-4 rounded-none font-bold uppercase tracking-widest shadow-lg hover:bg-blue-700 transition-all active:scale-[0.98] text-[10px]">Execute Operation</button>
                  {onBack && <button onClick={onBack} className="px-8 py-4 bg-slate-50 text-slate-400 rounded-none font-bold uppercase tracking-widest hover:bg-slate-100 transition-all text-[10px]">Cancel</button>}
               </div>
            </div>
         </div>
      </div>
   );
});

// --- LIVE ALERT FEED ---
const LiveAlertFeed = ({ alerts = [] }) => {
   const [feed, setFeed] = useState(() => {
      const syntheticEvents = [
         { id: 'f1', type: 'AI_DETECT', msg: 'New structure detected · Survey 142/A · 97.2% confidence', time: 'Just now', color: 'text-red-500', dot: 'bg-red-500' },
         { id: 'f2', type: 'FIELD_SYNC', msg: 'Inspector Rajesh submitted geotagged evidence · Salem West', time: '2m ago', color: 'text-blue-500', dot: 'bg-blue-500' },
         { id: 'f3', type: 'APPROVE', msg: 'Tahsildar approved registry correction · Survey 88/C', time: '5m ago', color: 'text-green-500', dot: 'bg-green-500' },
         { id: 'f4', type: 'SAT_PASS', msg: 'Sentinel-2 scan complete · 14,242 Ha processed', time: '8m ago', color: 'text-indigo-500', dot: 'bg-indigo-500' },
         { id: 'f5', type: 'ALERT', msg: 'Boundary violation flagged · Mettur Node · 89.4% conf', time: '11m ago', color: 'text-orange-500', dot: 'bg-orange-500' },
      ];
      return [...alerts.slice(0, 3).map((a, i) => ({
         id: `live-${a.id}`,
         type: 'AI_DETECT',
         msg: `${a.alert_type} · Survey ${a.parcel_details} · ${(a.confidence_score * 100).toFixed(0)}% conf`,
         time: 'Live',
         color: 'text-red-500',
         dot: 'bg-red-500 animate-pulse'
      })), ...syntheticEvents];
   });

   useEffect(() => {
      const newEvents = [
         { type: 'AI_DETECT', msg: 'Change vector detected · Attur Sector · 91.8% conf', color: 'text-red-500', dot: 'bg-red-500' },
         { type: 'FIELD_SYNC', msg: 'VAO Meyyanur uploaded survey report · 3 photos attached', color: 'text-blue-500', dot: 'bg-blue-500' },
         { type: 'APPROVE', msg: 'District Collector approved eviction order · #EO-441', color: 'text-green-500', dot: 'bg-green-500' },
         { type: 'SAT_PASS', msg: 'Cartosat-3 pass initiated · High-res imaging active', color: 'text-indigo-500', dot: 'bg-indigo-500' },
         { type: 'RESOLVE', msg: 'Case #882 marked resolved · Omalur North cleared', color: 'text-emerald-500', dot: 'bg-emerald-500' },
      ];
      let idx = 0;
      const interval = setInterval(() => {
         const ev = newEvents[idx % newEvents.length];
         setFeed(prev => [{ ...ev, id: `auto-${Date.now()}`, time: 'Just now' }, ...prev.slice(0, 14)]);
         idx++;
      }, 6000);
      return () => clearInterval(interval);
   }, []);

   return (
      <div className="bg-white border border-slate-200 rounded-none shadow-sm overflow-hidden">
         <div className="px-6 py-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
               <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
               Live Intelligence Feed
            </h3>
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Auto-Sync · 6s</span>
         </div>
         <div className="divide-y divide-slate-50 max-h-64 overflow-y-auto custom-scrollbar">
            {feed.map((ev, i) => (
               <div key={ev.id} className={`flex items-start gap-3 px-5 py-3 transition-all ${i === 0 ? 'bg-blue-50/50 animate-in slide-in-from-top-2 duration-500' : 'bg-white'}`}>
                  <div className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${ev.dot}`}></div>
                  <div className="flex-1 min-w-0">
                     <p className={`text-[9px] font-black uppercase tracking-tight ${ev.color} mb-0.5`}>{ev.type.replace('_', ' ')}</p>
                     <p className="text-[9px] font-bold text-slate-700 leading-tight truncate">{ev.msg}</p>
                  </div>
                  <span className="text-[8px] font-bold text-slate-300 uppercase shrink-0">{ev.time}</span>
               </div>
            ))}
         </div>
      </div>
   );
};

// --- NOTIFICATION CENTER PANEL ---
const NotificationCenterPanel = ({ isOpen, onClose, alerts, registryRequests, onNavigate }) => {
   const [readIds, setReadIds] = useState(new Set());

   const notifications = useMemo(() => {
      const notifs = [];
      alerts.filter(a => a.status === 'NEW' || a.status === 'Pending').slice(0, 4).forEach(a => notifs.push({
         id: `alert-${a.id}`, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50',
         title: 'AI Threat Detected', message: `${a.alert_type} — Survey ${a.parcel_details} (${a.taluk})`,
         time: 'Live', action: 'alerts'
      }));
      registryRequests.filter(r => r.status === 'PENDING_TAHSILDAR').slice(0, 3).forEach(r => notifs.push({
         id: `reg-${r.id}`, icon: CheckSquare, color: 'text-blue-600', bg: 'bg-blue-50',
         title: 'Registry Approval Pending', message: `${r.type} — ${r.survey} · ${r.taluk}`,
         time: r.timestamp, action: 'approvals'
      }));
      alerts.filter(a => a.verification).slice(0, 2).forEach(a => notifs.push({
         id: `verify-${a.id}`, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50',
         title: 'Field Verification Submitted', message: `Evidence by ${a.verification?.officer_name} — ${a.parcel_details}`,
         time: '5m ago', action: 'camera'
      }));
      notifs.push(
         { id: 'sys-sat', icon: Globe, color: 'text-indigo-600', bg: 'bg-indigo-50', title: 'Satellite Pass Complete', message: 'Sentinel-2 scanned 14,242 Ha. 12 new vectors queued for review.', time: '12m ago', action: 'ai-monitoring' },
         { id: 'sys-sec', icon: Shield, color: 'text-slate-600', bg: 'bg-slate-50', title: 'Security Audit Clear', message: '1,442 ingress threats blocked. All nodes operating normally.', time: '1h ago', action: 'health' },
         { id: 'sys-ai', icon: Cpu, color: 'text-purple-600', bg: 'bg-purple-50', title: 'AI Engine v4.2 Active', message: 'EncroachNet model running at 98.4% precision. Inference: 1,442/min.', time: '2h ago', action: 'detection-logic' }
      );
      return notifs;
   }, [alerts, registryRequests]);

   const unreadCount = notifications.filter(n => !readIds.has(n.id)).length;

   if (!isOpen) return null;
   return (
      <div className="fixed inset-0 z-[4500] flex justify-end">
         <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]" onClick={onClose} />
         <div className="relative bg-white w-full max-w-sm h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300">
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-900 flex justify-between items-center">
               <div className="flex items-center gap-3">
                  <div className="bg-blue-600 p-2 text-white"><Bell size={16} /></div>
                  <div>
                     <h2 className="text-[10px] font-black text-white uppercase tracking-widest">Command Alerts</h2>
                     <p className="text-[8px] font-bold text-blue-400 uppercase tracking-widest mt-0.5">{unreadCount} Unread · LIVE</p>
                  </div>
               </div>
               <button onClick={onClose} className="p-2 text-slate-400 hover:text-red-400 transition-all"><X size={16} /></button>
            </div>
            <div className="px-5 py-2 border-b border-slate-100 flex justify-between items-center bg-slate-50">
               <span className="text-[8px] font-bold text-slate-400 uppercase">{notifications.length} Total</span>
               <button onClick={() => setReadIds(new Set(notifications.map(n => n.id)))} className="text-[8px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-800 transition-all">Mark All Read</button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-slate-50">
               {notifications.map((notif) => {
                  const isRead = readIds.has(notif.id);
                  return (
                     <button key={notif.id}
                        onClick={() => { setReadIds(prev => new Set([...prev, notif.id])); onNavigate(notif.action); onClose(); }}
                        className={`w-full px-5 py-4 flex items-start gap-3 hover:bg-slate-50 transition-all text-left group ${isRead ? 'opacity-50' : ''}`}
                     >
                        <div className={`p-2 rounded-none ${notif.bg} ${notif.color} shrink-0 mt-0.5`}><notif.icon size={13} /></div>
                        <div className="flex-1 min-w-0">
                           <div className="flex justify-between items-center mb-0.5">
                              <p className="text-[9px] font-black text-slate-900 uppercase tracking-tight">{notif.title}</p>
                              {!isRead && <div className="w-1.5 h-1.5 bg-blue-600 rounded-full shrink-0"></div>}
                           </div>
                           <p className="text-[9px] text-slate-500 font-bold leading-relaxed">{notif.message}</p>
                           <p className="text-[8px] text-slate-300 font-bold uppercase mt-1">{notif.time}</p>
                        </div>
                        <ChevronRight size={11} className="text-slate-300 group-hover:text-blue-600 shrink-0 mt-1" />
                     </button>
                  );
               })}
            </div>
            <div className="p-4 bg-slate-900 border-t border-white/5">
               <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest text-center">GEOMMAND · AES-256 Encrypted Channel</p>
            </div>
         </div>
      </div>
   );
};

// --- MAIN APPLICATION ---

export default function App() {
   const [user, setUser] = useState(null);
   const [activeTab, setActiveTab] = useState('dashboard');
   const [parcels, setParcels] = useState([]);
   const [alerts, setAlerts] = useState([]);
   const [loginCat, setLoginCat] = useState('Core');
   const [currentTime, setCurrentTime] = useState(new Date());
   const [lang, setLang] = useState('EN');
   const t = (en, ta) => lang === 'EN' ? en : (ta || en);

   // --- LIVE INTELLIGENCE FEED SIMULATION ---
   useEffect(() => {
      if (!user) return;
      const feedInterval = setInterval(() => {
         const randomType = ['CONSTRUCTION', 'FENCING', 'AGRICULTURAL', 'COMMERCIAL'][Math.floor(Math.random() * 4)];
         const randomTaluk = TN_TALUKS['Salem'][Math.floor(Math.random() * TN_TALUKS['Salem'].length)];
         const newAlert = {
            id: `LIVE-${Math.floor(1000 + Math.random() * 9000)}`,
            alert_type: randomType,
            parcel_details: `${Math.floor(100 + Math.random() * 900)}/${Math.floor(1 + Math.random() * 10)}`,
            taluk: randomTaluk,
            status: 'NEW',
            severity: 'HIGH',
            timestamp: new Date().toISOString(),
            message: `New Change Detected: ${randomType} in ${randomTaluk}`,
            isLive: true
         };
         
         setAlerts(prev => {
            const updated = [newAlert, ...prev];
            return updated.slice(0, 100);
         });
      }, 45000);
      
      return () => clearInterval(feedInterval);
   }, [user]);
   const [isSidebarOpen, setIsSidebarOpen] = useState(false);
   const [isNotifOpen, setIsNotifOpen] = useState(false);
   const [subView, setSubView] = useState(null);
   const [gisAttributes, setGisAttributes] = useState(null);
   const [selectedPosition, setSelectedPosition] = useState(null);
   const [registryRequests, setRegistryRequests] = useState([
      { id: 'UP-8821', type: 'UPDATION', loc: 'Suramangalam', taluk: 'Salem West', survey: '142/A1', owner: 'Anbazhagan', cls: 'Poramboke', ext: '2.40 Hec', status: 'PENDING_TAHSILDAR', timestamp: '2026-05-05 10:12' },
      { id: 'UP-8822', type: 'UPDATION', loc: 'Meyyanur', taluk: 'Salem West', survey: '44/2', owner: 'Kavitha', cls: 'Natham', ext: '0.15 Hec', status: 'VERIFIED_DB', timestamp: '2026-05-04 14:22' },
      { id: 'CR-991A', type: 'CORRECTION', loc: 'Meyyanur', taluk: 'Salem West', survey: '88/C', error: 'Extent Error', proposed: '0.45 Hec', status: 'PENDING_TAHSILDAR', timestamp: '2026-05-05 09:45' },
      { id: 'CR-992B', type: 'CORRECTION', loc: 'Kolathur', taluk: 'Mettur', survey: '11/2', error: 'Classification', proposed: 'Poramboke', status: 'VERIFIED_DB', timestamp: '2026-05-03 11:10' }
   ]);

   const handleRegistrySubmit = (request) => {
      setRegistryRequests(prev => [
         { ...request, id: `${request.type === 'UPDATION' ? 'UP' : 'CR'}-${Math.floor(1000 + Math.random() * 9000)}`, status: 'PENDING_TAHSILDAR', timestamp: new Date().toLocaleString() },
         ...prev
      ]);
   };

   const handleRegistryAction = (id, newStatus) => {
      setRegistryRequests(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
   };

   const handleMapClick = useCallback(async (latlng) => {
      setSelectedPosition([latlng.lat, latlng.lng]);
      setGisAttributes({ message: "Running Automated Threat Assessment..." });
      try {
         const response = await axios.post(`${API_BASE}/smart-alert/`, {
            latitude: latlng.lat,
            longitude: latlng.lng
         });
         setGisAttributes({ ...response.data, status: 1 });
      } catch (err) {
         console.error("TNGIS Probe Failed:", err);
         setGisAttributes({ status: 0, message: "Node Communication Error" });
      }
   }, []);

   const patchAlertStatus = async (id, newStatus, extraData = {}) => {
      // 1. Update Local State Immediately (Optimistic UI)
      setAlerts(prev => prev.map(a => {
         if (String(a.id) === String(id)) {
            const updatedAlert = { ...a, status: newStatus, ...extraData };
            if (extraData.resolution_images && extraData.resolution_images.length > 0) {
               updatedAlert.img = extraData.resolution_images[0];
            }
            return updatedAlert;
         }
         return a;
      }));

      // 2. Persist to Backend
      try {
         await axios.patch(`${API_BASE}/alerts/${id}/`, {
            status: newStatus,
            ...extraData
         });
         console.log(`Backend Sync Success: Alert ${id} -> ${newStatus}`);
      } catch (err) {
         console.error(`Backend Sync Failed for Alert ${id}:`, err);
         // We keep the local state for demo purposes even if backend fails
      }
   };

   useEffect(() => {
      if (!user) return;
      const fetchData = async () => {
         try {
            const [pRes, aRes] = await Promise.all([
               axios.get(`${API_BASE}/parcels/`),
               axios.get(`${API_BASE}/alerts/`)
            ]);
            setParcels(pRes.data?.features?.map(f => ({ id: f.id, ...f.properties, coordinates: f.geometry.coordinates[0].map(c => [c[1], c[0]]) })) || []);
            const alertsData = aRes.data?.features?.map(f => {
               const fieldPhotos = [field1, field2, field3, field4, field5, field6, field7, field8];
               const imgIdx = (f.id.toString().split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % fieldPhotos.length;
               let assignedImg = fieldPhotos[imgIdx];

               const verificationPhotos = f.properties.verification?.photos;
               if (verificationPhotos && Array.isArray(verificationPhotos) && verificationPhotos.length > 0) {
                  let photo = verificationPhotos[0];
                  if (photo && !photo.startsWith('data:image') && !photo.startsWith('http') && !photo.startsWith('blob:')) {
                     photo = 'data:image/jpeg;base64,' + photo;
                  }
                  if (photo) assignedImg = photo;
               }

               const resolutionPhotos = f.properties.resolution_images;
               if (resolutionPhotos && Array.isArray(resolutionPhotos) && resolutionPhotos.length > 0) {
                  let photo = resolutionPhotos[0];
                  if (photo && !photo.startsWith('data:image') && !photo.startsWith('http') && !photo.startsWith('blob:')) {
                     photo = 'data:image/jpeg;base64,' + photo;
                  }
                  if (photo) assignedImg = photo;
               }

               return {
                  id: String(f.id),
                  ...f.properties,
                  position: [f.geometry.coordinates[1], f.geometry.coordinates[0]],
                  survey_number: f.properties.parcel_details,
                  status: (f.properties.status || 'NEW').toUpperCase(),
                  img: assignedImg
               };
            }) || [];
            
            setAlerts(prev => {
               const newAlerts = alertsData;
               const finalAlerts = newAlerts.map(na => {
                  const localMatch = prev.find(p => String(p.id) === String(na.id));
                  if (localMatch) {
                     // If backend updated status to a completed/verified state, accept it fully
                     if (['RESOLVED', 'COLLECTOR_ACCEPTED', 'TAHSILDAR_ACCEPTED'].includes(na.status)) {
                        return na;
                     }
                     // Keep local overrides only if both are in progress
                     if (localMatch.status !== 'NEW' && localMatch.status !== 'RESOLVED') {
                        return { 
                           ...na, 
                           status: localMatch.status, 
                           assignedTahsildar: localMatch.assignedTahsildar, 
                           assignedCollector: localMatch.assignedCollector,
                           assignedTo: localMatch.assignedTo,
                           resolution_notes: localMatch.resolution_notes,
                           verification: na.verification || localMatch.verification
                        };
                     }
                  }
                  return na;
               });
               
               return finalAlerts;
            });
         } catch (err) {
            console.error("Data Sync Error:", err);
         }
      };
      
      fetchData();
      const interval = setInterval(fetchData, 30000); 
      return () => clearInterval(interval);
   }, [user]);

   useEffect(() => {
      const timer = setInterval(() => setCurrentTime(new Date()), 1000);
      return () => clearInterval(timer);
   }, []);




   const handleDemoLogin = useCallback((roleId) => {
      if (!ROLES[roleId] || !MENU_STRUCTURE[roleId]) {
         console.error("Critical: Role configuration missing for", roleId);
         return;
      }
      // Assign specific jurisdictions for demo purposes
      let jurisdiction = { level: 'STATE', value: 'All' };
      if (roleId === 'COLLECTOR') jurisdiction = { level: 'DISTRICT', value: 'Salem' };
      if (roleId === 'TAHSILDAR') jurisdiction = { level: 'TALUK', value: 'Salem West' };
      if (roleId === 'VAO') jurisdiction = { level: 'VILLAGE', value: 'Omalur North' };
      if (roleId === 'INSPECTOR') jurisdiction = { level: 'TALUK', value: 'Mettur' };

      setUser({ 
         role: roleId, 
         name: ROLES[roleId].name, 
         avatar: roleId.slice(0, 2),
         jurisdiction: jurisdiction 
      });
      const firstTab = MENU_STRUCTURE[roleId].find(i => i.type !== 'header');
      setActiveTab(firstTab ? firstTab.id : 'dashboard');
      setIsSidebarOpen(false);
      setSubView(null);
   }, []);

   const handleExport = () => {
      alert("Preparing Strategic Intelligence Report...\nFormat: PDF/CSV\nExporting Data: Salem District Hub\n\nDownload will begin in 5 seconds.");
   };

   const renderActiveView = () => {
      if (subView === 'onboard') return <FormView title="Officer Onboarding" icon={UserPlus} onBack={() => setSubView(null)} fields={[{ label: 'Officer Identity', placeholder: 'Full Name' }, { label: 'Department Node', type: 'tn-district' }, { label: 'Assigned Territory', type: 'tn-taluk' }, { label: 'Security Clearance', placeholder: 'Level 1-5' }]} />;

      if (activeTab === 'profile') return <ProfileView user={user} />;
      if (activeTab === 'camera') return <CameraView alerts={alerts} />;
      if (activeTab === 'field-monitor') return <FieldOpsMonitorView user={user} />;
      if (activeTab === 'field-ops') return <CombinedTacticalOpsView user={user} alerts={alerts} />;
      if (activeTab === 'detection-logic') return <AIDetectionLogicView />;
      if (activeTab === 'government-registry') return <GovernmentLandRegistryView user={user} />;
      if (activeTab === 'gis-sentinel') return <DashboardView parcels={parcels} alerts={alerts} setAlerts={setAlerts} onExport={handleExport} onMapClick={handleMapClick} gisAttributes={{...gisAttributes, message: 'GEOMMAND MODE: Monitoring 14,200 Government Parcels in Real-Time.'}} onTabChange={setActiveTab} activeTab={activeTab} />;
      if (activeTab === 'health') return <SystemHealthView />;
      if (activeTab === 'ai-monitoring' || activeTab === 'alerts') return <AIMonitoringView user={user} alerts={alerts} patchAlertStatus={patchAlertStatus} parcels={parcels} onMapClick={handleMapClick} selectedPosition={selectedPosition} />;
      if (activeTab === 'reports') return <ReportsView parcels={parcels} alerts={alerts} />;
      if (activeTab === 'analytics') return <DistrictAnalyticsView alerts={alerts} />;
      if (activeTab === 'recovery') return <RevenueRecoveryView alerts={alerts} />;
      if (activeTab === 'approvals') {
         if (user.role === 'COLLECTOR' || user.role === 'TAHSILDAR') {
            return <div className="p-6"><RegistryApprovalsHub user={user} /></div>;
         }
         return <ApprovalsHubView user={user} alerts={alerts} patchAlertStatus={patchAlertStatus} registryRequests={registryRequests} onRegistryAction={handleRegistryAction} />;
      }
      if (activeTab === 'updation') return (
         <div className="p-6">
            <RegistryUpdationView 
               requests={registryRequests} 
               onSubmit={handleRegistrySubmit}
               user={user}
            />
         </div>
      );
      if (activeTab === 'correction') return (
         <div className="p-6">
            <RegistryCorrectionView 
               requests={registryRequests} 
               onSubmit={handleRegistrySubmit}
               user={user}
            />
         </div>
      );
      if (activeTab === 'tasks') {
         if (user.role === 'INSPECTOR') {
            return <div className="p-6"><InspectorExecutiveView parcels={parcels} alerts={alerts} patchAlertStatus={patchAlertStatus} /></div>;
         }
         if (user.role === 'VAO') {
            return <div className="p-6"><VillageExecutiveView parcels={parcels} alerts={alerts} patchAlertStatus={patchAlertStatus} /></div>;
         }
         return <ApprovalsHubView user={user} alerts={alerts} patchAlertStatus={patchAlertStatus} />;
      }
      if (activeTab === 'grievances') return (
         <OperationalListView 
            title="Public Grievance Matrix" 
            icon={MessageSquare} 
            columns={['Source', 'Subject', 'Priority', 'Status']} 
            data={[
               { s: 'Citizen Portal', t: 'Encroachment Survey Request', p: 'HIGH', st: 'PENDING' },
               { s: 'Collectorate Mail', t: 'Patta Correction Appeal', p: 'MEDIUM', st: 'IN_REVIEW' },
               { s: 'Help Desk', t: 'Boundary Marking Query', p: 'LOW', st: 'ASSIGNED' }
            ]}
         />
      );
      if (activeTab === 'directives') return (
         <OperationalListView 
            title="Village Executive Directives" 
            icon={Zap} 
            columns={['Order ID', 'Subject', 'Issue Date', 'Priority']} 
            data={[
               { id: 'ORD-2026-101', s: 'Emergency Flood Plain Survey', d: '22 APR 2026', p: 'CRITICAL' },
               { id: 'ORD-2026-102', s: 'Public Land Inventory Update', d: '15 APR 2026', p: 'HIGH' },
               { id: 'ORD-2026-103', s: 'Enforcement Protocol Training', d: '10 APR 2026', p: 'ROUTINE' }
            ]}
         />
      );
      if (activeTab === 'audit') return (
          <OperationalListView
             title="System Audit Trail"
             icon={History}
             columns={['Timestamp', 'User Node', 'Action Protocol', 'Entity Identity', 'Hash Status']}
             data={[
                { time: '10:42:01', user: 'Collector_HQ', action: 'EVICTION_ORDER_ISSUE', entity: 'Survey 142/A', status: 'VERIFIED' },
                { time: '09:15:22', user: 'AI_Sim_Node', action: 'NEW_DETECTION', entity: 'Salem West 44/1', status: 'PENDING' },
                { time: '08:44:10', user: 'Tahsildar_SW', action: 'FIELD_VERIFY_START', entity: 'Survey 88/4', status: 'IN_PROGRESS' },
                { time: '07:22:55', user: 'Admin_Master', action: 'USER_LOGIN', entity: 'Officer_Login_Hub', status: 'SUCCESS' },
                { time: '06:10:12', user: 'System_Cron', action: 'DATABASE_BACKUP', entity: 'PostGIS_Main', status: 'COMPLETED' }
             ]}
          />
       );
      if (activeTab === 'enforcement') return <EnforcementTrackingView alerts={alerts} user={user} />;
      if (activeTab === 'settings') return <SettingsView />;
      if (activeTab === 'legal') return <LegalCoordinationView alerts={alerts} />;
      if (activeTab === 'ai-monitoring' && user.role === 'ADMIN') return <AdminAIDetectionView alerts={alerts} />;
      if (activeTab === 'analytics' && user.role === 'COLLECTOR') return <CollectorAnalyticsView alerts={alerts} />;
      if (activeTab === 'system-config' && user.role === 'ADMIN') return <FormView title="Advanced System Configuration" icon={Settings} fields={[{ label: 'Satellite Source', placeholder: 'Sentinel-2 / DigitalGlobe' }, { label: 'AI Model Version', placeholder: 'EncroachNet v4.2' }, { label: 'Audit Granularity', placeholder: 'Level 5 (Full Trace)' }]} />;
      if (activeTab === 'strategic-tools' && user.role === 'COLLECTOR') return <OperationalListView title="Strategic Tools Suite" icon={Briefcase} columns={['Tool Name', 'Level', 'Status']} data={[{ n: 'Risk Simulator', l: 'District', s: 'Operational' }, { n: 'Budget Allocator', l: 'District', s: 'Active' }]} />;

      // Admin Specialized Views
      if (activeTab === 'database' && user.role === 'ADMIN') return <OperationalListView title="Database Infrastructure Hub" icon={Database} columns={['Node Name', 'Engine', 'Health', 'Usage']} data={[{ n: 'PostGIS_Primary', e: 'PostgreSQL 15', h: 'Healthy', u: '42%' }, { n: 'Redis_Cache', e: 'Redis 7.0', h: 'Active', u: '12%' }, { n: 'Vector_Store', e: 'Pinecone', h: 'Online', u: '8%' }]} />;
      if (activeTab === 'api-sync' && user.role === 'ADMIN') return <OperationalListView title="External API Node Sync" icon={Link} columns={['External Agency', 'Protocol', 'Status', 'Last Sync']} data={[{ n: 'TNGIS Central', p: 'REST/OAuth2', s: 'Connected', l: '2m ago' }, { n: 'Revenue Master', p: 'SOAP/XML', s: 'Connected', l: '10m ago' }, { n: 'Survey Node Hub', p: 'GraphQL', s: 'Standby', l: '1h ago' }]} />;
      if (activeTab === 'storage' && user.role === 'ADMIN') return <OperationalListView title="Cloud Storage Metrics" icon={Cloud} columns={['Bucket Identity', 'Region', 'Class', 'Used Space']} data={[{ n: 'Evidence-Vault', r: 'ap-south-1', c: 'Standard', u: '1.2 TB' }, { n: 'Sat-Imagery-Archive', r: 'ap-south-1', c: 'Coldline', u: '14.8 TB' }, { n: 'Model-Weights', r: 'ap-south-1', c: 'Nearline', u: '450 GB' }]} />;
      if (activeTab === 'security' && user.role === 'ADMIN') return <FormView title="Global Security & RBAC" icon={Lock} fields={[{ label: 'Encryption Protocol', placeholder: 'AES-256 (Default)' }, { label: 'Session Timeout (min)', placeholder: '30' }, { label: 'Multi-Factor Auth', placeholder: 'Enabled' }, { label: 'RBAC Depth', placeholder: 'Level 5 (Full)' }]} />;
      if (activeTab === 'threats' && user.role === 'ADMIN') return <OperationalListView title="Security Threat Registry" icon={ShieldAlert} columns={['Timestamp', 'Event Type', 'Source IP', 'Action Taken']} data={[{ t: '16:42:01', e: 'Brute Force Attempt', s: '103.44.22.11', a: 'IP_BLOCKED' }, { t: '14:15:22', e: 'Unauthorized API Access', s: 'Admin_Node_02', a: 'TOKEN_REVOKED' }, { t: '09:12:44', e: 'Unusual Data Export', s: 'VAO_Mettur', a: 'LOGGED' }]} />;
      if (activeTab === 'satellites' && user.role === 'ADMIN') return <OperationalListView title="Satellite Data Sources" icon={Globe} columns={['Provider', 'Resolution', 'Update Frequency', 'Status']} data={[{ p: 'Sentinel-2', r: '10m', u: '5 Days', s: 'Active' }, { p: 'DigitalGlobe', r: '0.3m', u: 'On-Demand', s: 'Ready' }, { p: 'LandSat 9', r: '30m', u: '8 Days', s: 'Standby' }]} />;
      if (activeTab === 'liaison' && user.role === 'ADMIN') return <OperationalListView title="Inter-Agency Liaison Matrix" icon={Briefcase} columns={['Department', 'Node Head', 'Priority Channel', 'Status']} data={[{ d: 'Police HQ', n: 'SP Salem', p: 'Secure_Line_01', s: 'Connected' }, { d: 'Forest Dept', n: 'DFO Salem', p: 'Radio_Node_4', s: 'Active' }, { d: 'Highways Dept', n: 'EE Highways', p: 'Email/Official', s: 'Standby' }]} />;
      
      if (activeTab === 'gis-sentinel') return <div className="p-6"><DistrictMapView parcels={parcels} alerts={alerts} onExport={handleExport} onMapClick={handleMapClick} selectedPosition={selectedPosition} /></div>;

      if (activeTab === 'dashboard') {
         if (user.role === 'COLLECTOR') return <CollectorExecutiveView parcels={parcels} alerts={alerts} patchAlertStatus={patchAlertStatus} onTabChange={setActiveTab} />;
         if (user.role === 'TAHSILDAR') return <TalukExecutiveView parcels={parcels} alerts={alerts} patchAlertStatus={patchAlertStatus} onTabChange={setActiveTab} />;
         if (user.role === 'VAO') return <VillageExecutiveView parcels={parcels} alerts={alerts} patchAlertStatus={patchAlertStatus} />;
         if (user.role === 'INSPECTOR') return <div className="p-6"><InspectorDashboardView parcels={parcels} alerts={alerts} onTabChange={setActiveTab} /></div>;
         return <DashboardView parcels={parcels} alerts={alerts} setAlerts={setAlerts} onExport={handleExport} onMapClick={handleMapClick} gisAttributes={gisAttributes} selectedPosition={selectedPosition} onTabChange={setActiveTab} />;
      }

      if (activeTab === 'map') {
         if (user.role === 'VAO') return <VillageMapHubView parcels={parcels} alerts={alerts} />;
         return <DistrictMapView parcels={parcels} alerts={alerts} onExport={handleExport} onMapClick={handleMapClick} selectedPosition={selectedPosition} />;
      }

      if (activeTab.includes('overview') || activeTab.includes('view') || activeTab.includes('zoning')) return <DashboardView parcels={parcels} alerts={alerts} setAlerts={setAlerts} onExport={handleExport} onMapClick={handleMapClick} gisAttributes={gisAttributes} selectedPosition={selectedPosition} onTabChange={setActiveTab} />;

      // Operational Lists
      if (activeTab === 'users') return <OperationalListView title="Officer Management Matrix" icon={Users} onActionClick={() => setSubView('onboard')} columns={['Officer Identity', 'Department', 'Access Level', 'Operational Status']} data={[{ n: 'Rajesh Kumar', r: 'Salem West', a: 'Level 4', s: 'Active' }, { n: 'S. Priya', r: 'Mettur Node', a: 'Level 3', s: 'In Field' }, { n: 'M. Karthik', r: 'Taluk-HQ', a: 'Level 5', s: 'Standby' }]} actionLabel="Onboard Officer" />;
      if (activeTab === 'logs') return <OperationalListView title="Tactical Audit Trail" icon={History} columns={['Timestamp', 'Identity', 'Operational Event', 'Outcome']} data={[{ t: '12:44:01', u: 'ADMIN-NODE', a: 'Security Protocol Update', s: 'Success' }, { t: '10:12:44', u: 'VAO-Mettur', a: 'Land Record Access', s: 'Logged' }, { t: '09:42:00', u: 'AI-Engine', a: 'Auto-Detection Sync', s: 'Verified' }]} />;
      if (activeTab === 'parcels' || activeTab === 'records' || activeTab === 'add' || activeTab === 'edit' || activeTab === 'public-records' || activeTab === 'field-reports') return <OperationalListView title="Land Records & Registry" icon={FileText} columns={['Survey No', 'Patta', 'Ownership', 'Status']} data={[{ s: '142/A', p: 'P-882', o: 'Anbazhagan', st: 'Verified' }, { s: '88/4', p: 'P-901', o: 'Kavitha', st: 'Active Alert' }]} actionLabel="New Registry" />;
      if (activeTab === 'cases' || activeTab === 'notices' || activeTab === 'tracking' || activeTab === 'grievances') return <OperationalListView title="Public Grievances & Cases" icon={MessageSquare} columns={['Source', 'Subject', 'Department', 'Status']} data={[{ id: 'CM-901', t: 'Land Dispute - Omalur', o: 'Revenue-Salem', s: 'High Priority' }, { id: 'COURT-22', t: 'Stay Order Review', o: 'Legal-Node', s: 'Pending' }]} />;
      if (activeTab === 'survey-tasks') return <OperationalListView title="Operational Tasking" icon={ClipboardCheck} columns={['Task ID', 'Village', 'Directive', 'Deadline']} data={[{ id: 'T-441', v: 'Omalur', s: 'Physical Verification', d: 'Today' }]} />;
      if (activeTab === 'directives') return <FormView title="Strategic Action Directive" icon={Zap} fields={[{ label: 'Target Taluk', placeholder: 'e.g. Salem West' }, { label: 'Directive Code', placeholder: 'e.g. EVICTION-44' }, { label: 'Immediate Action Required', placeholder: 'Details of the order...' }]} />;

      if (activeTab === 'approvals') {
         return <ApprovalsHubView user={user} alerts={alerts} setAlerts={setAlerts} registryRequests={registryRequests} onRegistryAction={handleRegistryAction} />;
      }

      return <DashboardView parcels={parcels} alerts={alerts} setAlerts={setAlerts} onExport={handleExport} onMapClick={handleMapClick} gisAttributes={gisAttributes} onTabChange={setActiveTab} />;
   };

   if (!user) {
      return (
         <div className="h-screen w-full flex items-center justify-center bg-slate-100 font-jakarta p-4 sm:p-6 overflow-hidden">
            <div className="w-full max-w-[1000px] flex flex-col md:flex-row h-full md:h-[650px] bg-white rounded-none shadow-xl border border-slate-200 overflow-hidden overflow-y-auto custom-scrollbar text-left">
               <div className="w-full md:w-[35%] p-8 sm:p-12 flex flex-col justify-center border-b md:border-b-0 md:border-r border-slate-100 bg-slate-50 shrink-0">
                  <div className="mb-6 md:mb-10">
                     <div className="bg-blue-600 w-12 h-12 rounded-none text-white flex items-center justify-center shadow-lg mb-4 md:mb-6"><ShieldAlert size={28} /></div>
                     <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 uppercase leading-none">GEOMMAND</h2>
                     <p className="text-slate-500 text-[9px] md:text-[10px] font-bold mt-2 uppercase tracking-widest">Government of Tamil Nadu</p>
                  </div>
                  <div className="space-y-3 md:space-y-4">
                     <input type="email" placeholder="Officer Identity" className="w-full bg-white border border-slate-200 rounded-none px-4 py-3 text-sm focus:border-blue-500 transition-all outline-none" />
                     <input type="password" placeholder="Security Key" className="w-full bg-white border border-slate-200 rounded-none px-4 py-3 text-sm focus:border-blue-500 transition-all shadow-sm outline-none" />
                     <button onClick={() => handleDemoLogin('ADMIN')} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 md:py-4 rounded-none font-bold shadow-md transition-all active:scale-[0.98] mt-2 md:mt-4 flex items-center justify-center gap-2 text-[10px] md:text-xs uppercase tracking-widest">Sign In</button>
                  </div>
               </div>
               <div className="flex-1 bg-white p-6 sm:p-12 flex flex-col min-h-[400px]">
                  <div className="mb-6 md:mb-8"><h2 className="text-lg md:text-xl font-bold text-slate-800 uppercase text-center tracking-tight">Administrative Portals</h2></div>
                  <div className="flex justify-center gap-1 mb-6 md:mb-8 bg-slate-100 p-1 rounded-none w-fit mx-auto border border-slate-200 flex-wrap">
                     {CATEGORIES.map(cat => (
                        <button key={cat} onClick={() => setLoginCat(cat)} className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-none text-[9px] sm:text-[10px] font-bold uppercase tracking-widest transition-all ${loginCat === cat ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-white hover:shadow-sm'}`}>{cat}</button>
                     ))}
                  </div>
                  <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                        {Object.entries(ROLES).filter(([_, r]) => r.cat === loginCat).map(([id, role]) => (
                           <button key={id} onClick={() => handleDemoLogin(id)} className="p-3 sm:p-4 bg-white border border-slate-200 rounded-none hover:border-blue-500 hover:bg-blue-50 transition-all group flex items-center gap-3 sm:gap-4 shadow-sm text-left">
                              <div className={`p-1.5 sm:p-2 rounded-none bg-white border border-slate-100 ${role.color} group-hover:scale-110 transition-transform shrink-0`}><role.icon size={16} /></div>
                              <p className="font-bold text-slate-800 text-[10px] sm:text-xs tracking-tight uppercase truncate flex-1">{role.name}</p>
                              <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-500 shrink-0" />
                           </button>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
         </div>
      );
   }

   return (
      <>
         <div className="flex h-screen bg-slate-100 font-jakarta text-sm antialiased text-slate-800 relative overflow-hidden">
         {/* Mobile Sidebar Overlay */}
         {isSidebarOpen && (
            <div className="fixed inset-0 bg-slate-900/40 z-[1900] lg:hidden backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsSidebarOpen(false)}></div>
         )}

         {/* Sidebar */}
         <aside className={`fixed inset-y-0 left-0 lg:static w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 z-[2000] shadow-sm transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
            <div className="p-6 flex items-center justify-between border-b border-slate-100">
               <div className="flex items-center gap-3" onClick={() => setActiveTab('dashboard')} style={{ cursor: 'pointer' }}>
                  <div className="bg-blue-600 p-2 rounded-none text-white shadow-md"><ShieldAlert size={20} /></div>
                  <div>
                     <h1 className="font-extrabold text-sm tracking-tighter text-slate-900 uppercase">GEOMMAND</h1>
                     <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Salem District</p>
                  </div>
               </div>
               <button className="lg:hidden p-1 text-slate-400 hover:text-slate-800" onClick={() => setIsSidebarOpen(false)}><X size={20} /></button>
            </div>
            <nav className="flex-1 overflow-y-auto custom-scrollbar pb-10">
                {MENU_STRUCTURE[user.role].map((item, idx) => {
                   let dynamicBadge = item.badge;
                   if (user.role === 'INSPECTOR' && item.id === 'tasks') {
                      const missionCount = alerts.filter(a => (a.status === 'COLLECTOR_ACCEPTED' || a.status === 'TAHSILDAR_ACCEPTED')).length;
                      if (missionCount > 0) dynamicBadge = missionCount.toString();
                   } else if (user.role === 'TAHSILDAR' && item.id === 'alerts') {
                      const tCount = alerts.filter(a => ['COLLECTOR_ACCEPTED', 'NEW'].includes((a.status || '').toUpperCase())).length;
                      if (tCount > 0) dynamicBadge = tCount.toString();
                   } else if (user.role === 'TAHSILDAR' && item.id === 'approvals') {
                      const rCount = registryRequests.filter(r => r.status === 'PENDING_TAHSILDAR').length;
                      if (rCount > 0) dynamicBadge = rCount.toString();
                   } else if (user.role === 'COLLECTOR' && item.id === 'alerts') {
                      const cCount = alerts.filter(a => a.status === 'NEW' || a.status === 'PENDING').length;
                      if (cCount > 0) dynamicBadge = cCount.toString();
                   }

                   return item.type === 'header' ? (
                       <p key={idx} className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-8 mb-3 px-6">{item.label}</p>
                    ) : (
                       <button key={item.id} onClick={() => { setActiveTab(item.id); setSubView(null); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-6 py-3.5 transition-all duration-200 group relative ${activeTab === item.id ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-100 z-10' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
                          <div className={`w-6 flex justify-center ${activeTab === item.id ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'}`}>
                             <item.icon size={18} />
                          </div>
                          <span className="flex-1 text-left text-[11px] font-bold uppercase tracking-wider">{item.label}</span>
                          {dynamicBadge && <span className={`${activeTab === item.id ? 'bg-white text-blue-600' : 'bg-blue-600 text-white'} text-[8px] font-black px-1.5 py-0.5 rounded-none shadow-sm`}>{dynamicBadge}</span>}
                          {activeTab === item.id && <div className="absolute inset-y-0 left-0 w-1.5 bg-white"></div>}
                       </button>
                    );
                })}
            </nav>
            <div className="p-4 border-t border-slate-100 mt-auto bg-slate-50">
               <div className="flex items-center gap-3 mb-4 px-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-none flex items-center justify-center text-white font-bold text-xs shadow-sm">{user.avatar}</div>
                  <div className="flex-1 min-w-0">
                     <p className="text-xs font-bold text-slate-800 truncate uppercase">{user.name.split(' ')[0]}</p>
                     <p className="text-[9px] font-medium text-slate-500 uppercase">{user.role}</p>
                  </div>
               </div>
               <button onClick={() => setUser(null)} className="w-full flex items-center justify-center gap-2 py-2.5 bg-white border border-slate-200 rounded-none text-slate-500 hover:text-red-600 transition-all font-bold text-[10px] uppercase shadow-sm group">
                  <LogOut size={14} /><span>Sign Out</span>
               </button>
            </div>
         </aside>

         <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-100">
            <header className="h-16 px-4 sm:px-8 flex items-center justify-between z-40 border-b border-slate-200 bg-white shadow-sm">
               <div className="flex items-center gap-4 sm:gap-6">
                  <button className="lg:hidden p-2 -ml-2 text-slate-600" onClick={() => setIsSidebarOpen(true)}><Menu size={24} /></button>
                  <div className="hidden sm:flex items-center gap-2">
                     <Clock size={16} className="text-blue-600" />
                     <span className="text-[11px] font-black text-slate-800 tracking-wider">
                        {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                     </span>
                  </div>
                  <div className="hidden sm:block w-px h-6 bg-slate-100"></div>
                  <h2 className="text-[10px] sm:text-xs font-bold text-slate-800 uppercase tracking-widest truncate max-w-[100px] sm:max-w-none">{subView ? `${activeTab} > ${subView}` : activeTab}</h2>
                  <div className="hidden xs:flex gap-1 sm:gap-2"><Badge variant="info">Secure</Badge><Badge variant="success">Live</Badge></div>
               </div>
               <div className="flex items-center gap-3 sm:gap-6">
                  <div className="flex items-center gap-2">
                     <button onClick={() => setLang(lang === 'EN' ? 'தமிழ்' : 'EN')} className="px-2 sm:px-3 py-1.5 sm:py-2 bg-slate-50 border border-slate-200 rounded-none text-[9px] sm:text-[10px] font-black text-blue-600 uppercase tracking-widest">{lang}</button>
                     <div className="hidden sm:block w-px h-6 bg-slate-200 mx-2"></div>
                     <button onClick={() => setActiveTab('profile')} className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-none text-[9px] sm:text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-1 sm:gap-2 ${activeTab === 'profile' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}><Users size={14} /><span className="hidden sm:inline">Profile</span></button>
                  </div>
                  <button onClick={() => setIsNotifOpen(true)} className="p-2 text-slate-500 hover:text-blue-600 transition-all relative">
                     <Bell size={20} />
                     <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-600 rounded-full border border-white animate-pulse text-[6px] font-black flex items-center justify-center text-white">
                     </span>
                  </button>
               </div>
            </header>

            <div className="flex-1 overflow-y-auto p-1 sm:p-2 scroll-smooth bg-slate-100 custom-scrollbar">
               {renderActiveView()}
            </div>
         </main>
      </div>
         <NotificationCenterPanel
            isOpen={isNotifOpen}
            onClose={() => setIsNotifOpen(false)}
            alerts={alerts}
            registryRequests={registryRequests}
            onNavigate={(tab) => { setActiveTab(tab); setSubView(null); }}
         />
      </>
   );
}

