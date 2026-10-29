import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Shield, Landmark, LogOut, User, RefreshCcw, AlertTriangle,
  ChevronDown, Layers, MapPin, CheckCircle2
} from 'lucide-react';
import { AuthAPI } from '../api/client';

export const Navbar = ({ currentUser, onRefresh, onOpenLoginModal }) => {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await AuthAPI.logout();
    } catch (e) {
      console.warn('Logout error:', e);
    }
    window.location.reload();
  };

  const navItems = currentUser?.nav || [
    { id: 'dashboard', label: 'Dashboard', path: '/dashboard' },
    { id: 'cases', label: 'Cases', path: '/cases' },
  ];

  const scope = currentUser?.scope || {};
  const jurisdictionLabel = scope.village
    ? `${scope.village} Village, ${scope.taluk || ''}`
    : scope.taluk
    ? `${scope.taluk} Taluk`
    : scope.district
    ? `${scope.district} District`
    : 'Tamil Nadu Statewide';

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      {/* 1. TOP OFFICIAL HEADER BAR */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-xl shadow-xs border border-slate-700">
              <Shield className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-slate-900 font-sans">
                  GEOMMAND
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                  ACT III OF 1905
                </span>
                {currentUser?.feature_flags?.is_demo && (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-300">
                    DEMO
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Government of Tamil Nadu • Revenue & Disaster Management Department
              </p>
            </div>
          </div>

          {/* Officer Identity & Action Bar */}
          <div className="flex items-center gap-3">
            {/* Jurisdiction Badge */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              <div className="text-left">
                <p className="font-semibold text-slate-800 leading-tight">
                  {currentUser?.role_display || currentUser?.role || 'Officer'}
                </p>
                <p className="text-[10px] text-slate-500 leading-tight">
                  {jurisdictionLabel}
                </p>
              </div>
            </div>

            {/* Refresh Button */}
            {onRefresh && (
              <button
                onClick={onRefresh}
                title="Refresh Portal Data"
                className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
              >
                <RefreshCcw className="w-4 h-4" />
              </button>
            )}

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 transition-colors shadow-xs"
              >
                <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px]">
                  {(currentUser?.username || 'U')[0].toUpperCase()}
                </div>
                <span className="hidden sm:inline-block max-w-[120px] truncate">
                  {currentUser?.username || 'Officer'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {profileDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  onMouseLeave={() => setProfileDropdownOpen(false)}
                >
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="font-bold text-slate-900 text-sm">
                      {currentUser?.first_name ? `${currentUser.first_name} ${currentUser.last_name || ''}` : currentUser?.username}
                    </p>
                    <p className="text-xs text-slate-500">
                      {currentUser?.email || `${currentUser?.username}@tn.gov.in`}
                    </p>
                    <p className="text-[11px] font-semibold text-blue-600 mt-1">
                      {currentUser?.role_display || currentUser?.role}
                    </p>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        onOpenLoginModal?.();
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      Switch Officer Account / Demo Login
                    </button>
                  </div>

                  <div className="border-t border-slate-100 pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium"
                    >
                      <LogOut className="w-4 h-4 text-red-500" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. ROLE-BASED NAVIGATION TABS */}
      <div className="bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 sm:space-x-3 overflow-x-auto scrollbar-none py-1">
            {navItems.map((item) => (
              <NavLink
                key={item.id}
                to={item.path}
                className={({ isActive }) =>
                  `px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
