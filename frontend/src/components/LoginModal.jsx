import React, { useState } from 'react';
import { 
  Shield, Lock, User, AlertCircle, ChevronRight, KeyRound, 
  Zap, Eye, EyeOff, ShieldCheck, ArrowRight, Check
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
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    { 
      label: 'District Collector (Salem)', 
      user: 'col_salem', 
      canonical: 'collector_salem',
      pass: getDemoPass('col_salem', 'collector_salem'), 
      role: 'COLLECTOR', 
      officer: 'R. Brindha Devi IAS',
      jurisdiction: 'Salem District Apex',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    },
    { 
      label: 'State Apex / CS (Secretariat)', 
      user: 'apex_tn', 
      canonical: 'state_apex_officer',
      pass: getDemoPass('apex_tn', 'state_apex_officer'), 
      role: 'STATE_APEX', 
      officer: 'Dr. K. Manivasan IAS',
      jurisdiction: 'Statewide Tamil Nadu',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    { 
      label: 'DVAC Auditor (Vigilance)', 
      user: 'dvac_auditor', 
      canonical: 'vigilance_officer',
      pass: getDemoPass('dvac_auditor', 'vigilance_officer'), 
      role: 'VIGILANCE', 
      officer: 'DVAC Audit Division',
      jurisdiction: 'Statutory Audit (Read-Only)',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    { 
      label: 'Field VAO (Kannankurichi)', 
      user: 'vao_kannan', 
      canonical: 'vao_kannankurichi',
      pass: getDemoPass('vao_kannan', 'vao_kannankurichi'), 
      role: 'VAO', 
      officer: 'K. Prakash',
      jurisdiction: 'Kannankurichi Village',
      badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    },
    { 
      label: 'GIS System Administrator', 
      user: 'admin', 
      canonical: 'admin_gis_officer',
      pass: getDemoPass('admin', 'admin_gis_officer'), 
      role: 'ADMIN_GIS', 
      officer: 'GIS Operations Core',
      jurisdiction: 'System Core & Layers',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
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
      let data = null;
      try {
        data = await AuthAPI.login(cleanUser, targetPass);
      } catch (firstErr) {
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
    <div className="fixed inset-0 z-50 bg-white flex items-center justify-center p-4 sm:p-6 overflow-hidden select-none">
      {/* Clean, Non-Scrollable, Professional Split Card */}
      <div className="w-full max-w-5xl bg-white border border-slate-200 rounded-2xl shadow-xl flex flex-col overflow-hidden max-h-[95vh]">
        
        {/* Top Header */}
        <div className="px-6 py-3.5 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 text-white rounded-lg shadow-xs">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
                  Government of Tamil Nadu
                </span>
                <span className="text-[9px] px-1.5 py-0.2 font-mono font-semibold rounded bg-slate-100 text-slate-600 border border-slate-200">
                  TN Act III of 1905
                </span>
              </div>
              <h1 className="text-base font-extrabold text-slate-900 tracking-tight">
                GEOMMAND <span className="text-slate-300 font-light mx-1">|</span> <span className="text-slate-600 font-normal text-sm">Land Intelligence & Enforcement</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Secure Gateway
            </span>
          </div>
        </div>

        {/* Split Body: Left = Demo Accounts, Right = Manual Form */}
        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-hidden divide-y md:divide-y-0 md:divide-x divide-slate-200">
          
          {/* LEFT: DEMO ACCOUNTS */}
          <div className="md:col-span-7 p-5 lg:p-6 flex flex-col justify-between bg-slate-50/50 overflow-hidden">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    Demo Accounts
                  </h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Click a profile to auto-fill or launch directly:
                  </p>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  6 Roles Available
                </span>
              </div>

              {/* 2-column grid of 6 compact accounts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {demoAccounts.map((acc) => {
                  const isSelected = activePreset === acc.user;
                  return (
                    <div
                      key={acc.user}
                      onClick={() => handleSelectDemo(acc, false)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer bg-white flex flex-col justify-between ${
                        isSelected 
                          ? 'border-blue-600 ring-1 ring-blue-600 shadow-sm' 
                          : 'border-slate-200 hover:border-slate-300 hover:shadow-xs'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${acc.badgeColor}`}>
                            {acc.role}
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono truncate">
                            @{acc.user}
                          </span>
                        </div>
                        <div className="font-semibold text-slate-900 text-xs truncate">
                          {acc.label}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate mt-0.5">
                          {acc.officer} • {acc.jurisdiction}
                        </div>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-medium">
                          {isSelected ? 'Selected' : 'Click to fill'}
                        </span>
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectDemo(acc, true);
                          }}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                        >
                          <span>Launch</span>
                          <ArrowRight className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Micro disclaimer */}
            <div className="mt-3 text-[10px] text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Simulated demo authority for Salem District testing.</span>
            </div>
          </div>

          {/* RIGHT: MANUAL LOGIN */}
          <div className="md:col-span-5 p-5 lg:p-6 flex flex-col justify-between bg-white overflow-hidden">
            <div>
              <div className="mb-4">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-blue-600" />
                  Manual Login
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Sign in with official revenue officer credentials:
                </p>
              </div>

              {/* Error Message Alert */}
              {errorMessage && (
                <div className="p-3 mb-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span className="font-medium">{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5">
                {/* Username */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Officer Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
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
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                      Password
                    </label>
                    {isDemo && password && (
                      <span className="text-[10px] text-blue-600 font-mono font-medium">
                        (preset loaded)
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
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
                      className="w-full pl-9 pr-9 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-lg text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer mt-2"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Authenticating...</span>
                    </div>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Bottom Security Info */}
            <div className="pt-3 border-t border-slate-100 text-[10px] text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>Security Shield:</span>
                <span className="font-mono text-slate-600">TNeGA Defense Active</span>
              </div>
              <div className="flex justify-between">
                <span>Rate Limiting:</span>
                <span className="font-mono text-slate-600">5-Attempt Axes Lockout</span>
              </div>
            </div>
          </div>

        </div>

        {/* Global Footer Ribbon */}
        <div className="px-6 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500 font-mono shrink-0">
          <span>HIGH COURT ATR COMPLIANCE DIRECTIVE ACTIVE</span>
          <span className="hidden sm:inline">TAMIL NADU REVENUE DEPARTMENT</span>
        </div>
      </div>
    </div>
  );
}