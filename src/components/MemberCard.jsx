import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import QRCode from 'qrcode';
import { format } from 'date-fns';
import { Printer, Download, ShieldCheck, Repeat, Phone, AlertCircle, Dumbbell } from 'lucide-react';
import StatusBadge from './StatusBadge';
import BalchaLogo from './BalchaLogo';

export default function MemberCard({ member, showActions = true, compact = false }) {
  const { t } = useTranslation();
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [showBack, setShowBack] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    if (member?.memberId) {
      QRCode.toDataURL(member.memberId, {
        width: 240,
        margin: 1,
        color: {
          dark: '#0A0E17',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'H',
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('QR Gen error:', err));
    }
  }, [member?.memberId]);

  if (!member) return null;

  function handlePrint() {
    window.print();
  }

  function handleDownload() {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.download = `${member.memberId}-Physical-ID.png`;
    link.href = qrDataUrl;
    link.click();
  }

  return (
    <div className="inline-flex flex-col items-center gap-3.5 select-none">
      {/* ============================================================
          PRINT-ONLY SHEET (Front & Back Badges with Cut-out Guides)
          ============================================================ */}
      <div className="print-area hidden">
        <div className="text-center mb-3">
          <h2 className="text-sm font-black tracking-wider uppercase text-slate-800 font-mono">
            BALCHA GYM — OFFICIAL MEMBERSHIP PASS
          </h2>
          <p className="text-[10px] text-slate-500 font-mono">
            ✂ Cut along the dotted line below and insert into standard badge holder / PVC laminate (85.6mm × 54mm)
          </p>
        </div>

        {/* Side-by-side or Stacked Front & Back Badges */}
        <div className="flex flex-row items-center gap-4 p-3 border-2 border-dashed border-slate-400 rounded-2xl bg-white shadow-none">
          {/* Front Badge */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#161D2B] via-[#0D121C] to-[#1A1224] border border-[#2B3852] text-white p-3.5 w-[330px] h-[206px] flex flex-col justify-between box-border shrink-0">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-rose-500 to-emerald-400" />
            
            <div className="flex justify-between items-center">
              <BalchaLogo size={24} showText={true} subtitle="MEMBER ID PASS" />
              <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-white/10 border border-white/20 text-amber-300">
                {member.plan}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                <img
                  src={member.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                  alt={member.fullName}
                  className="w-16 h-16 rounded-xl object-cover border-2 border-white/20 shadow-md"
                />
                <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-0.5 ring-2 ring-[#0D121C]">
                  <ShieldCheck size={9} className="text-white" />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-black text-sm text-white truncate leading-tight">
                  {member.fullName}
                </h3>
                <div className="font-mono text-xs font-bold text-amber-400 my-0.5 tracking-wider">
                  {member.memberId}
                </div>
                <div className="text-[10px] text-slate-300">
                  <span className="text-slate-400">Exp: </span>
                  <strong className="text-white">
                    {format(new Date(member.expiryDate), 'MMM d, yyyy')}
                  </strong>
                </div>
                <div className="mt-1">
                  <StatusBadge status={member.status} size="sm" />
                </div>
              </div>

              <div className="bg-white p-1 rounded-lg flex flex-col items-center justify-center shrink-0 border border-slate-200">
                {qrDataUrl && (
                  <img src={qrDataUrl} alt="QR" className="w-[50px] h-[50px] object-contain" />
                )}
                <span className="text-[6px] font-black text-slate-900 font-mono mt-0.5 uppercase">
                  SCAN TO ENTER
                </span>
              </div>
            </div>

            <div className="pt-1 border-t border-white/10 flex justify-between items-center text-[7px] text-slate-400">
              <span>Non-transferable • Reusable Physical Card</span>
              <span className="font-mono font-bold text-slate-300">ID: {member.memberId}</span>
            </div>
          </div>

          {/* Back Badge (Card Rules & Emergency Contact) */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#161D2B] via-[#0D121C] to-[#1A1224] border border-[#2B3852] text-white p-3.5 w-[330px] h-[206px] flex flex-col justify-between box-border shrink-0">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-rose-500 to-emerald-400" />
            
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-black uppercase text-amber-400 tracking-wider">
                CARD REGULATIONS & TERMS
              </span>
              <span className="text-[8px] font-mono text-slate-400 font-bold">
                {member.memberId}
              </span>
            </div>

            <div className="space-y-1 text-[8.5px] text-slate-300 leading-tight">
              <p>• <strong>Entry:</strong> Always present card at the front-desk scanner upon entry.</p>
              <p>• <strong>Permanence:</strong> The QR code encodes only Member ID. Card remains valid upon renewals.</p>
              <p>• <strong>Safety:</strong> Return gym weights and wipe equipment after use.</p>
              <p>• <strong>Contact:</strong> Emergency: {member.emergencyContact || '+251 911 000000'}</p>
            </div>

            <div className="pt-1.5 border-t border-white/10 flex justify-between items-center text-[7.5px] text-slate-400">
              <span>Front-Desk: +251 911 223344</span>
              <span className="font-mono text-amber-400">BALCHA GYM</span>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
          ON-SCREEN INTERACTIVE CARD (Front / Back Flip View)
          ============================================================ */}
      <div
        ref={cardRef}
        className="no-print relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#161D2B] via-[#0D121C] to-[#1A1224] border border-[#2B3852] shadow-2xl shadow-black/80 text-white p-4 font-sans transition-all w-[338px] h-[212px] flex flex-col justify-between box-border"
      >
        {/* Holographic Top Accent Stripe */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-rose-500 to-emerald-400" />

        {!showBack ? (
          /* Front Side View */
          <>
            {/* Card Header */}
            <div className="flex justify-between items-center">
              <BalchaLogo size={26} showText={true} subtitle="MEMBER ID PASS" />

              <span className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 border border-white/20 text-amber-300">
                {member.plan}
              </span>
            </div>

            {/* Card Body */}
            <div className="flex items-center gap-3">
              {/* Member Portrait */}
              <div className="relative shrink-0">
                <img
                  src={member.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                  alt={member.fullName}
                  className="w-16 h-16 rounded-xl object-cover border-2 border-white/20 shadow-md"
                />
                <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-0.5 shadow-md shadow-emerald-500/50 ring-2 ring-[#0D121C]">
                  <ShieldCheck size={10} className="text-white" />
                </div>
              </div>

              {/* Member Details */}
              <div className="flex-1 min-w-0">
                <h3 className="font-black text-sm text-white truncate leading-tight tracking-tight">
                  {member.fullName}
                </h3>
                <div className="font-mono text-xs font-bold text-amber-400 my-0.5 tracking-wider">
                  {member.memberId}
                </div>
                <div className="text-[10px] text-slate-300 flex items-center gap-1">
                  <span className="text-slate-400">Exp:</span>
                  <strong className="text-white font-semibold">
                    {format(new Date(member.expiryDate), 'MMM d, yyyy')}
                  </strong>
                </div>
                {member.status && (
                  <div className="mt-1">
                    <StatusBadge status={member.status} size="sm" />
                  </div>
                )}
              </div>

              {/* Scannable QR Code Box */}
              <div className="bg-white p-1 rounded-lg flex flex-col items-center justify-center shrink-0 shadow-md shadow-black/50 border border-slate-200">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`QR code for ${member.memberId}`}
                    style={{ width: '52px', height: '52px' }}
                    className="block object-contain"
                  />
                ) : (
                  <div className="w-[52px] h-[52px] flex items-center justify-center text-[7px] text-slate-600 font-mono">
                    QR CODE
                  </div>
                )}
                <span className="text-[6px] font-black text-slate-900 font-mono mt-0.5 tracking-tighter uppercase leading-none">
                  SCAN TO ENTER
                </span>
              </div>
            </div>

            {/* Card Footer */}
            <div className="pt-1.5 border-t border-white/10 flex justify-between items-center text-[8px] text-slate-400 font-medium">
              <span>Non-transferable • Reusable Card</span>
              <span className="font-mono font-bold text-slate-300">ID: {member.memberId}</span>
            </div>
          </>
        ) : (
          /* Back Side View */
          <>
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-black uppercase text-amber-400 tracking-wider">
                CARD REGULATIONS & TERMS
              </span>
              <span className="text-[8px] font-mono text-slate-400 font-bold">
                {member.memberId}
              </span>
            </div>

            <div className="space-y-1 text-[8.5px] text-slate-300 leading-tight">
              <p>• <strong>Entry:</strong> Always scan card at front desk before entering workout floor.</p>
              <p>• <strong>Permanence:</strong> QR code encodes only Member ID; card remains valid forever upon renewals.</p>
              <p>• <strong>Emergency Contact:</strong> {member.emergencyContact || 'Front Desk (+251 911 223344)'}</p>
              <p>• <strong>Phone:</strong> {member.phone}</p>
            </div>

            <div className="pt-1.5 border-t border-white/10 flex justify-between items-center text-[8px] text-slate-400 font-medium">
              <span>BALCHA GYM • ADDIS ABABA</span>
              <span className="font-mono text-emerald-400 font-bold">OFFICIAL PASS</span>
            </div>
          </>
        )}
      </div>

      {/* Action Buttons */}
      {showActions && (
        <div className="no-print flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gym-surface hover:bg-gym-hover border border-gym-border text-xs font-bold text-gym-text transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
            title="Print printable cutout badge pass"
          >
            <Printer size={13} className="text-amber-500" />
            <span>{t('profile.printCard')}</span>
          </button>

          <button
            onClick={() => setShowBack(!showBack)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gym-surface hover:bg-gym-hover border border-gym-border text-xs font-bold text-gym-text transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
            title="Flip to view front / back of card"
          >
            <Repeat size={13} className="text-cyan-500" />
            <span>{showBack ? 'View Front' : 'View Back'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gym-surface hover:bg-gym-hover border border-gym-border text-xs font-bold text-gym-text transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
            title="Download QR code image"
          >
            <Download size={13} className="text-gym-muted" />
            <span>{t('profile.downloadQr')}</span>
          </button>
        </div>
      )}
    </div>
  );
}