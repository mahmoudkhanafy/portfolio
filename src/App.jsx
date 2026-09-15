import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import SelectedWork from './components/SelectedWork';
import ServicesToolkit from './components/ServicesToolkit';
import ContactFooter from './components/ContactFooter';
import FloatingWhatsApp from './components/FloatingWhatsApp';

export default function App() {
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#F9F9FB] text-[#111111] flex flex-col font-sans selection:bg-[#DC2626] selection:text-white">
      {/* 1. Minimalist Top Bar */}
      <Navbar />

      {/* Main Page Flow */}
      <main className="flex-1">
        {/* 2. Editorial Hero Section */}
        <Hero />

        {/* 3. Selected Works (The Video Grid with Phone Mockup & Modal) */}
        <SelectedWork />

        {/* 5. Services & Toolkit (Clean Split Layout) */}
        <ServicesToolkit />
      </main>

      {/* 6. Contact & Editorial Footer */}
      <ContactFooter />

      {/* Persistent Floating Action Button */}
      <FloatingWhatsApp />
    </div>
  );
}
