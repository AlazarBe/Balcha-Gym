import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getLockers, assignLockerSlot, releaseLockerSlot, addLocker, deleteLocker, getMembers } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import {
  Grid,
  Search,
  Plus,
  Trash2,
  UserCheck,
  UserX,
  X,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  ArrowUpRight,
  ShieldAlert,
  UserPlus,
  Key,
  Layers,
  Sparkles,
} from 'lucide-react';

export default function Lockers() {
  const { t } = useTranslation();
  const [lockers, setLockers] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'has_free' | 'empty' | 'full'
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Assign Modal state
  const [assignTarget, setAssignTarget] = useState(null); // { lockerNumber, slotIndex }
  const [memberSearch, setMemberSearch] = useState('');

  async function loadData() {
    setLoading(true);
    try {
      const [lockerList, memberList] = await Promise.all([getLockers(), getMembers()]);
      setLockers(lockerList);
      setMembers(memberList);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleAddLocker() {
    setActionLoading(true);
    setErrorMsg(null);
    try {
      const updated = await addLocker();
      setLockers(updated);
      setSuccessMsg('New locker added successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDeleteLocker(lockerNumber) {
    const confirmDelete = window.confirm(
      t('lockers.deleteConfirm', { number: lockerNumber })
    );
    if (!confirmDelete) return;

    setActionLoading(true);
    setErrorMsg(null);
    try {
      const updated = await deleteLocker(lockerNumber);
      setLockers(updated);
      setSuccessMsg(`Locker #${lockerNumber} deleted.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReleaseSlot(lockerNumber, slotIndex, memberName) {
    const confirmRelease = window.confirm(
      t('lockers.releaseConfirm', {
        name: memberName || 'this member',
        number: lockerNumber,
        slot: slotIndex + 1,
      })
    );
    if (!confirmRelease) return;

    setActionLoading(true);
    setErrorMsg(null);
    try {
      const updated = await releaseLockerSlot({ lockerNumber, slotIndex });
      setLockers(updated);
      setSuccessMsg(t('lockers.releasedSuccess'));
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleAssignMember(memberId) {
    if (!assignTarget) return;
    setActionLoading(true);
    setErrorMsg(null);
    try {
      const updated = await assignLockerSlot({
        lockerNumber: assignTarget.lockerNumber,
        slotIndex: assignTarget.slotIndex,
        memberId,
      });
      setLockers(updated);
      setAssignTarget(null);
      setMemberSearch('');
      setSuccessMsg(t('lockers.assignedSuccess'));
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setActionLoading(false);
    }
  }

  // Calculate totals
  const totalLockers = lockers.length;
  const totalSlots = totalLockers * 4;
  const totalOccupied = lockers.reduce((sum, l) => sum + l.occupiedCount, 0);
  const totalAvailable = totalSlots - totalOccupied;
  const fullLockersCount = lockers.filter((l) => l.isFull).length;
  const emptyLockersCount = lockers.filter((l) => l.isEmpty).length;

  // Find all currently assigned member IDs across all lockers
  const assignedMemberIds = new Set(
    lockers.flatMap((l) => l.slots.filter(Boolean).map((s) => s._id || s.memberId))
  );

  // Filter unassigned members for the assignment modal
  const availableMembersForAssignment = members.filter((m) => {
    const isAssigned = assignedMemberIds.has(m._id) || assignedMemberIds.has(m.memberId);
    if (isAssigned) return false;
    if (!memberSearch.trim()) return true;
    const query = memberSearch.toLowerCase().trim();
    return (
      m.fullName.toLowerCase().includes(query) ||
      m.memberId.toLowerCase().includes(query) ||
      (m.phone && m.phone.includes(query))
    );
  });

  // Filter and search lockers
  const filteredLockers = lockers.filter((l) => {
    // Tab filter
    if (activeFilter === 'has_free' && (l.occupiedCount === 0 || l.isFull)) return false;
    if (activeFilter === 'empty' && !l.isEmpty) return false;
    if (activeFilter === 'full' && !l.isFull) return false;

    // Search query (locker number or member name/id in slots)
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();

    if (String(l.number).includes(query) || `locker ${l.number}`.includes(query) || `locker #${l.number}`.includes(query)) {
      return true;
    }

    return l.slots.some((s) => {
      if (!s) return false;
      return (
        s.fullName.toLowerCase().includes(query) ||
        s.memberId.toLowerCase().includes(query) ||
        (s.phone && s.phone.includes(query))
      );
    });
  });

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-black text-gym-text tracking-tight">
              {t('lockers.title')}
            </h1>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
              👟 4 Shoes / Locker
            </span>
          </div>
          <p className="text-xs md:text-sm text-gym-muted mt-1">
            {t('lockers.subtitle')}
          </p>
        </div>

        <button
          onClick={handleAddLocker}
          disabled={actionLoading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white text-xs md:text-sm font-black transition-all shadow-md shadow-amber-950/20 focus:outline-none focus:ring-2 focus:ring-amber-500 self-start sm:self-auto disabled:opacity-50"
        >
          <Plus size={16} />
          <span>{t('lockers.addLocker')}</span>
        </button>
      </div>

      {/* Success / Error Alerts */}
      {successMsg && (
        <div className="bg-emerald-500/15 border border-emerald-500/50 text-emerald-800 dark:text-emerald-300 rounded-xl p-3 mb-6 text-xs font-bold flex items-center gap-2 shadow-sm">
          <CheckCircle size={16} className="shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-500/15 border border-rose-500 text-rose-800 dark:text-rose-200 rounded-xl p-3 mb-6 text-xs font-bold flex items-center gap-2 shadow-sm">
          <ShieldAlert size={16} className="shrink-0 text-rose-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Locker Metric Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        <MetricCard
          label={t('lockers.totalLockers')}
          value={totalLockers}
          subtext={`${totalSlots} total shoe slots`}
          icon={Layers}
          colorClass="text-amber-500"
          borderClass="border-amber-500/40"
          bgClass="bg-amber-500/10"
        />

        <MetricCard
          label={t('lockers.occupiedSlots')}
          value={totalOccupied}
          subtext={`${totalSlots > 0 ? Math.round((totalOccupied / totalSlots) * 100) : 0}% capacity utilized`}
          icon={UserCheck}
          colorClass="text-cyan-500"
          borderClass="border-cyan-500/40"
          bgClass="bg-cyan-500/10"
        />

        <MetricCard
          label={t('lockers.availableSlots')}
          value={totalAvailable}
          subtext="Ready for assignment"
          icon={Sparkles}
          colorClass="text-emerald-500"
          borderClass="border-emerald-500/40"
          bgClass="bg-emerald-500/10"
        />

        <MetricCard
          label={t('lockers.emptyLockers')}
          value={emptyLockersCount}
          subtext="0 / 4 members"
          icon={Grid}
          colorClass="text-purple-500"
          borderClass="border-purple-500/40"
          bgClass="bg-purple-500/10"
        />

        <MetricCard
          label={t('lockers.fullLockers')}
          value={fullLockersCount}
          subtext="4 / 4 full capacity"
          icon={Key}
          colorClass="text-rose-500"
          borderClass="border-rose-500/40"
          bgClass="bg-rose-500/10"
        />
      </div>

      {/* Toolbar: Filter Tabs & Search */}
      <div className="bg-gym-card rounded-2xl border border-gym-border p-4 md:p-5 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Filter Pills */}
          <div className="flex flex-wrap gap-1.5">
            <FilterTab
              label={t('lockers.all')}
              count={lockers.length}
              active={activeFilter === 'all'}
              onClick={() => setActiveFilter('all')}
            />
            <FilterTab
              label={t('lockers.hasFree')}
              count={lockers.filter((l) => l.occupiedCount > 0 && !l.isFull).length}
              active={activeFilter === 'has_free'}
              activeClass="bg-cyan-500/15 border-cyan-500 text-cyan-700 dark:text-cyan-300 font-bold"
              onClick={() => setActiveFilter('has_free')}
            />
            <FilterTab
              label={t('lockers.emptyOnly')}
              count={emptyLockersCount}
              active={activeFilter === 'empty'}
              activeClass="bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold"
              onClick={() => setActiveFilter('empty')}
            />
            <FilterTab
              label={t('lockers.fullOnly')}
              count={fullLockersCount}
              active={activeFilter === 'full'}
              activeClass="bg-rose-500/15 border-rose-500 text-rose-700 dark:text-rose-300 font-bold"
              onClick={() => setActiveFilter('full')}
            />
          </div>

          {/* Quick Search */}
          <div className="relative min-w-[260px]">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gym-muted" />
            <input
              type="text"
              placeholder={t('lockers.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gym-surface border border-gym-border focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 rounded-xl pl-9 pr-3 py-1.5 text-xs text-gym-text placeholder:text-gym-dim focus:outline-none transition-all font-medium"
            />
          </div>
        </div>
      </div>

      {/* Main Lockers Visual Grid */}
      {loading ? (
        <div className="p-16 text-center text-gym-muted">
          <RefreshCw size={24} className="animate-spin text-amber-500 mx-auto mb-3" />
          <div className="text-sm font-semibold">Loading shoe locker grid...</div>
        </div>
      ) : filteredLockers.length === 0 ? (
        <div className="bg-gym-card rounded-2xl border border-gym-border p-12 text-center text-gym-dim shadow-sm">
          <Layers size={36} className="mx-auto mb-2 text-gym-muted opacity-60" />
          <h3 className="text-base font-bold text-gym-text">No lockers found</h3>
          <p className="text-xs text-gym-muted mt-1">Try changing your search or filter options.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredLockers.map((locker) => {
            const fillPercent = (locker.occupiedCount / locker.capacity) * 100;
            const isFull = locker.isFull;
            const isEmpty = locker.isEmpty;

            return (
              <div
                key={locker.id}
                className={`bg-gym-card rounded-2xl border transition-all shadow-sm flex flex-col justify-between overflow-hidden relative ${
                  isFull
                    ? 'border-rose-500/40 hover:border-rose-500/70'
                    : isEmpty
                    ? 'border-gym-border hover:border-emerald-500/40'
                    : 'border-cyan-500/40 hover:border-cyan-500/70'
                }`}
              >
                {/* Top Accent Stripe based on capacity */}
                <div
                  className={`h-1.5 w-full ${
                    isFull
                      ? 'bg-rose-500'
                      : isEmpty
                      ? 'bg-gym-border'
                      : 'bg-gradient-to-r from-emerald-500 to-cyan-500'
                  }`}
                />

                {/* Locker Card Header */}
                <div className="p-3.5 pb-2 border-b border-gym-border/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono font-black text-xs shadow-sm ${
                        isFull
                          ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                          : isEmpty
                          ? 'bg-gym-surface text-gym-muted border border-gym-border'
                          : 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30'
                      }`}
                    >
                      #{String(locker.number).padStart(2, '0')}
                    </div>

                    <div>
                      <div className="text-xs font-black text-gym-text uppercase tracking-wider flex items-center gap-1.5">
                        <span>Locker #{locker.number}</span>
                      </div>
                      <div className="text-[10px] text-gym-dim font-mono">
                        {locker.occupiedCount} of {locker.capacity} Slots Filled
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Capacity Badge */}
                    <span
                      className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                        isFull
                          ? 'bg-rose-500/20 border-rose-500/40 text-rose-700 dark:text-rose-300'
                          : isEmpty
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                          : 'bg-cyan-500/15 border-cyan-500/30 text-cyan-700 dark:text-cyan-300'
                      }`}
                    >
                      {isFull ? 'FULL (4/4)' : isEmpty ? 'EMPTY (0/4)' : `${locker.occupiedCount}/4`}
                    </span>

                    {/* Delete empty locker option */}
                    {isEmpty && lockers.length > 1 && (
                      <button
                        onClick={() => handleDeleteLocker(locker.number)}
                        className="p-1 rounded-lg text-gym-dim hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                        title="Delete empty locker"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {/* 4 Shoe Slots Container */}
                <div className="p-3 space-y-2 flex-1">
                  {locker.slots.map((slotMember, slotIdx) => {
                    const slotNum = slotIdx + 1;

                    if (slotMember) {
                      // Occupied Member Slot
                      return (
                        <div
                          key={slotIdx}
                          className="bg-gym-surface rounded-xl p-2.5 border border-gym-border/80 flex items-center justify-between gap-2 text-xs transition-colors hover:border-gym-border"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-5 h-5 rounded-md bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 font-mono font-bold text-[10px] flex items-center justify-center shrink-0 border border-cyan-500/20">
                              S{slotNum}
                            </span>

                            <img
                              src={slotMember.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'}
                              alt=""
                              className="w-7 h-7 rounded-lg object-cover border border-gym-border shrink-0"
                            />

                            <div className="min-w-0">
                              <Link
                                to={`/members/${slotMember._id || slotMember.memberId}`}
                                className="font-extrabold text-gym-text hover:text-amber-500 transition-colors truncate block leading-tight text-[11px]"
                                title="View member profile"
                              >
                                {slotMember.fullName}
                              </Link>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="font-mono text-[9px] text-amber-600 dark:text-amber-400 font-bold">
                                  {slotMember.memberId}
                                </span>
                                <StatusBadge status={slotMember.status} size="sm" showIcon={false} />
                              </div>
                            </div>
                          </div>

                          {/* Release button */}
                          <button
                            onClick={() => handleReleaseSlot(locker.number, slotIdx, slotMember.fullName)}
                            className="p-1 rounded-lg text-gym-dim hover:text-rose-500 hover:bg-rose-500/10 transition-all shrink-0"
                            title="Release slot (Remove member's shoes)"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      );
                    }

                    // Empty Slot (Dashed button to assign)
                    return (
                      <button
                        key={slotIdx}
                        type="button"
                        onClick={() =>
                          setAssignTarget({
                            lockerNumber: locker.number,
                            slotIndex: slotIdx,
                          })
                        }
                        className="w-full rounded-xl border border-dashed border-gym-border hover:border-amber-500/60 bg-gym-surface/40 hover:bg-amber-500/5 p-2 text-left transition-all flex items-center justify-between text-xs text-gym-muted hover:text-gym-text group focus:outline-none focus:ring-1 focus:ring-amber-500"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-gym-surface text-gym-dim font-mono font-bold text-[10px] flex items-center justify-center border border-gym-border shrink-0">
                            S{slotNum}
                          </span>
                          <span className="text-[11px] font-semibold text-gym-dim group-hover:text-amber-500 transition-colors">
                            + {t('lockers.assignMember')} (Slot {slotNum})
                          </span>
                        </div>

                        <UserPlus size={12} className="text-gym-dim group-hover:text-amber-500 transition-colors" />
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Member Assignment Modal */}
      {assignTarget && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gym-card rounded-2xl border border-gym-border p-6 max-w-md w-full relative shadow-2xl max-h-[85vh] flex flex-col">
            <button
              onClick={() => {
                setAssignTarget(null);
                setMemberSearch('');
              }}
              className="absolute top-4 right-4 text-gym-muted hover:text-gym-text p-1 rounded-lg hover:bg-gym-surface"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-500">
                <Key size={16} />
              </div>
              <h2 className="text-base font-black text-gym-text leading-tight">
                {t('lockers.assignModalTitle', {
                  number: assignTarget.lockerNumber,
                  slot: assignTarget.slotIndex + 1,
                })}
              </h2>
            </div>
            <p className="text-xs text-gym-muted mb-4">
              Select an active member to assign their shoes to this locker slot.
            </p>

            {/* Member search inside modal */}
            <div className="relative mb-3">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gym-muted" />
              <input
                type="text"
                placeholder={t('lockers.memberSearch')}
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                autoFocus
                className="w-full bg-gym-surface border border-gym-border focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 rounded-xl pl-8 pr-3 py-2 text-xs text-gym-text placeholder:text-gym-dim focus:outline-none transition-all font-medium"
              />
            </div>

            {/* Member selection list */}
            <div className="overflow-y-auto flex-1 space-y-2 pr-1 divide-y divide-gym-border/40">
              {availableMembersForAssignment.length === 0 ? (
                <div className="py-8 text-center text-gym-dim text-xs">
                  {t('lockers.noMembersFound')}
                </div>
              ) : (
                availableMembersForAssignment.map((m) => (
                  <div
                    key={m._id}
                    className="pt-2 flex items-center justify-between gap-3 hover:bg-gym-surface/60 p-2 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={m.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'}
                        alt=""
                        className="w-8 h-8 rounded-xl object-cover border border-gym-border shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="font-extrabold text-xs text-gym-text truncate">
                          {m.fullName}
                        </div>
                        <div className="text-[10px] text-gym-muted flex items-center gap-2">
                          <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">{m.memberId}</span>
                          <span>•</span>
                          <span className="capitalize">{m.plan}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleAssignMember(m._id)}
                      disabled={actionLoading}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white font-bold text-xs shadow-sm transition-all shrink-0 disabled:opacity-50"
                    >
                      Assign
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, subtext, icon: Icon, colorClass, borderClass, bgClass }) {
  return (
    <div className={`rounded-2xl p-3.5 border bg-gym-card ${borderClass} shadow-sm`}>
      <div className="flex justify-between items-start mb-1.5">
        <div className={`w-7 h-7 rounded-lg ${bgClass} flex items-center justify-center ${colorClass}`}>
          <Icon size={14} />
        </div>
      </div>
      <div className="text-xl font-black text-gym-text font-mono leading-none">
        {value ?? 0}
      </div>
      <div className="text-[10px] text-gym-text font-extrabold tracking-tight uppercase mt-1">
        {label}
      </div>
      {subtext && (
        <div className="text-[10px] text-gym-dim mt-0.5 truncate">
          {subtext}
        </div>
      )}
    </div>
  );
}

function FilterTab({ label, count, active, activeClass = 'bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-300 font-bold', onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-lg text-xs transition-all border font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 flex items-center gap-1.5 ${
        active
          ? `${activeClass} shadow-sm font-extrabold`
          : 'bg-gym-surface border-gym-border text-gym-muted hover:text-gym-text hover:bg-gym-hover'
      }`}
    >
      <span>{label}</span>
      {count !== undefined && (
        <span className="font-mono text-[10px] opacity-75">({count})</span>
      )}
    </button>
  );
}
