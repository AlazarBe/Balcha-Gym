import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { createMember } from '../api/client';
import { PLAN_PRICES, calculateNewExpiry } from '../utils/calculateNewExpiry';
import MemberCard from '../components/MemberCard';
import { format } from 'date-fns';
import {
  UserPlus,
  Camera,
  Upload,
  User,
  ShieldAlert,
  CheckCircle,
} from 'lucide-react';

const initialForm = {
  fullName: '',
  phone: '',
  plan: 'monthly',
  joinDate: new Date().toISOString().slice(0, 10),
  amount: 800,
  method: 'cash',
  emergencyContact: '',
  address: '',
};

export default function Register() {
  const { t } = useTranslation();
  const [form, setForm] = useState(initialForm);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [createdMember, setCreatedMember] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  function handlePlanSelect(planName) {
    const defaultAmount = PLAN_PRICES[planName] || 800;
    setForm((prev) => ({
      ...prev,
      plan: planName,
      amount: defaultAmount,
    }));
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handlePhotoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  }

  async function startWebcam() {
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 320 } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error(err);
      alert('Unable to access camera: ' + err.message);
      setIsCameraActive(false);
    }
  }

  function captureWebcamPhoto() {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, 300, 300);
    const dataUrl = canvas.toDataURL('image/jpeg');
    setPhotoPreview(dataUrl);
    stopWebcam();
  }

  function stopWebcam() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  }

  useEffect(() => {
    return () => {
      stopWebcam();
    };
  }, []);

  let previewExpiryDate = null;
  try {
    if (form.joinDate && form.amount) {
      const joinObj = new Date(form.joinDate);
      previewExpiryDate = calculateNewExpiry({
        plan: form.plan,
        oldExpiryDate: joinObj,
        amount: Number(form.amount),
        today: joinObj,
      });
    }
  } catch (e) {
    previewExpiryDate = null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const newMember = await createMember({
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        photoUrl: photoPreview,
        plan: form.plan,
        joinDate: new Date(form.joinDate),
        amount: Number(form.amount),
        method: form.method,
        address: form.address,
        emergencyContact: form.emergencyContact,
      });
      setCreatedMember(newMember);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  // Success view with generated card
  if (createdMember) {
    return (
      <div className="p-4 md:p-8 max-w-2xl mx-auto text-center">
        <div className="bg-gym-card rounded-2xl border border-gym-border p-6 md:p-8 shadow-md">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto mb-4 shadow-sm">
            <CheckCircle size={32} />
          </div>

          <h1 className="text-2xl font-black text-gym-text tracking-tight mb-1">
            {t('register.successTitle')}
          </h1>
          <p className="text-xs md:text-sm text-gym-muted mb-6">
            {t('register.successSub')}{' '}
            <strong className="font-mono text-amber-600 dark:text-amber-400 font-bold">{createdMember.memberId}</strong>
          </p>

          <div className="flex justify-center mb-6">
            <MemberCard member={createdMember} showActions={true} />
          </div>

          <div className="flex flex-wrap gap-2.5 justify-center mt-4 no-print">
            <button
              onClick={() => {
                setCreatedMember(null);
                setForm(initialForm);
                setPhotoPreview(null);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white text-xs md:text-sm font-black shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <UserPlus size={16} />
              <span>{t('dashboard.newMember')}</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-2.5 rounded-xl bg-gym-surface hover:bg-gym-hover border border-gym-border text-xs md:text-sm font-bold text-gym-text transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
            >
              {t('profile.printCard')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isYearly = form.plan === 'yearly';
  const balanceDue = isYearly ? Math.max(0, PLAN_PRICES.yearly - Number(form.amount || 0)) : 0;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-black text-gym-text tracking-tight">
          {t('register.title')}
        </h1>
        <p className="text-xs md:text-sm text-gym-muted mt-1">
          {t('register.subtitle')}
        </p>
      </div>

      {error && (
        <div className="bg-rose-500/15 border-2 border-rose-500 text-rose-800 dark:text-rose-200 rounded-2xl p-4 mb-6 flex items-center gap-3 text-xs md:text-sm font-bold shadow-sm">
          <ShieldAlert size={20} className="text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Personal Info & Photo */}
        <div className="bg-gym-card rounded-2xl border border-gym-border p-5 md:p-6 flex flex-col gap-4 shadow-sm">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-gym-text border-b border-gym-border pb-2.5">
            1. {t('profile.personalDetails')}
          </h2>

          {/* Photo Capture & Preview */}
          <div>
            <label className="text-xs font-bold text-gym-muted block mb-2">
              {t('register.photoUpload')}
            </label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-xl bg-gym-surface border-2 border-dashed border-gym-border flex items-center justify-center overflow-hidden shrink-0 relative">
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <User size={28} className="text-gym-dim" />
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex gap-2">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gym-surface hover:bg-gym-hover border border-gym-border text-xs font-bold text-gym-text transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm">
                    <Upload size={13} className="text-amber-500" />
                    <span>{t('register.uploadFile')}</span>
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  </label>

                  {!isCameraActive ? (
                    <button
                      type="button"
                      onClick={startWebcam}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gym-surface hover:bg-gym-hover border border-gym-border text-xs font-bold text-gym-text transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
                    >
                      <Camera size={13} className="text-rose-500" />
                      <span>{t('register.takePhoto')}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={captureWebcamPhoto}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white transition-all shadow-sm"
                    >
                      <span>{t('register.takePhoto')}</span>
                    </button>
                  )}
                </div>

                {photoPreview && (
                  <button
                    type="button"
                    onClick={() => setPhotoPreview(null)}
                    className="text-[11px] text-gym-dim hover:text-rose-500 text-left transition-colors font-semibold"
                  >
                    {t('common.delete')}
                  </button>
                )}
              </div>
            </div>

            {/* Webcam Live Capture Box */}
            {isCameraActive && (
              <div className="mt-3 p-3 bg-gym-surface rounded-xl flex flex-col items-center gap-2 border border-gym-border">
                <video ref={videoRef} autoPlay playsInline className="w-44 h-44 rounded-lg object-cover bg-black" />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={captureWebcamPhoto}
                    className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white"
                  >
                    {t('register.takePhoto')}
                  </button>
                  <button
                    type="button"
                    onClick={stopWebcam}
                    className="px-3 py-1 rounded-lg bg-gym-card hover:bg-gym-hover text-xs font-bold text-gym-muted"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-bold text-gym-muted block mb-1">
              {t('register.fullName')} *
            </label>
            <input
              type="text"
              name="fullName"
              placeholder={t('register.fullNamePlaceholder')}
              value={form.fullName}
              onChange={handleChange}
              required
              className="w-full bg-gym-surface border border-gym-border focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 rounded-xl px-3.5 py-2 text-sm text-gym-text placeholder:text-gym-dim focus:outline-none transition-all font-medium"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gym-muted block mb-1">
              {t('register.phone')} *
            </label>
            <input
              type="tel"
              name="phone"
              placeholder={t('register.phonePlaceholder')}
              value={form.phone}
              onChange={handleChange}
              required
              className="w-full bg-gym-surface border border-gym-border focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 rounded-xl px-3.5 py-2 text-sm font-mono text-gym-text placeholder:text-gym-dim focus:outline-none transition-all font-bold"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gym-muted block mb-1">
              {t('register.emergencyContact')}
            </label>
            <input
              type="text"
              name="emergencyContact"
              placeholder={t('register.emergencyPlaceholder')}
              value={form.emergencyContact}
              onChange={handleChange}
              className="w-full bg-gym-surface border border-gym-border focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 rounded-xl px-3.5 py-2 text-sm text-gym-text placeholder:text-gym-dim focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Right Column: Plan & Initial Payment */}
        <div className="bg-gym-card rounded-2xl border border-gym-border p-5 md:p-6 flex flex-col gap-4 shadow-sm">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-gym-text border-b border-gym-border pb-2.5">
            2. {t('register.membershipPlan')} & {t('common.amount')}
          </h2>

          {/* Plan Selector */}
          <div>
            <label className="text-xs font-bold text-gym-muted block mb-2">
              {t('register.membershipPlan')}
            </label>
            <div className="grid grid-cols-3 gap-2">
              <PlanCard
                name="Monthly"
                price="800 ETB"
                duration="30 Days"
                isSelected={form.plan === 'monthly'}
                onClick={() => handlePlanSelect('monthly')}
              />
              <PlanCard
                name="Quarterly"
                price="2,200 ETB"
                duration="90 Days"
                isSelected={form.plan === 'quarterly'}
                onClick={() => handlePlanSelect('quarterly')}
              />
              <PlanCard
                name="Yearly"
                price="8,000 ETB"
                duration="365 Days"
                badge="Partial OK"
                isSelected={form.plan === 'yearly'}
                onClick={() => handlePlanSelect('yearly')}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gym-muted block mb-1">
              {t('register.startDate')}
            </label>
            <input
              type="date"
              name="joinDate"
              value={form.joinDate}
              onChange={handleChange}
              required
              className="w-full bg-gym-surface border border-gym-border focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 rounded-xl px-3.5 py-2 text-sm text-gym-text focus:outline-none transition-all font-medium"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-gym-muted">
                {t('register.amountPaid')} *
              </label>
              {!isYearly && (
                <span className="text-[10px] text-gym-dim font-bold">
                  {PLAN_PRICES[form.plan]} {t('common.currency')}
                </span>
              )}
            </div>
            <input
              type="number"
              name="amount"
              min={isYearly ? 500 : PLAN_PRICES[form.plan]}
              value={form.amount}
              onChange={handleChange}
              required
              className="w-full bg-gym-surface border border-gym-border focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 rounded-xl px-3.5 py-2 text-sm font-mono font-black text-amber-600 dark:text-amber-400 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gym-muted block mb-1">
              {t('register.paymentMethod')}
            </label>
            <select
              name="method"
              value={form.method}
              onChange={handleChange}
              className="w-full bg-gym-surface border border-gym-border focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 rounded-xl px-3.5 py-2 text-sm text-gym-text focus:outline-none transition-all font-medium"
            >
              <option value="cash">💵 {t('common.cash')}</option>
              <option value="mobile_money">📱 {t('common.mobileMoney')}</option>
              <option value="other">💳 {t('common.other')}</option>
            </select>
          </div>

          {/* Live Expiry Preview Box */}
          <div className="bg-gym-surface rounded-xl p-3.5 border border-gym-border text-xs">
            <div className="flex justify-between items-center mb-1">
              <span className="text-gym-muted">{t('common.endDate')}:</span>
              <strong className="text-emerald-600 dark:text-emerald-400 font-extrabold text-sm font-mono">
                {previewExpiryDate ? format(previewExpiryDate, 'MMM d, yyyy') : '—'}
              </strong>
            </div>

            {isYearly && balanceDue > 0 && (
              <div className="text-amber-700 dark:text-amber-400 text-[11px] pt-2 border-t border-gym-border mt-2 font-medium">
                ⚠️ Partial payment: Remaining balance of <strong>{balanceDue} ETB</strong>. Access is prorated to covered days.
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white font-black text-sm tracking-wide shadow-md transition-all disabled:opacity-50 mt-1 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            {submitting ? t('common.loading') : t('register.submitBtn')}
          </button>
        </div>
      </form>
    </div>
  );
}

function PlanCard({ name, price, duration, badge, isSelected, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`p-3 rounded-xl border text-center transition-all cursor-pointer select-none relative ${
        isSelected
          ? 'bg-amber-500/15 border-amber-500 ring-1 ring-amber-500 text-gym-text shadow-sm'
          : 'bg-gym-surface border-gym-border text-gym-muted hover:border-gym-border/80 hover:bg-gym-hover'
      }`}
    >
      {badge && (
        <span className="absolute -top-2 right-1 text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-rose-600 text-white shadow-sm">
          {badge}
        </span>
      )}
      <div className="text-xs font-black uppercase tracking-tight text-gym-text">{name}</div>
      <div className={`text-xs font-extrabold my-0.5 font-mono ${isSelected ? 'text-amber-600 dark:text-amber-400' : 'text-gym-muted'}`}>
        {price}
      </div>
      <div className="text-[10px] text-gym-dim">{duration}</div>
    </div>
  );
}