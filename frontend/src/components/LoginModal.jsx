import React, { useState } from 'react';
import { 
  Shield, Lock, User, AlertCircle, CheckCircle2, ChevronRight, KeyRound, 
  Zap, Radio, Eye, EyeOff, ShieldCheck, MapPin, 
  ArrowRight, Landmark, Building2, Gavel, Scale, FileText
} from 'lucide-react';
import { AuthAPI } from '../api/client';

export default function LoginModal({ isOpen, onLoginSuccess }) {
  const isDemo = import.meta.env.VITE_DEMO === 'true' || import.meta.env.DEV;

  const getDemoPass = (uname, canonical) => {
    const key1 = `VITE_DEMO_PASSWORD_${(uname || '').toUpperCase()}`;
    const key2 = `VITE_DEMO_PASSWORD_${(canonical || '').toUpperCase()}`;
    return import.meta.env[key1] || import.meta.env[key2] || import.meta.env.VITE_DEMO_PASSWORD || '';
  };

  const demoAccounts = isDemo ? [
    { 
      label: 'Tahsildar (Salem West)', 
      user: 'tah_salem_west', 
      canonical: 'tahsildar_salem_west',
      pass: getDemoPass('tah_salem_west', 'tahsildar_salem_west'), 
      role: 'TAHSILDAR', 
      officer: 'S. Murugan',
      jurisdiction: 'Salem West Taluk',
      badgeColor: 'border-blue-400/50 text-blue-300 bg-blue-950/80',
      description: 'Accepts inspections, issues statutory Section 7 & 6 notices, manages local encroachment'
    },
    { 
      label: 'District Collector (Salem)', 
      user: 'col_salem', 
      canonical: 'collector_salem',
      pass: getDemoPass('col_salem', 'collector_salem'), 
      role: 'COLLECTOR', 
      officer: 'R. Brindha Devi IAS',
      jurisdiction: 'Salem District Apex',
      badgeColor: 'border-indigo-400/50 text-indigo-300 bg-indigo-950/80',
      description: 'District authority over all taluks, issues final Section 6 eviction orders, High Court ATR'
    },
    { 
      label: 'State Apex / CS (Secretariat)', 
      user: 'apex_tn', 
      canonical: 'state_apex_officer',
      pass: getDemoPass('apex_tn', 'state_apex_officer'), 
      role: 'STATE_APEX', 
      officer: 'Dr. K. Manivasan IAS',
      jurisdiction: 'Statewide Tamil Nadu',
      badgeColor: 'border-emerald-400/50 text-emerald-300 bg-emerald-950/80',
      description: 'Secretariat oversight across 38 districts, statewide land bank protection metrics'
    },
    { 
      label: 'DVAC Auditor (Vigilance)', 
      user: 'dvac_auditor', 
      canonical: 'vigilance_officer',
      pass: getDemoPass('dvac_auditor', 'vigilance_officer'), 
      role: 'VIGILANCE', 
      officer: 'DVAC Audit Division',
      jurisdiction: 'Statutory Audit (Read-Only)',
      badgeColor: 'border-amber-400/50 text-amber-300 bg-amber-950/80',
      description: 'Independent audit trail monitoring, anti-corruption registry verification'
    },
    { 
      label: 'Field VAO (Kannankurichi)', 
      user: 'vao_kannan', 
      canonical: 'vao_kannankurichi',
      pass: getDemoPass('vao_kannan', 'vao_kannankurichi'), 
      role: 'VAO', 
      officer: 'K. Prakash',
      jurisdiction: 'Kannankurichi Village',
      badgeColor: 'border-cyan-400/50 text-cyan-300 bg-cyan-950/80',
      description: 'Ground verification, drone survey telemetry, physical inspection reports'
    },
    { 
      label: 'GIS System Administrator', 
      user: 'admin', 
      canonical: 'admin_gis_officer',
      pass: getDemoPass('admin', 'admin_gis_officer'), 
      role: 'ADMIN_GIS', 
      officer: 'GIS Operations Core',
      jurisdiction: 'System Core & Layers',
      badgeColor: 'border-purple-400/50 text-purple-300 bg-purple-950/80',
      description: 'GeoServer layer synchronizer, Sentinel-2 ingest pipeline, system maintenance'
    },
  ] : [];

  const [username, setUsername] = useState(isDemo ? 'tah_salem_west' : '');
  const [password, setPassword] = useState(getDemoPass('tah_salem_west', 'tahsildar_salem_west'));
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activePreset, setActivePreset] = useState(isDemo ? 'tah_salem_west' : '');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

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

      if (data?.user || data?.access) {
        onLoginSuccess(data?.user);
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950 flex items-center justify-center p-3 sm:p-5 lg:p-6 min-h-screen">
      {/* Main Solid Container (No transparency anywhere) */}
      <div className="relative w-full max-w-6xl rounded-2xl bg-white border border-slate-700 shadow-2xl overflow-hidden my-auto">
        
        {/* Top Header Banner (Opaque Solid) */}
        <div className="bg-slate-900 text-white px-6 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-md border border-blue-400">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-400">
                  Government of Tamil Nadu
                </span>
                <span className="text-[9px] px-2 py-0.5 font-mono font-bold rounded bg-slate-800 text-blue-300 border border-slate-700">
                  v2.5 TACTICAL
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-black text-white tracking-wide uppercase font-jakarta flex items-center gap-2">
                GEOMMAND <span className="text-slate-500 font-light">|</span> <span className="text-slate-300 font-medium text-xs sm:text-sm">Land Intelligence & Enforcement Directorate</span>
              </h1>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-[10px] text-amber-300 font-mono">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>SATELLITE INGEST: SIMULATED (DEMO)</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-[10px] text-slate-300 font-mono">
              <Radio className="w-3 h-3 text-blue-400" />
              <span>SALEM SECTOR 04</span>
            </div>
          </div>
        </div>

        {/* Two-Column Split: Left Side = Demo Accounts, Right Side = Manual Login */}
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
          
          {/* LEFT SIDE: DEMO ACCOUNTS (Solid Dark Slate Background) */}
          <div className="lg:col-span-7 bg-slate-900 p-5 sm:p-7 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>Quick Demo Profiles (1-Click Launch)</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Select any statutory officer account below to test enforcement workflows:
                  </p>
                </div>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                  6 ACTIVE
                </span>
              </div>

              {/* 6 Demo Officer Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {demoAccounts.map((acc) => {
                  const isSelected = activePreset === acc.user;
                  return (
                    <div
                      key={acc.user}
                      onClick={() => handleSelectDemo(acc, false)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected 
                          ? 'bg-slate-800 border-blue-500 ring-2 ring-blue-500 shadow-lg' 
                          : 'bg-slate-850 hover:bg-slate-800 border-slate-750 hover:border-slate-600'
                      }`}
                      style={{ backgroundColor: isSelected ? '#1e293b' : '#0f172a' }}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border ${acc.badgeColor}`}>
                            {acc.role}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            @{acc.user}
                          </span>
                        </div>
                        <div className="font-bold text-white text-xs tracking-tight hover:text-blue-400 transition-colors">
                          {acc.label}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1 font-medium">
                          {acc.officer} • {acc.jurisdiction}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {acc.description}
                        </p>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between">
                        <span className="text-[9px] text-slate-400 font-mono">
                          {isSelected ? '✓ Selected' : 'Click to fill'}
                        </span>
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectDemo(acc, true);
                          }}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-500 border border-blue-400 text-white rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                        >
                          <span>Launch</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Legal Notice at base of left column */}
            <div className="mt-4 p-3 rounded-xl bg-slate-950 border border-slate-800 text-[10px] text-slate-400 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-200 font-bold">Statutory Governance: </span>
                Demonstration profiles simulate live authority delegation in Salem District under Tamil Nadu Act III of 1905 and Madras High Court directives.
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: MANUAL LOGIN (Solid Crisp White Background) */}
          <div className="lg:col-span-5 bg-white p-6 sm:p-8 flex flex-col justify-between">
            <div className="space-y-5">
              <div className="pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-900">
                  <Lock className="w-4 h-4 text-blue-600" />
                  <span>Manual Officer Authentication</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Sign in manually using your assigned departmental officer credentials:
                </p>
              </div>

              {/* Error Message Alert */}
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-300 text-red-800 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Authentication Failed: </span>
                    {errorMessage}
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Username Input */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Officer Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        setErrorMessage('');
                      }}
                      placeholder="e.g. tah_salem_west"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all font-medium"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                      Security Key / Password
                    </label>
                    {isDemo && password && (
                      <span className="text-[10px] text-blue-600 font-mono font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                        Preset Loaded
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setErrorMessage('');
                      }}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold rounded-xl shadow-md text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Verifying Officer Cryptographic Key...</span>
                    </div>
                  ) : (
                    <>
                      <span>Sign In to GEOMMAND Console</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Bottom Security Seals */}
            <div className="mt-6 pt-4 border-t border-slate-200 space-y-2 text-[10px] text-slate-600">
              <div className="flex items-center justify-between">
                <span className="font-medium">Cyber Defense Protocol:</span>
                <span className="text-emerald-700 font-mono font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">TNeGA_DEFENSE_v4</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Axes Access Protection:</span>
                <span className="text-blue-700 font-mono font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">5-Attempt Lockout Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Statutory Mandate:</span>
                <span className="text-slate-700 font-mono font-semibold">TN Land Encroachment Act 1905</span>
              </div>
            </div>
          </div>

        </div>

        {/* Global Solid Footer Ribbon */}
        <div className="bg-slate-900 text-slate-400 px-6 py-2.5 border-t border-slate-800 flex flex-wrap items-center justify-between text-[10px] font-mono">
          <span className="text-slate-300">HIGH COURT OF MADRAS ATR COMPLIANCE ACTIVE</span>
          <span className="hidden sm:inline text-slate-400">TAMIL NADU REVENUE & DISASTER MANAGEMENT DEPARTMENT</span>
        </div>
      </div>
    </div>
  );
}