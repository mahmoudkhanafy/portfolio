import React, { useState } from 'react';
import { MessageCircle, Phone } from 'lucide-react';
import { personalInfo } from '../portfolioData';

export default function FloatingWhatsApp() {
  const [activeTooltip, setActiveTooltip] = useState(null); // 'phone' | 'whatsapp' | null

  return (
    <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40 flex items-center space-x-2 sm:space-x-3">
      {/* Expanding Tooltip */}
      <div
        className={`hidden sm:flex items-center space-x-2 px-3.5 py-2 rounded-full bg-[#111111] text-white text-xs font-mono tracking-wider uppercase border border-gray-800 shadow-xl transition-all duration-300 pointer-events-none ${
          activeTooltip ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
        }`}
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span>
          {activeTooltip === 'phone' ? 'Call +20 115 637 9179' : 'Chat on WhatsApp'}
        </span>
      </div>

      {/* Direct Phone Call Button */}
      <a
        href={personalInfo.phoneUrl || "tel:+201156379179"}
        onMouseEnter={() => setActiveTooltip('phone')}
        onMouseLeave={() => setActiveTooltip(null)}
        className="group relative w-12 h-12 rounded-full bg-[#111111] hover:bg-black text-white flex items-center justify-center shadow-xl border border-gray-700/80 hover:border-[#DC2626] transition-all duration-300 transform hover:scale-110 active:scale-95"
        aria-label="Direct Phone Call with Mahmoud Khaled"
      >
        <Phone className="w-5 h-5 text-white transition-transform group-hover:rotate-12" />
      </a>

      {/* Floating Action WhatsApp Button */}
      <a
        href={personalInfo.whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setActiveTooltip('whatsapp')}
        onMouseLeave={() => setActiveTooltip(null)}
        className="group relative w-14 h-14 rounded-full bg-[#DC2626] hover:bg-[#B91C1C] text-white flex items-center justify-center shadow-2xl shadow-red-600/40 transition-all duration-300 transform hover:scale-110 active:scale-95"
        aria-label="Direct WhatsApp Chat with Mahmoud Khaled"
      >
        {/* Pulsing Ripple Effect */}
        <span className="absolute inset-0 rounded-full bg-[#DC2626] opacity-30 animate-ping pointer-events-none"></span>

        {/* WhatsApp Icon */}
        <MessageCircle className="w-6 h-6 text-white transition-transform group-hover:rotate-6" />

        {/* Online Indicator Dot */}
        <span className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-white shadow-xs"></span>
      </a>
    </div>
  );
}
