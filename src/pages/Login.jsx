import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import BalchaLogo from '../components/BalchaLogo';
import LanguageSelector from '../components/LanguageSelector';
import { Lock, Phone, ShieldAlert, ArrowRight, ShieldCheck, UserCheck, KeyRound } from 'lucide-react';

export default function Login() {
  const { t } = useTranslation();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!phone.trim() || !password.trim()) {
      setError(t('auth.invalidCreds'));
      return;
    }

    setLoading(true);

    try {
      login(phone, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Autofill helper: populates the inputs so the user can inspect credentials and submit
  function handleAutofill(demoPhone, demoPassword) {
    setPhone(demoPhone);
    setPassword(demoPassword);
    setError(null);
  }

  return (
    <div className="min-h-screen bg-gym-bg flex items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4 z-50">
        <LanguageSelector />
      </div>

      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex justify-center mb-3">
            <BalchaLogo size={56} showText={false} />
          </div>
          <h1 className="text-2xl font-black text-gym-text tracking-tight uppercase">
            {t('auth.loginTitle')}
          </h1>
          <p className="text-xs text-gym-muted font-bold tracking-wider uppercase mt-1">
            {t('auth.loginSubtitle')}
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-gym-card rounded-2xl border border-gym-border p-6 sm:p-8 shadow-2xl shadow-black/60">
          <h2 className="text-base font-extrabold text-gym-text mb-4 flex items-center gap-2">
            <Lock size={18} className="text-amber-500" />
            <span>Sign In to Station</span>
          </h2>

          {error && (
            <div className="bg-rose-500/15 border border-rose-500 text-rose-800 dark:text-rose-200 rounded-xl p-3.5 mb-5 text-xs font-bold flex items-start gap-2.5 shadow-sm">
              <ShieldAlert size={18} className="text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-bold text-gym-muted block mb-1">
                {t('auth.username')}
              </label>
              <div className="relative">
                <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gym-muted" />
                <input
                  type="text"
                  placeholder="e.g. 0911000000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="w-full bg-gym-surface border border-gym-border focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 rounded-xl pl-10 pr-3.5 py-2.5 text-sm font-mono text-gym-text placeholder:text-gym-dim focus:outline-none transition-all font-bold"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gym-muted block mb-1">
                {t('auth.password')}
              </label>
              <div className="relative">
                <KeyRound size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gym-muted" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-gym-surface border border-gym-border focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-gym-text placeholder:text-gym-dim focus:outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white font-black text-sm tracking-wide shadow-lg shadow-amber-950/30 transition-all flex items-center justify-center gap-2 mt-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <span>{t('auth.loginBtn')}</span>
              <ArrowRight size={16} />
            </button>
          </form>

          {/* Quick Demo Helper Box */}
          <div className="mt-6 pt-5 border-t border-gym-border">
            <span className="text-[10px] font-black uppercase tracking-wider text-gym-muted block mb-2 text-center">
              Test Accounts (Click to fill inputs):
            </span>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleAutofill('0911000000', 'admin')}
                className="p-2.5 rounded-xl bg-gym-surface hover:bg-gym-hover border border-amber-500/40 text-left transition-all group focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <div className="flex items-center gap-1.5 text-amber-500 font-extrabold text-xs">
                  <ShieldCheck size={14} />
                  <span>Fill Owner</span>
                </div>
                <div className="text-[10px] text-gym-dim mt-0.5 font-mono">0911000000 / admin</div>
              </button>

              <button
                type="button"
                onClick={() => handleAutofill('0911112233', 'desk')}
                className="p-2.5 rounded-xl bg-gym-surface hover:bg-gym-hover border border-emerald-500/40 text-left transition-all group focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <div className="flex items-center gap-1.5 text-emerald-500 font-extrabold text-xs">
                  <UserCheck size={14} />
                  <span>Fill Front Desk</span>
                </div>
                <div className="text-[10px] text-gym-dim mt-0.5 font-mono">0911112233 / desk</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
