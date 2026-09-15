import React from 'react';
import { ArrowDown, MessageCircle, MapPin, Phone, Play } from 'lucide-react';
import { personalInfo, metrics } from '../portfolioData';

export default function Hero() {
  const scrollToWork = () => {
    const el = document.getElementById('work');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-[90vh] flex flex-col justify-between pt-24 sm:pt-32 pb-12 overflow-x-hidden border-b border-[#E5E7EB] bg-[#F9F9FB] bg-grid-pattern">
      {/* Decorative Editorial Watermark Background */}
      <div className="absolute top-12 left-0 right-0 pointer-events-none select-none overflow-hidden opacity-[0.03] z-0 max-w-full">
        <span className="text-[14vw] font-bold uppercase tracking-wide text-[#111111] leading-none whitespace-nowrap font-display block">
          CINEMATIC EDITORIAL
        </span>
      </div>

      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10 w-full my-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-center">
          
          {/* LEFT COLUMN: Editorial Typography & CTAs (7 cols on lg) */}
          <div className="lg:col-span-7 flex flex-col justify-center space-y-5 sm:space-y-6 text-left">
            
            {/* Red Subtitle Badge */}
            <div className="inline-flex items-center space-x-2.5">
              <span className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs font-display tracking-widest bg-[#DC2626] text-white shadow-sm">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                <span>{personalInfo.title}</span>
              </span>
            </div>

            {/* Massive Bebas Neue Display Headline (Single Horizontal Line Side-by-Side) */}
            <div className="space-y-0">
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-[6.5rem] 2xl:text-[7.5rem] font-bold text-[#111111] uppercase tracking-wide leading-none font-display whitespace-nowrap">
                <span className="hover:text-[#DC2626] transition-colors duration-300">MAHMOUD</span>{' '}
                <span className="text-[#111111] relative">
                  KHALED
                  <span className="inline-block text-[#DC2626] ml-1">.</span>
                </span>
              </h1>
            </div>

            {/* Editorial Tagline */}
            <p className="text-base sm:text-lg md:text-xl font-semibold text-gray-800 tracking-tight max-w-xl leading-snug">
              {personalInfo.tagline}
            </p>

            {/* Bio Details */}
            <p className="text-xs sm:text-sm md:text-base text-gray-600 max-w-xl leading-relaxed font-normal">
              {personalInfo.shortBio}
            </p>

            {/* Location & Status Bar */}
            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 sm:gap-x-6 text-xs font-mono text-gray-600 pt-1">
              <div className="flex items-center space-x-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#DC2626]" />
                <span>{personalInfo.location}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="uppercase font-semibold tracking-wider text-emerald-800">{personalInfo.availability}</span>
              </div>
            </div>

            {/* Desktop Dual CTAs (Hidden on mobile to preserve vertical sequence) */}
            <div className="hidden lg:flex pt-3 flex-wrap items-center gap-4">
              <button
                onClick={scrollToWork}
                className="group inline-flex items-center space-x-3 px-7 py-3.5 rounded-full text-sm font-display tracking-wider bg-[#111111] text-white hover:bg-[#DC2626] transition-all duration-300 shadow-md hover:shadow-red-glow transform hover:-translate-y-0.5 cursor-pointer"
              >
                <span>Explore Selected Work</span>
                <ArrowDown className="w-4 h-4 group-hover:translate-y-1 transition-transform" />
              </button>

              <a
                href={personalInfo.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-3 px-6 py-3.5 rounded-full text-sm font-display tracking-wider bg-white text-[#111111] border-2 border-[#111111] hover:border-[#DC2626] hover:text-[#DC2626] transition-all duration-300 shadow-sm transform hover:-translate-y-0.5"
              >
                <MessageCircle className="w-4 h-4 text-[#DC2626]" />
                <span>Chat on WhatsApp</span>
              </a>

              <a
                href={personalInfo.phoneUrl || "tel:+201156379179"}
                className="inline-flex items-center space-x-2.5 px-5 py-3.5 rounded-full text-sm font-display tracking-wider bg-white text-[#111111] border border-gray-300 hover:border-[#DC2626] hover:text-[#DC2626] transition-all duration-200"
              >
                <Phone className="w-4 h-4 text-[#DC2626]" />
                <span>Call Direct</span>
              </a>
            </div>

          </div>

          {/* RIGHT COLUMN: Symmetrically Centered Solid Red Circle & Portrait */}
          <div className="lg:col-span-5 flex items-center justify-center my-5 sm:my-6 lg:my-0">
            
            {/* Avatar & Red Circle Container */}
            <div className="relative w-52 h-52 sm:w-64 sm:h-64 lg:w-[380px] lg:h-[440px] flex items-center justify-center">
              
              {/* CLEAN SOLID MINIMALIST RED CIRCLE BACKGROUND */}
              <div 
                className="absolute w-44 h-44 sm:w-56 sm:h-56 lg:w-[320px] lg:h-[320px] xl:w-[340px] xl:h-[340px] rounded-full bg-[#DC2626] shadow-2xl transition-transform duration-700 hover:scale-105"
                style={{
                  boxShadow: '0 25px 60px -15px rgba(220, 38, 38, 0.45)',
                }}
              />

              {/* USER'S PORTRAIT (mahmoud.png) COMPLETELY SOLID & SHARP */}
              <div className="relative z-10 w-full h-full flex items-end justify-center pointer-events-none select-none">
                <img
                  src={personalInfo.heroPortrait}
                  alt={personalInfo.name}
                  className="max-h-[96%] sm:max-h-[96%] lg:max-h-[95%] w-auto object-contain object-bottom drop-shadow-[0_20px_30px_rgba(0,0,0,0.35)] filter contrast-105"
                  onError={(e) => {
                    e.target.src = personalInfo.heroPortrait;
                  }}
                />
              </div>

              {/* FLOATING "HIGH-RETENTION VISUALS" BADGE CONCEALING FLAT BOTTOM CROP */}
              <div className="absolute -bottom-2.5 sm:-bottom-4 lg:-bottom-3 left-1/2 -translate-x-1/2 z-20 bg-[#121212] rounded-xl sm:rounded-2xl border border-white/10 shadow-2xl backdrop-blur-md px-3.5 py-2 sm:px-5 sm:py-3.5 flex items-center gap-2.5 sm:gap-3.5 whitespace-nowrap pointer-events-auto">
                <div className="bg-[#DC2626] w-8 h-8 sm:w-11 sm:h-11 flex items-center justify-center text-white shrink-0 rounded-lg sm:rounded-xl shadow-md">
                  <Play className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white fill-white ml-0.5" />
                </div>
                <div className="text-left">
                  <div className="font-display tracking-wider text-white text-xs sm:text-base lg:text-lg leading-tight font-bold uppercase">
                    HIGH-RETENTION VISUALS
                  </div>
                  <div className="text-[9px] sm:text-xs text-zinc-400 font-mono tracking-wider sm:tracking-widest uppercase leading-none mt-0.5 sm:mt-1">
                    COMMERCIALS &amp; REELS
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* Mobile Full-Width High-Impact CTA Buttons (Follows the avatar cleanly on mobile) */}
          <div className="flex lg:hidden flex-col w-full gap-3 pt-2">
            <a
              href={personalInfo.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-4 rounded-xl text-base font-display tracking-wider bg-[#DC2626] text-white flex items-center justify-center space-x-2.5 shadow-md active:scale-98 transition-all"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Chat on WhatsApp</span>
            </a>

            <div className="grid grid-cols-2 gap-3">
              <a
                href={personalInfo.phoneUrl || "tel:+201156379179"}
                className="w-full py-3.5 rounded-xl text-sm font-display tracking-wider bg-white text-[#111111] border-2 border-gray-300 active:border-[#DC2626] flex items-center justify-center space-x-2 transition-all"
              >
                <Phone className="w-4 h-4 text-[#DC2626]" />
                <span>Call Direct</span>
              </a>
              <button
                onClick={scrollToWork}
                className="w-full py-3.5 rounded-xl text-sm font-display tracking-wider bg-[#111111] text-white flex items-center justify-center space-x-2 transition-all"
              >
                <span>Explore Work</span>
                <ArrowDown className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

        {/* METRICS ARCHITECTURAL ROW - Clean 3-column grid with Bebas Neue digits */}
        <div className="mt-12 sm:mt-16 pt-8 border-t border-[#E5E7EB] grid grid-cols-3 gap-2 sm:gap-4 md:gap-8">
          {metrics.map((metric, idx) => (
            <div
              key={idx}
              className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left space-y-1 sm:space-y-0 sm:space-x-3 p-3 sm:p-4 rounded-xl bg-white/70 backdrop-blur-sm border border-[#E5E7EB]/70 hover:border-[#DC2626]/40 transition-all duration-300"
            >
              <div className="text-4xl sm:text-4xl md:text-5xl font-display text-[#DC2626] leading-none shrink-0">
                {metric.value}
              </div>
              <div className="min-w-0">
                <div className="text-[11px] sm:text-xs md:text-sm font-display tracking-wider text-[#111111] uppercase line-clamp-1 sm:line-clamp-none">
                  {metric.label}
                </div>
                <div className="text-[10px] sm:text-xs text-gray-500 font-medium line-clamp-1 sm:line-clamp-2 mt-0.5">
                  {metric.subtext}
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
