import React from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, AlertTriangle, XCircle, Snowflake } from 'lucide-react';

const STATUS_CONFIG = {
  active: {
    key: 'common.active',
    defaultLabel: 'Active',
    containerClass: 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.15)]',
    dotClass: 'bg-emerald-400 shadow-[0_0_8px_#34d399]',
    icon: CheckCircle2,
  },
  grace_period: {
    key: 'common.expiringSoon',
    defaultLabel: 'Grace Period',
    containerClass: 'bg-amber-950/40 border-amber-500/50 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.15)]',
    dotClass: 'bg-amber-400 shadow-[0_0_8px_#fbbf24]',
    icon: AlertTriangle,
  },
  expired: {
    key: 'common.expired',
    defaultLabel: 'Expired',
    containerClass: 'bg-rose-950/40 border-rose-500/50 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.15)]',
    dotClass: 'bg-rose-400 shadow-[0_0_8px_#f43f5e]',
    icon: XCircle,
  },
  frozen: {
    key: 'common.frozen',
    defaultLabel: 'Frozen',
    containerClass: 'bg-cyan-950/40 border-cyan-500/50 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.15)]',
    dotClass: 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]',
    icon: Snowflake,
  },
};

export default function StatusBadge({ status, showIcon = true, size = 'md' }) {
  const { t } = useTranslation();
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.expired;
  const Icon = config.icon;

  const isSmall = size === 'sm';
  const isLarge = size === 'lg';

  const sizeClasses = isSmall
    ? 'px-2 py-0.5 text-[11px] gap-1'
    : isLarge
    ? 'px-3.5 py-1.5 text-sm gap-2'
    : 'px-2.5 py-1 text-xs gap-1.5';

  const dotSizeClass = isSmall ? 'w-1.5 h-1.5' : isLarge ? 'w-2 h-2' : 'w-2 h-2';
  const iconSize = isSmall ? 12 : isLarge ? 16 : 13;

  return (
    <span
      className={`inline-flex items-center rounded-full border font-bold uppercase tracking-wider transition-all select-none ${config.containerClass} ${sizeClasses}`}
    >
      <span className={`rounded-full shrink-0 ${dotSizeClass} ${config.dotClass}`} />
      {showIcon && <Icon size={iconSize} className="stroke-[2.5]" />}
      <span>{t(config.key, config.defaultLabel)}</span>
    </span>
  );
}