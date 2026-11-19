import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check } from 'lucide-react';

const LANGUAGES = [
  { code: 'en', name: 'English', label: 'EN', nativeName: 'English' },
  { code: 'am', name: 'Amharic', label: 'አማ', nativeName: 'አማርኛ' },
  { code: 'om', name: 'Oromo', label: 'OM', nativeName: 'Afaan Oromoo' },
];

export default function LanguageSelector() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentLang = LANGUAGES.find((l) => l.code === (i18n.language || 'en')) || LANGUAGES[0];

  function changeLanguage(code) {
    i18n.changeLanguage(code);
    setIsOpen(false);
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gym-surface hover:bg-gym-hover border border-gym-border text-gym-text text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
        title="Switch Language / ቋንቋ ይቀይሩ"
        aria-label="Select language"
      >
        <Globe size={15} className="text-amber-500 shrink-0" />
        <span className="font-extrabold uppercase tracking-wide">{currentLang.label}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-44 rounded-xl bg-gym-card border border-gym-border shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-gym-muted border-b border-gym-border/50 mb-1">
            Select Language
          </div>
          {LANGUAGES.map((lang) => {
            const isSelected = i18n.language === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-left hover:bg-gym-surface transition-colors ${
                  isSelected ? 'text-amber-500 font-bold bg-amber-500/10' : 'text-gym-text'
                }`}
              >
                <div className="flex flex-col">
                  <span>{lang.nativeName}</span>
                  <span className="text-[10px] text-gym-dim">{lang.name}</span>
                </div>
                {isSelected && <Check size={14} className="text-amber-500 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
