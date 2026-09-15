import React, { useState } from 'react';
import { Layers, Cpu, CheckCircle2, Award, Zap, ArrowRight, Video, Sparkles } from 'lucide-react';
import { services, toolkit, metrics, personalInfo } from '../portfolioData';

export default function ServicesToolkit() {
  const [activeService, setActiveService] = useState(0);

  return (
    <section id="services" className="py-20 sm:py-24 bg-white border-b border-[#E5E7EB] relative overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="mb-12 sm:mb-16 pb-6 border-b border-[#E5E7EB]">
          <div className="inline-flex items-center space-x-2 text-xs font-mono font-bold tracking-widest uppercase text-[#DC2626] mb-2">
            <Layers className="w-3.5 h-3.5" />
            <span>PRODUCTION CAPABILITIES &amp; GEAR</span>
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold uppercase tracking-wide text-[#111111] font-display leading-none">
            SERVICES &amp; TOOLKIT
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-gray-500 max-w-xl font-normal">
            End-to-end post-production, viral short-form retention architectures, and on-location cinematography.
          </p>
        </div>

        {/* CLEAN SPLIT LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          
          {/* LEFT COLUMN: The 5 Core Services in an Editorial Numbered List (7 cols) */}
          <div className="lg:col-span-7 space-y-3.5 sm:space-y-4">
            <div className="text-xs font-mono tracking-wider uppercase text-gray-500 mb-3 pb-2 border-b border-gray-200 flex justify-between items-center">
              <span>01 // POST-PRODUCTION &amp; SHOOTING DISCIPLINES</span>
              <span>(5 SPECIALTIES)</span>
            </div>

            {services.map((service, idx) => {
              const isSelected = activeService === idx;
              return (
                <div
                  key={service.number}
                  onClick={() => setActiveService(idx)}
                  className={`group p-4 sm:p-6 rounded-2xl border transition-all duration-300 cursor-pointer active:scale-[0.99] select-none ${
                    isSelected
                      ? 'bg-[#F9F9FB] border-[#DC2626] shadow-md -translate-y-0.5'
                      : 'bg-white border-[#E5E7EB] hover:border-gray-400 hover:bg-gray-50/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 sm:gap-4">
                    {/* Number and Title */}
                    <div className="flex items-start space-x-3.5 sm:space-x-4">
                      <span className={`text-3xl sm:text-4xl font-bold font-display tracking-tight transition-colors leading-none shrink-0 ${
                        isSelected ? 'text-[#DC2626]' : 'text-gray-400 group-hover:text-[#DC2626]'
                      }`}>
                        {service.number}
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-xl sm:text-2xl font-bold text-[#111111] uppercase tracking-wide font-display leading-tight">
                            {service.title}
                          </h3>
                          <span className={`px-2.5 py-0.5 rounded text-[11px] font-display tracking-wider uppercase ${
                            isSelected ? 'bg-[#DC2626] text-white' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {service.tag}
                          </span>
                        </div>
                        <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-gray-600 leading-relaxed font-normal">
                          {service.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Deliverables Pills */}
                  {service.deliverables && (
                    <div className="mt-3.5 sm:mt-4 pt-3.5 sm:pt-4 border-t border-gray-200/80 flex flex-wrap gap-1.5 sm:gap-2">
                      {service.deliverables.map((item, dIdx) => (
                        <span
                          key={dIdx}
                          className="inline-flex items-center space-x-1.5 px-2.5 sm:px-3 py-1 rounded-full text-xs font-mono bg-white border border-[#E5E7EB] text-gray-700 shadow-2xs"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]"></span>
                          <span>{item}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* RIGHT COLUMN: Toolkit Tags & Key Metric Cards (5 cols) */}
          <div id="toolkit" className="lg:col-span-5 space-y-6 sm:space-y-8 lg:sticky lg:top-24">
            
            {/* 3 KEY METRIC CARDS */}
            <div className="space-y-3">
              <div className="text-xs font-mono tracking-wider uppercase text-gray-500 mb-2 pb-2 border-b border-gray-200 flex justify-between">
                <span>02 // IMPACT METRICS</span>
                <span>VERIFIED</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-3">
                {metrics.map((metric, idx) => (
                  <div
                    key={idx}
                    className="p-4 sm:p-5 rounded-xl bg-[#111111] text-white border border-gray-800 shadow-md flex items-center justify-between hover:border-[#DC2626] transition-colors"
                  >
                    <div>
                      <div className="text-4xl sm:text-5xl font-bold font-display text-[#DC2626] tracking-wide leading-none">
                        {metric.value}
                      </div>
                      <div className="text-xs sm:text-sm font-display tracking-wider uppercase text-gray-200 mt-1">
                        {metric.label}
                      </div>
                      <div className="text-[11px] text-gray-400 mt-0.5 font-normal">
                        {metric.subtext}
                      </div>
                    </div>
                    <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[#DC2626] shrink-0">
                      <Zap className="w-4 h-4" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SOFTWARE TOOLKIT TAGS */}
            <div className="space-y-3">
              <div className="text-xs font-mono tracking-wider uppercase text-gray-500 mb-2 pb-2 border-b border-gray-200 flex justify-between items-center">
                <span>03 // EDITING &amp; COLOR TOOLKIT</span>
                <span>NLE &amp; VFX</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
                {toolkit.map((tool, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-[#F9F9FB] border border-[#E5E7EB] hover:border-[#DC2626] hover:bg-white transition-all duration-200 flex items-center justify-between group shadow-2xs"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center font-display text-base group-hover:bg-[#DC2626] transition-colors">
                        {tool.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-display tracking-wider uppercase text-[#111111]">
                          {tool.name}
                        </div>
                        <div className="text-[10px] font-mono text-gray-500">
                          {tool.category}
                        </div>
                      </div>
                    </div>

                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-white border border-[#E5E7EB] text-gray-700">
                      {tool.proficiency}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Work Inquiry Card */}
            <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-[#1A1A1E] to-[#111111] text-white border border-gray-800 shadow-xl space-y-4">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626] animate-ping"></span>
                <span className="text-xs font-mono uppercase tracking-widest text-[#DC2626] font-bold">
                  PROJECT ONBOARDING
                </span>
              </div>
              <h4 className="text-2xl sm:text-3xl font-bold font-display uppercase tracking-wide leading-tight">
                Need Fast Turnaround Video Assets?
              </h4>
              <p className="text-xs text-gray-300 leading-relaxed font-normal">
                Whether you need a high-retention TikTok/Reel batch or a broadcast-ready commercial cut, let's connect and review your timeline.
              </p>
              <a
                href={personalInfo.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center space-x-2 w-full py-3.5 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-sm font-display tracking-wider uppercase transition-all duration-200 shadow-md hover:shadow-red-glow active:scale-98"
              >
                <span>Chat Directly on WhatsApp</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
