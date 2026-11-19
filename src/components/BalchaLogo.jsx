// src/components/BalchaLogo.jsx
import React from 'react';
import balchaLogoImg from '../assets/Balcha-logo.png';

export default function BalchaLogo({ size = 40, showText = false, subtitle = 'FRONT-DESK PORTAL' }) {
  return (
    <div className="inline-flex items-center gap-3 select-none">
      {/* Balcha Official Image Logo */}
      <img
        src={balchaLogoImg}
        alt="Balcha GYM Logo"
        style={{ width: size, height: size }}
        className="rounded-xl object-contain shrink-0 shadow-md shadow-black/30"
      />

      {showText && (
        <div className="text-left">
          <div className="text-base font-black tracking-wider uppercase leading-none text-gym-text">
            BALCHA GYM
          </div>
          {subtitle && (
            <div className="text-[10px] text-gym-muted tracking-widest uppercase font-bold mt-1">
              {subtitle}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
