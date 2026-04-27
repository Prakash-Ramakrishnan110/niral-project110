import React, { useState, useEffect, useCallback, useMemo } from 'react';
import MapView from './components/Map';
import {
   ShieldAlert, LayoutDashboard, Map as MapIcon, AlertTriangle, Gavel, FileText, Settings, Bell, LogOut, Search,
   AlertCircle, Navigation, Download, Filter, CheckCircle2, Globe, Cpu, History, Users, Layers, Terminal, RefreshCcw,
   Activity, BarChart3, Scale, ClipboardCheck, CheckSquare, MapPin, Lock, BookOpen, PieChart, HardHat, Monitor, Cloud,
   HeartPulse, Key, MessageSquare, Camera, ChevronRight, ChevronLeft, Clock, MoreVertical, PlusCircle, UserPlus, TrendingUp, Zap,
   Briefcase, Landmark, Book, HelpCircle, UserCheck, Image, ShieldCheck, Database, Link, Menu, X, Trash2, Eye, Shield, Award,
   Truck, Target
} from 'lucide-react';
import axios from 'axios';
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
      { type: 'header', label: 'Administration' },
      { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { id: 'users', icon: Users, label: 'User Management' },
      { id: 'health', icon: HeartPulse, label: 'System Health' },
      { id: 'ai-monitoring', icon: Cpu, label: 'AI Monitoring' },
      { id: 'logs', icon: History, label: 'Audit Logs' },
      { id: 'reports', icon: BarChart3, label: 'Strategic Reports' },
      { id: 'settings', icon: Settings, label: 'Global Settings' },
   ],
   TAHSILDAR: [
      { type: 'header', label: 'Taluk Command Center' },
      { id: 'dashboard', icon: LayoutDashboard, label: 'Taluk Intelligence' },
      { id: 'map', icon: Globe, label: 'GIS Zoning Matrix' },
      { id: 'alerts', icon: AlertTriangle, label: 'Tactical Threat Queue', badge: '12' },
      { id: 'approvals', icon: CheckSquare, label: 'Registry Approvals' },
      { id: 'users', icon: Users, label: 'Field Coordination' },
      { id: 'analytics', icon: BarChart3, label: 'Taluk Analytics' },
      { id: 'settings', icon: Settings, label: 'Command Settings' },
   ],
    COLLECTOR: [
       { type: 'header', label: 'Collector Panel' },
       { id: 'dashboard', icon: LayoutDashboard, label: 'Executive Hub' },
       { id: 'map', icon: Globe, label: 'District Audit Matrix' },
       { id: 'enforcement', icon: Activity, label: 'Work Monitoring', badge: 'ACTIVE' },
       { id: 'alerts', icon: AlertTriangle, label: 'AI Detection Queue', badge: 'CRITICAL' },
       { id: 'reports', icon: FileText, label: 'Strategic Reports' },
       { id: 'approvals', icon: CheckSquare, label: 'Authorizations' },
       { id: 'analytics', icon: BarChart3, label: 'Operational Analytics' },
       { id: 'audit', icon: History, label: 'System Audit' },
       { id: 'settings', icon: Settings, label: 'Node Settings' },
    ],
   VAO: [
      { type: 'header', label: 'Village Administration' },
      { id: 'dashboard', icon: LayoutDashboard, label: 'Village Dashboard' },
      { id: 'parcels', icon: FileText, label: 'Land Registry (Adangal)' },
      { id: 'tasks', icon: ClipboardCheck, label: 'Field Verifications' },
      { id: 'alerts', icon: AlertTriangle, label: 'Encroachment Alerts', badge: '2' },
      { id: 'grievances', icon: MessageSquare, label: 'Public Grievances' },
      { id: 'map', icon: Globe, label: 'Village Map' },
      { id: 'settings', icon: Settings, label: 'Profile Settings' },
   ],
   INSPECTOR: [
      { type: 'header', label: 'Field Operations' },
      { id: 'dashboard', icon: LayoutDashboard, label: 'Inspector Dashboard' },
      { id: 'tasks', icon: ClipboardCheck, label: 'Assigned Surveys', badge: '3' },
      { id: 'map', icon: Navigation, label: 'Field Navigation' },
      { id: 'camera', icon: Camera, label: 'Evidence Capture' },
      { id: 'field-reports', icon: FileText, label: 'Submit Reports' },
      { id: 'settings', icon: Settings, label: 'Profile' },
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
   return <span className={`px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-wider ${styles[variant] || styles.info} ${className}`}>{children}</span>;
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
                           <img src={currentAlert.img || img1} className="w-full h-full object-cover grayscale brightness-90 hover:grayscale-0 transition-all" alt="Recon" />
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
   <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col h-full animate-in fade-in duration-300">
      {(title || Icon) && (
         <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
               {Icon && <div className="p-2 bg-slate-50 text-blue-600 rounded-lg"><Icon size={18} /></div>}
               {title && <h3 className="font-bold text-slate-800 uppercase text-[10px] tracking-widest">{title}</h3>}
            </div>
            {badge && <Badge variant={badge.variant}>{badge.text}</Badge>}
         </div>
      )}
      <div className="flex-1">{children}</div>
   </div>
);

const ProgressBar = ({ progress, color = 'bg-blue-600' }) => (
   <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
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
            <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
               <div className={`p-3 rounded-xl bg-slate-50 ${k.c}`}><k.i size={20} /></div>
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
                           <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-all font-black">{d.v}%</div>
                           <div className={`${d.c} w-full rounded-t-xl transition-all duration-700`} style={{ height: `${d.v * 1.8}px` }}></div>
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
                           <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                              <div className={`h-full ${item.c}`} style={{ width: `${item.v}%` }}></div>
                           </div>
                        </div>
                     ))}
                  </div>
               </Card>
               <Card title="Monthly Resolution Speed" icon={Clock}>
                  <div className="flex flex-col items-center justify-center py-6">
                     <div className="w-32 h-32 rounded-full border-[10px] border-slate-50 relative flex items-center justify-center">
                        <div className="absolute inset-0 rounded-full border-[10px] border-indigo-600 border-r-transparent border-b-transparent animate-spin-slow"></div>
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
                     <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex justify-between items-center mb-3">
                           <span className="text-[10px] font-black text-slate-800 uppercase">{t.n}</span>
                           <Badge variant={t.r === 'HIGH' ? 'danger' : 'info'}>{t.r}</Badge>
                        </div>
                        <div className="flex items-center gap-3">
                           <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden"><div className={`h-full ${t.c.replace('text', 'bg')}`} style={{ width: `${t.l}%` }}></div></div>
                           <span className={`text-[10px] font-black ${t.c}`}>{t.l}%</span>
                        </div>
                     </div>
                  ))}
               </div>
            </Card>

            <div className="bg-slate-900 rounded-3xl p-6 text-white text-center shadow-xl shadow-slate-200">
               <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4"><Download size={24} /></div>
               <h5 className="text-[11px] font-black uppercase tracking-widest mb-2">Quarterly Report</h5>
               <p className="text-[9px] text-slate-400 font-bold uppercase mb-6 leading-relaxed">Full district spatial audit for Q1 2026 is ready for download.</p>
               <button className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">Export PDF Audit</button>
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
                     <div key={i} className="flex-1 bg-blue-100 rounded-t-sm animate-in slide-in-from-bottom duration-500" style={{ height: `${h}%`, animationDelay: `${i * 50}ms` }}></div>
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
                     <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">{n.n}</span>
                        <div className="flex items-center gap-4">
                           <div className="h-1 w-24 bg-slate-200 rounded-full overflow-hidden"><div className="h-full bg-blue-600" style={{ width: n.s === 'LAG' ? '80%' : '20%' }}></div></div>
                           <span className={`text-[9px] font-black ${n.s === 'LAG' ? 'text-orange-500' : 'text-green-600'}`}>{n.l}</span>
                        </div>
                     </div>
                  ))}
               </div>
            </Card>
            <Card title="Service Health Matrix" icon={ShieldCheck}>
               <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {['Database', 'Auth Node', 'GIS Engine', 'AI Pipeline', 'GeoServer', 'API Gateway', 'CDN Node', 'Audit Engine', 'Search'].map((s, i) => (
                     <div key={i} className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
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
                  <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-green-600 mx-auto mb-4 border-4 border-white shadow-sm"><Shield size={32} /></div>
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
               <div key={i} className={`flex-1 rounded-sm ${i === 12 || i === 40 ? 'bg-orange-400' : 'bg-green-500'}`} title={`Hour ${i}: 99.9%`}></div>
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
                  <span className="text-[10px] bg-blue-600 text-white px-3 py-1 rounded-full not-italic tracking-[0.3em] font-black shadow-lg shadow-blue-200">SECURE_CHANNEL</span>
               </h2>
               <div className="flex items-center gap-3 mt-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-ping"></div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.4em]">Active Field Synchronization · {evidenceItems.length} Tactical Records</p>
               </div>
            </div>
            <div className="flex bg-slate-900 p-2 rounded-[2rem] shadow-2xl border border-white/10">
               <button className="px-8 py-4 bg-blue-600 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.3em] hover:bg-blue-500 transition-all flex items-center gap-3 shadow-xl group">
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
                              className={`group relative rounded-3xl overflow-hidden border-2 cursor-pointer transition-all duration-500 bg-white shadow-sm hover:shadow-2xl hover:-translate-y-2 ${selectedEvidence?.id === alert.id ? 'border-blue-600 neon-glow ring-8 ring-blue-50/50' : 'border-slate-100'}`}
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
                                    <div className="bg-blue-600 text-white text-[7px] font-black px-2 py-1 rounded-sm tracking-[0.2em] uppercase">Secured</div>
                                    <div className="bg-black/60 backdrop-blur-md text-white text-[7px] font-black px-2 py-1 rounded-sm tracking-[0.2em] uppercase border border-white/10">TN-RECON</div>
                                 </div>

                                 {/* Confidence Meter */}
                                 <div className="absolute bottom-4 left-4 right-4">
                                    <div className="flex justify-between items-end mb-1">
                                       <p className="text-[7px] font-black text-white/70 uppercase tracking-widest italic">Match_Confidence</p>
                                       <p className="text-[10px] font-black text-blue-400 italic">{(alert.confidence_score * 100).toFixed(0)}%</p>
                                    </div>
                                    <div className="h-[2px] bg-white/20 rounded-full overflow-hidden">
                                       <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${alert.confidence_score * 100}%` }}></div>
                                    </div>
                                 </div>
                              </div>

                              {/* Detailed Intel Footer */}
                              <div className="p-5">
                                 <div className="flex items-center gap-3 mb-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 ${selectedEvidence?.id === alert.id ? 'bg-blue-600 border-blue-400 text-white animate-pulse' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
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
                  <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl border border-slate-100 sticky top-6 animate-in slide-in-from-right-10 duration-700">
                     <div className="flex justify-between items-center mb-8">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-blue-600 border border-slate-100"><Layers size={20} /></div>
                           <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Intelligence_Record</p>
                        </div>
                        <button onClick={() => setSelectedEvidence(null)} className="text-slate-300 hover:text-red-500 transition-all"><X size={20} /></button>
                     </div>

                     <div className="rounded-3xl overflow-hidden shadow-xl mb-8 group relative">
                        <img src={selectedEvidence.img} className="w-full object-cover aspect-square grayscale hover:grayscale-0 transition-all duration-700" />
                        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
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
                              { l: 'Survey Coordinate', v: `Section ${selectedEvidence.parcel_details}`, i: Target },
                              { l: 'Geo-spatial Lock', v: `${selectedEvidence.position[0].toFixed(4)}° N, ${selectedEvidence.position[1].toFixed(4)}° E`, i: Navigation },
                              { l: 'AI Match Accuracy', v: `${(selectedEvidence.confidence_score * 100).toFixed(1)}% Confidence`, i: Cpu },
                              { l: 'Security Hash', v: 'TN-GEOM-882X-ALPHA', i: Lock }
                           ].map((item, i) => (
                              <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-100 transition-all group">
                                 <div className="p-2 bg-white rounded-lg text-slate-400 group-hover:text-blue-600 transition-all shadow-sm"><item.i size={14} /></div>
                                 <div>
                                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">{item.l}</p>
                                    <p className="text-[10px] font-black text-slate-800">{item.v}</p>
                                 </div>
                              </div>
                           ))}
                        </div>

                        {/* Tactical Analysis Suite */}
                        <div className="p-5 bg-slate-900 rounded-[2rem] text-white space-y-4 shadow-xl border border-white/5">
                           <div className="flex justify-between items-center">
                              <p className="text-[8px] font-black uppercase tracking-widest text-blue-400">Tactical Analysis</p>
                              <div className="flex gap-1">
                                 {[1,2,3,4,5].map(x => <div key={x} className="w-1 h-1 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: `${x*200}ms`}}></div>)}
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
                           <button className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-blue-700 transition-all">Submit Evidence</button>
                           <button className="p-4 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-all"><Download size={18} /></button>
                        </div>
                     </div>
                </div>
             ) : (
                  <div className="bg-slate-50 rounded-[2.5rem] h-[500px] flex flex-col items-center justify-center p-12 text-center border-4 border-dotted border-slate-200">
                     <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-2xl mb-8 text-slate-200 animate-pulse"><Monitor size={40} /></div>
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

   const activeDetections = alerts.filter(a => a.status !== 'RESOLVED' && a.status !== 'Resolved');

   const filteredDetections = alerts.filter(a => {
      if (filterStatus === 'ACTIVE') return a.status !== 'RESOLVED' && a.status !== 'Resolved';
      if (filterStatus === 'RESOLVED') return a.status === 'RESOLVED' || a.status === 'Resolved';
      return true; // 'ALL'
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
               <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                  <div className="flex justify-between items-start mb-4">
                     <div className={`p-3 rounded-lg ${kpi.bg} ${kpi.c}`}><kpi.i size={20} /></div>
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
               <div className="bg-white border border-slate-200 rounded-xl shadow-sm h-[600px] overflow-hidden relative">
                  <div className="absolute top-6 left-6 z-[1000] flex gap-2">
                     <Badge variant="info" className="bg-white/95 backdrop-blur shadow-lg border-slate-200 text-slate-900 rounded-lg">AI LIVE GIS STREAM</Badge>
                     <div className="flex items-center gap-2 px-3 py-1 bg-green-500/90 backdrop-blur rounded-lg text-[8px] font-black text-white uppercase tracking-widest shadow-lg animate-pulse">● Node Active</div>
                  </div>
                  <MapView 
                     parcels={parcels} 
                     alerts={alerts} 
                     onParcelClick={() => {}} 
                     onMapClick={onMapClick} 
                     selectedPosition={selectedPosition} 
                  />
                  
                  {/* Floating Action Overlay */}
                  <div className="absolute bottom-6 left-6 right-6 z-[1000] flex justify-between items-end">
                     <div className="p-4 bg-white/95 backdrop-blur-md rounded-xl border border-slate-200 shadow-2xl min-w-[200px]">
                        <p className="text-[9px] font-black text-slate-900 uppercase tracking-widest mb-2 flex items-center gap-2"><MapPin size={10} className="text-blue-600" /> View: {selectedDistrict}</p>
                        <div className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div><span className="text-[8px] font-bold text-slate-500 uppercase">Detection Hotspot</span></div>
                     </div>
                  </div>
               </div>
            </div>

            {/* Right Side: Detection Intelligence Stream */}
            <div className="col-span-12 lg:col-span-4 space-y-6">
               <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col h-[600px] overflow-hidden">
                  <div className="p-6 border-b border-slate-100 bg-white">
                     <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2"><Cpu size={14} className="text-blue-600" /> Tactical Queue</h3>
                        <Badge variant="danger">{filteredDetections.length}</Badge>
                     </div>
                     <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                        {['ACTIVE', 'RESOLVED', 'ALL'].map(s => (
                           <button 
                              key={s} 
                              onClick={() => setFilterStatus(s)}
                              className={`flex-1 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${filterStatus === s ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
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
                           className="p-4 bg-white border border-slate-200 rounded-xl transition-all cursor-pointer group shadow-sm hover:border-blue-500 border-l-4 border-l-red-500"
                        >
                           <div className="flex items-center gap-4">
                              <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 border border-slate-100 shadow-inner">
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
                                 <button className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-all"><Eye size={14} /></button>
                                 <button className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-[8px] font-black uppercase tracking-widest shadow-md hover:bg-blue-700 transition-all">Review</button>
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
         </div>

         {/* Detailed Intelligence Command Card - Extended View */}
         {selectedAlert && (
            <div className="fixed inset-0 z-[5000] flex items-center justify-center p-6 animate-in fade-in duration-300">
               <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedAlert(null)}></div>
               <div className="bg-white w-full max-w-6xl rounded-none shadow-2xl relative z-[5001] overflow-hidden flex flex-col border border-slate-300">
                  {/* Header */}
                  <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white">
                     <div className="flex items-center gap-6">
                        <div className="p-4 bg-red-600 text-white"><AlertTriangle size={24} /></div>
                        <div>
                           <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-1">{selectedAlert.alert_type}</h2>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                              GIS-NODE: #TN-{selectedAlert.id.slice(0, 8)} | PRIORITY-ALPHA | LIVE
                           </p>
                        </div>
                     </div>
                     <button onClick={() => setSelectedAlert(null)} className="p-2 text-slate-400 hover:text-slate-900 transition-all"><X size={24} /></button>
                  </div>

                  {/* Modal Body */}
                  <div className="p-8 space-y-8 flex-1 overflow-hidden">
                     {/* Images Row - Single Primary Image */}
                     <div className="grid grid-cols-12 gap-4 h-[350px]">
                        <div className="col-span-12 border border-slate-200 bg-slate-900 relative overflow-hidden">
                           <img src={selectedAlert.img || img1} className="w-full h-full object-cover" />
                           <div className="absolute top-4 left-4 bg-black/60 px-4 py-2 text-[10px] font-black text-white uppercase tracking-[0.3em]">Official Surveillance Evidence</div>
                        </div>
                     </div>

                     {/* High-Density Info Cards */}
                     <div className="grid grid-cols-3 gap-6 h-[280px]">
                        {/* Section 1: Spatial Intelligence */}
                        <div className="space-y-3">
                           <h4 className="text-[9px] font-black text-blue-600 uppercase tracking-[0.2em]">Spatial Intelligence</h4>
                           <div className="grid grid-cols-1 gap-2">
                              {[
                                 { l: 'Area Coverage', v: '1.24 Hectares', s: 'Measured via GIS' },
                                 { l: 'Coordinates', v: `${selectedAlert.position?.[0]}, ${selectedAlert.position?.[1]}`, s: 'Lat/Long Lock' },
                                 { l: 'Zonal Category', v: 'Agricultural Buffer', s: 'Restricted Area' }
                              ].map((c, i) => (
                                 <div key={i} className="p-3 bg-slate-50 border border-slate-100">
                                    <p className="text-[8px] font-black text-slate-400 uppercase mb-0.5">{c.l}</p>
                                    <p className="text-xs font-black text-slate-900 uppercase">{c.v}</p>
                                    <p className="text-[7px] text-slate-400 font-bold uppercase mt-1">{c.s}</p>
                                 </div>
                              ))}
                           </div>
                        </div>

                        {/* Section 2: Ownership & Legal */}
                        <div className="space-y-3">
                           <h4 className="text-[9px] font-black text-indigo-600 uppercase tracking-[0.2em]">Ownership & Legal</h4>
                           <div className="grid grid-cols-1 gap-2">
                              {[
                                 { l: 'Survey / Sub-div', v: `${selectedAlert.parcel_details} / 2A`, s: 'Revenue Record' },
                                 { l: 'Patta Number', v: 'P-1442-2026', s: 'Verified Link' },
                                 { l: 'Occupant Status', v: 'Unauthorized', s: 'Legal Notice Pending' }
                              ].map((c, i) => (
                                 <div key={i} className="p-3 bg-slate-50 border border-slate-100">
                                    <p className="text-[8px] font-black text-slate-400 uppercase mb-0.5">{c.l}</p>
                                    <p className="text-xs font-black text-slate-900 uppercase">{c.v}</p>
                                    <p className="text-[7px] text-slate-400 font-bold uppercase mt-1">{c.s}</p>
                                 </div>
                              ))}
                           </div>
                        </div>

                        {/* Section 3: AI Diagnostics */}
                        <div className="space-y-3">
                           <h4 className="text-[9px] font-black text-red-600 uppercase tracking-[0.2em]">AI Diagnostics</h4>
                           <div className="grid grid-cols-1 gap-2">
                              {[
                                 { l: 'Confidence Score', v: `${(selectedAlert.confidence_score * 100).toFixed(2)}%`, s: '+/- 0.2% Variance' },
                                 { l: 'Model Version', v: 'Vision-TN v4.2', s: 'Neural Matrix' },
                                 { l: 'Detection Date', v: '27 APR 2026', s: '14:22:01 IST' }
                              ].map((c, i) => (
                                 <div key={i} className="p-3 bg-slate-50 border border-slate-100">
                                    <p className="text-[8px] font-black text-slate-400 uppercase mb-0.5">{c.l}</p>
                                    <p className="text-xs font-black text-slate-900 uppercase">{c.v}</p>
                                    <p className="text-[7px] text-slate-400 font-bold uppercase mt-1">{c.s}</p>
                                 </div>
                              ))}
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="p-8 border-t border-slate-100 flex gap-4">
                     <button className="flex-1 py-4 border-2 border-slate-900 text-slate-900 font-black uppercase tracking-[0.2em] text-[10px] hover:bg-slate-50 transition-all">Download PDF Dossier</button>
                     <button className="flex-1 py-4 bg-slate-900 text-white font-black uppercase tracking-[0.2em] text-[10px] hover:bg-black transition-all shadow-xl">Authorize Action Protocol</button>
                  </div>
               </div>
            </div>
         )}

         {/* Bottom Row: State-wide District Grid or Taluk Grid for Collector */}
         <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
            <div className="flex justify-between items-center mb-8">
               <div>
                  <h3 className="font-black text-slate-900 uppercase tracking-tight text-lg leading-none">
                     {user.role === 'COLLECTOR' ? 'Taluk Surveillance Matrix' : 'District Surveillance Matrix'}
                  </h3>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-2">
                     {user.role === 'COLLECTOR' ? 'Real-time sub-division monitoring for Salem District' : 'Real-time node monitoring across Tamil Nadu'}
                  </p>
               </div>
               <Badge variant="info" className="rounded-lg">{user.role === 'COLLECTOR' ? 'Salem Node Cluster' : 'Global Node Cluster'}</Badge>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-10 gap-3">
               {(user.role === 'COLLECTOR' ? 
                  ['Salem West', 'Salem South', 'Mettur', 'Omalur', 'Attur', 'Edappadi', 'Sankari', 'Vazhapadi', 'Gangavalli', 'Yercaud', 'Pethanaickenpalayam', 'Kadaiyampatti', 'Valapady'] : 
                  TN_DISTRICTS
               ).map(d => (
                  <button 
                     key={d} 
                     onClick={() => setSelectedDistrict(d)} 
                     className={`p-4 rounded-xl border transition-all text-center group ${selectedDistrict === d ? 'bg-blue-600 border-blue-600 text-white shadow-xl scale-105' : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-white hover:border-slate-200'}`}
                  >
                     <p className="text-[9px] font-black uppercase truncate group-hover:tracking-widest transition-all">{d}</p>
                     <div className="flex justify-center gap-1 mt-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${activeDetections.length > 0 && (d === 'Salem' || d === 'Salem West') ? 'bg-red-400 animate-pulse' : 'bg-green-400 opacity-20'}`}></div>
                     </div>
                  </button>
               ))}
            </div>
         </div>
      </div>
   );
};

const InspectorExecutiveView = ({ parcels = [], alerts = [], setAlerts }) => {
   const activeAlerts = alerts.filter(a => a.status === 'VAO_ASSIGNED');
   const resolvedAlerts = alerts.filter(a => a.status === 'RESOLVED');

   const handleResolve = (id) => {
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'RESOLVED', resolution_notes: 'Field verification complete via mobile sync.' } : a));
   };

   return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
         {/* Strategic Status Bar */}
         <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-2xl flex flex-wrap items-center justify-between gap-6 border border-white/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12"><Navigation size={150} /></div>
            <div className="flex items-center gap-5 relative z-10">
               <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg border border-white/20"><Navigation size={28} /></div>
               <div>
                  <h2 className="text-xl font-black uppercase tracking-tight">FIELD_COMMAND_HUB</h2>
                  <div className="flex items-center gap-3 mt-1">
                     <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div><p className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">MOBILE_SYNC_LIVE</p></div>
                     <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest border-l border-white/10 pl-3">OPERATOR_RAJESH_022</p>
                  </div>
               </div>
            </div>
            <div className="flex gap-4 relative z-10">
               {[
                  { l: 'ACTIVE_TASKS', v: activeAlerts.length, c: 'text-blue-400' },
                  { l: 'RESOLVED_TODAY', v: resolvedAlerts.length, c: 'text-green-400' },
                  { l: 'SYNC_STABILITY', v: '99.8%', c: 'text-indigo-400' }
               ].map((s, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 px-6 py-3 rounded-2xl">
                     <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-1">{s.l}</p>
                     <p className={`text-xl font-black ${s.c}`}>{s.v}</p>
                  </div>
               ))}
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Mission Intelligence Grid */}
            <div className="lg:col-span-2 space-y-6">
               <Card title="Operational Mission Matrix" icon={ClipboardCheck}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {activeAlerts.map(alert => (
                        <div key={alert.id} className="bg-slate-50 rounded-3xl p-5 border border-slate-100 hover:border-blue-200 transition-all group relative overflow-hidden">
                           <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 -mr-16 -mt-16 rounded-full group-hover:scale-110 transition-all"></div>
                           <div className="flex justify-between items-start mb-4 relative z-10">
                              <Badge variant="danger">FIELD_ACTION_REQUIRED</Badge>
                              <p className="text-[9px] font-black text-slate-400">ID_{alert.id}</p>
                           </div>
                           <div className="flex gap-4 mb-6 relative z-10">
                              <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-white shadow-lg bg-slate-200"><img src={alert.img} className="w-full h-full object-cover" /></div>
                              <div className="flex-1">
                                 <h3 className="text-sm font-black text-slate-900 uppercase">SURVEY {alert.parcel_details}</h3>
                                 <p className="text-[9px] font-bold text-slate-500 uppercase mt-1">{alert.alert_type}</p>
                                 <div className="mt-3 flex items-center gap-4">
                                    <div><p className="text-[7px] font-black text-slate-400 uppercase">DISTANCE</p><p className="text-[10px] font-black text-slate-800">2.4 KM</p></div>
                                    <div><p className="text-[7px] font-black text-slate-400 uppercase">THREAT</p><Badge variant="warning">LVL_4</Badge></div>
                                 </div>
                              </div>
                           </div>
                           <div className="flex gap-2 relative z-10">
                              <button onClick={() => handleResolve(alert.id)} className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">Resolve Mission</button>
                              <button className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 transition-all"><Eye size={16} /></button>
                           </div>
                        </div>
                     ))}
                     {activeAlerts.length === 0 && (
                        <div className="col-span-2 p-12 text-center">
                           <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mx-auto mb-4"><CheckCircle2 size={32} /></div>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Awaiting Command Assignments</p>
                        </div>
                     )}
                  </div>
               </Card>

               {/* Evidence Sync Gallery */}
               <Card title="Field Evidence Repository" icon={Camera}>
                  <div className="flex justify-between items-center mb-4 px-1">
                     <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Live Sync: {new Date().toLocaleTimeString()}</p>
                     <div className="flex gap-1"><div className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div><div className="w-1 h-1 bg-green-500 rounded-full animate-pulse delay-75"></div><div className="w-1 h-1 bg-green-500 rounded-full animate-pulse delay-150"></div></div>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                     {[...alerts.filter(a => a.img).map(a => a.img), img1, img2, img3, img4, field1, field1].slice(0, 12).map((img, i) => (
                        <div key={i} className="aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100 group relative cursor-pointer shadow-sm">
                           <img src={img} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500" />
                           <div className="absolute inset-0 bg-blue-600/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                              <Eye size={16} className="text-white" />
                           </div>
                        </div>
                     ))}
                  </div>
               </Card>
            </div>

            {/* Tactical Sidebar */}
            <div className="space-y-6">
               <Card title="Live Field Telemetry" icon={Activity}>
                  <div className="space-y-4">
                     <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex justify-between items-center mb-3">
                           <p className="text-[9px] font-black text-slate-800 uppercase">Network_Integrity</p>
                           <p className="text-[10px] font-black text-green-600">STABLE</p>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden"><div className="w-[92%] h-full bg-green-500"></div></div>
                     </div>
                     <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex justify-between items-center mb-3">
                           <p className="text-[9px] font-black text-slate-800 uppercase">GPS_Lock_Accuracy</p>
                           <p className="text-[10px] font-black text-blue-600">± 1.2m</p>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden"><div className="w-[85%] h-full bg-blue-600"></div></div>
                     </div>
                  </div>
               </Card>

               <Card title="Operational Performance" icon={TrendingUp}>
                  <div className="space-y-4">
                     {[
                        { l: 'Verification Speed', v: '14.2 min/task' },
                        { l: 'Evidence Density', v: '4.8 photos/task' },
                        { l: 'Reporting Accuracy', v: '98.4%' }
                     ].map((p, i) => (
                        <div key={i} className="flex justify-between items-center border-b border-slate-50 pb-3 last:border-0">
                           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{p.l}</p>
                           <p className="text-[10px] font-black text-slate-900 uppercase">{p.v}</p>
                        </div>
                     ))}
                     <button className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[9px] shadow-xl hover:bg-red-600 transition-all mt-4 flex items-center justify-center gap-2">
                        <AlertCircle size={14} /> Panic_Emergency_Signal
                     </button>
                  </div>
               </Card>
            </div>
         </div>
      </div>
   );
};
const VillageExecutiveView = ({ parcels = [], alerts = [], setAlerts }) => {
   const [assignmentModal, setAssignmentModal] = useState({ open: false, alertId: null });
   const activeAlerts = alerts.filter(a => a.status === 'TAHSILDAR_ACCEPTED');

   const handleAction = (id) => {
      setAssignmentModal({ open: true, alertId: id });
   };

   const confirmAssignment = (officer) => {
      setAlerts(prev => prev.map(a => a.id === assignmentModal.alertId ? { ...a, status: 'VAO_ASSIGNED', assignedTo: officer } : a));
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
               <Card title="Immediate Field Tasks" icon={ClipboardCheck}>
                  <div className="space-y-3">
                     {activeAlerts.map(alert => (
                        <div key={alert.id} className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between group hover:bg-white border border-transparent hover:border-slate-100 transition-all">
                           <div className="flex items-center gap-4">
                              <div className="w-14 h-14 rounded-xl overflow-hidden border border-slate-200"><img src={alert.img} className="w-full h-full object-cover" /></div>
                              <div><p className="text-xs font-black text-slate-800 uppercase">Survey {alert.parcel_details}</p><p className="text-[10px] text-slate-400 font-bold uppercase">{alert.alert_type}</p></div>
                           </div>
                           <button onClick={() => handleAction(alert.id)} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-md">Assign Inspector</button>
                        </div>
                     ))}
                     {activeAlerts.length === 0 && <div className="p-8 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">No Active Encroachment Tasks</div>}
                  </div>
               </Card>
            </div>
            <div className="space-y-6"><Card title="Village Alerts" icon={ShieldAlert}><div className="space-y-4">{activeAlerts.slice(0, 2).map((a, i) => (<div key={i} className="p-3 bg-red-50 rounded-xl border border-red-100"><p className="text-[10px] font-black text-red-800 uppercase mb-1">Encroachment Alert</p><p className="text-[9px] text-red-600 leading-tight">New structure detected at Survey {a.parcel_details}.</p></div>))}</div></Card></div>
         </div>
         <OfficerAssignmentModal isOpen={assignmentModal.open} alertId={assignmentModal.alertId} type="FIELD_OFFICER" onClose={() => setAssignmentModal({ open: false, alertId: null })} onAssign={confirmAssignment} />
      </div>
   );
};

const TalukExecutiveView = ({ user, parcels = [], alerts = [], setAlerts }) => {
   const [assignmentModal, setAssignmentModal] = useState({ open: false, alertId: null });
   
   // Filtering alerts assigned by the Collector
   const activeAlerts = alerts.filter(a => a.status === 'COLLECTOR_ACCEPTED');

   const handleAction = (id) => {
      setAssignmentModal({ open: true, alertId: id });
   };

   const confirmAssignment = (officer) => {
      setAlerts(prev => prev.map(a => String(a.id) === String(assignmentModal.alertId) ? { ...a, status: 'TAHSILDAR_ACCEPTED', assignedTahsildar: officer } : a));
      alert(`TACTICAL DISPATCH: Alert #${assignmentModal.alertId} forwarded to VAO node for Village Assignment.\n\nPriority: HIGH\nStatus: FORWARDED`);
      setAssignmentModal({ open: false, alertId: null });
   };

   return (
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-5 duration-500">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-2">
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
                        <div key={alert.id} className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between group hover:bg-white border border-transparent hover:border-slate-100 transition-all">
                           <div className="flex items-center gap-4">
                              <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 shadow-sm"><img src={alert.img} className="w-full h-full object-cover" /></div>
                              <div>
                                 <p className="text-[11px] font-black text-slate-800 uppercase leading-none">Survey {alert.parcel_details}</p>
                                 <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">{alert.alert_type}</p>
                                 <div className="flex items-center gap-2 mt-2">
                                    <div className="w-1.5 h-1.5 bg-blue-600"></div>
                                    <p className="text-[8px] font-black text-blue-600 uppercase">Assigned by Collector</p>
                                 </div>
                              </div>
                           </div>
                           <button onClick={() => handleAction(alert.id)} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-md">Assign VAO</button>
                        </div>
                     ))}
                     {activeAlerts.length === 0 && (
                        <div className="p-12 text-center">
                           <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mx-auto mb-4"><CheckCircle2 size={24} /></div>
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
                        <div key={i} className="p-3 bg-slate-50 rounded-xl flex justify-between items-center border border-slate-100">
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

const CollectorExecutiveView = ({ parcels = [], alerts = [], setAlerts, onTabChange }) => {
   const [assignmentModal, setAssignmentModal] = useState({ open: false, alertId: null });
   const [selectedTaluk, setSelectedTaluk] = useState('All');
   const [filterStatus, setFilterStatus] = useState('ACTIVE');
   
   const salemTaluks = TN_TALUKS['Salem'] || [];

   const handleAction = (id) => {
      setAssignmentModal({ open: true, alertId: id });
   };

   const confirmAssignment = (officer) => {
      setAlerts(prev => prev.map(a => String(a.id) === String(assignmentModal.alertId) ? { ...a, status: 'COLLECTOR_ACCEPTED', assignedCollector: officer } : a));
      alert(`EXECUTIVE ORDER: Mission #${assignmentModal.alertId} officially authorized.\n\nCommand: SECURE_PROPERTY\nStatus: TRANSMITTED_TO_TALUK_NODE`);
      setAssignmentModal({ open: false, alertId: null });
   };

   const filteredAlerts = alerts.filter(a => {
      const matchesTaluk = selectedTaluk === 'All' || (a.taluk === selectedTaluk);
      if (!matchesTaluk) return false;

      // REMOVE COMPLETED: Only show unresolved alerts in the primary action queue
      if (filterStatus === 'ACTIVE') return ['NEW', 'WAITING', 'PENDING'].includes((a.status || 'NEW').toUpperCase());
      if (filterStatus === 'RESOLVED') return ['RESOLVED', 'SUCCESS'].includes((a.status || '').toUpperCase());
      return true;
   });

   const activeCount = alerts.filter(a => ['NEW', 'WAITING', 'PENDING'].includes((a.status || 'NEW').toUpperCase())).length;

   return (
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-6 duration-700">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div>
               <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Executive Command Matrix</h2>
               <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Salem District • Strategic Node</p>
            </div>
            <div className="flex items-center gap-3">
               <Badge variant="danger">{activeCount} Unresolved Threats</Badge>
            </div>
         </div>

         <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="flex justify-between items-center mb-6">
               <div><h3 className="font-black text-slate-900 uppercase tracking-tight text-lg">District-wide Taluk Surveillance</h3><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Salem District • {salemTaluks.length} Taluk Nodes</p></div>
               <div className="flex gap-2">
                  <button onClick={() => setSelectedTaluk('All')} className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${selectedTaluk === 'All' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>All Taluks</button>
                  <Badge variant="info">Live Feed</Badge>
               </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2">
               {salemTaluks.map(t => (
                  <button key={t} onClick={() => setSelectedTaluk(t)} className={`p-3 rounded-xl border transition-all text-center ${selectedTaluk === t ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100'}`}>
                     <p className="text-[8px] font-black uppercase truncate">{t}</p>
                     <div className="flex justify-center gap-1 mt-1">
                        <div className={`w-1 h-1 rounded-full ${alerts.some(a => (a.status !== 'RESOLVED' && a.status !== 'Resolved') && ((a.taluk === t) || (a.parcel_details && a.parcel_details.includes(t)))) ? 'bg-red-400 animate-pulse' : 'bg-green-400 opacity-20'}`}></div>
                     </div>
                  </button>
               ))}
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-8 space-y-4">
               <Card title={`Tactical Threat Queue: ${selectedTaluk}`} icon={ShieldAlert}>
                   <div className="p-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                      <div className="flex bg-white p-1 rounded-lg gap-1 border border-slate-200">
                         {['ACTIVE', 'RESOLVED', 'ALL'].map(s => (
                            <button 
                               key={s} 
                               onClick={() => setFilterStatus(s)}
                               className={`px-4 py-1.5 rounded-md text-[8px] font-black uppercase tracking-widest transition-all ${filterStatus === s ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                               {s}
                            </button>
                         ))}
                      </div>
                      <Badge variant="info">{filteredAlerts.length} Nodes</Badge>
                   </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-2">
                     {filteredAlerts.map(alert => (
                        <div key={alert.id} className="group relative rounded-2xl border border-slate-100 overflow-hidden hover:border-indigo-500 transition-all bg-white shadow-sm flex flex-col">
                           <div className="h-40 bg-slate-100 relative">
                              <img src={alert.img || img1} alt="Encroachment" className="w-full h-full object-cover" />
                              <div className="absolute top-3 right-3"><Badge variant="danger">{(alert.confidence_score * 100).toFixed(0)}% CONF</Badge></div>
                           </div>
                           <div className="p-4 flex-1 flex flex-col justify-between">
                              <div className="mb-4">
                                 <p className="text-[10px] font-bold text-slate-400 uppercase">Survey {alert.parcel_details}</p>
                                 <p className="text-xs font-black text-slate-800 uppercase leading-tight mt-1">{alert.alert_type}</p>
                              </div>
                              <button onClick={() => handleAction(alert.id)} className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all">Authorize Tahsildar</button>
                           </div>
                        </div>
                     ))}
                     {filteredAlerts.length === 0 && (
                        <div className="col-span-2 py-12 text-center">
                           <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300"><ShieldCheck size={32} /></div>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No Strategic Detections Required</p>
                        </div>
                      )}
                  </div>
               </Card>
            </div>

            <div className="lg:col-span-4 space-y-6">
               <div className="bg-slate-900 rounded-3xl p-6 text-white relative overflow-hidden shadow-xl">
                  <h4 className="text-[10px] font-black uppercase tracking-widest mb-6 flex items-center gap-2 text-blue-400"><Activity size={14} /> Operational Oversight</h4>
                  <div className="space-y-3">
                     <div className="p-4 bg-white/5 border border-white/10 rounded-xl mb-4">
                        <div className="flex justify-between items-center mb-2">
                           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Field Missions</span>
                           <span className="text-blue-400 font-black text-xs">03</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                           <div className="h-full bg-blue-500 w-2/3"></div>
                        </div>
                        <p className="text-[8px] text-slate-400 font-bold uppercase mt-2">Team Alpha: ON SITE (SW-142)</p>
                     </div>
                     <button onClick={() => onTabChange('enforcement')} className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3"><Monitor size={14} /> Monitor Live Work</button>
                     <button onClick={() => alert("ISSUE: District-wide Encroachment Sweep initiated.")} className="w-full py-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">Mobilize All Taluks</button>
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
      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
         <div className="flex justify-between items-center mb-8">
            <div>
               <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Revenue Recovery Matrix</h3>
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Financial Intelligence • Salem District</p>
            </div>
            <button onClick={() => alert('Generating Comprehensive Audit Report (PDF)...\nCompiling data from Revenue, Police, and GIS nodes.')} className="px-6 py-2.5 bg-green-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-green-100 flex items-center gap-2 transition-all hover:bg-green-700"><Download size={16} /> Export Audit</button>
         </div>
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
               <div className="h-80 flex items-end gap-6 px-4">
                  {[
                     { t: 'Salem West', v: 85, c: 'bg-green-500' }, { t: 'Salem South', v: 60, c: 'bg-green-400' },
                     { t: 'Mettur', v: 92, c: 'bg-green-600' }, { t: 'Omalur', v: 45, c: 'bg-emerald-400' },
                     { t: 'Attur', v: 70, c: 'bg-green-700' }, { t: 'Edappadi', v: 55, c: 'bg-emerald-500' }
                  ].map((d, i) => (
                     <div key={i} className="flex-1 flex flex-col items-center gap-4 group cursor-pointer">
                        <div className="w-full relative">
                           <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-all font-black">₹{d.v}L</div>
                           <div className={`${d.c} w-full rounded-2xl group-hover:scale-105 transition-all duration-1000 animate-in slide-in-from-bottom`} style={{ height: `${d.v * 2.5}px`, animationDelay: `${i * 100}ms` }}></div>
                        </div>
                        <span className="text-[9px] font-black text-slate-500 uppercase rotate-45 lg:rotate-0 mt-2">{d.t}</span>
                     </div>
                  ))}
               </div>
            </div>
            <div className="space-y-6">
               <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-4">Recovery Efficiency</p>
                  <div className="flex items-center justify-between mb-2">
                     <span className="text-2xl font-black text-slate-900">92.4%</span>
                     <span className="text-green-600 font-bold text-[10px]">+4.2%</span>
                  </div>
                  <ProgressBar progress={92} color="bg-green-600" />
               </div>
               <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-4">Target Variance</p>
                  <div className="flex items-center justify-between mb-2">
                     <span className="text-2xl font-black text-slate-900">₹12.2 Cr</span>
                     <span className="text-orange-500 font-bold text-[10px]">REMAINING</span>
                  </div>
                  <ProgressBar progress={78} color="bg-orange-500" />
               </div>
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
            <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
               <div className="flex justify-between items-start mb-3">
                  <div className={`p-2 rounded-xl bg-slate-50 ${k.c}`}><k.i size={18} /></div>
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
                     <div key={i} className="p-5 bg-slate-50 rounded-2xl hover:bg-white border border-transparent hover:border-slate-200 transition-all flex items-center justify-between group cursor-pointer">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">{c.id.split('-')[0]}</div>
                           <div>
                              <p className="text-xs font-black text-slate-800 uppercase">{c.t}</p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">{c.d} • {c.id}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-4">
                           <Badge variant={c.p === 'CRITICAL' ? 'danger' : 'info'}>{c.s}</Badge>
                           <button className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 group-hover:text-blue-600 transition-all"><ChevronRight size={14} /></button>
                        </div>
                     </div>
                  ))}
               </div>
            </Card>
         </div>
         <div className="space-y-6">
            <Card title="Legal Intelligence Feed" icon={FileText}>
               <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                     <p className="text-[10px] font-black text-blue-900 uppercase mb-2">Upcoming Hearing</p>
                     <p className="text-[11px] text-blue-700 leading-relaxed font-bold">Survey 142/A stay order review scheduled for April 24th in Madras High Court.</p>
                  </div>
                  <div className="space-y-3">
                     <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase"><span>Document Uploads</span><span>12 Today</span></div>
                     <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase"><span>Legal Notices</span><span className="text-red-600">4 Urgent</span></div>
                  </div>
               </div>
            </Card>
            <div className="bg-slate-900 rounded-3xl p-6 text-white text-center shadow-xl shadow-slate-200">
               <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4"><Gavel size={24} /></div>
               <h5 className="text-[11px] font-black uppercase tracking-widest mb-2">Legal Coordination</h5>
               <p className="text-[9px] text-slate-400 font-bold uppercase mb-6 leading-relaxed">Request special legal counsel for complex encroachment stays in Mettur.</p>
               <button className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">Assign Counsel</button>
            </div>
         </div>
      </div>
   </div>
);

const ApprovalsHubView = ({ user, alerts = [], setAlerts }) => {
   const isCollector = user?.role === 'COLLECTOR';
   const [assignmentModal, setAssignmentModal] = useState({ open: false, alertId: null });
   
   const pendingApprovals = alerts.filter(a => {
      if (isCollector) return ['NEW', 'WAITING', 'PENDING'].includes((a.status || 'NEW').toUpperCase());
      return a.status === 'COLLECTOR_ACCEPTED';
   });

   const handleAction = (id) => {
      setAssignmentModal({ open: true, alertId: id });
   };

   const confirmAssignment = (officer) => {
      const newStatus = isCollector ? 'COLLECTOR_ACCEPTED' : 'TAHSILDAR_ACCEPTED';
      const assignField = isCollector ? 'assignedCollector' : 'assignedTahsildar';
      
      setAlerts(prev => prev.map(a => String(a.id) === String(assignmentModal.alertId) ? { ...a, status: newStatus, [assignField]: officer } : a));
      alert(`MISSION_DISPATCH: ${officer} authorized for Node ${assignmentModal.alertId}`);
      setAssignmentModal({ open: false, alertId: null });
   };

   return (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
         <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div>
               <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{isCollector ? 'Executive Authorization Pipeline' : 'Taluk Dispatch Matrix'}</h2>
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Pending Field Dispatches • {isCollector ? 'Salem District Hub' : 'Taluk Command'}</p>
            </div>
            <Badge variant="danger">{pendingApprovals.length} Critical Actions Required</Badge>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
               <Card title="Decision Pipeline" icon={ShieldAlert}>
                  <div className="space-y-3">
                     {pendingApprovals.map(alert => (
                        <div key={alert.id} className="p-5 bg-slate-50 rounded-2xl flex items-center justify-between group hover:bg-white border border-transparent hover:border-slate-100 transition-all">
                           <div className="flex items-center gap-5">
                              <div className="w-16 h-16 rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
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
                              <button onClick={() => handleAction(alert.id)} className="px-6 py-3 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg hover:shadow-blue-100 flex items-center gap-2">
                                 <Zap size={14} /> Authorize Now
                              </button>
                           </div>
                        </div>
                     ))}
                     {pendingApprovals.length === 0 && (
                        <div className="py-20 text-center">
                           <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300 shadow-inner"><ShieldCheck size={40} /></div>
                           <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">All Field Missions Authorized</p>
                        </div>
                     )}
                  </div>
               </Card>
            </div>

            <div className="space-y-6">
               <Card title="Operational Directives" icon={FileText}>
                  <div className="space-y-4">
                     <div className="p-5 bg-blue-600 rounded-3xl text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10"><Scale size={100} /></div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-80">Legal Priority</h4>
                        <p className="text-xs font-bold leading-relaxed mb-6">Immediate survey required for Mettur Survey 142/A to counter pending stay order.</p>
                        <button className="w-full py-3 bg-white text-blue-600 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl">Review Legal Case</button>
                     </div>
                     
                     <div className="p-4 border border-slate-200 rounded-2xl">
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">Uplink Status</p>
                        <div className="flex items-center justify-between mb-2">
                           <span className="text-[10px] font-black text-slate-900 uppercase">District HQ</span>
                           <div className="flex gap-1">
                              {[1,1,1,0.5].map((v, i) => <div key={i} className="w-2 h-2 bg-green-500 rounded-full" style={{ opacity: v }}></div>)}
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

const EnforcementTrackingView = ({ alerts = [] }) => {
   const activeMissions = [
      { id: 'MIS-771', target: 'Survey 142/A', officer: 'Tahsildar - Salem West', status: 'ON_SITE', progress: 65, startTime: '09:00 AM', location: 'Salem West Node', img: field1 },
      { id: 'MIS-772', target: 'Survey 88/C', officer: 'Tahsildar - Mettur', status: 'EN_ROUTE', progress: 25, startTime: '10:30 AM', location: 'Mettur Highway', img: field3 },
      { id: 'MIS-773', target: 'Survey 55/D', officer: 'VAO - Attur East', status: 'COMPLETED', progress: 100, startTime: '08:15 AM', location: 'Attur Village Hub', img: field4 }
   ];

   const [selectedMission, setSelectedMission] = useState(activeMissions[0]);

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
                     <div className="text-right">
                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Satellite Link</p>
                        <p className="text-xs font-black text-green-600 uppercase">ACTIVE_SECURE</p>
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
                        <img src={selectedMission.img} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" alt="Field Photo" />
                        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[8px] px-2 py-1 font-black uppercase">Live_Rec_01</div>
                     </div>
                     <div className="grid grid-cols-2 gap-2">
                        {[img1, img2].map((im, i) => (
                           <div key={i} className="aspect-square bg-slate-100 border border-slate-200 overflow-hidden"><img src={im} className="w-full h-full object-cover grayscale opacity-50" /></div>
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

const ReportsView = ({ parcels = [], alerts = [] }) => (
   <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <Card title="District Health Matrix" icon={PieChart}>
            <div className="flex flex-col items-center justify-center py-8">
               <div className="w-40 h-40 rounded-full border-[12px] border-slate-50 relative flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-[12px] border-blue-500 border-r-transparent border-b-transparent"></div>
                  <div className="text-center">
                     <p className="text-3xl font-black text-slate-900">84%</p>
                     <p className="text-[9px] font-bold text-slate-400 uppercase">Overall Goal</p>
                  </div>
               </div>
               <div className="mt-8 grid grid-cols-2 gap-x-8 gap-y-4 w-full px-4">
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div><span className="text-[10px] font-bold text-slate-600 uppercase">Cleared</span></div>
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-slate-200"></div><span className="text-[10px] font-bold text-slate-600 uppercase">Pending</span></div>
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-400"></div><span className="text-[10px] font-bold text-slate-600 uppercase">Legal</span></div>
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-400"></div><span className="text-[10px] font-bold text-slate-600 uppercase">Verified</span></div>
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
                           <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-all font-bold tracking-widest">{d.val}%</div>
                           <div className="bg-blue-600/10 rounded-t-lg group-hover:bg-blue-600/20 transition-all h-60 flex flex-col justify-end overflow-hidden">
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
                  <div key={i} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-4">
                     <div className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center font-black text-slate-400 text-xs">#{i + 1}</div>
                     <div className="flex-1">
                        <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight">{t.name}</p>
                        <div className="mt-2 h-1.5 w-full bg-slate-200 rounded-full overflow-hidden"><div className="h-full bg-blue-600" style={{ width: `${t.score}%` }}></div></div>
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
               <div className="p-6 bg-blue-50 rounded-2xl text-center">
                  <p className="text-[9px] font-bold text-blue-600 uppercase tracking-widest mb-2">Total Inspections</p>
                  <h4 className="text-4xl font-black text-blue-900">14,202</h4>
               </div>
               <div className="p-6 bg-green-50 rounded-2xl text-center">
                  <p className="text-[9px] font-bold text-green-600 uppercase tracking-widest mb-2">Resolution Rate</p>
                  <h4 className="text-4xl font-black text-green-900">92%</h4>
               </div>
            </div>
            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
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
                  <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
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
         <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="flex border-b border-slate-100 bg-slate-50/50">
               {['general', 'security', 'integration', 'notifications', 'advanced'].map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)} className={`px-8 py-5 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-700'}`}>{tab}</button>
               ))}
            </div>
            <div className="p-10 space-y-8">
               {activeTab === 'general' && (
                  <div className="space-y-6">
                     <div className="grid grid-cols-2 gap-8">
                        <div><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Platform Name</label><input type="text" defaultValue="GeoCommand District Node" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 focus:border-blue-500 outline-none" /></div>
                        <div><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">District ID</label><input type="text" defaultValue="SLM-781" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 focus:border-blue-500 outline-none" /></div>
                     </div>
                     <div><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Operational Timezone</label><select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 focus:border-blue-500 outline-none"><option>IST (UTC +5:30)</option><option>UTC</option></select></div>
                     <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                        <div><p className="text-[11px] font-black text-slate-800 uppercase tracking-tight">Maintenance Mode</p><p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Suspend all field operations for node update</p></div>
                        <div className="w-12 h-6 bg-slate-200 rounded-full relative cursor-pointer"><div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all"></div></div>
                     </div>
                  </div>
               )}
               {activeTab === 'security' && (
                  <div className="space-y-6">
                     <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 flex items-center gap-4">
                        <div className="p-3 bg-blue-600 text-white rounded-xl"><Shield size={24} /></div>
                        <div><h4 className="text-[11px] font-black text-blue-900 uppercase tracking-widest">Enhanced Encryption Active</h4><p className="text-[9px] text-blue-700 font-bold uppercase mt-1">AES-256 Protocol securing all land registry data</p></div>
                     </div>
                     <div className="space-y-4">
                        <div className="flex justify-between items-center py-4 border-b border-slate-50"><div><p className="text-[11px] font-black text-slate-800 uppercase">Two-Factor Authentication</p><p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Require SMS/Email OTP for officer login</p></div><div className="w-12 h-6 bg-blue-600 rounded-full relative cursor-pointer"><div className="absolute top-1 right-1 w-4 h-4 bg-white rounded-full transition-all"></div></div></div>
                        <div className="flex justify-between items-center py-4 border-b border-slate-50"><div><p className="text-[11px] font-black text-slate-800 uppercase">IP Whitelisting</p><p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Restrict access to official gov IP ranges</p></div><div className="w-12 h-6 bg-slate-200 rounded-full relative cursor-pointer"><div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all"></div></div></div>
                     </div>
                  </div>
               )}
               {activeTab === 'notifications' && (
                  <div className="space-y-6">
                     <div className="grid grid-cols-2 gap-4">
                        {['New Detection', 'Critical Alert', 'User Activity', 'System Status', 'Monthly Reports', 'Legal Notice Response'].map(n => (
                           <div key={n} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between">
                              <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">{n}</span>
                              <div className="w-10 h-5 bg-blue-600 rounded-full relative"><div className="absolute top-1 right-1 w-3 h-3 bg-white rounded-full"></div></div>
                           </div>
                        ))}
                     </div>
                  </div>
               )}
               <div className="flex gap-4 pt-4">
                  <button className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">Save Global Configuration</button>
                  <button className="px-8 py-4 bg-slate-50 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all border border-slate-200">Reset</button>
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
               <div className="bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl relative animate-in zoom-in-95 duration-200">
                  <button className="absolute top-6 right-6 text-slate-400 hover:text-slate-800" onClick={() => setSelectedItem(null)}><X size={24} /></button>
                  <div className="flex items-center gap-4 mb-6">
                     <div className="p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-100"><Shield size={24} /></div>
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
                     <button className="py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all">Modify Status</button>
                     <button className="py-3 bg-slate-50 text-slate-400 border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all">Audit History</button>
                  </div>
               </div>
            </div>
         )}

         <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm gap-6">
            <div className="flex items-center gap-4">
               <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Icon size={24} /></div>
               <div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-tight">{title}</h2>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Salem Node • Active Dataset</p>
               </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
               <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input type="text" placeholder="Search..." className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500" />
               </div>
               {actionLabel && <button onClick={onActionClick} className="px-6 py-2 bg-blue-600 text-white rounded-lg text-[9px] font-bold uppercase tracking-widest shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2"><PlusCircle size={16} /> {actionLabel}</button>}
            </div>
         </div>
         <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden overflow-x-auto">
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
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
               <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Globe size={18} /></div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Surveyed Area</p>
               </div>
               <h2 className="text-3xl font-black text-slate-900 tracking-tighter">14,242 <span className="text-sm text-slate-400 font-bold uppercase ml-1">Ha</span></h2>
               <p className="text-[9px] text-green-600 font-bold uppercase mt-2">● 98.2% GIS Coverage</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
               <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-xl"><Landmark size={18} /></div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Poramboke Inventory</p>
               </div>
               <h2 className="text-3xl font-black text-slate-900 tracking-tighter">8,142 <span className="text-sm text-slate-400 font-bold uppercase ml-1">Parcels</span></h2>
               <p className="text-[9px] text-amber-600 font-bold uppercase mt-2">● 14% Under Legal Review</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
               <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-50 text-green-600 rounded-xl"><ShieldCheck size={18} /></div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reclaimed Zone</p>
               </div>
               <h2 className="text-3xl font-black text-slate-900 tracking-tighter">412.5 <span className="text-sm text-slate-400 font-bold uppercase ml-1">Ha</span></h2>
               <p className="text-[9px] text-blue-600 font-bold uppercase mt-2">● Recovery Rate +12% YoY</p>
            </div>
            <div className="bg-blue-600 p-4 rounded-2xl text-white shadow-xl shadow-blue-100 flex flex-col justify-between">
               <div>
                  <h3 className="text-xs font-black uppercase tracking-widest mb-1">Administrative Report</h3>
                  <p className="text-[9px] text-blue-100 font-bold uppercase">Generate Monthly Land Audit</p>
               </div>
               <button onClick={onExport} className="w-full py-2.5 bg-white text-blue-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-50 transition-all">Download Audit</button>
            </div>
         </div>

         <div className="grid grid-cols-12 gap-4 items-start">
            {/* GIS & Statistics Hub */}
            <div className="col-span-12 lg:col-span-8 space-y-4">
               {/* GIS Audit Node */}
               <div className="bg-white border border-slate-200 rounded-2xl shadow-sm h-[600px] overflow-hidden relative group">
                  <div className="absolute top-6 left-6 z-[1000] flex gap-2">
                     <Badge variant="info" className="bg-white/90 backdrop-blur shadow-lg">DISTRICT CLASSIFICATION MAP</Badge>
                     <div className="flex items-center gap-2 px-3 py-1 bg-blue-600/90 backdrop-blur rounded-full text-[8px] font-black text-white uppercase tracking-widest shadow-lg">● Zoning Live</div>
                  </div>
                  <MapView parcels={parcels} alerts={alerts} onParcelClick={() => { }} onMapClick={onMapClick} selectedPosition={selectedPosition} />
                  
                  {/* Classification Legend */}
                  <div className="absolute bottom-6 left-6 z-[1000] p-4 bg-white/95 backdrop-blur-md rounded-xl border border-white/20 shadow-2xl space-y-2 min-w-[180px]">
                     <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-2 flex items-center gap-2 border-b border-slate-100 pb-2">Land Classification</p>
                     <div className="flex items-center gap-3"><div className="w-3 h-3 rounded bg-blue-600"></div><span className="text-[9px] font-bold text-slate-600 uppercase">Government Poramboke</span></div>
                     <div className="flex items-center gap-3"><div className="w-3 h-3 rounded bg-green-600"></div><span className="text-[9px] font-bold text-slate-600 uppercase">Reserve Forest</span></div>
                     <div className="flex items-center gap-3"><div className="w-3 h-3 rounded bg-amber-500"></div><span className="text-[9px] font-bold text-slate-600 uppercase">Waqf / Religious Board</span></div>
                     <div className="flex items-center gap-3"><div className="w-3 h-3 rounded bg-purple-600"></div><span className="text-[9px] font-bold text-slate-600 uppercase">Water Bodies / HR&CE</span></div>
                  </div>
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
                        <div className="w-32 h-32 rounded-full border-[10px] border-slate-50 relative flex items-center justify-center">
                           <div className="absolute inset-0 rounded-full border-[10px] border-blue-600 border-r-transparent border-b-transparent animate-spin-slow"></div>
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
                     <select onChange={(e) => setSelectedTaluk(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[10px] font-black text-slate-800 uppercase tracking-widest focus:border-blue-500 outline-none">
                        <option>All Taluks</option>
                        {TN_TALUKS['Salem'].map(t => <option key={t}>{t}</option>)}
                     </select>
                     
                     <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {talukStats.map(t => (
                           <div key={t.name} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 transition-all group">
                              <div className="flex justify-between items-center mb-4">
                                 <p className="text-[11px] font-black text-slate-900 uppercase">{t.name}</p>
                                 <Badge variant={t.risk === 'HIGH' ? 'danger' : 'info'}>{t.risk} RISK</Badge>
                              </div>
                              <div className="grid grid-cols-3 gap-2 text-center mb-4">
                                 <div className="p-2 bg-white rounded-xl border border-slate-100">
                                    <p className="text-[8px] font-bold text-slate-400 uppercase mb-1">Total</p>
                                    <p className="text-[10px] font-black text-slate-800">{t.total}</p>
                                 </div>
                                 <div className="p-2 bg-white rounded-xl border border-slate-100">
                                    <p className="text-[8px] font-bold text-red-400 uppercase mb-1">Encr.</p>
                                    <p className="text-[10px] font-black text-red-600">{t.encroached}</p>
                                 </div>
                                 <div className="p-2 bg-white rounded-xl border border-slate-100">
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

               <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden group shadow-2xl">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-blue-600/40 transition-all duration-700"></div>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-8 flex items-center gap-2"><History size={16} className="text-blue-400" /> Strategic Timeline</h3>
                  <div className="space-y-6">
                     {[
                        { t: '13:02', m: 'Drone Stream Alpha Connected', s: 'SUCCESS' },
                        { t: '10:15', m: 'New Encroachment Detected', s: 'ALERT' },
                        { t: '08:44', m: 'Mettur Node Sync Failure', s: 'RETRY' }
                     ].map((item, i) => (
                        <div key={i} className="flex gap-4 group">
                           <div className="flex flex-col items-center">
                              <div className="w-2 h-2 rounded-full bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.8)]"></div>
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

const DashboardView = React.memo(({ parcels, alerts, setAlerts, onExport, onMapClick, gisAttributes, selectedPosition }) => {
   const [assignmentModal, setAssignmentModal] = useState({ open: false, alertId: null });
   const activeAlerts = alerts.filter(a => a.status === 'NEW' || a.status === 'TAHSILDAR_ACCEPTED');

   return (
      <div className="space-y-6 animate-in fade-in duration-700 pb-10">
         {gisAttributes && (
            <div className="bg-white border-2 border-blue-600 p-6 rounded-3xl shadow-xl animate-in slide-in-from-top-4 duration-500">
               <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                     <div className="p-2 bg-blue-600 text-white rounded-xl"><Globe size={18} /></div>
                     <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">GIS Tactical Insight</h3>
                  </div>
                  <div className="flex items-center gap-2">
                     <Badge variant={gisAttributes.status === 1 ? 'success' : 'danger'}>
                        {gisAttributes.status === 1 ? 'GIS Sync' : 'Link Offline'}
                     </Badge>
                     {gisAttributes.threat_level && (
                        <Badge variant={gisAttributes.threat_level === 'CRITICAL' ? 'danger' : 'info'}>
                           {gisAttributes.threat_level} THREAT
                        </Badge>
                     )}
                  </div>
               </div>
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
                        <button onClick={() => alert('Generating Official Encroachment Alert...')} className="w-full py-3 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-200 animate-bounce">
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
               <div className="bg-white border border-slate-200 rounded-3xl shadow-sm h-[650px] overflow-hidden relative group">
                  <div className="absolute top-6 left-6 z-[1000] flex gap-2">
                     <Badge variant="info" className="bg-white/90 backdrop-blur shadow-lg border-white/20">LIVE GIS STREAM</Badge>
                     <div className="flex items-center gap-2 px-3 py-1 bg-green-500/90 backdrop-blur rounded-full text-[8px] font-black text-white uppercase tracking-widest shadow-lg animate-pulse">● System Online</div>
                  </div>
                  <MapView parcels={parcels} alerts={alerts} onParcelClick={() => { }} onMapClick={onMapClick} selectedPosition={selectedPosition} />

                  <div className="absolute bottom-6 left-6 z-[1000] p-4 bg-white/90 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl space-y-2.5 min-w-[160px]">
                     <p className="text-[9px] font-black text-slate-900 uppercase tracking-widest mb-2 border-b border-slate-200 pb-2 flex items-center gap-2"><MapPin size={10} className="text-blue-600" /> Tactical Legend</p>
                     <div className="flex items-center gap-3"><div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div><span className="text-[8px] font-bold text-slate-600 uppercase">Government Land</span></div>
                     <div className="flex items-center gap-3"><div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse"></div><span className="text-[8px] font-bold text-slate-600 uppercase">Critical Incursion</span></div>
                     <div className="flex items-center gap-3"><div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div><span className="text-[8px] font-bold text-slate-600 uppercase">Excavation / Construction</span></div>
                     <div className="flex items-center gap-3"><div className="w-2.5 h-2.5 rounded-full bg-violet-600"></div><span className="text-[8px] font-bold text-slate-600 uppercase">Forest / Env Risk</span></div>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                     <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2"><Layers size={14} className="text-blue-600" /> Layer Matrix</h3>
                     <div className="space-y-3">
                        {['Satellite Feed', 'Cadastral Overlay', 'Water Resource'].map(l => (
                           <div key={l} className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl border border-slate-100">
                              <span className="text-[10px] font-bold text-slate-700 uppercase tracking-tight">{l}</span>
                              <div className="w-10 h-5 bg-blue-600 rounded-full relative cursor-pointer shadow-inner"><div className="absolute top-1 right-1 w-3 h-3 bg-white rounded-full transition-all"></div></div>
                           </div>
                        ))}
                     </div>
                  </div>
                  <div className="bg-slate-900 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden group border border-white/5">
                     <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-all duration-700 rotate-12"><Camera size={100} /></div>
                     <h3 className="text-xs font-black uppercase tracking-widest mb-6 flex items-center gap-2 text-blue-400"><Monitor size={14} /> Drone Telemetry</h3>
                     <div className="space-y-4">
                        <div className="flex justify-between items-center bg-white/5 p-3 rounded-2xl border border-white/5">
                           <span className="text-[9px] font-bold text-slate-400 uppercase">Live Stream</span>
                           <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                              <span className="text-[9px] font-black text-red-500">REC</span>
                           </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                           <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                               <p className="text-[8px] font-bold text-slate-500 uppercase mb-1">Altitude</p>
                               <p className="text-sm font-black text-blue-400">124m</p>
                           </div>
                           <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                               <p className="text-[8px] font-bold text-slate-500 uppercase mb-1">Signal</p>
                               <p className="text-sm font-black text-green-400">92%</p>
                           </div>
                        </div>
                     </div>
                  </div>
                  <div className="bg-blue-600 p-6 rounded-3xl text-white shadow-xl shadow-blue-100 relative overflow-hidden group">
                     <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-all duration-700"><Globe size={100} /></div>
                     <h3 className="text-xs font-black uppercase tracking-widest mb-2">District Export</h3>
                     <p className="text-[9px] text-blue-100 font-bold uppercase mb-6 leading-relaxed">Download latest GIS spatial audit and encroachment reports.</p>
                     <button onClick={onExport} className="w-full py-3 bg-white text-blue-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-50 transition-all active:scale-[0.98]">Authorize Export</button>
                  </div>
               </div>
            </div>

            {/* Strategic Intelligence Hub */}
            <div className="col-span-12 lg:col-span-3 space-y-6 flex flex-col h-full sticky top-6">
               <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-blue-600/40 transition-all"></div>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2"><TrendingUp size={16} className="text-blue-400" /> District Equity at Risk</h3>
                  <div className="space-y-1">
                     <h2 className="text-4xl font-black tracking-tighter">₹842.40 Cr</h2>
                     <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Estimated Value of Encroached Land</p>
                  </div>
                  <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-2 gap-4">
                     <div><p className="text-[8px] font-bold text-slate-500 uppercase mb-1">Recovery Rate</p><p className="text-sm font-black text-green-400">+12.4%</p></div>
                     <div><p className="text-[8px] font-bold text-slate-500 uppercase mb-1">Audit Score</p><p className="text-sm font-black text-blue-400">94/100</p></div>
                  </div>
               </div>

               <div className="bg-white border border-slate-200 rounded-3xl shadow-sm flex flex-col max-h-[600px]">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                     <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2"><Target size={14} className="text-red-600" /> Tactical Dispatch</h3>
                     <Badge variant="danger">{alerts.filter(a => a.status === 'NEW').length} NEW</Badge>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                     {alerts.filter(a => a.status === 'NEW').map(alert => (
                        <div key={alert.id} className="p-4 bg-slate-50 hover:bg-white border border-transparent hover:border-slate-100 rounded-2xl transition-all cursor-pointer group shadow-sm" onClick={() => setAssignmentModal({ open: true, alertId: alert.id })}>
                           <div className="flex justify-between items-center mb-3">
                               <Badge variant={alert.confidence_score > 0.8 ? 'danger' : 'warning'} className="text-[8px] px-2 py-0.5">{(alert.confidence_score * 100).toFixed(0)}% AI CONFIDENCE</Badge>
                               <span className="text-[9px] text-slate-300 font-bold">#{alert.id.slice(0, 6)}</span>
                           </div>
                           
                           <div className="flex gap-3 mb-4">
                              <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 shadow-sm shrink-0">
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

                           <button className="w-full py-3 bg-slate-900 text-white rounded-xl text-[8px] font-black uppercase tracking-widest shadow-lg shadow-slate-100 hover:bg-blue-600 transition-all flex items-center justify-center gap-2">
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

               <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2"><BarChart3 size={14} className="text-indigo-600" /> Taluk Saturation</h3>
                  <div className="space-y-4">
                     {[
                        { n: 'Salem West', p: 88, c: 'bg-red-500' },
                        { n: 'Mettur', p: 42, c: 'bg-orange-500' },
                        { n: 'Omalur', p: 15, c: 'bg-green-500' }
                     ].map(t => (
                        <div key={t.n}>
                           <div className="flex justify-between text-[9px] font-bold uppercase mb-2"><span>{t.n}</span><span className={t.p > 70 ? 'text-red-600' : 'text-slate-400'}>{t.p}% Risk</span></div>
                           <ProgressBar progress={t.p} color={t.c} />
                        </div>
                     ))}
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

         <div className="bg-slate-900 rounded-3xl p-6 text-white text-center shadow-xl shadow-slate-200 mt-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-3xl group-hover:bg-blue-600/20 transition-all"></div>
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 relative z-10"><Monitor size={24} /></div>
            <h5 className="text-[11px] font-black uppercase tracking-widest mb-2 relative z-10">Command Briefing</h5>
            <p className="text-[9px] text-slate-400 font-bold uppercase mb-6 leading-relaxed relative z-10">District-wide detection efficiency is up by 12% following the v4.2 update.</p>
            <button onClick={() => onExport()} className="w-full py-3 bg-white text-slate-900 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all hover:bg-slate-100 relative z-10 flex items-center justify-center gap-2">
               <Download size={14} /> Download Latest Audit
            </button>
         </div>
      </div>
   );
});


const ProfileView = React.memo(({ user }) => (
   <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col sm:row items-center sm:items-start gap-6 sm:gap-8 text-center sm:text-left">
         <div className="w-20 h-20 sm:w-24 sm:h-24 bg-blue-600 rounded-2xl sm:rounded-3xl flex items-center justify-center text-white text-3xl sm:text-4xl font-extrabold shadow-lg shrink-0">{user.avatar}</div>
         <div className="flex-1">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 uppercase tracking-tight">{user.name}</h2>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] sm:text-xs mt-1">{user.role} • Salem District Node</p>
            <div className="flex justify-center sm:justify-start gap-3 mt-4"><Badge variant="success">Active</Badge><Badge variant="info">Level 4</Badge></div>
         </div>
         <button className="w-full sm:w-auto px-6 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold uppercase hover:bg-slate-100 transition-all">Security Protocol</button>
      </div>
   </div>
));

const FormView = React.memo(({ title, icon: Icon, fields, onBack }) => {
   const [district, setDistrict] = useState('Salem');
   return (
      <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-500">
         <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm relative">
            {onBack && <button onClick={onBack} className="absolute top-8 right-8 text-slate-400 hover:text-slate-800 transition-all"><X size={20} /></button>}
            <div className="flex items-center gap-4 mb-8">
               <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Icon size={24} /></div>
               <h2 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-tight">{title}</h2>
            </div>
            <div className="space-y-6">
               {fields.map((f, i) => (
                  <div key={i}>
                     <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2">{f.label}</label>
                     {f.type === 'tn-district' ? (
                        <select onChange={(e) => setDistrict(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-black text-slate-800 focus:border-blue-500 outline-none uppercase tracking-tighter">
                           {TN_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                     ) : f.type === 'tn-taluk' ? (
                        <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-black text-slate-800 focus:border-blue-500 outline-none uppercase tracking-tighter">
                           {(TN_TALUKS[district] || []).map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                     ) : (
                        <input type={f.type || 'text'} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 focus:border-blue-500 transition-all outline-none" placeholder={f.placeholder} />
                     )}
                  </div>
               ))}
               <div className="flex gap-4">
                  <button onClick={() => { alert("Operation Executed Successfully!"); if (onBack) onBack(); }} className="flex-1 bg-blue-600 text-white py-4 rounded-xl font-bold uppercase tracking-widest shadow-lg hover:bg-blue-700 transition-all active:scale-[0.98] text-[10px]">Execute Operation</button>
                  {onBack && <button onClick={onBack} className="px-8 py-4 bg-slate-50 text-slate-400 rounded-xl font-bold uppercase tracking-widest hover:bg-slate-100 transition-all text-[10px]">Cancel</button>}
               </div>
            </div>
         </div>
      </div>
   );
});

// --- MAIN APPLICATION ---

export default function App() {
   const [user, setUser] = useState(null);
   const [activeTab, setActiveTab] = useState('dashboard');
   const [parcels, setParcels] = useState([]);
   const [alerts, setAlerts] = useState([]);
   const [loginCat, setLoginCat] = useState('Core');
   const [currentTime, setCurrentTime] = useState(new Date());
   const [lang, setLang] = useState('EN');
   const [isSidebarOpen, setIsSidebarOpen] = useState(false);
   const [subView, setSubView] = useState(null);
   const [gisAttributes, setGisAttributes] = useState(null);
   const [selectedPosition, setSelectedPosition] = useState(null);

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
               const type = (f.properties.alert_type || '').toLowerCase();
               // Diverse image rotation (Deterministic Hash for diversity)
               const fieldPhotos = [field1, field2, field3, field4, field5, field6, field7, field8];
               const imgIdx = (f.id.toString().split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % fieldPhotos.length;
               let assignedImg = fieldPhotos[imgIdx];
               
               if (type.includes('wall') || type.includes('construction') || type.includes('brick')) assignedImg = field1;
               else if (type.includes('shed') || type.includes('hut') || type.includes('tarpaulin')) assignedImg = field2;
               else if (type.includes('dumping') || type.includes('material') || type.includes('sand')) assignedImg = field3;
               else if (type.includes('marker') || type.includes('stone') || type.includes('boundary')) assignedImg = field4;
               else if (type.includes('foundation') || type.includes('trench') || type.includes('soil')) assignedImg = field5;
               else if (type.includes('shop') || type.includes('park') || type.includes('plank')) assignedImg = field6;
               else if (type.includes('fence') || type.includes('pillar') || type.includes('wire')) assignedImg = field7;
               else if (type.includes('vehicle') || type.includes('parking') || type.includes('container')) assignedImg = field8;

               return {
                  id: String(f.id),
                  ...f.properties,
                  position: [f.geometry.coordinates[1], f.geometry.coordinates[0]],
                  survey_number: f.properties.parcel_details,
                  status: f.properties.status || 'NEW',
                  img: assignedImg
               };
            }) || [];
            setAlerts(prev => {
               const newAlerts = alertsData.length > 0 ? alertsData : [
                  { id: 'm1', position: [11.6655, 78.1472], confidence_score: 0.94, alert_type: 'Illegal Wall Construction', parcel_details: '142/A', taluk: 'Salem West', img: field1, status: 'NEW' },
                  { id: 'm2', position: [11.6698, 78.1412], confidence_score: 0.88, alert_type: 'Illegal Shopping Complex', parcel_details: '211/B', taluk: 'Mettur', img: field2, status: 'NEW' },
                  { id: 'm3', position: [11.6612, 78.1512], confidence_score: 0.92, alert_type: 'Unordered Settlement Cluster', parcel_details: '88/C', taluk: 'Omalur', img: field3, status: 'NEW' },
                  { id: 'm4', position: [11.6755, 78.1492], confidence_score: 0.97, alert_type: 'Agricultural Incursion', parcel_details: '55/D', taluk: 'Attur', img: field4, status: 'NEW' },
                  { id: 'm5', position: [11.6555, 78.1372], confidence_score: 0.85, alert_type: 'Religious Structure Encroachment', parcel_details: '10/E', taluk: 'Salem South', img: field1, status: 'NEW' }
               ];
               
               // PRESERVE LOCAL MISSION STATE (Match on string IDs)
               return newAlerts.map(na => {
                  const localMatch = prev.find(p => String(p.id) === String(na.id));
                  if (localMatch && localMatch.status !== 'NEW') {
                     return { ...na, status: localMatch.status, assignedTahsildar: localMatch.assignedTahsildar, assignedCollector: localMatch.assignedCollector };
                  }
                  return na;
               });
            });
         } catch (err) { 
             console.error("Data Sync Error:", err); 
             // Demo Fallback: Ensure map has data even if backend is offline
             setParcels(prev => prev.length > 0 ? prev : [
                { id: 1, survey_number: '142/A', owner: 'Govt - Revenue', classification: 'Public', status: 'Encroached', area: '1.2 Ha', coordinates: [[11.6643, 78.1460], [11.6663, 78.1460], [11.6663, 78.1480], [11.6643, 78.1480], [11.6643, 78.1460]] }
             ]);
             setAlerts([
                { id: 'f1', position: [11.6643, 78.1460], confidence_score: 0.98, alert_type: 'Unauthorized Brick Construction', parcel_details: '142/A', taluk: 'Salem West', img: field1, status: 'NEW' },
                { id: 'f2', position: [11.6700, 78.1500], confidence_score: 0.85, alert_type: 'Temporary Shed Detection', parcel_details: '88/4', taluk: 'Mettur', img: field2, status: 'NEW' },
                { id: 'f3', position: [11.6600, 78.1400], confidence_score: 0.92, alert_type: 'Illegal Material Dumping', parcel_details: '12/B', taluk: 'Omalur', img: field3, status: 'NEW' },
                { id: 'f4', position: [11.6800, 78.1600], confidence_score: 0.96, alert_type: 'Boundary Marker Tampering', parcel_details: '561/1', taluk: 'Attur', img: field4, status: 'NEW' },
                { id: 'f5', position: [11.6500, 78.1300], confidence_score: 0.95, alert_type: 'Commercial Extension', parcel_details: '99/C', taluk: 'Salem South', img: field1, status: 'NEW' }
             ]);
          }
      };
      fetchData();
      const interval = setInterval(fetchData, 5000);
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
      setUser({ role: roleId, name: ROLES[roleId].name, avatar: roleId.slice(0, 2) });
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
      if (activeTab === 'health') return <SystemHealthView />;
      if (activeTab === 'ai-monitoring' || activeTab === 'alerts') return <AIMonitoringView user={user} alerts={alerts} setAlerts={setAlerts} parcels={parcels} onMapClick={handleMapClick} selectedPosition={selectedPosition} />;
      if (activeTab === 'reports') return <ReportsView parcels={parcels} alerts={alerts} />;
      if (activeTab === 'analytics') return <DistrictAnalyticsView alerts={alerts} />;
      if (activeTab === 'recovery') return <RevenueRecoveryView alerts={alerts} />;
      if (activeTab === 'approvals') return <ApprovalsHubView user={user} alerts={alerts} setAlerts={setAlerts} />;
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
      if (activeTab === 'enforcement') return <EnforcementTrackingView alerts={alerts} />;
      if (activeTab === 'settings') return <SettingsView />;
      if (activeTab === 'legal') return <LegalCoordinationView alerts={alerts} />;

      if (activeTab === 'dashboard') {
         if (user.role === 'COLLECTOR') return <CollectorExecutiveView parcels={parcels} alerts={alerts} setAlerts={setAlerts} onTabChange={setActiveTab} />;
         if (user.role === 'TAHSILDAR') return <TalukExecutiveView parcels={parcels} alerts={alerts} setAlerts={setAlerts} onTabChange={setActiveTab} />;
         if (user.role === 'VAO') return <VillageExecutiveView parcels={parcels} alerts={alerts} setAlerts={setAlerts} />;
         if (user.role === 'INSPECTOR') return <InspectorExecutiveView parcels={parcels} alerts={alerts} setAlerts={setAlerts} />;
         return <DashboardView parcels={parcels} alerts={alerts} setAlerts={setAlerts} onExport={handleExport} onMapClick={handleMapClick} gisAttributes={gisAttributes} selectedPosition={selectedPosition} />;
      }

      if (activeTab === 'map') return <DistrictMapView parcels={parcels} alerts={alerts} onExport={handleExport} onMapClick={handleMapClick} selectedPosition={selectedPosition} />;

      if (activeTab.includes('overview') || activeTab.includes('view') || activeTab.includes('zoning')) return <DashboardView parcels={parcels} alerts={alerts} setAlerts={setAlerts} onExport={handleExport} onMapClick={handleMapClick} gisAttributes={gisAttributes} selectedPosition={selectedPosition} />;

      // Operational Lists
      if (activeTab === 'users') return <OperationalListView title="Officer Management Matrix" icon={Users} onActionClick={() => setSubView('onboard')} columns={['Officer Identity', 'Department', 'Access Level', 'Operational Status']} data={[{ n: 'Rajesh Kumar', r: 'Salem West', a: 'Level 4', s: 'Active' }, { n: 'S. Priya', r: 'Mettur Node', a: 'Level 3', s: 'In Field' }, { n: 'M. Karthik', r: 'Taluk-HQ', a: 'Level 5', s: 'Standby' }]} actionLabel="Onboard Officer" />;
      if (activeTab === 'logs') return <OperationalListView title="Tactical Audit Trail" icon={History} columns={['Timestamp', 'Identity', 'Operational Event', 'Outcome']} data={[{ t: '12:44:01', u: 'ADMIN-NODE', a: 'Security Protocol Update', s: 'Success' }, { t: '10:12:44', u: 'VAO-Mettur', a: 'Land Record Access', s: 'Logged' }, { t: '09:42:00', u: 'AI-Engine', a: 'Auto-Detection Sync', s: 'Verified' }]} />;
      if (activeTab === 'parcels' || activeTab === 'records' || activeTab === 'add' || activeTab === 'edit' || activeTab === 'public-records' || activeTab === 'field-reports') return <OperationalListView title="Land Records & Registry" icon={FileText} columns={['Survey No', 'Patta', 'Ownership', 'Status']} data={[{ s: '142/A', p: 'P-882', o: 'Anbazhagan', st: 'Verified' }, { s: '88/4', p: 'P-901', o: 'Kavitha', st: 'Active Alert' }]} actionLabel="New Registry" />;
      if (activeTab === 'cases' || activeTab === 'notices' || activeTab === 'tracking' || activeTab === 'grievances') return <OperationalListView title="Public Grievances & Cases" icon={MessageSquare} columns={['Source', 'Subject', 'Department', 'Status']} data={[{ id: 'CM-901', t: 'Land Dispute - Omalur', o: 'Revenue-Salem', s: 'High Priority' }, { id: 'COURT-22', t: 'Stay Order Review', o: 'Legal-Node', s: 'Pending' }]} />;
      if (activeTab === 'tasks' || activeTab === 'survey-tasks') return <OperationalListView title="Operational Tasking" icon={ClipboardCheck} columns={['Task ID', 'Village', 'Directive', 'Deadline']} data={[{ id: 'T-441', v: 'Omalur', s: 'Physical Verification', d: 'Today' }]} />;
      if (activeTab === 'directives') return <FormView title="Strategic Action Directive" icon={Zap} fields={[{ label: 'Target Taluk', placeholder: 'e.g. Salem West' }, { label: 'Directive Code', placeholder: 'e.g. EVICTION-44' }, { label: 'Immediate Action Required', placeholder: 'Details of the order...' }]} />;

      return <DashboardView parcels={parcels} alerts={alerts} setAlerts={setAlerts} onExport={handleExport} onMapClick={handleMapClick} gisAttributes={gisAttributes} />;
   };

   if (!user) {
      return (
         <div className="h-screen w-full flex items-center justify-center bg-slate-100 font-jakarta p-4 sm:p-6 overflow-hidden">
            <div className="w-full max-w-[1000px] flex flex-col md:flex-row h-full md:h-[650px] bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden overflow-y-auto custom-scrollbar text-left">
               <div className="w-full md:w-[35%] p-8 sm:p-12 flex flex-col justify-center border-b md:border-b-0 md:border-r border-slate-100 bg-slate-50 shrink-0">
                  <div className="mb-6 md:mb-10">
                     <div className="bg-blue-600 w-12 h-12 rounded-lg text-white flex items-center justify-center shadow-lg mb-4 md:mb-6"><ShieldAlert size={28} /></div>
                     <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 uppercase leading-none">GeoCommand</h2>
                     <p className="text-slate-500 text-[9px] md:text-[10px] font-bold mt-2 uppercase tracking-widest">Government of Tamil Nadu</p>
                  </div>
                  <div className="space-y-3 md:space-y-4">
                     <input type="email" placeholder="Officer Identity" className="w-full bg-white border border-slate-200 rounded px-4 py-3 text-sm focus:border-blue-500 transition-all outline-none" />
                     <input type="password" placeholder="Security Key" className="w-full bg-white border border-slate-200 rounded px-4 py-3 text-sm focus:border-blue-500 transition-all shadow-sm outline-none" />
                     <button onClick={() => handleDemoLogin('ADMIN')} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 md:py-4 rounded font-bold shadow-md transition-all active:scale-[0.98] mt-2 md:mt-4 flex items-center justify-center gap-2 text-[10px] md:text-xs uppercase tracking-widest">Sign In</button>
                  </div>
               </div>
               <div className="flex-1 bg-white p-6 sm:p-12 flex flex-col min-h-[400px]">
                  <div className="mb-6 md:mb-8"><h2 className="text-lg md:text-xl font-bold text-slate-800 uppercase text-center tracking-tight">Administrative Portals</h2></div>
                  <div className="flex justify-center gap-1 mb-6 md:mb-8 bg-slate-100 p-1 rounded w-fit mx-auto border border-slate-200 flex-wrap">
                     {CATEGORIES.map(cat => (
                        <button key={cat} onClick={() => setLoginCat(cat)} className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded text-[9px] sm:text-[10px] font-bold uppercase tracking-widest transition-all ${loginCat === cat ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-white hover:shadow-sm'}`}>{cat}</button>
                     ))}
                  </div>
                  <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                        {Object.entries(ROLES).filter(([_, r]) => r.cat === loginCat).map(([id, role]) => (
                           <button key={id} onClick={() => handleDemoLogin(id)} className="p-3 sm:p-4 bg-white border border-slate-200 rounded hover:border-blue-500 hover:bg-blue-50 transition-all group flex items-center gap-3 sm:gap-4 shadow-sm text-left">
                              <div className={`p-1.5 sm:p-2 rounded bg-white border border-slate-100 ${role.color} group-hover:scale-110 transition-transform shrink-0`}><role.icon size={16} /></div>
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
      <div className="flex h-screen bg-slate-100 font-jakarta text-sm antialiased text-slate-800 relative overflow-hidden">
         {/* Mobile Sidebar Overlay */}
         {isSidebarOpen && (
            <div className="fixed inset-0 bg-slate-900/40 z-[1900] lg:hidden backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsSidebarOpen(false)}></div>
         )}

         {/* Sidebar */}
         <aside className={`fixed inset-y-0 left-0 lg:static w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 z-[2000] shadow-sm transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
            <div className="p-6 flex items-center justify-between border-b border-slate-100">
               <div className="flex items-center gap-3" onClick={() => setActiveTab('dashboard')} style={{ cursor: 'pointer' }}>
                  <div className="bg-blue-600 p-2 rounded text-white shadow-md"><ShieldAlert size={20} /></div>
                  <div>
                     <h1 className="font-extrabold text-sm tracking-tighter text-slate-900 uppercase">GeoCommand</h1>
                     <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Salem District</p>
                  </div>
               </div>
               <button className="lg:hidden p-1 text-slate-400 hover:text-slate-800" onClick={() => setIsSidebarOpen(false)}><X size={20} /></button>
            </div>
            <nav className="flex-1 overflow-y-auto custom-scrollbar pb-10">
               {MENU_STRUCTURE[user.role].map((item, idx) => (
                  item.type === 'header' ? (
                     <p key={idx} className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-6 mb-2 px-6">{item.label}</p>
                  ) : (
                     <button key={item.id} onClick={() => { setActiveTab(item.id); setSubView(null); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-6 py-3.5 transition-all duration-200 group relative ${activeTab === item.id ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-600 font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
                        <item.icon size={18} className={activeTab === item.id ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'} />
                        <span className="flex-1 text-left text-[11px] uppercase tracking-wider">{item.label}</span>
                        {item.badge && <span className="bg-blue-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow-sm">{item.badge}</span>}
                     </button>
                  )
               ))}
            </nav>
            <div className="p-4 border-t border-slate-100 mt-auto bg-slate-50">
               <div className="flex items-center gap-3 mb-4 px-2">
                  <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-xs shadow-sm">{user.avatar}</div>
                  <div className="flex-1 min-w-0">
                     <p className="text-xs font-bold text-slate-800 truncate uppercase">{user.name.split(' ')[0]}</p>
                     <p className="text-[9px] font-medium text-slate-500 uppercase">{user.role}</p>
                  </div>
               </div>
               <button onClick={() => setUser(null)} className="w-full flex items-center justify-center gap-2 py-2.5 bg-white border border-slate-200 rounded text-slate-500 hover:text-red-600 transition-all font-bold text-[10px] uppercase shadow-sm group">
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
                     <button onClick={() => setLang(lang === 'EN' ? 'தமிழ்' : 'EN')} className="px-2 sm:px-3 py-1.5 sm:py-2 bg-slate-50 border border-slate-200 rounded text-[9px] sm:text-[10px] font-black text-blue-600 uppercase tracking-widest">{lang}</button>
                     <div className="hidden sm:block w-px h-6 bg-slate-200 mx-2"></div>
                     <button onClick={() => setActiveTab('profile')} className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded text-[9px] sm:text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-1 sm:gap-2 ${activeTab === 'profile' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}><Users size={14} /><span className="hidden sm:inline">Profile</span></button>
                  </div>
                  <button className="p-2 text-slate-500 hover:text-blue-600 transition-all relative"><Bell size={20} /><span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-600 rounded-full border border-white"></span></button>
               </div>
            </header>

            <div className="flex-1 overflow-y-auto p-1 sm:p-2 scroll-smooth bg-slate-100 custom-scrollbar">
               {renderActiveView()}
            </div>
         </main>
      </div>
   );
}

