import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getFinancialSummary, getAllPayments } from '../api/client';
import { exportPaymentsToCsv } from '../utils/exportCsv';
import { format } from 'date-fns';
import {
  DollarSign,
  CreditCard,
  Download,
  X,
  RefreshCw,
  Smartphone,
  Wallet,
  TrendingUp,
  Receipt,
  AlertTriangle,
} from 'lucide-react';

export default function FinancialSummaryModal({ onClose }) {
  const { t } = useTranslation();
  const [financials, setFinancials] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    try {
      const [fin, payList] = await Promise.all([getFinancialSummary(), getAllPayments()]);
      setFinancials(fin);
      setPayments(payList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function handleExportCsv() {
    if (payments.length > 0) {
      exportPaymentsToCsv(payments);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gym-card rounded-2xl border border-gym-border p-6 max-w-3xl w-full relative shadow-2xl max-h-[90vh] flex flex-col">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gym-border">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center text-white shadow-md">
              <TrendingUp size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-gym-text leading-tight">
                  Financial & Revenue Intelligence
                </h2>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  Owner Audit
                </span>
              </div>
              <p className="text-xs text-gym-muted mt-0.5">
                Real-time breakdown of gym cash flow, mobile money payments, and pending installments.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gym-surface hover:bg-gym-hover border border-gym-border text-xs font-bold text-gym-text transition-all shadow-sm"
              title="Download full payment spreadsheet"
            >
              <Download size={13} className="text-emerald-500" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={onClose}
              className="text-gym-muted hover:text-gym-text p-1.5 rounded-lg hover:bg-gym-surface"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {loading || !financials ? (
          <div className="py-20 text-center text-gym-muted">
            <RefreshCw size={24} className="animate-spin text-amber-500 mx-auto mb-2" />
            <span className="text-xs font-semibold">Calculating gym financial ledger...</span>
          </div>
        ) : (
          <div className="overflow-y-auto pt-4 space-y-5 flex-1 pr-1">
            {/* Top Revenue Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Total Revenue */}
              <div className="bg-gym-surface rounded-xl p-4 border border-gym-border">
                <div className="flex items-center justify-between text-gym-muted mb-1">
                  <span className="text-[10px] font-black uppercase tracking-wider">Lifetime Revenue</span>
                  <Wallet size={16} className="text-amber-500" />
                </div>
                <div className="text-2xl font-black text-gym-text font-mono">
                  {financials.totalRevenue.toLocaleString()} <span className="text-xs text-amber-500 font-sans">ETB</span>
                </div>
                <div className="text-[10px] text-gym-dim mt-0.5 font-mono">
                  Across {financials.totalTransactions} transactions
                </div>
              </div>

              {/* Today's Collection */}
              <div className="bg-gym-surface rounded-xl p-4 border border-gym-border">
                <div className="flex items-center justify-between text-gym-muted mb-1">
                  <span className="text-[10px] font-black uppercase tracking-wider">Collected Today</span>
                  <DollarSign size={16} className="text-emerald-500" />
                </div>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  {financials.todayRevenue.toLocaleString()} <span className="text-xs font-sans">ETB</span>
                </div>
                <div className="text-[10px] text-gym-dim mt-0.5">
                  Same-day front desk receipts
                </div>
              </div>

              {/* Pending Receivables */}
              <div className="bg-gym-surface rounded-xl p-4 border border-gym-border">
                <div className="flex items-center justify-between text-gym-muted mb-1">
                  <span className="text-[10px] font-black uppercase tracking-wider">Pending Receivables</span>
                  <AlertTriangle size={16} className="text-rose-500" />
                </div>
                <div className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
                  {financials.totalBalanceDue.toLocaleString()} <span className="text-xs font-sans">ETB</span>
                </div>
                <div className="text-[10px] text-gym-dim mt-0.5">
                  Yearly partial installments due
                </div>
              </div>
            </div>

            {/* Payment Method Channels Breakdown */}
            <div className="bg-gym-surface rounded-xl p-4 border border-gym-border">
              <div className="text-xs font-black uppercase tracking-wider text-gym-text mb-3">
                Payment Channel Distribution
              </div>

              <div className="space-y-3">
                {/* Cash */}
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="flex items-center gap-1.5 text-gym-text">
                      <Wallet size={14} className="text-emerald-500" />
                      <span>Cash at Front Desk</span>
                    </span>
                    <span className="font-mono text-gym-text">
                      {financials.cashTotal.toLocaleString()} ETB ({financials.totalRevenue ? Math.round((financials.cashTotal / financials.totalRevenue) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-gym-card overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${financials.totalRevenue ? (financials.cashTotal / financials.totalRevenue) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                {/* Mobile Money (Telebirr / CBE) */}
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="flex items-center gap-1.5 text-gym-text">
                      <Smartphone size={14} className="text-cyan-500" />
                      <span>Telebirr / CBE Mobile Money</span>
                    </span>
                    <span className="font-mono text-gym-text">
                      {financials.mobileMoneyTotal.toLocaleString()} ETB ({financials.totalRevenue ? Math.round((financials.mobileMoneyTotal / financials.totalRevenue) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-gym-card overflow-hidden">
                    <div
                      className="h-full bg-cyan-500 rounded-full"
                      style={{ width: `${financials.totalRevenue ? (financials.mobileMoneyTotal / financials.totalRevenue) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                {/* POS / Card */}
                {financials.otherTotal > 0 && (
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="flex items-center gap-1.5 text-gym-text">
                        <CreditCard size={14} className="text-purple-500" />
                        <span>POS / Card</span>
                      </span>
                      <span className="font-mono text-gym-text">
                        {financials.otherTotal.toLocaleString()} ETB ({financials.totalRevenue ? Math.round((financials.otherTotal / financials.totalRevenue) * 100) : 0}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-gym-card overflow-hidden">
                      <div
                        className="h-full bg-purple-500 rounded-full"
                        style={{ width: `${financials.totalRevenue ? (financials.otherTotal / financials.totalRevenue) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Payments Ledger Table */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div className="text-xs font-black uppercase tracking-wider text-gym-text flex items-center gap-1.5">
                  <Receipt size={14} className="text-amber-500" />
                  <span>Recent Transaction Audit ({payments.length})</span>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-gym-border bg-gym-surface">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gym-card text-gym-muted uppercase font-bold tracking-wider text-[10px] border-b border-gym-border">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Member</th>
                      <th className="py-2.5 px-3">ID</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3">Channel</th>
                      <th className="py-2.5 px-3 text-right">Balance Due</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gym-border">
                    {payments.map((p) => (
                      <tr key={p._id} className="hover:bg-gym-card/60 transition-colors">
                        <td className="py-2.5 px-3 font-mono text-[11px] text-gym-muted">
                          {format(new Date(p.createdAt), 'MMM d, yyyy')}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-gym-text">
                          {p.memberName}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                          {p.memberIdLabel}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {p.amount} ETB
                        </td>
                        <td className="py-2.5 px-3 text-gym-muted capitalize">
                          {p.method.replace('_', ' ')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold">
                          {p.isPartial ? (
                            <span className="text-amber-600 dark:text-amber-400">{p.balanceDue} ETB</span>
                          ) : (
                            <span className="text-gym-dim">Paid Full</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
