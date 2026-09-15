import React, { useState } from 'react';
import { Mail, MessageCircle, Instagram, MapPin, ArrowUpRight, Copy, Check, Phone } from 'lucide-react';
import { personalInfo } from '../portfolioData';

export default function ContactFooter() {
  const [copied, setCopied] = useState(false);

  const copyEmail = () => {
    navigator.clipboard.writeText(personalInfo.email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <footer id="contact" className="bg-[#111111] text-white pt-20 sm:pt-24 pb-12 relative overflow-x-hidden border-t border-gray-800">
      
      {/* Editorial Background Typography Accent */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none select-none overflow-hidden opacity-[0.03] z-0 max-w-full">
        <span className="text-[18vw] font-bold uppercase tracking-wide text-white leading-none whitespace-nowrap font-display block">
          LET'S CONNECT
        </span>
      </div>

      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
        
        {/* Top Editorial Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 pb-14 sm:pb-16 border-b border-gray-800">
          
          {/* Main Headline & Pitch (7 cols) */}
          <div className="lg:col-span-7 space-y-5 sm:space-y-6">
            <div className="inline-flex items-center space-x-2 text-xs font-mono font-bold tracking-widest uppercase text-[#DC2626]">
              <span className="w-2 h-2 rounded-full bg-[#DC2626]"></span>
              <span>GET IN TOUCH // 2026 COMMISSIONS</span>
            </div>

            <h2 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold uppercase tracking-wide text-white font-display leading-[0.9]">
              LET'S CONNECT<span className="text-[#DC2626]">.</span>
            </h2>

            <p className="text-sm sm:text-base md:text-lg text-gray-400 max-w-xl leading-relaxed font-normal">
              Ready to bring your ideas to life with high-impact visuals? Whether you need dynamic Reel &amp; TikTok editing, on-ground video shooting, sleek motion graphics, or professional color grading—let’s collaborate to create content that stands out.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
              <a
                href={personalInfo.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center space-x-2.5 px-6 py-3.5 rounded-xl sm:rounded-full bg-[#DC2626] hover:bg-[#B91C1C] text-white text-sm font-display tracking-wider uppercase transition-all duration-300 shadow-md hover:shadow-red-glow active:scale-98"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat on WhatsApp</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>

              <a
                href={personalInfo.phoneUrl || "tel:+201156379179"}
                className="inline-flex items-center justify-center space-x-2.5 px-6 py-3.5 rounded-xl sm:rounded-full bg-white text-[#111111] hover:bg-gray-100 text-sm font-display tracking-wider uppercase transition-all duration-300 shadow-md active:scale-98"
              >
                <Phone className="w-4 h-4 text-[#DC2626]" />
                <span>Call Direct</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>

              <button
                onClick={copyEmail}
                className="inline-flex items-center justify-center space-x-2.5 px-5 py-3.5 rounded-xl sm:rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white text-sm font-display tracking-wider uppercase transition-all duration-300 cursor-pointer active:scale-98"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-gray-300" />}
                <span>{copied ? "Email Copied!" : "Copy Email"}</span>
              </button>
            </div>
          </div>

          {/* Direct Quick Links & Channels (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-6 sm:space-y-8">
            
            <div className="space-y-3 sm:space-y-3.5">
              <div className="text-xs font-mono tracking-wider uppercase text-gray-500 pb-2 border-b border-gray-800">
                DIRECT CONTACT CHANNELS
              </div>

              {/* Direct Phone Call Link */}
              <a
                href={personalInfo.phoneUrl || "tel:+201156379179"}
                className="group flex items-center justify-between p-3.5 sm:p-4 rounded-xl bg-white/5 border border-white/10 hover:border-[#DC2626] hover:bg-white/10 transition-all duration-200"
              >
                <div className="flex items-center space-x-3.5">
                  <div className="w-10 h-10 rounded-lg bg-[#DC2626]/20 text-[#DC2626] flex items-center justify-center group-hover:bg-[#DC2626] group-hover:text-white transition-colors">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-gray-400 uppercase">
                      Call Direct
                    </div>
                    <div className="text-sm font-display tracking-wider text-white group-hover:text-[#DC2626] transition-colors">
                      +20 115 637 9179
                    </div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-white transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>

              {/* WhatsApp Link */}
              <a
                href={personalInfo.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between p-3.5 sm:p-4 rounded-xl bg-white/5 border border-white/10 hover:border-[#DC2626] hover:bg-white/10 transition-all duration-200"
              >
                <div className="flex items-center space-x-3.5">
                  <div className="w-10 h-10 rounded-lg bg-[#DC2626]/20 text-[#DC2626] flex items-center justify-center group-hover:bg-[#DC2626] group-hover:text-white transition-colors">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-gray-400 uppercase">
                      WhatsApp Quick Chat
                    </div>
                    <div className="text-sm font-display tracking-wider text-white group-hover:text-[#DC2626] transition-colors">
                      +20 115 637 9179
                    </div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-white transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>

              {/* Email Link */}
              <a
                href={`mailto:${personalInfo.email}`}
                className="group flex items-center justify-between p-3.5 sm:p-4 rounded-xl bg-white/5 border border-white/10 hover:border-[#DC2626] hover:bg-white/10 transition-all duration-200"
              >
                <div className="flex items-center space-x-3.5">
                  <div className="w-10 h-10 rounded-lg bg-[#DC2626]/20 text-[#DC2626] flex items-center justify-center group-hover:bg-[#DC2626] group-hover:text-white transition-colors">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-gray-400 uppercase">
                      Email Address
                    </div>
                    <div className="text-xs sm:text-sm font-medium text-white group-hover:text-[#DC2626] transition-colors truncate max-w-[200px] sm:max-w-none">
                      {personalInfo.email}
                    </div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-white transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>

              {/* Instagram Link */}
              <a
                href={personalInfo.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between p-3.5 sm:p-4 rounded-xl bg-white/5 border border-white/10 hover:border-[#DC2626] hover:bg-white/10 transition-all duration-200"
              >
                <div className="flex items-center space-x-3.5">
                  <div className="w-10 h-10 rounded-lg bg-[#DC2626]/20 text-[#DC2626] flex items-center justify-center group-hover:bg-[#DC2626] group-hover:text-white transition-colors">
                    <Instagram className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-gray-400 uppercase">
                      Instagram Profile
                    </div>
                    <div className="text-sm font-display tracking-wider text-white group-hover:text-[#DC2626] transition-colors">
                      @mahmoud_khaled.0
                    </div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-white transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            </div>

            {/* Location & Time Zone Status */}
            <div className="pt-2 flex items-center space-x-3 text-xs font-mono text-gray-400">
              <MapPin className="w-4 h-4 text-[#DC2626]" />
              <span>{personalInfo.location}</span>
            </div>

          </div>

        </div>

        {/* Bottom Architectural Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-gray-500">
          <div>
            © 2026 MAHMOUD KHALED. ALL RIGHTS RESERVED.
          </div>

          <div className="flex items-center space-x-6">
            <span className="text-gray-400">EDITORIAL VIDEO SUITE</span>
            <span className="text-[#DC2626]">•</span>
            <span>DAVINCI &amp; PREMIERE</span>
            <span className="text-[#DC2626]">•</span>
            <a href="#" className="hover:text-white transition-colors">BACK TO TOP ↑</a>
          </div>
        </div>

      </div>
    </footer>
  );
}
