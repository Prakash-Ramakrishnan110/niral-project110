import React, { useState } from 'react';
import { Shield, Lock, User, AlertCircle, CheckCircle2, ChevronRight, KeyRound } from 'lucide-react';
import { AuthAPI } from '../api/client';

export default function LoginModal({ isOpen, onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const demoAccounts = [
    { label: 'Tahsildar (Salem West)', user: 'tah_salem_west', pass: 'DemoAdmin@2026!', role: 'TAHSILDAR', jurisdiction: 'Salem West' },
    { label: 'District Collector (Salem)', user: 'col_salem', pass: 'DemoAdmin@2026!', role: 'COLLECTOR', jurisdiction: 'Salem District' },
    { label: 'State Apex / CS (Secretariat)', user: 'apex_tn', pass: 'DemoAdmin@2026!', role: 'STATE_APEX', jurisdiction: 'Statewide TN' },
    { label: 'DVAC Auditor (Vigilance)', user: 'dvac_auditor', pass: 'DemoAdmin@2026!', role: 'VIGILANCE', jurisdiction: 'Auditing (Read-Only)' },
    { label: 'Field VAO (Kannankurichi)', user: 'vao_kannan', pass: 'DemoAdmin@2026!', role: 'VAO', jurisdiction: 'Salem / Kannankurichi' },
  ];

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!username.trim() || !password) {
      setErrorMessage('Please enter both username and password.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const data = await AuthAPI.login(username.trim(), password);
      onLoginSuccess(data.user);
    } catch (err) {
      const resp = err.response;
      if (resp?.status === 429) {
        setErrorMessage(resp.data?.error || 'Account locked due to 5 consecutive failed login attempts. Please wait 15 minutes.');
      } else if (resp?.status === 401) {
        setErrorMessage(resp.data?.error || 'Invalid officer credentials. Check username/password.');
      } else {
        setErrorMessage(resp?.data?.error || 'Failed to authenticate. Check server connectivity.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDemo = (account) => {
    setUsername(account.user);
    setPassword(account.pass);
    setErrorMessage('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-emerald-600 px-6 py-5 text-white">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
              <Shield className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-wider uppercase">TAMIL NADU GEOMMAND</h2>
              <p className="text-xs text-blue-100 font-medium tracking-wide">
                Land Encroachment Intelligence & Statutory Enforcement
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400" />
              Officer Authentication Portal
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Sign in with your Revenue Department credentials. Role-based scoping applies automatically.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-800/80 text-red-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Authentication Failure: </span>
                {errorMessage}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                Officer Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. tah_salem_west"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <span>Authenticating Officer...</span>
              ) : (
                <>
                  <span>SIGN IN TO GEOMMAND</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Selector */}
          <div className="pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Quick Demo Presets
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-300 font-mono">
                GEOMMAND_ENV=demo
              </span>
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.user}
                  type="button"
                  onClick={() => handleSelectDemo(acc)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 text-left transition-colors flex items-center justify-between cursor-pointer group"
                >
                  <div>
                    <div className="text-xs font-semibold text-slate-200 group-hover:text-blue-300">
                      {acc.label}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      User: <code className="text-slate-300">{acc.user}</code> • Role:{' '}
                      <span className="text-emerald-400 font-medium">{acc.role}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-200" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Security Notice */}
        <div className="bg-slate-950 px-6 py-3 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
          <span>Protected by Tamil Nadu e-Governance Cyber Defense</span>
          <span>Axes Rate Guard Active</span>
        </div>
      </div>
    </div>
  );
}
