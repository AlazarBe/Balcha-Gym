// src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { isGymOpenNow } from './api/client';

import Dashboard from './pages/Dashboard';
import Attendance from './pages/Attendance';
import Register from './pages/Register';
import ScanCheckIn from './pages/ScanCheckIn';
import MemberProfile from './pages/MemberProfile';
import StaffManagement from './pages/StaffManagement';
import Lockers from './pages/Lockers';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import BalchaLogo from './components/BalchaLogo';
import LanguageSelector from './components/LanguageSelector';

import {
  LayoutDashboard,
  UserPlus,
  QrCode,
  CalendarCheck,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Sun,
  Moon,
  Menu,
  X,
  Users,
  LogOut,
  Crown,
  Layers,
} from 'lucide-react';

function Navigation() {
  const { t } = useTranslation();
  const { user, logout, isOwner } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [gymOpen, setGymOpen] = useState(isGymOpenNow());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      setGymOpen(isGymOpenNow());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  function handleLogout() {
    if (window.confirm(t('nav.logoutConfirm'))) {
      logout();
      navigate('/login');
    }
  }

  // If user is not logged in or on login page, don't show navigation
  if (!user || location.pathname === '/login') {
    return null;
  }

  return (
    <>
      {/* Mobile Top Header */}
      <div className="no-print md:hidden bg-gym-card border-b border-gym-border px-4 py-3 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <BalchaLogo size={32} showText={true} subtitle="DESK PORTAL" />

        <div className="flex items-center gap-2">
          {/* Language Selector Mobile */}
          <LanguageSelector />

          {/* Theme Toggle Mobile */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-gym-surface hover:bg-gym-hover border border-gym-border text-gym-text transition-all focus:outline-none focus:ring-2 focus:ring-amber-500"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-amber-600" />}
          </button>

          {/* Hamburger Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-gym-surface hover:bg-gym-hover border border-gym-border text-gym-text transition-all focus:outline-none focus:ring-2 focus:ring-amber-500"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Main Sidebar (Desktop fixed, Mobile collapsible) */}
      <aside
        className={`no-print w-full md:w-64 bg-gym-card border-b md:border-b-0 md:border-r border-gym-border flex flex-col md:sticky md:top-0 md:h-screen z-40 shrink-0 transition-all ${
          mobileMenuOpen ? 'block' : 'hidden md:flex'
        }`}
      >
        {/* Brand Logo Header (Desktop) */}
        <div className="p-4 md:p-5 border-b border-gym-border hidden md:flex items-center justify-between">
          <BalchaLogo size={38} showText={true} subtitle="FRONT-DESK PORTAL" />
        </div>

        {/* Live Gym Operational Status, Language Selector & Theme Toggle Bar */}
        <div className="p-3 border-b border-gym-border/80 flex items-center gap-2">
          <div className="bg-gym-surface/80 rounded-xl px-3 py-2 flex items-center justify-between border border-gym-border/60 flex-1">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                  gymOpen
                    ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]'
                    : 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'
                }`}
              />
              <div>
                <div
                  className={`text-[10px] font-black tracking-wider uppercase leading-none ${
                    gymOpen ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {gymOpen ? t('nav.gymOpen') : t('nav.gymClosed')}
                </div>
                <div className="text-[10px] text-gym-muted font-mono font-medium mt-0.5">
                  {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
            <Clock size={14} className="text-gym-dim" />
          </div>

          {/* Language Selector (Desktop) */}
          <div className="hidden md:block shrink-0">
            <LanguageSelector />
          </div>

          {/* Dark / Light Mode Switch Button (Desktop) */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-gym-surface hover:bg-gym-hover border border-gym-border text-gym-text transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 shrink-0 hidden md:flex items-center justify-center shadow-sm"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
          >
            {isDark ? (
              <Sun size={16} className="text-amber-400 hover:rotate-45 transition-transform" />
            ) : (
              <Moon size={16} className="text-amber-600 hover:-rotate-12 transition-transform" />
            )}
          </button>
        </div>

        {/* Main Navigation Links */}
        <nav className="p-2 md:p-3 flex flex-col gap-1.5 flex-1 overflow-y-auto">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs md:text-sm font-bold tracking-wide transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                isActive
                  ? 'bg-amber-500/15 border-l-4 border-amber-500 text-gym-text font-black shadow-sm'
                  : 'text-gym-muted hover:text-gym-text hover:bg-gym-surface/60'
              }`
            }
          >
            <LayoutDashboard size={18} className="shrink-0 text-amber-500" />
            <span>{t('nav.dashboard')}</span>
          </NavLink>

          <NavLink
            to="/scan"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs md:text-sm font-bold tracking-wide transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                isActive
                  ? 'bg-amber-500/15 border-l-4 border-amber-500 text-gym-text font-black shadow-sm'
                  : 'text-gym-muted hover:text-gym-text hover:bg-gym-surface/60'
              }`
            }
          >
            <QrCode size={18} className="shrink-0 text-emerald-500" />
            <span>{t('nav.scanCheckIn')}</span>
          </NavLink>

          <NavLink
            to="/register"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs md:text-sm font-bold tracking-wide transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                isActive
                  ? 'bg-amber-500/15 border-l-4 border-amber-500 text-gym-text font-black shadow-sm'
                  : 'text-gym-muted hover:text-gym-text hover:bg-gym-surface/60'
              }`
            }
          >
            <UserPlus size={18} className="shrink-0 text-rose-500" />
            <span>{t('nav.registerMember')}</span>
          </NavLink>

          <NavLink
            to="/attendance"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs md:text-sm font-bold tracking-wide transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                isActive
                  ? 'bg-amber-500/15 border-l-4 border-amber-500 text-gym-text font-black shadow-sm'
                  : 'text-gym-muted hover:text-gym-text hover:bg-gym-surface/60'
              }`
            }
          >
            <CalendarCheck size={18} className="shrink-0 text-cyan-500" />
            <span>{t('nav.dailyAttendance')}</span>
          </NavLink>

          <NavLink
            to="/lockers"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs md:text-sm font-bold tracking-wide transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                isActive
                  ? 'bg-amber-500/15 border-l-4 border-amber-500 text-gym-text font-black shadow-sm'
                  : 'text-gym-muted hover:text-gym-text hover:bg-gym-surface/60'
              }`
            }
          >
            <Layers size={18} className="shrink-0 text-purple-500" />
            <span>{t('nav.lockers')}</span>
          </NavLink>

          {/* Owner Only: Staff & Worker Management */}
          {isOwner && (
            <NavLink
              to="/staff"
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs md:text-sm font-bold tracking-wide transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 mt-2 border-t border-gym-border/40 pt-3 ${
                  isActive
                    ? 'bg-amber-500/15 border-l-4 border-amber-500 text-gym-text font-black shadow-sm'
                    : 'text-gym-muted hover:text-gym-text hover:bg-gym-surface/60'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Users size={18} className="shrink-0 text-amber-400" />
                <span>{t('nav.staffManagement')}</span>
              </div>
              <Crown size={14} className="text-amber-500 shrink-0" />
            </NavLink>
          )}
        </nav>

        {/* Active Staff Session & Logout Footer */}
        <div className="p-3.5 border-t border-gym-border bg-gym-surface/40 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs text-white shadow-md shrink-0 ${
                isOwner ? 'bg-gradient-to-tr from-amber-600 to-rose-600' : 'bg-gradient-to-tr from-slate-600 to-slate-800'
              }`}
            >
              {user.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-extrabold text-gym-text truncate">
                {user.name}
              </div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                <ShieldCheck size={11} />
                <span>{isOwner ? t('nav.owner') : t('nav.frontDesk')}</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg bg-gym-surface hover:bg-rose-500/10 border border-gym-border text-gym-muted hover:text-rose-500 transition-colors shrink-0 focus:outline-none"
            title={t('nav.logout')}
            aria-label={t('nav.logout')}
          >
            <LogOut size={15} />
          </button>
        </div>
      </aside>
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <div className="flex flex-col md:flex-row min-h-screen bg-gym-bg text-gym-text font-sans selection:bg-amber-500 selection:text-slate-950 transition-colors">
            <Navigation />
            <main className="flex-1 min-w-0 overflow-y-auto">
              <Routes>
                {/* Public Route */}
                <Route path="/login" element={<Login />} />

                {/* Protected Front-Desk & Owner Routes */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/register"
                  element={
                    <ProtectedRoute>
                      <Register />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/scan"
                  element={
                    <ProtectedRoute>
                      <ScanCheckIn />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/attendance"
                  element={
                    <ProtectedRoute>
                      <Attendance />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/members/:id"
                  element={
                    <ProtectedRoute>
                      <MemberProfile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/lockers"
                  element={
                    <ProtectedRoute>
                      <Lockers />
                    </ProtectedRoute>
                  }
                />

                {/* Protected Owner Only Route */}
                <Route
                  path="/staff"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <StaffManagement />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
