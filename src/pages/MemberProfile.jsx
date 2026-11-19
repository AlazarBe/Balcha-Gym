import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getMemberById, getPaymentsForMember, getAttendanceForMember, renewMember, getLockerForMember } from '../api/client';
import { PLAN_PRICES, calculateNewExpiry } from '../utils/calculateNewExpiry';
import StatusBadge from '../components/StatusBadge';
import MemberCard from '../components/MemberCard';
import SmsModal from '../components/SmsModal';
import { format } from 'date-fns';
import {
  CreditCard,
  History,
  Printer,
  CheckCircle2,
  ArrowLeft,
  RefreshCw,
  Receipt,
  ShieldAlert,
  X,
  MessageSquare,
  Phone,
  Layers,
} from 'lucide-react';

export default function MemberProfile() {
  const { t } = useTranslation();
  const { id } = useParams();
  const [member, setMember] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [payments, setPayments] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('cash');
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [showSmsModal, setShowSmsModal] = useState(false);
  const [lockerInfo, setLockerInfo] = useState(null);

  async function loadAll() {
    try {
      const m = await getMemberById(id);
      setMember(m);
      setSelectedPlan(m.plan);
      setAmount(m.plan === 'yearly' ? 4000 : PLAN_PRICES[m.plan]);
      const payList = await getPaymentsForMember(m._id);
      setPayments(payList);
      const attList = await getAttendanceForMember(m._id);
      setAttendance(attList);
      const locker = getLockerForMember(m._id);
      setLockerInfo(locker);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    loadAll();
  }, [id]);

  function handlePlanSelect(newPlan) {
    setSelectedPlan(newPlan);
    setAmount(newPlan === 'yearly' ? 4000 : PLAN_PRICES[newPlan]);
  }

  let previewNewExpiry = null;
  if (member && amount && selectedPlan) {
    try {
      previewNewExpiry = calculateNewExpiry({
        plan: selectedPlan,
        oldExpiryDate: new Date(member.expiryDate),
        amount: Number(amount),
        today: new Date(),
      });
    } catch (e) {
      previewNewExpiry = null;
    }
  }

  async function handleRenew(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await renewMember(member._id, { plan: selectedPlan, amount: Number(amount), method });
      setSuccessMsg(
        `Payment recorded! Membership renewed under ${selectedPlan.toUpperCase()} plan until ${format(
          new Date(res.member.expiryDate),
          'MMM d, yyyy'
        )}`
      );
      await loadAll();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!member) {
    return (
      <div className="p-16 text-center text-gym-muted">
        <RefreshCw size={24} className="animate-spin text-amber-500 mx-auto mb-3" />
        <div className="text-sm font-semibold">Loading member profile...</div>
      </div>
    );
  }

  const isPlanChanged = selectedPlan !== member.plan;
  const isYearly = selectedPlan === 'yearly';
  const latestPayment = payments[0];
  const balanceDue = member.plan === 'yearly' && latestPayment ? latestPayment.balanceDue : 0;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Top Breadcrumb Link & Print Card Shortcut */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs md:text-sm font-bold text-gym-muted hover:text-gym-text transition-colors"
        >
          <ArrowLeft size={16} />
          <span>{t('profile.back')}</span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Send SMS Reminder Button */}
          <button
            onClick={() => setShowSmsModal(true)}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-xs font-bold text-amber-700 dark:text-amber-300 transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
          >
            <MessageSquare size={14} className="text-amber-500" />
            <span>{t('sms.title')}</span>
          </button>

          <button
            onClick={() => setShowCardModal(true)}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gym-surface hover:bg-gym-hover border border-gym-border text-xs font-bold text-gym-text transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
          >
            <Printer size={14} className="text-amber-500" />
            <span>{t('profile.printCard')}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Member Overview & Renewal Form (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* Member Overview Card */}
          <div className="bg-gym-card rounded-2xl border border-gym-border p-5 md:p-6 shadow-sm">
            <div className="flex items-start gap-4 mb-4">
              <img
                src={member.photoUrl}
                alt={member.fullName}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-gym-border shadow-md shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-black text-gym-text truncate">{member.fullName}</h1>
                  <StatusBadge status={member.status} size="sm" />
                </div>
                <div className="font-mono text-sm font-bold text-amber-600 dark:text-amber-400 tracking-wider my-0.5">
                  {member.memberId}
                </div>
                <div className="text-xs text-gym-muted">
                  {t('common.joined')} {format(new Date(member.joinDate), 'MMMM d, yyyy')}
                </div>
              </div>
            </div>

            {/* Quick Details Grid */}
            <div className="grid grid-cols-2 gap-2.5 bg-gym-surface rounded-xl p-3.5 border border-gym-border text-xs">
              <div>
                <span className="text-gym-dim uppercase font-bold text-[10px] block">{t('common.phone')}</span>
                <span className="font-bold text-gym-text font-mono flex items-center gap-1 mt-0.5">
                  <Phone size={11} className="text-gym-dim" />
                  <span>{member.phone}</span>
                </span>
              </div>
              <div>
                <span className="text-gym-dim uppercase font-bold text-[10px] block">{t('common.plan')}</span>
                <span className="font-bold text-gym-text uppercase">{member.plan}</span>
              </div>
              <div>
                <span className="text-gym-dim uppercase font-bold text-[10px] block">{t('profile.expiryDate')}</span>
                <span className="font-bold text-gym-text">{format(new Date(member.expiryDate), 'MMM d, yyyy')}</span>
              </div>
              <div>
                <span className="text-gym-dim uppercase font-bold text-[10px] block">{t('profile.emergencyContact')}</span>
                <span className="font-medium text-gym-muted truncate block">{member.emergencyContact || '—'}</span>
              </div>
              <div className="col-span-2 pt-2 border-t border-gym-border/60 flex items-center justify-between">
                <span className="text-gym-dim uppercase font-bold text-[10px] flex items-center gap-1">
                  <Layers size={12} className="text-cyan-500" />
                  <span>Shoe Locker</span>
                </span>
                {lockerInfo ? (
                  <Link
                    to="/lockers"
                    className="font-bold text-cyan-600 dark:text-cyan-400 font-mono hover:underline flex items-center gap-1"
                  >
                    <span>{lockerInfo.slotLabel}</span>
                  </Link>
                ) : (
                  <Link
                    to="/lockers"
                    className="text-[11px] text-gym-dim hover:text-amber-500 font-semibold"
                  >
                    + Assign Locker
                  </Link>
                )}
              </div>
            </div>

            {/* Balance Due Notice if partial yearly */}
            {balanceDue > 0 && (
              <div className="mt-3.5 bg-amber-500/15 border border-amber-500/50 text-amber-900 dark:text-amber-200 rounded-xl p-3 text-xs">
                <div className="font-extrabold flex items-center justify-between">
                  <span>⚠️ Balance Due on Current Plan:</span>
                  <span className="font-mono text-amber-700 dark:text-amber-300 font-black">{balanceDue} {t('common.currency')}</span>
                </div>
                <div className="text-[11px] text-amber-800 dark:text-amber-300/80 mt-1">
                  Access is active for days paid so far.
                </div>
              </div>
            )}
          </div>

          {/* Renewal & Plan Change Form Card */}
          <div className="bg-gym-card rounded-2xl border border-gym-border p-5 md:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b border-gym-border pb-3">
              <div className="flex items-center gap-2">
                <CreditCard size={18} className="text-amber-500" />
                <h2 className="text-sm font-extrabold uppercase tracking-wider text-gym-text">
                  {t('profile.renewMembership')}
                </h2>
              </div>
            </div>

            {successMsg && (
              <div className="bg-emerald-500/15 border border-emerald-500/50 text-emerald-800 dark:text-emerald-300 rounded-xl p-3 mb-4 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 size={16} className="shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {error && (
              <div className="bg-rose-500/15 border border-rose-500 text-rose-800 dark:text-rose-200 rounded-xl p-3 mb-4 text-xs font-bold flex items-center gap-2">
                <ShieldAlert size={16} className="shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleRenew} className="flex flex-col gap-3.5">
              {/* Renewal Plan Selection Pills */}
              <div>
                <label className="text-xs font-bold text-gym-muted block mb-1.5">
                  {t('profile.selectRenewPlan')}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handlePlanSelect('monthly')}
                    className={`p-2.5 rounded-xl border text-center transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                      selectedPlan === 'monthly'
                        ? 'bg-amber-500/15 border-amber-500 ring-1 ring-amber-500 text-gym-text shadow-sm'
                        : 'bg-gym-surface border-gym-border text-gym-muted hover:text-gym-text hover:bg-gym-hover'
                    }`}
                  >
                    <div className="text-xs font-black uppercase">Monthly</div>
                    <div className="text-[11px] font-bold font-mono text-amber-600 dark:text-amber-400 mt-0.5">
                      800 ETB
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePlanSelect('quarterly')}
                    className={`p-2.5 rounded-xl border text-center transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                      selectedPlan === 'quarterly'
                        ? 'bg-amber-500/15 border-amber-500 ring-1 ring-amber-500 text-gym-text shadow-sm'
                        : 'bg-gym-surface border-gym-border text-gym-muted hover:text-gym-text hover:bg-gym-hover'
                    }`}
                  >
                    <div className="text-xs font-black uppercase">Quarterly</div>
                    <div className="text-[11px] font-bold font-mono text-amber-600 dark:text-amber-400 mt-0.5">
                      2,200 ETB
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePlanSelect('yearly')}
                    className={`p-2.5 rounded-xl border text-center transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 relative ${
                      selectedPlan === 'yearly'
                        ? 'bg-amber-500/15 border-amber-500 ring-1 ring-amber-500 text-gym-text shadow-sm'
                        : 'bg-gym-surface border-gym-border text-gym-muted hover:text-gym-text hover:bg-gym-hover'
                    }`}
                  >
                    <span className="absolute -top-2 right-1 text-[7px] font-black uppercase px-1 py-0.2 rounded bg-rose-600 text-white">
                      Partial OK
                    </span>
                    <div className="text-xs font-black uppercase">Yearly</div>
                    <div className="text-[11px] font-bold font-mono text-amber-600 dark:text-amber-400 mt-0.5">
                      8,000 ETB
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-gym-muted">{t('common.amount')} ({t('common.currency')}) *</label>
                  <span className="text-[10px] text-gym-dim font-bold">
                    {!isYearly
                      ? `${PLAN_PRICES[selectedPlan]} ${t('common.currency')}`
                      : 'Partial installments allowed'}
                  </span>
                </div>
                <input
                  type="number"
                  min={isYearly ? 500 : PLAN_PRICES[selectedPlan]}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="w-full bg-gym-surface border border-gym-border focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 rounded-xl px-3.5 py-2 text-sm font-mono font-bold text-amber-600 dark:text-amber-400 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gym-muted block mb-1">{t('register.paymentMethod')}</label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="w-full bg-gym-surface border border-gym-border focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 rounded-xl px-3.5 py-2 text-sm text-gym-text focus:outline-none transition-all font-medium"
                >
                  <option value="cash">💵 {t('common.cash')}</option>
                  <option value="mobile_money">📱 {t('common.mobileMoney')}</option>
                  <option value="other">💳 {t('common.other')}</option>
                </select>
              </div>

              {/* Renewal Math Preview Callout */}
              <div className="bg-gym-surface rounded-xl p-3 border border-gym-border text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-gym-muted">{t('common.endDate')}:</span>
                  <strong className="text-emerald-600 dark:text-emerald-400 font-mono font-extrabold text-sm">
                    {previewNewExpiry ? format(previewNewExpiry, 'MMM d, yyyy') : '—'}
                  </strong>
                </div>
                {isPlanChanged && (
                  <div className="text-[11px] text-cyan-600 dark:text-cyan-400 font-semibold mt-1">
                    ✨ {member.plan.toUpperCase()} → {selectedPlan.toUpperCase()}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white font-black text-xs md:text-sm tracking-wide shadow-md transition-all disabled:opacity-50 mt-1 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {submitting ? t('common.loading') : t('profile.renewBtn')}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Detailed Logs (Payments & Attendance) (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          {/* Payment History Table */}
          <div className="bg-gym-card rounded-2xl border border-gym-border p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3 border-b border-gym-border pb-2.5">
              <Receipt size={16} className="text-amber-500" />
              <h2 className="text-xs font-black uppercase tracking-wider text-gym-text">{t('profile.paymentHistory')}</h2>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gym-border bg-gym-card">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gym-surface text-gym-muted uppercase font-bold tracking-wider text-[10px] border-b border-gym-border">
                    <th className="py-2.5 px-3">{t('common.date')}</th>
                    <th className="py-2.5 px-3">{t('common.amount')}</th>
                    <th className="py-2.5 px-3">{t('register.paymentMethod')}</th>
                    <th className="py-2.5 px-3">{t('common.endDate')}</th>
                    <th className="py-2.5 px-3 text-right">Balance Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gym-border">
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gym-dim">
                        {t('profile.noPayments')}
                      </td>
                    </tr>
                  ) : (
                    payments.map((p) => (
                      <tr key={p._id} className="hover:bg-gym-surface/60 transition-colors">
                        <td className="py-2.5 px-3 text-gym-text font-mono text-[11px]">
                          {format(new Date(p.createdAt), 'MMM d, yyyy')}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {p.amount} {t('common.currency')}
                        </td>
                        <td className="py-2.5 px-3 text-gym-muted capitalize">
                          {p.method.replace('_', ' ')}
                        </td>
                        <td className="py-2.5 px-3 text-gym-text font-medium">
                          {p.coversUntil ? format(new Date(p.coversUntil), 'MMM d, yyyy') : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-[11px]">
                          {p.isPartial ? (
                            <span className="text-amber-600 dark:text-amber-400">{p.balanceDue} {t('common.currency')}</span>
                          ) : (
                            <span className="text-gym-dim">Paid Full</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Attendance History Table */}
          <div className="bg-gym-card rounded-2xl border border-gym-border p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3 border-b border-gym-border pb-2.5">
              <History size={16} className="text-cyan-500" />
              <h2 className="text-xs font-black uppercase tracking-wider text-gym-text">{t('profile.attendanceHistory')}</h2>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gym-border bg-gym-card">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gym-surface text-gym-muted uppercase font-bold tracking-wider text-[10px] border-b border-gym-border">
                    <th className="py-2.5 px-3">{t('common.date')}</th>
                    <th className="py-2.5 px-3">{t('attendance.checkIn')}</th>
                    <th className="py-2.5 px-3 text-right">{t('attendance.checkOut')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gym-border">
                  {attendance.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-gym-dim">
                        {t('profile.noAttendance')}
                      </td>
                    </tr>
                  ) : (
                    attendance.map((a) => (
                      <tr key={a._id} className="hover:bg-gym-surface/60 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-gym-text text-[11px]">
                          {a.date}
                        </td>
                        <td className="py-2.5 px-3 text-emerald-600 dark:text-emerald-400 font-mono text-[11px]">
                          {a.checkIn ? format(new Date(a.checkIn), 'h:mm:ss a') : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right text-gym-muted font-mono text-[11px]">
                          {a.checkOut ? format(new Date(a.checkOut), 'h:mm:ss a') : '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* SMS Modal */}
      {showSmsModal && (
        <SmsModal
          member={member}
          onClose={() => setShowSmsModal(false)}
        />
      )}

      {/* Member Card Preview / Print Modal */}
      {showCardModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gym-card rounded-2xl border border-gym-border p-6 max-w-md w-full text-center relative shadow-2xl">
            <button
              onClick={() => setShowCardModal(false)}
              className="absolute top-4 right-4 text-gym-muted hover:text-gym-text p-1 rounded-lg hover:bg-gym-surface"
            >
              <X size={18} />
            </button>

            <h2 className="text-base font-black text-gym-text uppercase tracking-wider mb-4">
              {t('profile.qrCard')}
            </h2>

            <div className="flex justify-center mb-5">
              <MemberCard member={member} showActions={true} />
            </div>

            <button
              onClick={() => setShowCardModal(false)}
              className="px-4 py-2 rounded-xl bg-gym-surface hover:bg-gym-hover border border-gym-border text-xs font-bold text-gym-text"
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}