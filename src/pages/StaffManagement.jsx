import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  ShieldAlert,
  UserX,
  UserCheck,
  Trash2,
  Phone,
  KeyRound,
  Lock,
  X,
  CheckCircle,
} from 'lucide-react';

export default function StaffManagement() {
  const { t } = useTranslation();
  const { staffList, addStaff, toggleStaffStatus, deleteStaff, user } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('front_desk');
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  function handleAddWorker(e) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    try {
      addStaff({ name, phone, password, role });
      setSuccessMsg(`New worker "${name}" added successfully.`);
      setName('');
      setPhone('');
      setPassword('');
      setRole('front_desk');
      setShowAddModal(false);
    } catch (err) {
      setError(err.message);
    }
  }

  function handleFireWorker(worker) {
    const isDeactivating = worker.status === 'active';
    const confirmMessage = isDeactivating
      ? `Are you sure you want to fire/deactivate ${worker.name}? They will immediately lose login access.`
      : `Reactivate access for ${worker.name}?`;

    if (window.confirm(confirmMessage)) {
      toggleStaffStatus(worker.id);
    }
  }

  function handleDeleteWorker(worker) {
    if (window.confirm(`Permanently remove ${worker.name} from the staff records?`)) {
      deleteStaff(worker.id);
    }
  }

  const activeStaff = staffList.filter((s) => s.status === 'active');
  const deactivatedStaff = staffList.filter((s) => s.status === 'deactivated');

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Top Header & Add Worker Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-black text-gym-text tracking-tight">
              {t('staff.title')}
            </h1>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
              {t('nav.owner')}
            </span>
          </div>
          <p className="text-xs md:text-sm text-gym-muted mt-1">
            {t('staff.subtitle')}
          </p>
        </div>

        <button
          onClick={() => {
            setShowAddModal(true);
            setError(null);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white text-xs md:text-sm font-black transition-all shadow-md shadow-amber-950/20 focus:outline-none focus:ring-2 focus:ring-amber-500 self-start sm:self-auto"
        >
          <UserPlus size={16} />
          <span>{t('staff.addStaff')}</span>
        </button>
      </div>

      {successMsg && (
        <div className="bg-emerald-500/15 border border-emerald-500/50 text-emerald-800 dark:text-emerald-300 rounded-xl p-3 mb-6 text-xs font-bold flex items-center gap-2">
          <CheckCircle size={16} className="shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Staff Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-gym-card rounded-2xl border border-gym-border p-4 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[10px] text-gym-muted uppercase font-bold tracking-wider">
              {t('staff.title')}
            </div>
            <div className="text-2xl font-black text-gym-text font-mono mt-0.5">
              {staffList.length}
            </div>
            <div className="text-[10px] text-gym-dim mt-0.5 font-mono">Authorized accounts</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
            <Users size={20} />
          </div>
        </div>

        <div className="bg-gym-card rounded-2xl border border-gym-border p-4 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[10px] text-gym-muted uppercase font-bold tracking-wider">
              {t('staff.active')}
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
              {activeStaff.length}
            </div>
            <div className="text-[10px] text-gym-dim mt-0.5">Active access</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
            <UserCheck size={20} />
          </div>
        </div>

        <div className="bg-gym-card rounded-2xl border border-gym-border p-4 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[10px] text-gym-muted uppercase font-bold tracking-wider">
              {t('staff.disabled')}
            </div>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono mt-0.5">
              {deactivatedStaff.length}
            </div>
            <div className="text-[10px] text-gym-dim mt-0.5">Login access blocked</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500">
            <UserX size={20} />
          </div>
        </div>
      </div>

      {/* Staff Directory Table */}
      <div className="bg-gym-card rounded-2xl border border-gym-border p-4 md:p-5 shadow-sm">
        <div className="text-xs font-black uppercase tracking-wider text-gym-text mb-4">
          {t('staff.title')} ({staffList.length})
        </div>

        <div className="overflow-x-auto rounded-xl border border-gym-border bg-gym-card">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gym-surface text-gym-muted uppercase font-bold tracking-wider text-[10px] border-b border-gym-border">
                <th className="py-2.5 px-3">{t('staff.staffName')}</th>
                <th className="py-2.5 px-3">{t('staff.username')}</th>
                <th className="py-2.5 px-3">{t('staff.role')}</th>
                <th className="py-2.5 px-3">{t('staff.status')}</th>
                <th className="py-2.5 px-3">{t('common.date')}</th>
                <th className="py-2.5 px-4 text-right">{t('staff.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gym-border">
              {staffList.map((worker) => {
                const isCurrentUser = user?.id === worker.id;
                const isOwnerAccount = worker.role === 'admin';

                return (
                  <tr key={worker.id} className="hover:bg-gym-surface/60 transition-colors">
                    {/* Name */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                            worker.role === 'admin'
                              ? 'bg-gradient-to-tr from-amber-500 to-rose-600 text-white shadow-sm'
                              : 'bg-gym-surface text-gym-text border border-gym-border'
                          }`}
                        >
                          {worker.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-extrabold text-gym-text flex items-center gap-1.5">
                            <span>{worker.name}</span>
                            {isCurrentUser && (
                              <span className="text-[9px] font-bold text-amber-500 font-mono">(You)</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Phone Login */}
                    <td className="py-3 px-3">
                      <span className="font-mono font-bold text-gym-text text-xs">
                        {worker.phone}
                      </span>
                    </td>

                    {/* Role */}
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          worker.role === 'admin'
                            ? 'bg-amber-500/15 border border-amber-500/40 text-amber-600 dark:text-amber-300'
                            : 'bg-gym-surface border border-gym-border text-gym-text'
                        }`}
                      >
                        <Shield size={10} />
                        <span>{worker.role === 'admin' ? t('staff.admin') : t('staff.receptionist')}</span>
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3">
                      {worker.status === 'active' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                          <ShieldCheck size={11} />
                          <span>{t('staff.active')}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/40 text-rose-700 dark:text-rose-300 text-[10px] font-bold">
                          <ShieldAlert size={11} />
                          <span>{t('staff.disabled')}</span>
                        </span>
                      )}
                    </td>

                    {/* Date Added */}
                    <td className="py-3 px-3 text-gym-muted font-mono text-[11px]">
                      {worker.createdAt}
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3 px-4 text-right">
                      {!isOwnerAccount ? (
                        <div className="inline-flex items-center gap-1.5">
                          {/* Fire / Reactivate Button */}
                          <button
                            onClick={() => handleFireWorker(worker)}
                            className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm ${
                              worker.status === 'active'
                                ? 'bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/40 text-rose-600 dark:text-rose-300'
                                : 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/40 text-emerald-600 dark:text-emerald-300'
                            }`}
                            title={worker.status === 'active' ? 'Fire worker & revoke access' : 'Reactivate access'}
                          >
                            {worker.status === 'active' ? t('staff.disabled') : t('staff.active')}
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDeleteWorker(worker)}
                            className="p-1 rounded-lg bg-gym-surface hover:bg-gym-hover border border-gym-border text-gym-muted hover:text-rose-500 transition-colors"
                            title="Delete record permanently"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-gym-dim font-bold uppercase">Owner Protected</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hire / Add New Worker Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gym-card rounded-2xl border border-gym-border p-6 max-w-md w-full relative shadow-2xl">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-gym-muted hover:text-gym-text p-1 rounded-lg hover:bg-gym-surface"
            >
              <X size={18} />
            </button>

            <h2 className="text-base font-black text-gym-text uppercase tracking-wider mb-1 flex items-center gap-2">
              <UserPlus size={18} className="text-amber-500" />
              <span>Hire / Add Front-Desk Worker</span>
            </h2>
            <p className="text-xs text-gym-muted mb-4">
              Set up credentials so the new worker can log into the front-desk terminal.
            </p>

            {error && (
              <div className="bg-rose-500/15 border border-rose-500 text-rose-800 dark:text-rose-200 rounded-xl p-3 mb-4 text-xs font-bold">
                {error}
              </div>
            )}

            <form onSubmit={handleAddWorker} className="flex flex-col gap-3.5">
              <div>
                <label className="text-xs font-bold text-gym-muted block mb-1">
                  Worker Full Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bethlehem Tadesse"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-gym-surface border border-gym-border focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 rounded-xl px-3.5 py-2 text-sm text-gym-text focus:outline-none transition-all font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gym-muted block mb-1">
                  Phone Number (Login ID) *
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 0933445566"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="w-full bg-gym-surface border border-gym-border focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 rounded-xl px-3.5 py-2 text-sm font-mono text-gym-text focus:outline-none transition-all font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gym-muted block mb-1">
                  Password / Access PIN *
                </label>
                <input
                  type="password"
                  placeholder="Create desk password or 4-digit PIN"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-gym-surface border border-gym-border focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 rounded-xl px-3.5 py-2 text-sm text-gym-text focus:outline-none transition-all font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gym-muted block mb-1">
                  System Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-gym-surface border border-gym-border focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 rounded-xl px-3.5 py-2 text-sm text-gym-text focus:outline-none transition-all font-medium"
                >
                  <option value="front_desk">Front-Desk Worker (Check-in, register, renew)</option>
                  <option value="admin">Admin / Assistant Manager (Full system access)</option>
                </select>
              </div>

              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-gym-surface hover:bg-gym-hover border border-gym-border text-xs font-bold text-gym-text"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white font-black text-xs shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  Authorize Worker
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
