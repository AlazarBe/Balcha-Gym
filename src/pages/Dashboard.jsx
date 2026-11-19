import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getMembers, getDashboardSummary, getPendingSmsMembers, autoDispatchSmsReminders, getSmsLogs } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { exportMembersToCsv } from '../utils/exportCsv';
import StatusBadge from '../components/StatusBadge';
import SmsModal from '../components/SmsModal';
import FinancialSummaryModal from '../components/FinancialSummaryModal';
import { format } from 'date-fns';
import {
  Users,
  UserCheck,
  AlertTriangle,
  XCircle,
  Clock,
  Search,
  UserPlus,
  QrCode,
  ArrowUpRight,
  RefreshCw,
  Calendar,
  Phone,
  Flame,
  Download,
  MessageSquare,
  TrendingUp,
  Crown,
  Send,
  Zap,
  CheckCircle,
  FileText,
  X,
} from 'lucide-react';

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const { isOwner } = useAuth();
  const [members, setMembers] = useState([]);
  const [summary, setSummary] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Automated SMS Engine State
  const [pendingSmsMembers, setPendingSmsMembers] = useState([]);
  const [autoSmsSending, setAutoSmsSending] = useState(false);
  const [autoSmsResult, setAutoSmsResult] = useState(null);
  const [showSmsLogsModal, setShowSmsLogsModal] = useState(false);
  const [smsLogs, setSmsLogs] = useState([]);

  // Modals state
  const [smsTargetMember, setSmsTargetMember] = useState(null);
  const [showFinancialModal, setShowFinancialModal] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const [summaryData, pendingSms, logs] = await Promise.all([
        getDashboardSummary(),
        getPendingSmsMembers(),
        getSmsLogs(),
      ]);
      setSummary(summaryData);
      setPendingSmsMembers(pendingSms);
      setSmsLogs(logs);

      let params = { q: searchQuery };
      if (activeTab === 'active') params.status = 'active';
      else if (activeTab === 'grace_period') params.status = 'grace_period';
      else if (activeTab === 'expired') params.status = 'expired';
      else if (activeTab === 'exp_5') params.window = 5;
      else if (activeTab === 'exp_2') params.window = 2;
      else if (activeTab === 'exp_0') params.window = 0;

      const memberList = await getMembers(params);
      setMembers(memberList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRunAutoSms() {
    if (pendingSmsMembers.length === 0) return;
    setAutoSmsSending(true);
    setAutoSmsResult(null);
    try {
      const res = await autoDispatchSmsReminders(i18n.language || 'en');
      setAutoSmsResult(`Automated Carrier Dispatch Complete! Sent ${res.sentCount} SMS reminders successfully.`);
      await loadData();
      setTimeout(() => setAutoSmsResult(null), 5000);
    } catch (err) {
      alert('Auto-SMS error: ' + err.message);
    } finally {
      setAutoSmsSending(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [activeTab, searchQuery]);

  function handleExportCsv() {
    if (members.length > 0) {
      exportMembersToCsv(members, activeTab);
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Top Header & Fast Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gym-text tracking-tight">
            {t('dashboard.title')}
          </h1>
          <p className="text-xs md:text-sm text-gym-muted mt-1">
            {t('dashboard.subtitle')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Owner Only Financial Overview Button */}
          {isOwner && (
            <button
              onClick={() => setShowFinancialModal(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 border border-amber-500/50 text-xs md:text-sm font-black text-amber-700 dark:text-amber-300 transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
              title="View gym revenue and payment channels"
            >
              <TrendingUp size={15} className="text-amber-500" />
              <span>{t('dashboard.financials')}</span>
            </button>
          )}

          {/* Export CSV Button */}
          <button
            onClick={handleExportCsv}
            disabled={members.length === 0}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gym-surface hover:bg-gym-hover border border-gym-border text-xs md:text-sm font-bold text-gym-text transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm disabled:opacity-50"
            title="Download currently filtered members spreadsheet"
          >
            <Download size={15} className="text-emerald-500" />
            <span>{t('common.exportCsv')}</span>
          </button>

          <Link
            to="/scan"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gym-surface hover:bg-gym-hover border border-gym-border text-xs md:text-sm font-bold text-gym-text transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
          >
            <QrCode size={15} className="text-emerald-500" />
            <span>{t('dashboard.scanPass')}</span>
          </Link>

          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white text-xs md:text-sm font-black transition-all shadow-md shadow-amber-950/20 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <UserPlus size={15} />
            <span>{t('dashboard.newMember')}</span>
          </Link>
        </div>
      </div>

      {/* Automated Expiry SMS Service Banner */}
      <div className="bg-gradient-to-r from-purple-500/10 via-amber-500/10 to-rose-500/10 border border-purple-500/30 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/40 shadow-sm">
            <Zap size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs md:text-sm font-black text-gym-text uppercase tracking-wide">
                Automated SMS Expiry Engine
              </h3>
              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                Direct SIM / Gateway
              </span>
            </div>
            <p className="text-[11px] md:text-xs text-gym-muted mt-0.5">
              {pendingSmsMembers.length > 0
                ? `⚡ ${pendingSmsMembers.length} active members due for expiration alert (5d, 2d, Today, Grace Period).`
                : `✅ All active member reminders are up to date for today.`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {pendingSmsMembers.length > 0 && (
            <button
              onClick={handleRunAutoSms}
              disabled={autoSmsSending}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xs shadow-md transition-all disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {autoSmsSending ? (
                <RefreshCw size={13} className="animate-spin" />
              ) : (
                <Send size={13} />
              )}
              <span>{autoSmsSending ? 'Auto-Dispatching...' : `Auto-Send All (${pendingSmsMembers.length})`}</span>
            </button>
          )}

          <button
            onClick={() => setShowSmsLogsModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gym-surface hover:bg-gym-hover border border-gym-border text-xs font-bold text-gym-text transition-all shadow-sm"
            title="View full history of sent SMS reminders"
          >
            <FileText size={13} className="text-cyan-500" />
            <span>SMS Logs ({smsLogs.length})</span>
          </button>
        </div>
      </div>

      {autoSmsResult && (
        <div className="bg-emerald-500/15 border border-emerald-500/50 text-emerald-800 dark:text-emerald-300 rounded-xl p-3 mb-6 text-xs font-bold flex items-center gap-2 shadow-sm">
          <CheckCircle size={16} className="shrink-0" />
          <span>{autoSmsResult}</span>
        </div>
      )}

      {/* Stat Metric Cards Grid */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 mb-6">
          <StatCard
            label={t('dashboard.total')}
            value={summary.total}
            icon={Users}
            colorClass="text-amber-500"
            borderClass="border-amber-500/40"
            bgClass="bg-amber-500/10"
            isActive={activeTab === 'all'}
            onClick={() => setActiveTab('all')}
          />
          <StatCard
            label={t('dashboard.active')}
            value={summary.active}
            icon={UserCheck}
            colorClass="text-emerald-500"
            borderClass="border-emerald-500/40"
            bgClass="bg-emerald-500/10"
            isActive={activeTab === 'active'}
            onClick={() => setActiveTab('active')}
          />
          <StatCard
            label={t('dashboard.grace')}
            value={summary.grace}
            icon={AlertTriangle}
            colorClass="text-amber-500"
            borderClass="border-amber-400/50"
            bgClass="bg-amber-500/15"
            badge={t('common.expiringSoon')}
            isActive={activeTab === 'grace_period'}
            onClick={() => setActiveTab('grace_period')}
          />
          <StatCard
            label={t('dashboard.today0d')}
            value={summary.expiringToday}
            icon={Flame}
            colorClass="text-rose-500"
            borderClass="border-rose-500/40"
            bgClass="bg-rose-500/10"
            isActive={activeTab === 'exp_0'}
            onClick={() => setActiveTab('exp_0')}
          />
          <StatCard
            label={t('dashboard.in2Days')}
            value={summary.expiring2}
            icon={Clock}
            colorClass="text-orange-500"
            borderClass="border-orange-500/40"
            bgClass="bg-orange-500/10"
            isActive={activeTab === 'exp_2'}
            onClick={() => setActiveTab('exp_2')}
          />
          <StatCard
            label={t('dashboard.in5Days')}
            value={summary.expiring5}
            icon={Calendar}
            colorClass="text-purple-500"
            borderClass="border-purple-500/40"
            bgClass="bg-purple-500/10"
            isActive={activeTab === 'exp_5'}
            onClick={() => setActiveTab('exp_5')}
          />
          <StatCard
            label={t('dashboard.expired')}
            value={summary.expired}
            icon={XCircle}
            colorClass="text-red-500"
            borderClass="border-red-500/40"
            bgClass="bg-red-500/10"
            isActive={activeTab === 'expired'}
            onClick={() => setActiveTab('expired')}
          />
        </div>
      )}

      {/* Main Members Data Table Card */}
      <div className="bg-gym-card rounded-2xl border border-gym-border p-4 md:p-5 shadow-sm">
        {/* Table Filter Tabs & Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
          {/* Expiry Window Filter Pills */}
          <div className="flex flex-wrap gap-1.5">
            <FilterTab
              label={t('dashboard.allMembers')}
              active={activeTab === 'all'}
              onClick={() => setActiveTab('all')}
            />
            <FilterTab
              label={t('dashboard.active')}
              active={activeTab === 'active'}
              activeClass="bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300"
              onClick={() => setActiveTab('active')}
            />
            <FilterTab
              label={t('common.expiringSoon')}
              active={activeTab === 'grace_period'}
              activeClass="bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-300"
              onClick={() => setActiveTab('grace_period')}
            />
            <FilterTab
              label={t('dashboard.today0d')}
              active={activeTab === 'exp_0'}
              activeClass="bg-rose-500/15 border-rose-500 text-rose-700 dark:text-rose-300"
              onClick={() => setActiveTab('exp_0')}
            />
            <FilterTab
              label={t('dashboard.in2Days')}
              active={activeTab === 'exp_2'}
              activeClass="bg-orange-500/15 border-orange-500 text-orange-700 dark:text-orange-300"
              onClick={() => setActiveTab('exp_2')}
            />
            <FilterTab
              label={t('dashboard.in5Days')}
              active={activeTab === 'exp_5'}
              activeClass="bg-purple-500/15 border-purple-500 text-purple-700 dark:text-purple-300"
              onClick={() => setActiveTab('exp_5')}
            />
            <FilterTab
              label={t('dashboard.expired')}
              active={activeTab === 'expired'}
              activeClass="bg-red-500/15 border-red-500 text-red-700 dark:text-red-300"
              onClick={() => setActiveTab('expired')}
            />
          </div>

          {/* Quick Search */}
          <div className="relative min-w-[240px]">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gym-muted"
            />
            <input
              type="text"
              placeholder={t('common.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gym-surface border border-gym-border focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 rounded-xl pl-9 pr-3 py-1.5 text-xs text-gym-text placeholder:text-gym-dim focus:outline-none transition-all font-medium"
            />
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto rounded-xl border border-gym-border bg-gym-card">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gym-surface text-gym-muted uppercase font-bold tracking-wider text-[10px] border-b border-gym-border">
                <th className="py-3 px-4">{t('dashboard.member')}</th>
                <th className="py-3 px-3">{t('dashboard.memberId')}</th>
                <th className="py-3 px-3">{t('dashboard.phone')}</th>
                <th className="py-3 px-3">{t('dashboard.plan')}</th>
                <th className="py-3 px-3">{t('dashboard.expiryDate')}</th>
                <th className="py-3 px-3">{t('dashboard.status')}</th>
                <th className="py-3 px-4 text-right">{t('dashboard.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gym-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gym-muted">
                    <div className="inline-flex items-center gap-2 font-semibold">
                      <RefreshCw size={16} className="animate-spin text-amber-500" />
                      <span>{t('dashboard.loadingMembers')}</span>
                    </div>
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gym-dim">
                    {t('dashboard.noMembersFound')}
                  </td>
                </tr>
              ) : (
                members.map((m) => {
                  const needsReminder = m.status === 'grace_period' || m.status === 'expired' || (m.daysLeft >= 0 && m.daysLeft <= 5);

                  return (
                    <tr key={m._id} className="hover:bg-gym-surface/60 transition-colors">
                      {/* Member Portrait + Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={m.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                            alt={m.fullName}
                            className="w-9 h-9 rounded-xl object-cover border border-gym-border shrink-0"
                          />
                          <div className="min-w-0">
                            <Link
                              to={`/members/${m._id}`}
                              className="font-extrabold text-gym-text hover:text-amber-500 transition-colors inline-flex items-center gap-1"
                            >
                              <span className="truncate">{m.fullName}</span>
                              <ArrowUpRight size={12} className="text-gym-dim shrink-0" />
                            </Link>
                            <div className="text-[10px] text-gym-dim">
                              {t('common.joined')} {format(new Date(m.joinDate), 'MMM d, yyyy')}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Member ID */}
                      <td className="py-3 px-3">
                        <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-xs">
                          {m.memberId}
                        </span>
                      </td>

                      {/* Phone */}
                      <td className="py-3 px-3 text-gym-text">
                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          <Phone size={11} className="text-gym-dim" />
                          <span>{m.phone}</span>
                        </div>
                      </td>

                      {/* Plan */}
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-md bg-gym-surface border border-gym-border font-bold uppercase text-[10px] text-gym-text">
                          {m.plan}
                        </span>
                      </td>

                      {/* Expiry Date + Countdown */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-gym-text text-xs">
                          {format(new Date(m.expiryDate), 'MMM d, yyyy')}
                        </div>
                        <div
                          className={`text-[10px] font-bold mt-0.5 ${
                            m.daysLeft === 0
                              ? 'text-rose-600 dark:text-rose-400'
                              : m.daysLeft > 0 && m.daysLeft <= 5
                              ? 'text-amber-600 dark:text-amber-400'
                              : m.daysLeft < 0
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-gym-dim'
                          }`}
                        >
                          {m.daysLeft === 0
                            ? `🚨 ${t('common.expiresToday')}`
                            : m.daysLeft > 0
                            ? `${m.daysLeft} ${t('common.daysRemaining')}`
                            : `${Math.abs(m.daysLeft)} ${t('common.daysOverdue')}`}
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-3">
                        <StatusBadge status={m.status} size="sm" />
                      </td>

                      {/* Actions (SMS Reminder + Renew) */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {needsReminder && (
                            <button
                              onClick={() => setSmsTargetMember(m)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-[11px] font-bold text-amber-700 dark:text-amber-300 transition-all"
                              title="Send SMS expiry reminder"
                            >
                              <MessageSquare size={12} />
                              <span>{t('common.sms')}</span>
                            </button>
                          )}

                          <Link
                            to={`/members/${m._id}`}
                            className="inline-flex items-center px-2.5 py-1 rounded-lg bg-gym-surface hover:bg-gym-hover border border-gym-border text-[11px] font-bold text-gym-text transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
                          >
                            {t('common.viewRenew')}
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SMS Reminder Modal */}
      {smsTargetMember && (
        <SmsModal
          member={smsTargetMember}
          onClose={() => setSmsTargetMember(null)}
        />
      )}

      {/* Financial Overview Modal for Owner */}
      {showFinancialModal && (
        <FinancialSummaryModal
          onClose={() => setShowFinancialModal(false)}
        />
      )}

      {/* SMS Logs Ledger Modal */}
      {showSmsLogsModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gym-card rounded-2xl border border-gym-border p-6 max-w-3xl w-full relative shadow-2xl max-h-[85vh] flex flex-col">
            <button
              onClick={() => setShowSmsLogsModal(false)}
              className="absolute top-4 right-4 text-gym-muted hover:text-gym-text p-1.5 rounded-lg hover:bg-gym-surface"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2.5 mb-1 pb-3 border-b border-gym-border">
              <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/40 flex items-center justify-center text-purple-500">
                <FileText size={18} />
              </div>
              <div>
                <h2 className="text-base font-black text-gym-text leading-tight">
                  SMS Notification Ledger & Delivery History
                </h2>
                <p className="text-xs text-gym-muted">
                  Log of automated and manual SMS reminders sent to members via direct carrier SIM / Gateway.
                </p>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 mt-3">
              {smsLogs.length === 0 ? (
                <div className="py-12 text-center text-gym-dim text-xs font-medium">
                  No SMS notifications dispatched yet.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-gym-border bg-gym-surface">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gym-card text-gym-muted uppercase font-bold tracking-wider text-[10px] border-b border-gym-border">
                        <th className="py-2.5 px-3">Sent At</th>
                        <th className="py-2.5 px-3">Member</th>
                        <th className="py-2.5 px-3">Phone</th>
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3">Message Snippet</th>
                        <th className="py-2.5 px-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gym-border">
                      {smsLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-gym-card/60 transition-colors">
                          <td className="py-2.5 px-3 font-mono text-[10px] text-gym-dim whitespace-nowrap">
                            {format(new Date(log.sentAt), 'MMM d, h:mm a')}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-gym-text whitespace-nowrap">
                            {log.memberName}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-xs text-amber-600 dark:text-amber-400 font-bold whitespace-nowrap">
                            {log.phone}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gym-card border border-gym-border text-gym-muted whitespace-nowrap">
                              {log.type || 'Automated'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-gym-muted text-[11px] max-w-xs truncate" title={log.message}>
                            {log.message}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-black">
                              <CheckCircle size={10} />
                              <span>{log.status}</span>
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, colorClass, borderClass, bgClass, badge, isActive, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl p-3.5 border transition-all cursor-pointer select-none relative overflow-hidden ${
        isActive
          ? `bg-gym-card ${borderClass} ring-2 ring-amber-500/50 shadow-md`
          : 'bg-gym-card border-gym-border hover:border-gym-border/80 hover:bg-gym-surface/40'
      }`}
    >
      <div className="flex justify-between items-start mb-1.5">
        <div className={`w-7 h-7 rounded-lg ${bgClass} flex items-center justify-center ${colorClass}`}>
          <Icon size={14} />
        </div>
        {badge && (
          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30">
            {badge}
          </span>
        )}
      </div>
      <div className="text-xl font-black text-gym-text font-mono leading-none">
        {value ?? 0}
      </div>
      <div className="text-[10px] text-gym-muted font-bold tracking-tight uppercase mt-1">
        {label}
      </div>
    </div>
  );
}

function FilterTab({ label, active, activeClass = 'bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-300 font-bold', onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-lg text-xs transition-all border font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 ${
        active
          ? `${activeClass} shadow-sm font-extrabold`
          : 'bg-gym-surface border-gym-border text-gym-muted hover:text-gym-text hover:bg-gym-hover'
      }`}
    >
      {label}
    </button>
  );
}