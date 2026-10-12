import React, { useMemo, useState, useRef } from 'react';
import { 
  Zap, Monitor, MapPin, Activity, Users, Truck, CheckCircle2, 
  Globe, Target, Navigation, History, Camera, Cpu, ArrowRight, ChevronLeft, Map 
} from 'lucide-react';
import site1 from './assets/site1.png';
import site2 from './assets/site2.png';
import site3 from './assets/site3.png';
import site4 from './assets/site4.png';
import enc1 from './assets/encroachment_1_1776786774942.png';
import enc2 from './assets/encroachment_2_1776786789882.png';
import enc3 from './assets/encroachment_3_1776786808071.png';
import enc4 from './assets/encroachment_4_1776786823398.png';

const SECTORS = [
   { id: 'S1', name: 'Salem West - Sector A', before: site1, after: enc1, coords: '11.6643° N, 78.1460° E' },
   { id: 'S2', name: 'Mettur Dam - North', before: site2, after: enc2, coords: '11.7865° N, 77.8012° E' },
   { id: 'S3', name: 'Omalur Junction', before: site3, after: enc3, coords: '11.7452° N, 78.0432° E' },
   { id: 'S4', name: 'Attur Bypass', before: site4, after: enc4, coords: '11.5982° N, 78.6011° E' },
];

// --- SHARED COMPONENTS ---
const Badge = ({ children, variant = 'info', className = '' }) => {
   const styles = {
      info: 'bg-blue-100 text-blue-700 border-blue-200',
      success: 'bg-green-100 text-green-700 border-green-200',
      danger: 'bg-red-100 text-red-700 border-red-200',
      warning: 'bg-orange-100 text-orange-700 border-orange-200',
   };
   return (
      <span className={`px-2 py-0.5 rounded-none border text-[8px] font-black uppercase tracking-widest ${styles[variant]} ${className}`}>
         {children}
      </span>
   );
};

const Card = ({ children, title, icon: Icon, action, className = "" }) => (
   <div className={`bg-white border border-slate-200 rounded-none shadow-sm overflow-hidden flex flex-col ${className}`}>
      <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
         <div className="flex items-center gap-2">
            {Icon && <Icon size={14} className="text-blue-600" />}
            <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{title}</h3>
         </div>
         {action}
      </div>
      <div className="flex-1">
         {children}
      </div>
   </div>
);

// --- SATELLITE COMPARISON SLIDER ---
const SatelliteComparisonSlider = () => {
   const [sliderPos, setSliderPos] = useState(50);
   const [activeSector, setActiveSector] = useState(SECTORS[0]);
   const containerRef = useRef(null);
   const dragging = useRef(false);

   const handleMove = (clientX) => {
      if (!dragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      setSliderPos((x / rect.width) * 100);
   };

   return (
      <div className="space-y-4">
         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
               <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-blue-600 rounded-none inline-block"></span>
                  Active Sector: {activeSector.name}
               </p>
               <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1 ml-4">{activeSector.coords} · LATEST_SYNC: 2M AGO</p>
            </div>
            <div className="flex bg-slate-100 p-1 rounded-none border border-slate-200">
               {SECTORS.map(s => (
                  <button 
                     key={s.id} 
                     onClick={() => setActiveSector(s)}
                     className={`px-3 py-1 text-[8px] font-black uppercase tracking-widest transition-all ${activeSector.id === s.id ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-900'}`}
                  >
                     {s.id}
                  </button>
               ))}
            </div>
         </div>

         <div className="flex justify-between items-center bg-slate-50 border-x border-t border-slate-200 px-4 py-2">
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
               <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse inline-block"></span>
               Temporal Intelligence Analysis · Drag to Compare
            </p>
            <div className="flex gap-4 text-[8px] font-black uppercase">
               <span className="text-slate-400 flex items-center gap-1.5"><div className="w-2.5 h-1.5 bg-slate-400"></div>2023 BASELINE</span>
               <span className="text-blue-600 flex items-center gap-1.5"><div className="w-2.5 h-1.5 bg-blue-600"></div>CURRENT SCAN</span>
            </div>
         </div>

         <div
            ref={containerRef}
            className="relative h-[400px] lg:h-[500px] w-full bg-slate-900 overflow-hidden cursor-col-resize select-none rounded-none border-2 border-slate-900 shadow-2xl"
            onMouseMove={(e) => handleMove(e.clientX)}
            onMouseUp={() => { dragging.current = false; }}
            onMouseLeave={() => { dragging.current = false; }}
            onTouchMove={(e) => { dragging.current = true; handleMove(e.touches[0].clientX); }}
            onTouchEnd={() => { dragging.current = false; }}
         >
            {/* AFTER image — full base layer */}
            <img src={activeSector.after} className="absolute inset-0 w-full h-full object-cover" alt="After" />
            <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-2">
               <div className="bg-blue-600/90 backdrop-blur text-white px-3 py-1.5 text-[9px] font-black uppercase tracking-widest border border-blue-400/30 shadow-2xl">
                  ⚠ CURRENT · CHANGE DETECTED
               </div>
               <div className="bg-black/80 backdrop-blur text-white px-2 py-1 text-[7px] font-mono uppercase tracking-widest border border-white/5">
                  PROBABILITY: 94.2%
               </div>
            </div>

            {/* BEFORE image — clipped to left side of slider */}
            <div
               className="absolute inset-0 overflow-hidden"
               style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
            >
               <img src={activeSector.before} className="w-full h-full object-cover filter grayscale brightness-90 contrast-125" alt="Before" />
               <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur text-white px-3 py-1.5 text-[9px] font-black uppercase tracking-widest border border-white/10 shadow-2xl">
                  ARCHIVE · 2023 BASELINE
               </div>
               {/* Grid overlay for tactical feel */}
               <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]"></div>
               <div className="absolute inset-0 pointer-events-none" style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.05) 2px, rgba(0,0,0,0.05) 4px)' }}></div>
            </div>

            {/* Slider handle */}
            <div
               className="absolute inset-y-0 z-20 flex flex-col items-center justify-center"
               style={{ left: `${sliderPos}%`, transform: 'translateX(-50%)' }}
               onMouseDown={() => { dragging.current = true; }}
               onTouchStart={() => { dragging.current = true; }}
            >
               <div className="w-0.5 h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)]"></div>
               <div className="absolute w-12 h-12 bg-white rounded-none shadow-2xl flex flex-col items-center justify-center border-4 border-slate-900 cursor-col-resize hover:scale-110 transition-all">
                  <div className="flex gap-0.5">
                     <div className="w-1 h-4 bg-blue-600"></div>
                     <div className="w-1 h-4 bg-blue-600"></div>
                  </div>
               </div>
            </div>

            {/* Tactical Metadata Overlays */}
            <div className="absolute bottom-4 left-4 z-10 flex gap-2">
               <div className="bg-black/90 px-3 py-2 border-l-2 border-blue-600">
                  <p className="text-[7px] font-black text-blue-400 uppercase tracking-widest">Spectral_Band</p>
                  <p className="text-[10px] font-black text-white uppercase tracking-tighter">B04_RED_EDGE</p>
               </div>
               <div className="bg-black/90 px-3 py-2 border-l-2 border-green-500">
                  <p className="text-[7px] font-black text-green-400 uppercase tracking-widest">Resolution</p>
                  <p className="text-[10px] font-black text-white uppercase tracking-tighter">0.3M_GSD</p>
               </div>
            </div>

            <div className="absolute bottom-4 right-4 z-10 bg-black/90 px-4 py-2 border border-white/10 text-right">
               <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Sentinel-2 Uplink</p>
               <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest animate-pulse">● AI_LIVE_STREAM</p>
            </div>
         </div>
      </div>
   );
};

// --- AI DETECTION LOGIC VIEW ---
export const AIDetectionLogicView = () => {
   const steps = [
      { id: 'S1', title: 'Satellite Acquisition', desc: 'Pulling 30cm resolution multi-spectral imagery from Sentinel-2 & Cartosat-3.', status: 'COMPLETED', time: '0.4s' },
      { id: 'S2', title: 'Change Detection', desc: 'Comparing current feed against baseline cadastral geometry (Govt. Registry).', status: 'COMPLETED', time: '1.2s' },
      { id: 'S3', title: 'Object Classification', desc: 'CNN Analysis: Identified 85% probability of permanent RCC structure.', status: 'ACTIVE', time: 'RUNNING' },
      { id: 'S4', title: 'Legal Validation', desc: 'Cross-referencing against Patta database for valid planning permission.', status: 'PENDING', time: 'WAIT' },
   ];

   return (
      <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
         {/* Satellite Temporal Comparison */}
         <Card title="Temporal Satellite Change Detection · Drag Slider to Compare" icon={Globe}>
            <div className="p-4">
               <SatelliteComparisonSlider />
            </div>
         </Card>

         <div className="grid grid-cols-12 gap-6">
         <div className="col-span-12 lg:col-span-8 space-y-6">
            <Card title="Live AI Inference Pipeline" icon={Cpu}>
               <div className="p-6 bg-slate-900 aspect-video relative flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:20px_20px]"></div>
                  <div className="z-10 w-full max-w-2xl space-y-8">
                     <div className="flex justify-between items-center">
                        {steps.map((s, idx) => (
                           <React.Fragment key={s.id}>
                              <div className="flex flex-col items-center gap-3 relative group">
                                 <div className={`w-12 h-12 rounded-none border-2 flex items-center justify-center transition-all ${s.status === 'ACTIVE' ? 'border-blue-500 bg-blue-500/20 animate-pulse' : s.status === 'COMPLETED' ? 'border-green-500 bg-green-500/20' : 'border-slate-700 bg-slate-800'}`}>
                                    {s.status === 'COMPLETED' ? <CheckCircle2 size={20} className="text-green-500" /> : <span className="text-xs font-black text-white">{s.id}</span>}
                                 </div>
                                 <p className="text-[8px] font-black text-white uppercase tracking-tighter absolute -bottom-6 w-24 text-center">{s.title}</p>
                              </div>
                              {idx < steps.length - 1 && <div className={`flex-1 h-0.5 ${idx === 1 ? 'bg-gradient-to-r from-green-500 to-blue-500' : s.status === 'COMPLETED' ? 'bg-green-500' : 'bg-slate-700'}`}></div>}
                           </React.Fragment>
                        ))}
                     </div>
                     <div className="bg-black/40 backdrop-blur-md p-6 border border-white/10 rounded-none mt-12">
                        <div className="flex justify-between items-start mb-4">
                           <div>
                              <h4 className="text-blue-400 text-xs font-black uppercase">Current Operation</h4>
                              <p className="text-white text-lg font-bold">Incursion Verification Node #441</p>
                           </div>
                           <Badge variant="danger" className="animate-pulse">Active Threat Detection</Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 border-t border-white/5 pt-4">
                           <div><p className="text-slate-500 text-[8px] uppercase font-bold">Confidence</p><p className="text-xl font-black text-white">94.2%</p></div>
                           <div><p className="text-slate-500 text-[8px] uppercase font-bold">Area Scope</p><p className="text-xl font-black text-white">1,240 SQM</p></div>
                           <div><p className="text-slate-500 text-[8px] uppercase font-bold">Prediction</p><p className="text-xl font-black text-white">Illegal Const.</p></div>
                        </div>
                     </div>
                  </div>
               </div>
            </Card>
         </div>

         <div className="col-span-12 lg:col-span-4 space-y-6">
            <Card title="Neural Logs" icon={Zap}>
               <div className="p-4 space-y-3 font-mono">
                  {steps.map(s => (
                     <div key={s.id} className="p-3 bg-slate-50 border border-slate-100 flex justify-between items-center group hover:border-blue-300 transition-all">
                        <div>
                           <p className="text-[10px] font-black text-slate-800 uppercase tracking-tight">{s.title}</p>
                           <p className="text-[8px] text-slate-500 mt-0.5 leading-relaxed">{s.desc}</p>
                        </div>
                        <div className="text-right">
                           <p className={`text-[9px] font-black ${s.status === 'ACTIVE' ? 'text-blue-600' : 'text-slate-400'}`}>{s.time}</p>
                           <ArrowRight size={10} className="text-slate-300 ml-auto mt-1 group-hover:translate-x-1 transition-transform" />
                        </div>
                     </div>
                  ))}
               </div>
            </Card>
            <div className="bg-blue-600 p-6 rounded-none text-white shadow-xl relative overflow-hidden">
               <div className="absolute -right-4 -bottom-4 opacity-10"><Target size={120} /></div>
               <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 opacity-80">Mission Directive</h4>
               <p className="text-lg font-bold leading-tight">Authorize field drone dispatch for high-resolution visual evidence.</p>
               <button className="mt-4 w-full py-2 bg-white text-blue-600 font-black text-[9px] uppercase tracking-widest shadow-lg hover:bg-slate-100 transition-all">Dispatch Node</button>
            </div>
         </div>
         </div>
      </div>
   );
};

// --- MOCK DISTRICT DATA ---
const DISTRICTS_DATA = [
   { name: 'Salem', activeNodes: 42, alerts: 12, status: 'HIGH_ACTIVITY' },
   { name: 'Chennai', activeNodes: 128, alerts: 56, status: 'CRITICAL' },
   { name: 'Coimbatore', activeNodes: 85, alerts: 24, status: 'MODERATE' },
   { name: 'Madurai', activeNodes: 64, alerts: 8, status: 'STABLE' },
   { name: 'Tiruchirappalli', activeNodes: 38, alerts: 4, status: 'STABLE' },
   { name: 'Tirunelveli', activeNodes: 45, alerts: 15, status: 'MODERATE' },
   { name: 'Erode', activeNodes: 52, alerts: 21, status: 'HIGH_ACTIVITY' },
   { name: 'Vellore', activeNodes: 31, alerts: 6, status: 'STABLE' },
];

const TALUK_NODES = {
   'Salem': [
      { id: 'F1', name: 'Officer Rajesh', task: 'Site Verification', loc: 'Omalur', battery: '82%', status: 'MOVING' },
      { id: 'F2', name: 'Inspector Priya', task: 'Evidence Capture', loc: 'Salem West', battery: '45%', status: 'ON_SITE' },
      { id: 'F3', name: 'Surveyor Kumar', task: 'Boundary Mapping', loc: 'Mettur', battery: '91%', status: 'IDLE' },
      { id: 'F4', name: 'Inspector Ramesh', task: 'Drone Recon', loc: 'Attur', battery: '60%', status: 'MOVING' },
   ],
   // fallback for other districts
   'Default': [
      { id: 'D1', name: 'Unit Alpha', task: 'Patrol', loc: 'Sector 1', battery: '100%', status: 'IDLE' },
      { id: 'D2', name: 'Unit Beta', task: 'Recon', loc: 'Sector 2', battery: '75%', status: 'MOVING' },
   ]
};

const VILLAGE_NODES = {
   'Salem West': [
      { id: 'V1', name: 'VAO Suramangalam', task: 'Field Verification', loc: 'Suramangalam Village', battery: '82%', status: 'MOVING' },
      { id: 'V2', name: 'Inspector Priya', task: 'Evidence Collection', loc: 'Meyyanur Village', battery: '45%', status: 'ON_SITE' },
      { id: 'V3', name: 'Surveyor Dass', task: 'Boundary Mapping', loc: 'Reddipatti Village', battery: '91%', status: 'IDLE' },
   ],
   'Mettur': [
      { id: 'V4', name: 'VAO Kolathur', task: 'Site Inspection', loc: 'Kolathur Village', battery: '65%', status: 'ON_SITE' },
      { id: 'V5', name: 'Inspector Gopi', task: 'Reconnaissance', loc: 'Mecheri Village', battery: '88%', status: 'MOVING' },
      { id: 'V6', name: 'Survey Team 4', task: 'Land Survey', loc: 'Nangavalli Village', battery: '100%', status: 'IDLE' },
   ],
   'Attur': [
      { id: 'V7', name: 'VAO Thammampatti', task: 'Patrol', loc: 'Thammampatti Village', battery: '95%', status: 'MOVING' },
      { id: 'V8', name: 'Inspector Raja', task: 'Encroachment Check', loc: 'Gangavalli Village', battery: '50%', status: 'ON_SITE' }
   ],
   'Default': [
      { id: 'V9', name: 'Patrol Unit', task: 'General Patrol', loc: 'Central Village', battery: '100%', status: 'IDLE' },
      { id: 'V10', name: 'Survey Unit', task: 'Measurement', loc: 'North Village', battery: '80%', status: 'MOVING' }
   ]
};

export const FieldOpsMonitorView = ({ user, selectedRegion: propRegion, setSelectedRegion: propSetRegion }) => {
   const [localRegion, setLocalRegion] = useState(null);
   const selectedRegion = propRegion !== undefined ? propRegion : localRegion;
   const setSelectedRegion = propSetRegion !== undefined ? propSetRegion : setLocalRegion;

   const isCollector = user?.role === 'COLLECTOR';
   const isTahsildar = user?.role === 'TAHSILDAR';
   const isDistrictLevel = isCollector || isTahsildar;
   const userDistrict = isDistrictLevel ? (user?.district || 'Salem') : null;

   const salemTaluks = [
      { name: 'Salem West', activeNodes: 12, alerts: 3, status: 'HIGH_ACTIVITY' },
      { name: 'Salem South', activeNodes: 8, alerts: 1, status: 'STABLE' },
      { name: 'Mettur', activeNodes: 15, alerts: 5, status: 'CRITICAL' },
      { name: 'Omalur', activeNodes: 4, alerts: 0, status: 'STABLE' },
      { name: 'Attur', activeNodes: 9, alerts: 2, status: 'MODERATE' },
      { name: 'Edappadi', activeNodes: 5, alerts: 1, status: 'STABLE' },
      { name: 'Yercaud', activeNodes: 3, alerts: 0, status: 'STABLE' },
   ];

   const nodes = useMemo(() => {
      if (!selectedRegion) return [];
      if (isDistrictLevel) {
         return VILLAGE_NODES[selectedRegion] || VILLAGE_NODES['Default'];
      }
      return TALUK_NODES[selectedRegion] || TALUK_NODES['Default'];
   }, [selectedRegion, isDistrictLevel]);

   // State/District Overview Grid
   if (!selectedRegion) {
      const gridData = isDistrictLevel ? salemTaluks : DISTRICTS_DATA;
      const title = isDistrictLevel ? `${userDistrict} DISTRICT COMMAND` : 'STATE COMMAND OVERVIEW';
      const subtitle = isDistrictLevel ? 'Active Taluk-Level Deployments' : 'Active Statewide Field Deployments';
      
      return (
         <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            <div className="flex justify-between items-center bg-slate-900 p-6 text-white border border-slate-700">
               <div>
                  <h2 className="text-2xl font-black uppercase tracking-widest flex items-center gap-3">
                     <Globe className="text-blue-500" /> {title}
                  </h2>
                  <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{subtitle}</p>
               </div>
               <div className="text-right">
                  <p className="text-3xl font-black text-blue-500">{gridData.reduce((acc, curr) => acc + curr.activeNodes, 0)}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total Active Nodes</p>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               {gridData.map((item) => (
                  <div 
                     key={item.name}
                     onClick={() => setSelectedRegion(item.name)}
                     className="bg-white border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-500 transition-all cursor-pointer group flex flex-col"
                  >
                     <div className="p-5 border-b border-slate-100 flex justify-between items-start">
                        <div>
                           <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest group-hover:text-blue-600 transition-colors">{item.name}</h3>
                           <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">{isDistrictLevel ? 'Taluk Command' : 'District Command'}</p>
                        </div>
                        <Badge variant={item.status === 'CRITICAL' ? 'danger' : item.status === 'HIGH_ACTIVITY' ? 'warning' : 'success'}>
                           {item.status}
                        </Badge>
                     </div>
                     <div className="p-5 bg-slate-50 flex-1 grid grid-cols-2 gap-4">
                        <div>
                           <p className="text-[9px] font-bold text-slate-400 uppercase">Deployed</p>
                           <p className="text-xl font-black text-slate-800 flex items-center gap-2"><Users size={14} className="text-blue-500"/> {item.activeNodes}</p>
                        </div>
                        <div>
                           <p className="text-[9px] font-bold text-slate-400 uppercase">Alerts</p>
                           <p className="text-xl font-black text-slate-800 flex items-center gap-2"><Target size={14} className="text-red-500"/> {item.alerts}</p>
                        </div>
                     </div>
                  </div>
               ))}
            </div>
         </div>
      );
   }

   // District Detail View
   return (
      <div className="space-y-6 animate-in slide-in-from-right-8 duration-500 pb-10">
         {/* Detail Header with Back Button */}
         <div className="flex items-center justify-between bg-slate-900 p-4 text-white border border-slate-700">
            <div className="flex items-center gap-4">
               <button 
                  onClick={() => setSelectedRegion(null)}
                  className="p-2 bg-white/10 hover:bg-blue-600 transition-all flex items-center justify-center rounded-none"
               >
                  <ChevronLeft size={20} />
               </button>
               <div>
                  <h2 className="text-xl font-black uppercase tracking-widest flex items-center gap-3">
                     <Map className="text-blue-500" size={20} /> {selectedRegion} {isDistrictLevel ? 'TALUK COMMAND' : 'DISTRICT COMMAND'}
                  </h2>
                  <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">{isDistrictLevel ? 'Village-Level Tactical View' : 'Taluk-Level Tactical View'}</p>
               </div>
            </div>
            <div className="flex gap-2">
               <Badge variant="success">UPLINK_SECURE</Badge>
               <Badge variant="info">{nodes.length}_NODES_ACTIVE</Badge>
            </div>
         </div>

         <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-9 space-y-6">
               <Card title={`${selectedRegion} Tactical Map`} icon={Globe}>
                  <div 
                     className="h-[400px] bg-slate-100 relative group overflow-hidden border border-slate-200"
                     style={{ backgroundImage: "url('/tactical_map_bg_realistic.png')", backgroundSize: 'cover', backgroundPosition: 'center' }}
                  >
                     <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[0.5px]"></div>
                     <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-blue-500/30 rounded-full animate-ping duration-3000"></div>
                     <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] border border-blue-500/40 rounded-full animate-pulse"></div>

                     {nodes.map((n, i) => (
                        <div key={n.id} style={{ top: `${30 + (i * 15)}%`, left: `${35 + (i * 20)}%` }} className="absolute z-10 group cursor-pointer">
                           <div className="relative">
                              <div className={`p-2 rounded-none shadow-xl border-2 flex items-center justify-center transition-all ${n.status === 'ON_SITE' ? 'bg-red-600 border-white text-white animate-bounce' : 'bg-white border-blue-600 text-blue-600 hover:scale-110'}`}>
                                 {n.status === 'ON_SITE' ? <Camera size={14} /> : <MapPin size={14} />}
                              </div>
                              <div className="absolute left-full ml-3 top-0 whitespace-nowrap bg-white/90 backdrop-blur p-2 border border-slate-200 shadow-xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none translate-x-2 group-hover:translate-x-0">
                                 <p className="text-[9px] font-black text-slate-900 uppercase tracking-tighter">{n.name}</p>
                                 <p className="text-[8px] font-bold text-blue-600 mt-0.5">{n.task}</p>
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>
               </Card>

               {/* Grouping Nodes by Taluk/Village */}
               <div className="space-y-4">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 border-b border-slate-200 pb-2">
                     <Target size={14} className="text-blue-600" /> {isDistrictLevel ? 'Village Deployment' : 'Taluk Deployment'}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {nodes.map(n => (
                        <Card key={n.id} title={n.name} icon={Users} action={<Badge variant={n.status === 'ON_SITE' ? 'danger' : 'success'}>{n.status}</Badge>}>
                           <div className="p-4 space-y-4">
                              <div className="flex justify-between items-end">
                                 <div>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase">Location</p>
                                    <p className="text-sm font-black text-slate-800">{n.loc}</p>
                                 </div>
                                 <div className="text-right">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Energy</p>
                                    <p className="text-xs font-black text-green-600">{n.battery}</p>
                                 </div>
                              </div>
                              <div className="w-full h-1 bg-slate-100 overflow-hidden"><div className="h-full bg-blue-600 transition-all" style={{ width: n.battery }}></div></div>
                              <div className="pt-2 flex gap-2">
                                 <button onClick={() => alert(`Routing to ${n.name} at ${n.loc} via secure GPS uplink...`)} className="flex-1 py-2 bg-slate-900 text-white text-[8px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2"><Navigation size={10} /> Route</button>
                                 <button onClick={() => alert(`Establishing secure communication channel with ${n.name}...`)} className="flex-1 py-2 bg-blue-50 text-blue-600 text-[8px] font-black uppercase tracking-widest border border-blue-100 hover:bg-blue-100 transition-all flex items-center justify-center gap-2"><Activity size={10} /> Comms</button>
                              </div>
                           </div>
                        </Card>
                     ))}
                  </div>
               </div>
            </div>

            <div className="col-span-12 lg:col-span-3 space-y-6">
               <Card title="Ops Timeline" icon={History}>
                  <div className="p-4 space-y-6">
                     {[
                        { t: '09:42 AM', m: `Incursion Verified at ${selectedRegion} Sector`, i: MapPin, c: 'text-red-600' },
                        { t: '09:15 AM', m: 'Officer arrived at site', i: Users, c: 'text-blue-600' },
                        { t: '08:30 AM', m: `Sat-Scan completed (${selectedRegion})`, i: Globe, c: 'text-green-600' },
                        { t: '07:45 AM', m: 'System initialized v2.5', i: Cpu, c: 'text-slate-400' },
                     ].map((log, idx) => (
                        <div key={idx} className="flex gap-4 relative">
                           {idx < 3 && <div className="absolute left-[7px] top-[18px] bottom-[-24px] w-[1px] bg-slate-200"></div>}
                           <div className={`w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm shrink-0 mt-1 z-10 bg-white flex items-center justify-center`}><log.i size={8} className={log.c} /></div>
                           <div>
                              <p className="text-[8px] font-black text-slate-400">{log.t}</p>
                              <p className="text-[10px] font-bold text-slate-700 leading-tight mt-0.5">{log.m}</p>
                           </div>
                        </div>
                     ))}
                  </div>
               </Card>

               <div className="bg-slate-900 p-6 rounded-none text-white space-y-6 relative overflow-hidden border border-white/10">
                  <div className="absolute -left-10 -bottom-10 opacity-5 rotate-12"><Navigation size={200} /></div>
                  <div>
                     <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-1">Local Command</h4>
                     <p className="text-xl font-bold leading-tight">Broadcast directives to active {selectedRegion} units.</p>
                  </div>
                  <textarea className="w-full bg-white/5 border border-white/10 rounded-none p-3 text-[10px] text-white focus:border-blue-500 outline-none" placeholder={`Enter high-priority directive for ${selectedRegion}...`}></textarea>
                  <button className="w-full py-3 bg-blue-600 text-white font-black text-[9px] uppercase tracking-widest shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2"><ArrowRight size={12} /> Broadcast Order</button>
               </div>
            </div>
         </div>
      </div>
   );
};
