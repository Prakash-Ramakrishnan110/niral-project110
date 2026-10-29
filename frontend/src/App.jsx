import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import LoginModal from './components/LoginModal';
import ExecutiveDashboardView from './views/ExecutiveDashboardView';
import WorkQueueView from './views/WorkQueueView';
import CourtStaysView from './views/CourtStaysView';
import HearingsView from './views/HearingsView';
import RehabilitationView from './views/RehabilitationView';
import TacticalMapView from './views/TacticalMapView';
import VAOMobileView from './views/VAOMobileView';
import { HighCourtATRView } from './views/HighCourtATRView';
import { AuthAPI, subscribeAuthChange } from './api/client';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);

  const fetchCurrentUser = async () => {
    try {
      const data = await AuthAPI.getCurrentUser();
      setCurrentUser(data);
    } catch (e) {
      // If unauthenticated, trigger login modal
      setCurrentUser(null);
      setLoginModalOpen(true);
    } finally {
      setLoadingUser(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
    const unsubscribe = subscribeAuthChange(() => {
      fetchCurrentUser();
    });
    return unsubscribe;
  }, []);

  const handleLoginSuccess = () => {
    setLoginModalOpen(false);
    fetchCurrentUser();
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin mb-4" />
        <p className="text-xs font-semibold text-slate-600 tracking-wide uppercase">
          Initializing GEOMMAND Secure Spatial Node...
        </p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
        {/* TOP OFFICIAL NAVBAR */}
        <Navbar
          currentUser={currentUser}
          onRefresh={fetchCurrentUser}
          onOpenLoginModal={() => setLoginModalOpen(true)}
        />

        {/* MAIN BODY ROUTED VIEWS */}
        <main className="flex-1">
          <Routes>
            <Route path="/dashboard" element={<ExecutiveDashboardView onRefreshData={fetchCurrentUser} />} />
            <Route path="/cases" element={<WorkQueueView />} />
            <Route path="/court-stays" element={<CourtStaysView />} />
            <Route path="/hearings" element={<HearingsView />} />
            <Route path="/rehabilitation" element={<RehabilitationView />} />
            <Route path="/map" element={<TacticalMapView />} />
            <Route path="/field-queue" element={<VAOMobileView />} />
            <Route path="/atr" element={<HighCourtATRView alerts={[]} onRefresh={fetchCurrentUser} />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>

        {/* FOOTER */}
        <footer className="bg-white border-t border-slate-200 py-3 px-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>
              GEOMMAND • Statewide Cadastral Encroachment & Statutory Due Process Node
            </span>
            <span className="text-[11px] text-slate-400">
              Tamil Nadu Land Encroachment Act III of 1905 • Official Draft Notices Pending Sworn Attestation
            </span>
          </div>
        </footer>

        {/* LOGIN MODAL */}
        <LoginModal
          isOpen={loginModalOpen}
          onLoginSuccess={handleLoginSuccess}
        />
      </div>
    </BrowserRouter>
  );
}
