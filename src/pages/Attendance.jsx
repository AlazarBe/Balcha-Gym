import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getAttendanceByDate, checkOutAttendance } from '../api/client';
import { exportAttendanceToCsv } from '../utils/exportCsv';
import { format } from 'date-fns';
import {
  CalendarCheck,
  Clock,
  UserCheck,
  LogOut,
  Search,
  RefreshCw,
  Download,
} from 'lucide-react';
import { Link } from 'react-router-dom';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function Attendance() {
  const { t } = useTranslation();
  const [date, setDate] = useState(todayStr());
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  async function loadAttendance() {
    setLoading(true);
    try {
      const data = await getAttendanceByDate(date);
      setRecords(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAttendance();
  }, [date]);

  async function handleCheckOut(recordId) {
    try {
      await checkOutAttendance(recordId);
      await loadAttendance();
    } catch (err) {
      alert(err.message);
    }
  }

  function handleExportCsv() {
    if (records.length > 0) {
      exportAttendanceToCsv(records, date);
    }
  }

  const filteredRecords = records.filter(
    (r) =>
      r.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.memberIdLabel.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeInGym = records.filter((r) => !r.checkOut).length;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header & Date Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gym-text tracking-tight">
            {t('attendance.title')}
          </h1>
          <p className="text-xs md:text-sm text-gym-muted mt-1">
            {t('attendance.subtitle')}
          </p>
        </div>

        {/* Date Controls & CSV Export */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-gym-card border border-gym-border focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 rounded-xl px-3 py-1.5 text-xs text-gym-text focus:outline-none transition-all font-mono font-medium shadow-sm"
          />
          <button
            onClick={() => setDate(todayStr())}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm ${
              date === todayStr()
                ? 'bg-amber-500 text-slate-950 font-black border-amber-500'
                : 'bg-gym-surface hover:bg-gym-hover text-gym-text border-gym-border'
            }`}
          >
            {t('common.today')}
          </button>

          <button
            onClick={handleExportCsv}
            disabled={records.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gym-surface hover:bg-gym-hover border border-gym-border text-xs font-bold text-gym-text transition-all shadow-sm disabled:opacity-50"
            title="Download daily attendance sheet (CSV)"
          >
            <Download size={13} className="text-emerald-500" />
            <span>{t('common.exportCsv')}</span>
          </button>
        </div>
      </div>

      {/* Daily Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-gym-card rounded-2xl border border-gym-border p-4 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[10px] text-gym-muted uppercase font-bold tracking-wider">
              {t('attendance.totalCheckIns')}
            </div>
            <div className="text-2xl font-black text-gym-text font-mono mt-0.5">
              {records.length}
            </div>
            <div className="text-[10px] text-gym-dim mt-0.5 font-mono">{t('common.date')}: {date}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
            <UserCheck size={20} />
          </div>
        </div>

        <div className="bg-gym-card rounded-2xl border border-gym-border p-4 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[10px] text-gym-muted uppercase font-bold tracking-wider">
              {t('attendance.activeInGym')}
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
              {activeInGym}
            </div>
            <div className="text-[10px] text-gym-dim mt-0.5">{t('attendance.activeInGymSub')}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
            <Clock size={20} />
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-gym-card rounded-2xl border border-gym-border p-4 md:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="text-xs font-black uppercase tracking-wider text-gym-text">
            {t('attendance.dailyVisits')} ({filteredRecords.length})
          </div>

          <div className="relative min-w-[220px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gym-muted" />
            <input
              type="text"
              placeholder={t('attendance.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gym-surface border border-gym-border focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 rounded-xl pl-8 pr-3 py-1.5 text-xs text-gym-text placeholder:text-gym-dim focus:outline-none transition-all font-medium"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-gym-border bg-gym-card">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gym-surface text-gym-muted uppercase font-bold tracking-wider text-[10px] border-b border-gym-border">
                <th className="py-2.5 px-3">{t('attendance.member')}</th>
                <th className="py-2.5 px-3">{t('attendance.memberId')}</th>
                <th className="py-2.5 px-3">{t('attendance.plan')}</th>
                <th className="py-2.5 px-3">{t('attendance.checkIn')}</th>
                <th className="py-2.5 px-3">{t('attendance.checkOut')}</th>
                <th className="py-2.5 px-4 text-right">{t('attendance.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gym-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gym-muted">
                    <div className="inline-flex items-center gap-2 font-semibold">
                      <RefreshCw size={16} className="animate-spin text-amber-500" />
                      <span>{t('attendance.loadingAttendance')}</span>
                    </div>
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gym-dim">
                    {t('attendance.noVisits')}
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => (
                  <tr key={r._id} className="hover:bg-gym-surface/60 transition-colors">
                    {/* Member */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={r.photoUrl}
                          alt={r.memberName}
                          className="w-7 h-7 rounded-lg object-cover border border-gym-border shrink-0"
                        />
                        <Link
                          to={`/members/${r.member}`}
                          className="font-bold text-gym-text hover:text-amber-500 transition-colors"
                        >
                          {r.memberName}
                        </Link>
                      </div>
                    </td>

                    {/* Member ID */}
                    <td className="py-2.5 px-3">
                      <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-xs">
                        {r.memberIdLabel}
                      </span>
                    </td>

                    {/* Plan */}
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded bg-gym-surface border border-gym-border text-[10px] font-bold uppercase text-gym-text">
                        {r.plan}
                      </span>
                    </td>

                    {/* Check In */}
                    <td className="py-2.5 px-3 text-emerald-600 dark:text-emerald-400 font-mono font-bold text-[11px]">
                      {r.checkIn ? format(new Date(r.checkIn), 'h:mm:ss a') : '—'}
                    </td>

                    {/* Check Out */}
                    <td className="py-2.5 px-3 font-mono text-[11px]">
                      {r.checkOut ? (
                        <span className="text-gym-muted">{format(new Date(r.checkOut), 'h:mm:ss a')}</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
                          {t('common.workingOut')}
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-2.5 px-4 text-right">
                      {!r.checkOut ? (
                        <button
                          onClick={() => handleCheckOut(r._id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gym-surface hover:bg-gym-hover border border-gym-border text-[11px] font-bold text-gym-text hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
                        >
                          <LogOut size={12} className="text-rose-500" />
                          <span>{t('common.checkOut')}</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-gym-dim font-medium">{t('common.completed')}</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}