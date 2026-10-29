import React, { useState } from 'react';
import { 
  Shield, Lock, User, AlertCircle, CheckCircle2, ChevronRight, KeyRound, 
  Zap, Globe, Radio, Eye, EyeOff, Sparkles, Activity, ShieldCheck, MapPin, 
  Check, ArrowRight, Compass, Satellite
} from 'lucide-react';
import { AuthAPI } from '../api/client';

export default function LoginModal({ isOpen, onLoginSuccess }) {
  const [username, setUsername] = useState('tah_salem_west');
  const [password, setPassword] = useState('Demo@TahSalem2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activePreset, setActivePreset] = useState('tah_salem_west');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const demoAccounts = [
    { 
      label: 'Tahsildar (Salem West)', 
      user: 'tah_salem_west', 
      canonical: 'tahsildar_salem_west',
      pass: 'DemoAdmin@2026!', 
      role: 'TAHSILDAR', 
      officer: 'S. Murugan',
      jurisdiction: 'Salem West Taluk',
      badgeColor: 'border-blue-200 text-blue-700 bg-blue-50',
      description: 'Accepts inspections, issues statutory Section 7 & 6 notices, manages local encroachment'
    },
    { 
      label: 'District Collector (Salem)', 
      user: 'col_salem', 
      canonical: 'collector_salem',
      pass: 'DemoAdmin@2026!', 
      role: 'COLLECTOR', 
      officer: 'R. Brindha Devi IAS',
      jurisdiction: 'Salem District Apex',
      badgeColor: 'border-indigo-200 text-indigo-700 bg-indigo-50',
      description: 'District authority over all taluks, issues final Section 6 eviction orders, High Court ATR'
    },
    { 
      label: 'State Apex / CS (Secretariat)', 
      user: 'apex_tn', 
      canonical: 'state_apex_officer',
      pass: 'DemoAdmin@2026!', 
      role: 'STATE_APEX', 
      officer: 'Dr. K. Manivasan IAS',
      jurisdiction: 'Statewide Tamil Nadu',
      badgeColor: 'border-emerald-200 text-emerald-700 bg-emerald-50',
      description: 'Secretariat oversight across 38 districts, statewide land bank protection metrics'
    },
    { 
      label: 'DVAC Auditor (Vigilance)', 
      user: 'dvac_auditor', 
      canonical: 'vigilance_officer',
      pass: 'DemoAdmin@2026!', 
      role: 'VIGILANCE', 
      officer: 'DVAC Audit Division',
      jurisdiction: 'Statutory Audit (Read-Only)',
      badgeColor: 'border-amber-200 text-amber-700 bg-amber-50',
      description: 'Independent audit trail monitoring, anti-corruption registry verification'
    },
    { 
      label: 'Field VAO (Kannankurichi)', 
      user: 'vao_kannan', 
      canonical: 'vao_kannankurichi',
      pass: 'DemoAdmin@2026!', 
      role: 'VAO', 
      officer: 'K. Prakash',
      jurisdiction: 'Kannankurichi Village',
      badgeColor: 'border-cyan-200 text-cyan-700 bg-cyan-50',
      description: 'Ground verification, drone survey telemetry, physical inspection reports'
    },
    { 
      label: 'GIS System Administrator', 
      user: 'admin', 
      canonical: 'admin_gis_officer',
      pass: 'DemoAdmin@2026!', 
      role: 'ADMIN_GIS', 
      officer: 'GIS Operations Core',
      jurisdiction: 'System Core & Layers',
      badgeColor: 'border-purple-200 text-purple-700 bg-purple-50',
      description: 'GeoServer layer synchronizer, Sentinel-2 ingest pipeline, system maintenance'
    },
  ];

  const performLogin = async (targetUser, targetPass) => {
    setLoading(true);
    setErrorMessage('');

    const cleanUser = (targetUser || '').trim();
    try {
      // First attempt with given username
      let data = null;
      try {
        data = await AuthAPI.login(cleanUser, targetPass);
      } catch (firstErr) {
        // Fallback to canonical or alias if 401
        const matched = demoAccounts.find(d => d.user === cleanUser || d.canonical === cleanUser);
        if (matched) {
          const fallbackUser = cleanUser === matched.user ? matched.canonical : matched.user;
          data = await AuthAPI.login(fallbackUser, targetPass);
        } else {
          throw firstErr;
        }
      }

      if (data?.user) {
        onLoginSuccess(data.user);
      }
    } catch (err) {
      const resp = err.response;
      if (resp?.status === 429) {
        setErrorMessage(resp.data?.error || 'Account locked due to consecutive failed login attempts. Please wait 15 minutes.');
      } else if (resp?.status === 401) {
        setErrorMessage(resp.data?.error || 'Invalid credentials. Please click any Quick Demo Preset card on the left to sign in immediately.');
      } else {
        setErrorMessage(resp?.data?.error || 'Failed to authenticate. Verify backend connection (http://localhost:8000).');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!username.trim() || !password) {
      setErrorMessage('Please enter both officer username and password.');
      return;
    }
    performLogin(username, password);
  };

  const handleSelectDemo = (account, autoLaunch = false) => {
    setUsername(account.user);
    setPassword(account.pass);
    setActivePreset(account.user);
    setErrorMessage('');
    if (autoLaunch) {
      performLogin(account.user, account.pass);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs overflow-y-auto p-4 sm:p-6 lg:p-8">
      {/* Ambient Radial Lighting */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(37,99,235,0.08),transparent_65%)] pointer-events-none" />

      {/* Main Command Gateway Container */}
      <div className="relative w-full max-w-5xl rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-500">
        
        {/* Top Telemetry & Status Ribbon */}
        <div className="bg-white px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="relative p-2.5 bg-blue-50 rounded-xl border border-blue-200 text-blue-600 shadow-xs">
              <Shield className="w-6 h-6 text-blue-600" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-600">
                  Government of Tamil Nadu
                </span>
                <span className="text-[9px] px-2 py-0.2 font-mono font-bold rounded bg-blue-50 text-blue-700 border border-blue-200">
                  v2.5 TACTICAL
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-wider uppercase font-jakarta flex items-center gap-2">
                GEOMMAND <span className="text-slate-300 font-light">|</span> <span className="text-slate-600 font-medium text-sm sm:text-base">Land Intelligence Directorate</span>
              </h1>
            </div>
          </div>

          {/* Live Telemetry Chips */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-[10px] text-slate-700 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>SENTINEL-2 LINK: ACTIVE</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-[10px] text-slate-700 font-mono">
              <Radio className="w-3 h-3 text-blue-600" />
              <span>SALEM SECTOR 04</span>
            </div>
          </div>
        </div>

        {/* Dual Panel Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
          
          {/* LEFT COLUMN: 1-Click Role Presets */}
          <div className="lg:col-span-7 p-6 sm:p-8 space-y-4 bg-slate-50/70">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  Verified Officer Profiles (1-Click Launch)
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Click any role card below to instantly launch the secure command console:
                </p>
              </div>
              <span className="hidden sm:inline-flex text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold">
                PROVISIONED
              </span>
            </div>

            {/* Role Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {demoAccounts.map((acc) => {
                const isSelected = activePreset === acc.user;
                return (
                  <div
                    key={acc.user}
                    onClick={() => handleSelectDemo(acc, false)}
                    className={`relative p-3.5 rounded-xl border transition-all cursor-pointer group flex flex-col justify-between ${
                      isSelected 
                        ? 'bg-blue-50/80 border-blue-500 shadow-sm ring-1 ring-blue-500/30' 
                        : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-xs'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${acc.badgeColor} border`}>
                          {acc.role}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {acc.user}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {acc.label}
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium mt-0.5 flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                        <span className="truncate">{acc.jurisdiction}</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 truncate max-w-[120px]">
                        {acc.officer}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectDemo(acc, true);
                        }}
                        className="px-2.5 py-1 bg-blue-50 hover:bg-blue-600 border border-blue-200 hover:border-blue-600 text-blue-700 hover:text-white rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 shadow-xs"
                      >
                        <span>Launch</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Security Compliance Notice */}
            <div className="p-3 rounded-xl bg-white border border-slate-200 text-[10px] text-slate-600 flex items-start gap-2.5 shadow-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-800 font-bold">Statutory Enforcement Scoping: </span>
                All sessions maintain cryptographically signed audit logs under TN Act III of 1905 and High Court of Madras compliance directives.
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Officer Sign In Form */}
          <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between bg-white">
            <div className="space-y-5">
              <div>
                <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-blue-600" />
                  Officer Terminal Authentication
                </h2>
                <p className="text-[11px] text-slate-500 mt-1">
                  Authenticate using your official Revenue Officer credentials:
                </p>
              </div>

              {/* Error Message Alert */}
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Authentication Issue: </span>
                    {errorMessage}
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Officer Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        setErrorMessage('');
                      }}
                      placeholder="e.g. tah_salem_west"
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex justify-between">
                    <span>Officer Security Key / Password</span>
                    <span className="text-[10px] text-blue-600 font-mono font-bold">DemoAdmin@2026!</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <KeyRound className="w-4 h-4 text-slate-400" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setErrorMessage('');
                      }}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold rounded-xl shadow-sm text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Verifying Officer Cryptographic Credentials...</span>
                    </div>
                  ) : (
                    <>
                      <span>SIGN IN TO GEOMMAND CONSOLE</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Bottom Security Seals */}
            <div className="mt-6 pt-4 border-t border-slate-100 space-y-2 text-[10px] text-slate-500">
              <div className="flex items-center justify-between">
                <span>Cyber Defense Guard:</span>
                <span className="text-emerald-600 font-mono font-bold">TNeGA_DEFENSE_v4</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Brute-Force Protection:</span>
                <span className="text-blue-600 font-mono font-bold">Axes 5-Attempt Lockout Active</span>
              </div>
            </div>
          </div>

        </div>

        {/* Global Footer Ribbon */}
        <div className="bg-slate-50 px-6 py-2.5 border-t border-slate-200 flex flex-wrap items-center justify-between text-[10px] text-slate-500 font-mono">
          <span>HIGH COURT ATR COMPLIANCE DIRECTIVE ACTIVE</span>
          <span className="hidden sm:inline">TAMIL NADU REVENUE & LAND ADMINISTRATION PORTAL</span>
        </div>
      </div>
    </div>
  );
}
