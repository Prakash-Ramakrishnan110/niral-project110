import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import LoginModal from './components/LoginModal';
import { AuthAPI, subscribeAuthChange } from './api/client';

// Route-level code splitting (dynamic imports)
const ExecutiveDashboardView = lazy(() => import('./views/ExecutiveDashboardView'));
const WorkQueueView = lazy(() => import('./views/WorkQueueView'));
const CourtStaysView = lazy(() => import('./views/CourtStaysView'));
const HearingsView = lazy(() => import('./views/HearingsView'));
const RehabilitationView = lazy(() => import('./views/RehabilitationView'));
const TacticalMapView = lazy(() => import('./views/TacticalMapView'));
const VAOMobileView = lazy(() => import('./views/VAOMobileView'));
const HighCourtATRView = lazy(() => import('./views/HighCourtATRView').then(m => ({ default: m.HighCourtATRView })));

function RouteLoading() {
  return (
    <div className="flex flex-col items-center justify-center p-12">
      <div className="w-8 h-8 border-3 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-2" />
      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Loading Console Module...</span>
    </div>
  );
}

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
    const unsubscribe = subscribeAuthChange((token) => {
      if (token) {
        fetchCurrentUser();
      } else {
        setCurrentUser(null);
        setLoginModalOpen(true);
      }
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
          {currentUser ? (
            <Suspense fallback={<RouteLoading />}>
              <Routes key={currentUser?.id || 'guest'}>
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
            </Suspense>
          ) : (
            <div className="max-w-2xl mx-auto py-20 px-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto mb-4 shadow-xs">
                <span className="font-extrabold text-2xl font-mono">🔒</span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 mb-2">
                Revenue Officer Authentication Required
              </h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
                Access to the GEOMMAND statutory enforcement console requires authenticated Revenue Officer credentials under the Tamil Nadu Land Encroachment Act III of 1905.
              </p>
              <button
                onClick={() => setLoginModalOpen(true)}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm transition-all cursor-pointer"
              >
                Sign In with Officer Credentials
              </button>
            </div>
          )}
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
