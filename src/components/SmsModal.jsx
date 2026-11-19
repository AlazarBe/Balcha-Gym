import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { sendSmsNotification } from '../api/client';
import {
  MessageSquare,
  Send,
  Copy,
  Check,
  X,
  Phone,
  CheckCircle,
  ExternalLink,
  Languages,
} from 'lucide-react';

export default function SmsModal({ member, onClose }) {
  const { t, i18n } = useTranslation();
  const [lang, setLang] = useState(i18n.language || 'en'); // 'en' | 'am' | 'om'
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  if (!member) return null;

  const expiryFormatted = format(new Date(member.expiryDate), 'MMM d, yyyy');

  // Multi-language template engine
  const templates = {
    en: {
      exp_5: `Dear ${member.fullName}, your Balcha Gym membership expires in 5 days on ${expiryFormatted}. Renew early at the desk to keep your workout streak uninterrupted!`,
      exp_2: `Balcha Gym Reminder: ${member.fullName}, only 2 days left on your ${member.plan.toUpperCase()} pass! Visit the front desk today for fast renewal.`,
      exp_0: `🚨 Balcha Gym Alert: ${member.fullName}, your membership expires TODAY! Please renew at the desk now to avoid entry interruption.`,
      grace: `⚠️ Balcha Gym: ${member.fullName}, you are in your 3-day grace period. Renew today to keep your permanent card active without interruption!`,
      custom: `Dear ${member.fullName}, greetings from Balcha Gym! Please contact front-desk regarding your membership.`,
    },
    am: {
      exp_5: `ውድ ${member.fullName}፣ የባልቻ ጂም አባልነትዎ በ5 ቀናት ውስጥ በ${expiryFormatted} ያበቃል። ያለማቋረጥ ስፖርትዎን ለመቀጠል እባክዎ ቀድመው ያድሱ።`,
      exp_2: `የባልቻ ጂም ማሳሰቢያ፡ ${member.fullName}፣ የ${member.plan.toUpperCase()} ፓስዎ ሊያበቃ 2 ቀናት ብቻ ቀርተዋል! ዛሬውኑ እድሳት ያድርጉ።`,
      exp_0: `🚨 አስቸኳይ የባልቻ ጂም ማሳሰቢያ፡ ${member.fullName}፣ አባልነትዎ ዛሬ ያበቃል! የመግቢያ መቆራረጥ እንዳያጋጥምዎ አሁኑኑ ያድሱ።`,
      grace: `⚠️ ባልቻ ጂም፡ ${member.fullName}፣ የ3 ቀናት የእፎይታ ጊዜ ላይ ነዎት። ካርድዎ እንዳይታገድ ዛሬውኑ በሪሴፕሽን ያድሱ!`,
      custom: `ውድ ${member.fullName}፣ ከባልቻ ጂም! ስለ አባልነትዎ የፊት ዴስክን ያነጋግሩ።`,
    },
    om: {
      exp_5: `Kabajamoo ${member.fullName}, miseensummaan Balcha Gym keessanii guyyaa 5 keessatti ${expiryFormatted} irratti dhumata. Guyyaa kaffaltiin dhumuun dura haaromsadhaa!`,
      exp_2: `Yaadachiisa Balcha Gym: ${member.fullName}, paasii ${member.plan.toUpperCase()} keessan irratti guyyaa 2 qofatu hafe! Har'a seensa irratti haaromsadhaa.`,
      exp_0: `🚨 Beeksisa Balcha Gym: ${member.fullName}, miseensummaan keessan HAR'A dhumata! Tajaajilli akka inni hin cinneef seensa irratti haaromsadhaa.`,
      grace: `⚠️ Balcha Gym: ${member.fullName}, yeroo dhiifamaa guyyaa 3 keessa jirtu. Waraqaan keessan akka hin cufamneef har'a haaromsadhaa!`,
      custom: `Kabajamoo ${member.fullName}, nagaa Balcha Gym irraa! Waa'ee miseensummaa keessanii seensa (front desk) qunnamaa.`,
    },
  };

  // Select recommended default template based on member's days left
  let defaultType = 'custom';
  if (member.daysLeft === 5) defaultType = 'exp_5';
  else if (member.daysLeft === 2) defaultType = 'exp_2';
  else if (member.daysLeft === 0) defaultType = 'exp_0';
  else if (member.status === 'grace_period') defaultType = 'grace';
  else if (member.daysLeft > 0 && member.daysLeft < 5) defaultType = 'exp_2';

  const [selectedType, setSelectedType] = useState(defaultType);
  const [customMessage, setCustomMessage] = useState(templates[lang][defaultType]);

  function handleTypeChange(type) {
    setSelectedType(type);
    setCustomMessage(templates[lang][type]);
  }

  function handleLangToggle() {
    const nextLang = lang === 'en' ? 'am' : 'en';
    setLang(nextLang);
    setCustomMessage(templates[nextLang][selectedType]);
  }

  async function handleSend() {
    setSending(true);
    try {
      await sendSmsNotification(member._id, customMessage);
      setSentSuccess(true);
      setTimeout(() => {
        setSentSuccess(false);
      }, 3000);
    } catch (err) {
      alert(err.message);
    } finally {
      setSending(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(customMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const cleanPhone = member.phone.replace(/[^0-9+]/g, '');
  const nativeSmsUrl = `sms:${cleanPhone}?body=${encodeURIComponent(customMessage)}`;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gym-card rounded-2xl border border-gym-border p-6 max-w-lg w-full relative shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gym-muted hover:text-gym-text p-1 rounded-lg hover:bg-gym-surface"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="flex items-center justify-between mb-4 pr-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-500">
              <MessageSquare size={18} />
            </div>
            <div>
              <h2 className="text-base font-black text-gym-text leading-tight">
                Send SMS Expiry Reminder
              </h2>
              <div className="text-xs text-gym-muted flex items-center gap-1.5 mt-0.5">
                <span>To: <strong>{member.fullName}</strong></span>
                <span className="font-mono text-amber-600 dark:text-amber-400">({member.phone})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Template Selector & Language Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex flex-wrap gap-1">
            <button
              type="button"
              onClick={() => handleTypeChange('exp_5')}
              className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase transition-all border ${
                selectedType === 'exp_5'
                  ? 'bg-purple-500/20 border-purple-500 text-purple-700 dark:text-purple-300'
                  : 'bg-gym-surface border-gym-border text-gym-muted'
              }`}
            >
              5-Day Notice
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('exp_2')}
              className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase transition-all border ${
                selectedType === 'exp_2'
                  ? 'bg-orange-500/20 border-orange-500 text-orange-700 dark:text-orange-300'
                  : 'bg-gym-surface border-gym-border text-gym-muted'
              }`}
            >
              2-Day Urgent
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('exp_0')}
              className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase transition-all border ${
                selectedType === 'exp_0'
                  ? 'bg-rose-500/20 border-rose-500 text-rose-700 dark:text-rose-300'
                  : 'bg-gym-surface border-gym-border text-gym-muted'
              }`}
            >
              Today (0d)
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('grace')}
              className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase transition-all border ${
                selectedType === 'grace'
                  ? 'bg-amber-500/20 border-amber-500 text-amber-700 dark:text-amber-300'
                  : 'bg-gym-surface border-gym-border text-gym-muted'
              }`}
            >
              Grace Period
            </button>
          </div>

          <button
            type="button"
            onClick={handleLangToggle}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-gym-surface hover:bg-gym-hover border border-gym-border text-[11px] font-bold text-gym-text"
          >
            <Languages size={12} className="text-amber-500" />
            <span>{lang === 'en' ? 'English' : 'አማርኛ (Amharic)'}</span>
          </button>
        </div>

        {/* Message Editor */}
        <div className="mb-4">
          <textarea
            rows={4}
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            className="w-full bg-gym-surface border border-gym-border focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 rounded-xl p-3 text-xs text-gym-text placeholder:text-gym-dim focus:outline-none transition-all leading-relaxed font-medium"
          />
          <div className="flex justify-between items-center text-[10px] text-gym-dim mt-1">
            <span>Character count: {customMessage.length}</span>
            <span>1 SMS segment (Direct Carrier / SIM Gateway)</span>
          </div>
        </div>

        {sentSuccess && (
          <div className="bg-emerald-500/15 border border-emerald-500/50 text-emerald-800 dark:text-emerald-300 rounded-xl p-2.5 mb-4 text-xs font-bold flex items-center gap-2">
            <CheckCircle size={15} />
            <span>Automated SMS sent & logged successfully to {member.phone}!</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              onClick={handleSend}
              disabled={sending}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <Send size={13} />
              <span>{sending ? 'Dispatching SMS...' : 'Send SMS Now'}</span>
            </button>

            <button
              onClick={handleCopy}
              className="px-3.5 py-2.5 rounded-xl bg-gym-surface hover:bg-gym-hover border border-gym-border text-xs font-bold text-gym-text transition-all flex items-center gap-1.5 focus:outline-none"
              title="Copy message to clipboard"
            >
              {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <a
            href={nativeSmsUrl}
            className="w-full py-2 rounded-xl bg-gym-surface hover:bg-gym-hover border border-gym-border text-gym-text text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Phone size={13} className="text-cyan-500" />
            <span>Open in Phone SMS App</span>
          </a>
        </div>
      </div>
    </div>
  );
}

