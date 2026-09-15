import React, { useState, useEffect } from 'react';
import { Menu, X, ArrowUpRight, Phone } from 'lucide-react';
import { personalInfo } from '../portfolioData';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Selected Work', href: '#work' },
    { name: 'Services', href: '#services' },
    { name: 'Toolkit', href: '#toolkit' },
    { name: 'Contact', href: '#contact' },
  ];

  const handleNavClick = (e, href) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled
          ? 'bg-[#F9F9FB]/95 backdrop-blur-md shadow-sm border-b border-[#E5E7EB] py-3'
          : 'bg-[#F9F9FB]/85 backdrop-blur-sm border-b border-transparent py-4 sm:py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Brand Logo / Identification */}
          <a
            href="#"
            className="group flex items-center space-x-3 text-left focus:outline-none"
          >
            <div className="w-8 h-8 rounded-full bg-[#DC2626] flex items-center justify-center text-white font-display text-base tracking-normal shadow-sm transition-transform duration-300 group-hover:scale-110">
              MK
            </div>
            <div>
              <div className="text-base sm:text-lg font-bold tracking-wider text-[#111111] uppercase font-display flex items-center gap-1.5 leading-none">
                MAHMOUD KHALED
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#DC2626]"></span>
                <span className="text-[10px] font-mono font-medium text-gray-500 hidden sm:inline">
                  / PORTFOLIO 2026
                </span>
              </div>
              <div className="text-[9px] sm:text-[10px] font-mono tracking-widest text-gray-500 uppercase mt-0.5">
                VIDEO EDITOR &amp; VIDEOGRAPHER
              </div>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="text-sm font-display tracking-wider text-gray-700 uppercase hover:text-[#DC2626] transition-colors relative py-1 group"
              >
                {link.name}
                <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-[#DC2626] transition-all duration-300 group-hover:w-full"></span>
              </a>
            ))}
          </nav>

          {/* Desktop Right Action: Call & WhatsApp CTA */}
          <div className="hidden sm:flex items-center space-x-3">
            <a
              href={personalInfo.phoneUrl || "tel:+201156379179"}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-full text-xs font-display tracking-wider uppercase bg-white text-[#111111] border border-[#E5E7EB] hover:border-[#DC2626] hover:text-[#DC2626] transition-all duration-200 shadow-2xs"
              aria-label="Call Direct"
            >
              <Phone className="w-3.5 h-3.5 text-[#DC2626]" />
              <span>Call Direct</span>
            </a>
            <a
              href={personalInfo.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-display tracking-wider uppercase bg-[#DC2626] text-white hover:bg-[#B91C1C] transition-all duration-300 shadow-sm hover:shadow-red-glow transform hover:-translate-y-0.5"
            >
              <span>Hire Me</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Clean Non-Intrusive Mobile Quick Actions */}
          <div className="flex md:hidden items-center space-x-2">
            <a
              href={personalInfo.phoneUrl || "tel:+201156379179"}
              className="p-2 rounded-full text-[#111111] bg-white border border-gray-200 active:border-[#DC2626] active:text-[#DC2626] transition-colors shadow-2xs"
              aria-label="Call Mahmoud Khaled"
            >
              <Phone className="w-4 h-4 text-[#DC2626]" />
            </a>
            <a
              href={personalInfo.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 rounded-full text-xs font-display tracking-wider uppercase bg-[#DC2626] text-white shadow-sm flex items-center gap-1 active:scale-95 transition-all"
            >
              <span>Hire</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-800 hover:bg-gray-200/60 focus:outline-none transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#F9F9FB] border-b border-[#E5E7EB] px-5 pt-3 pb-6 space-y-3 shadow-xl">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className="block py-3 px-3 rounded-xl text-lg font-display tracking-wider uppercase text-[#111111] hover:bg-red-50 hover:text-[#DC2626] transition-colors"
            >
              {link.name}
            </a>
          ))}
          <div className="pt-3 border-t border-gray-200 space-y-2.5">
            <a
              href={personalInfo.phoneUrl || "tel:+201156379179"}
              className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-white border border-gray-300 text-[#111111] text-sm font-display tracking-wider uppercase shadow-2xs"
            >
              <Phone className="w-4 h-4 text-[#DC2626]" />
              <span>Call Direct (+20 115 637 9179)</span>
            </a>
            <a
              href={personalInfo.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center space-x-2 py-3.5 rounded-xl bg-[#DC2626] text-white text-sm font-display tracking-wider uppercase shadow-md"
            >
              <span>Chat on WhatsApp</span>
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
