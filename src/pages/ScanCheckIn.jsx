import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { scanMember, checkOutAttendance } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import { format } from 'date-fns';
import {
  QrCode,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ArrowRight,
  RefreshCw,
  SlidersHorizontal,
  CreditCard,
  AlertOctagon,
} from 'lucide-react';

const STATUS_CONFIG = {
  active: {
    bannerClass: 'bg-emerald-500/15 border-emerald-500 text-emerald-800 dark:text-emerald-300 shadow-sm',
    textClass: 'text-emerald-700 dark:text-emerald-400',
    icon: CheckCircle2,
    headlineKey: 'scan.accessGranted',
    subtextKey: 'scan.accessGrantedSub',
  },
  grace_period: {
    bannerClass: 'bg-amber-500/15 border-amber-500 text-amber-800 dark:text-amber-300 shadow-sm',
    textClass: 'text-amber-700 dark:text-amber-400',
    icon: AlertTriangle,
    headlineKey: 'scan.gracePeriod',
    subtextKey: 'scan.gracePeriodSub',
  },
  expired: {
    bannerClass: 'bg-rose-500/15 border-rose-500 text-rose-800 dark:text-rose-300 shadow-sm',
    textClass: 'text-rose-700 dark:text-rose-400',
    icon: XCircle,
    headlineKey: 'scan.expired',
    subtextKey: 'scan.expiredSub',
  },
};

export default function ScanCheckIn() {
  const { t } = useTranslation();
  const [manualId, setManualId] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recentScans, setRecentScans] = useState([]);
  const [forceAllowHours, setForceAllowHours] = useState(true);

  const scannerRef = useRef(null);

  async function handleLookup(id) {
    if (!id || !id.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await scanMember(id.trim(), forceAllowHours);
      setResult(res);

      setRecentScans((prev) => [
        {
          id: Date.now(),
          member: res.member,
          time: new Date(),
          status: res.member.status,
          blocked: res.blocked,
          duplicateScan: res.duplicateScan,
        },
        ...prev.slice(0, 7),
      ]);
    } catch (err) {
      setError(err.message || t('scan.notFound'));
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  function handleManualSubmit(e) {
    e.preventDefault();
    if (!manualId.trim()) return;
    handleLookup(manualId.trim());
    setManualId('');
  }

  useEffect(() => {
    try {
      const scanner = new Html5QrcodeScanner(
        'qr-reader',
        {
          fps: 10,
          qrbox: { width: 220, height: 220 },
          rememberLastUsedCamera: true,
          aspectRatio: 1.0,
        },
        false
      );

      scanner.render(
        (decodedText) => {
          handleLookup(decodedText);
        },
        () => {}
      );

      scannerRef.current = scanner;

      return () => {
        scanner.clear().catch((e) => console.log('Scanner cleanup:', e));
      };
    } catch (e) {
      console.warn('QR scanner mount notice:', e);
    }
  }, [forceAllowHours]);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gym-text tracking-tight">
            {t('scan.title')}
          </h1>
          <p className="text-xs md:text-sm text-gym-muted mt-1">
            {t('scan.subtitle')}
          </p>
        </div>

        {/* Operating Hours Dev Toggle */}
        <button
          onClick={() => setForceAllowHours(!forceAllowHours)}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gym-surface hover:bg-gym-hover border border-gym-border text-xs font-bold text-gym-text transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 self-start sm:self-auto shadow-sm"
        >
          <SlidersHorizontal size={13} className="text-amber-500" />
          <span>Hours Check: <strong className={forceAllowHours ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>{forceAllowHours ? 'Dev Bypass (Always Open)' : 'Strict Hours'}</strong></span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Camera Scanner & Manual Input (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* QR Camera Box */}
          <div className="bg-gym-card rounded-2xl border border-gym-border p-5 shadow-sm text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <QrCode size={18} className="text-amber-500" />
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-gym-text">
                {t('scan.title')}
              </h2>
            </div>

            <div
              id="qr-reader"
              className="rounded-xl overflow-hidden border border-gym-border bg-black mx-auto mb-4 max-w-[280px]"
            />

            {/* Manual ID Input Bar */}
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gym-muted"
                />
                <input
                  type="text"
                  placeholder={t('scan.placeholder')}
                  value={manualId}
                  onChange={(e) => setManualId(e.target.value)}
                  className="w-full bg-gym-surface border border-gym-border focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 rounded-xl pl-10 pr-3 py-2.5 text-sm font-mono text-gym-text placeholder:text-gym-dim focus:outline-none transition-all font-bold"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white font-extrabold text-sm shadow-md shadow-amber-950/20 transition-all disabled:opacity-50 flex items-center justify-center shrink-0 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {loading ? <RefreshCw size={16} className="animate-spin" /> : t('scan.searchBtn')}
              </button>
            </form>

            <p className="text-[11px] text-gym-dim mt-2.5">
              Supports 2D USB Barcode guns, phone screens, and physical member cards.
            </p>
          </div>

          {/* Quick Demo Scan Shortcuts */}
          <div className="bg-gym-card rounded-2xl border border-gym-border p-4 shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-wider text-gym-muted block mb-2">
              Quick Test Codes:
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => handleLookup('GYM-0001')}
                className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 font-mono text-xs font-bold transition-all"
              >
                GYM-0001 (Active)
              </button>
              <button
                onClick={() => handleLookup('GYM-0002')}
                className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-700 dark:text-amber-300 font-mono text-xs font-bold transition-all"
              >
                GYM-0002 (In 2 Days)
              </button>
              <button
                onClick={() => handleLookup('GYM-0003')}
                className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-700 dark:text-amber-300 font-mono text-xs font-bold transition-all"
              >
                GYM-0003 (Grace Period)
              </button>
              <button
                onClick={() => handleLookup('GYM-0004')}
                className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/40 text-rose-700 dark:text-rose-300 font-mono text-xs font-bold transition-all"
              >
                GYM-0004 (Expired)
              </button>
              <button
                onClick={() => handleLookup('GYM-0005')}
                className="px-2.5 py-1 rounded-lg bg-gym-surface hover:bg-gym-hover border border-gym-border text-gym-text font-mono text-xs font-bold transition-all"
              >
                GYM-0005 (Partial Yearly)
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Instant Eligibility Result Panel (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Error Banner */}
          {error && (
            <div className="bg-rose-500/15 border-2 border-rose-500 rounded-2xl p-6 text-center shadow-md">
              <XCircle size={42} className="text-rose-500 mx-auto mb-2" />
              <h3 className="text-lg font-black text-rose-800 dark:text-rose-200 mb-1">{t('scan.notFound')}</h3>
              <p className="text-xs text-rose-700 dark:text-rose-300">{error}</p>
            </div>
          )}

          {result ? (
            <div className="bg-gym-card rounded-2xl border border-gym-border p-6 shadow-md relative overflow-hidden">
              {/* Top Operational Status Banner */}
              <div
                className={`rounded-xl border-2 p-4 flex items-start gap-3.5 mb-5 ${
                  STATUS_CONFIG[result.member.status]?.bannerClass
                }`}
              >
                {React.createElement(
                  STATUS_CONFIG[result.member.status]?.icon || CheckCircle2,
                  { size: 28, className: `shrink-0 ${STATUS_CONFIG[result.member.status]?.textClass}` }
                )}
                <div>
                  <h2 className={`text-base font-black tracking-wider uppercase leading-tight ${
                    STATUS_CONFIG[result.member.status]?.textClass
                  }`}>
                    {t(STATUS_CONFIG[result.member.status]?.headlineKey)}
                  </h2>
                  <p className="text-xs text-gym-text mt-1 font-medium leading-relaxed">
                    {t(STATUS_CONFIG[result.member.status]?.subtextKey)}
                  </p>
                </div>
              </div>

              {/* Edge Case 1: Gym Closed (Operating Hours Block) */}
              {result.blocked && (
                <div className="bg-red-500/20 border-2 border-red-500 text-red-800 dark:text-red-200 rounded-xl p-3.5 mb-4 flex items-center gap-3 font-semibold text-xs shadow-sm">
                  <AlertOctagon size={20} className="text-red-500 shrink-0" />
                  <span>{result.blockReason}</span>
                </div>
              )}

              {/* Edge Case 2: Duplicate Scan Warning */}
              {!result.blocked && result.duplicateScan && (
                <div className="bg-amber-500/20 border-2 border-amber-500 text-amber-900 dark:text-amber-200 rounded-xl p-3.5 mb-4 flex items-center gap-3 font-bold text-xs shadow-sm">
                  <AlertTriangle size={20} className="text-amber-500 shrink-0" />
                  <div>
                    ⚠️ ALREADY SCANNED TODAY AT{' '}
                    <span className="font-mono underline">
                      {new Date(result.attendance.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                    . Verify member face before admitting second entry.
                  </div>
                </div>
              )}

              {/* Member Profile Snapshot */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pb-5 border-b border-gym-border">
                <img
                  src={result.member.photoUrl}
                  alt={result.member.fullName}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-2 border-gym-border shadow-md shrink-0"
                />

                <div className="flex-1 text-center sm:text-left min-w-0">
                  <h3 className="text-xl sm:text-2xl font-black text-gym-text truncate">
                    {result.member.fullName}
                  </h3>
                  <div className="font-mono text-sm font-bold text-amber-600 dark:text-amber-400 tracking-wider my-1">
                    {result.member.memberId}
                  </div>
                  <div className="text-xs text-gym-muted">
                    Phone: <span className="text-gym-text font-semibold">{result.member.phone}</span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <StatusBadge status={result.member.status} size="md" />
                    <span className="px-2.5 py-1 rounded-full bg-gym-surface border border-gym-border text-xs font-bold uppercase text-gym-text">
                      {result.member.plan} Pass
                    </span>
                    {result.member.locker && (
                      <span className="px-2.5 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-xs font-black text-cyan-600 dark:text-cyan-400 font-mono flex items-center gap-1">
                        👟 {result.member.locker.slotLabel}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Attendance & Expiry Grid */}
              <div className="grid grid-cols-2 gap-3 my-4">
                <div className="bg-gym-surface rounded-xl p-3 border border-gym-border">
                  <span className="text-[10px] uppercase font-bold text-gym-muted block">Expiry Date</span>
                  <div className="text-sm font-extrabold text-gym-text mt-0.5">
                    {format(new Date(result.member.expiryDate), 'MMM d, yyyy')}
                  </div>
                  <div className="text-[11px] text-gym-dim mt-0.5">
                    {result.member.daysLeft >= 0 ? `${result.member.daysLeft} days left` : `${Math.abs(result.member.daysLeft)} days overdue`}
                  </div>
                </div>

                <div className="bg-gym-surface rounded-xl p-3 border border-gym-border">
                  <span className="text-[10px] uppercase font-bold text-gym-muted block">Attendance Status</span>
                  <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {result.attendance?.checkIn
                      ? format(new Date(result.attendance.checkIn), 'h:mm:ss a')
                      : 'Not Logged'}
                  </div>
                  <div className="text-[11px] text-gym-dim mt-0.5">
                    {result.duplicateScan ? 'Repeat Visit Today' : 'First Entry Today'}
                  </div>
                </div>
              </div>

              {/* Outstanding Balance Alert if yearly partial */}
              {result.member.balanceDue > 0 && (
                <div className="bg-amber-500/15 border border-amber-500/50 rounded-xl p-3 mb-4 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200">
                  <div className="flex items-center gap-2">
                    <CreditCard size={16} className="text-amber-500 shrink-0" />
                    <span>Balance Due: <strong className="font-mono text-amber-700 dark:text-amber-300">{result.member.balanceDue} ETB</strong></span>
                  </div>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase">Partial Plan</span>
                </div>
              )}

              {/* Fast Action Buttons */}
              <div className="flex items-center gap-2.5 mt-2">
                <Link
                  to={`/members/${result.member._id}`}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white font-extrabold text-xs tracking-wide shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <span>Open Profile & Process Renewal</span>
                  <ArrowRight size={14} />
                </Link>
                <button
                  onClick={() => {
                    setResult(null);
                    setError(null);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-gym-surface hover:bg-gym-hover border border-gym-border text-xs font-bold text-gym-muted hover:text-gym-text transition-all"
                >
                  Clear
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gym-card rounded-2xl border border-gym-border p-10 flex flex-col items-center justify-center text-center shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-gym-surface flex items-center justify-center text-gym-muted mb-3 border border-gym-border">
                <QrCode size={32} />
              </div>
              <h3 className="text-base font-extrabold text-gym-text mb-1">
                Awaiting Next Scan
              </h3>
              <p className="text-xs text-gym-muted max-w-xs">
                Scan physical card barcode/QR or type Member ID to trigger instant eligibility verification.
              </p>
            </div>
          )}

          {/* Recent Scans Live Stream */}
          {recentScans.length > 0 && (
            <div className="bg-gym-card rounded-2xl border border-gym-border p-4 shadow-sm">
              <div className="text-[10px] font-black uppercase tracking-wider text-gym-muted mb-2">
                Recent Scans Log:
              </div>
              <div className="flex flex-col gap-1.5">
                {recentScans.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between px-3 py-2 rounded-xl bg-gym-surface border border-gym-border text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={s.member.photoUrl}
                        alt=""
                        className="w-6 h-6 rounded-full object-cover shrink-0"
                      />
                      <span className="font-bold text-gym-text truncate">{s.member.fullName}</span>
                      <span className="font-mono text-xs text-amber-600 dark:text-amber-400 font-bold shrink-0">{s.member.memberId}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge status={s.status} size="sm" showIcon={false} />
                      <span className="text-[10px] font-mono text-gym-dim">
                        {format(s.time, 'h:mm:ss a')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}