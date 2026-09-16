import React, { useState, useRef, useEffect } from 'react';
import { Play, Eye, Film, Smartphone, Monitor, Sparkles, ArrowUpRight } from 'lucide-react';
import { projects } from '../portfolioData';
import VideoModal from './VideoModal';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(hover: none)').matches ||
      window.innerWidth <= 768 ||
      (Boolean(navigator.maxTouchPoints) && navigator.maxTouchPoints > 0)
    );
  });

  useEffect(() => {
    const checkMobile = () => {
      if (typeof window === 'undefined') return;
      const isTouchOrSmallScreen =
        window.matchMedia('(hover: none)').matches ||
        window.innerWidth <= 768 ||
        (Boolean(navigator.maxTouchPoints) && navigator.maxTouchPoints > 0);
      setIsMobile(isTouchOrSmallScreen);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    const hoverQuery =
      typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(hover: none)') : null;
    if (hoverQuery?.addEventListener) {
      hoverQuery.addEventListener('change', checkMobile);
    } else if (hoverQuery?.addListener) {
      hoverQuery.addListener(checkMobile);
    }

    return () => {
      window.removeEventListener('resize', checkMobile);
      if (hoverQuery?.removeEventListener) {
        hoverQuery.removeEventListener('change', checkMobile);
      } else if (hoverQuery?.removeListener) {
        hoverQuery.removeListener(checkMobile);
      }
    };
  }, []);

  return isMobile;
}

function ProjectCard({ project, onSelectProject, isMobile }) {
  const videoRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const isVertical = project.aspectRatio === '9/16';
  const videoSrc = project.videoUrl || project.previewVideoUrl;

  // Guarantee strictly muted volume on mount for desktop video element
  useEffect(() => {
    if (!isMobile && videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.volume = 0;
    }
  }, [isMobile]);

  // Clean up WebKit video buffers when ProjectCard unmounts
  useEffect(() => {
    return () => {
      if (videoRef.current) {
        try {
          videoRef.current.pause();
          videoRef.current.removeAttribute('src');
          while (videoRef.current.firstChild) {
            videoRef.current.removeChild(videoRef.current.firstChild);
          }
          videoRef.current.load();
        } catch (err) {}
      }
    };
  }, []);

  const handleMouseEnter = () => {
    if (isMobile) return;
    setIsHovered(true);
    if (videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.volume = 0;
      videoRef.current.play().catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    if (isMobile) return;
    setIsHovered(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0; // resets back to the poster/first frame
      videoRef.current.muted = true;
      videoRef.current.volume = 0;
    }
  };

  const handleClick = () => {
    onSelectProject(project);
  };

  if (isVertical) {
    // 9:16 PHONE / REEL CARD STYLING — Optimized with poster thumbnail & zero mobile background buffering
    return (
      <div
        className="group relative cursor-pointer flex flex-col items-center w-full select-none touch-manipulation active:scale-[0.98] transition-transform"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        {/* Sleek Device Shell (reduced borders on mobile) */}
        <div className="w-full max-w-[320px] sm:max-w-[300px] rounded-2xl sm:rounded-[2.5rem] border-[2px] sm:border-[3.5px] border-[#222226] group-hover:border-[#DC2626] p-1 sm:p-1.5 bg-[#0F0F12] shadow-xl sm:shadow-2xl transition-all duration-500 transform group-hover:-translate-y-2 relative pointer-events-auto">
          
          {/* Top Notch - Desktop only to maximize mobile video real-estate */}
          <div className="hidden sm:flex absolute top-3 left-1/2 -translate-x-1/2 w-20 h-4 bg-black rounded-full z-30 items-center justify-center space-x-1.5 border border-white/10 pointer-events-none shadow-md">
            <div className="w-1.5 h-1.5 rounded-full bg-[#1A1A24]"></div>
            <div className="w-2 h-2 rounded-full bg-[#0D0D14] border border-blue-900/30"></div>
          </div>

          {/* Inner Screen Container */}
          <div className="relative aspect-[9/16] rounded-xl sm:rounded-[2.15rem] overflow-hidden bg-black">
            
            {/* Mobile/Touch: Render ONLY poster img with lazy loading to prevent GPU memory choke.
                Desktop: Render active video tag with hover-to-play support. */}
            {isMobile ? (
              <img
                src={project.thumbnailUrl}
                alt={project.title}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 pointer-events-none"
              />
            ) : (
              <video
                ref={videoRef}
                src={videoSrc}
                poster={project.thumbnailUrl}
                preload="metadata"
                playsInline
                webkit-playsinline="true"
                loop
                muted={true}
                defaultMuted={true}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 pointer-events-none"
              >
                <source src={videoSrc} type={videoSrc?.endsWith('.mov') ? 'video/quicktime' : 'video/mp4'} />
                <source src={videoSrc} type="video/mp4" />
              </video>
            )}

            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none"></div>

            {/* Clean Category Badge (No Views or Aspect Ratio clutter) */}
            <div className="absolute top-2 sm:top-7 left-2 sm:left-3.5 z-20 pointer-events-none">
              <span className="px-2 py-0.5 rounded text-[8px] sm:text-[10px] font-display tracking-wider bg-[#DC2626] text-white uppercase shadow-sm">
                {project.category}
              </span>
            </div>

            {/* Center Play Button Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className={`w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-[#DC2626] text-white flex items-center justify-center shadow-lg transition-all duration-300 ${
                  isHovered ? 'scale-110 opacity-90' : 'opacity-70 scale-90'
                }`}
              >
                <Play className="w-4 h-4 sm:w-6 sm:h-6 text-white fill-white ml-0.5" />
              </div>
            </div>

            {/* Bottom Meta Overlay */}
            <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-3.5 right-2 sm:right-3.5 z-20 pointer-events-none">
              <div className="text-[8px] sm:text-[10px] font-mono text-red-400 uppercase tracking-wider font-semibold line-clamp-1">
                {project.client}
              </div>
              <h4 className="text-xs sm:text-xl font-bold uppercase tracking-wide text-white font-display line-clamp-1 mt-0.5 leading-tight">
                {project.title}
              </h4>
              <p className="hidden sm:block text-[11px] text-gray-300 line-clamp-1 mt-0.5 font-normal">
                {project.tagline}
              </p>
            </div>

          </div>
        </div>

        {/* Minimal Bottom Caption */}
        <div className="mt-2 text-center">
          <span className="text-[10px] sm:text-xs font-display uppercase tracking-widest text-gray-500 group-hover:text-[#DC2626] transition-colors flex items-center justify-center gap-1">
            <span>Watch Cut</span>
            <ArrowUpRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
          </span>
        </div>
      </div>
    );
  }

  // 16:9 CINEMATIC & COMMERCIAL CARD STYLING (LANDSCAPE SMARTPHONE FRAME)
  return (
    <div
      className="group relative cursor-pointer flex flex-col w-full select-none touch-manipulation active:scale-[0.98] transition-transform"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {/* Landscape Smartphone Mockup Container */}
      <div className="w-full rounded-2xl sm:rounded-3xl border-[3px] border-zinc-800/90 group-hover:border-[#DC2626] shadow-2xl relative overflow-hidden bg-black p-1 sm:p-1.5 transition-all duration-500 transform group-hover:-translate-y-1.5 pointer-events-auto">
        
        {/* Landscape Camera Pill / Speaker Notch Centered on Left Edge */}
        <div className="w-1.5 h-6 rounded-full bg-zinc-900 border border-white/10 absolute left-2 top-1/2 -translate-y-1/2 z-30 pointer-events-none hidden sm:block shadow-xs"></div>

        {/* Inner Screen */}
        <div className="relative aspect-video rounded-xl sm:rounded-2xl overflow-hidden bg-black">
          
          {/* Mobile/Touch: Render ONLY poster img with lazy loading to prevent GPU memory choke.
              Desktop: Render active video tag with hover-to-play support. */}
          {isMobile ? (
            <img
              src={project.thumbnailUrl}
              alt={project.title}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 pointer-events-none"
            />
          ) : (
            <video
              ref={videoRef}
              src={videoSrc}
              poster={project.thumbnailUrl}
              preload="metadata"
              playsInline
              webkit-playsinline="true"
              loop
              muted={true}
              defaultMuted={true}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 pointer-events-none"
            >
              <source src={videoSrc} type={videoSrc?.endsWith('.mov') ? 'video/quicktime' : 'video/mp4'} />
              <source src={videoSrc} type="video/mp4" />
            </video>
          )}

          {/* Dark Vignette & Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent pointer-events-none"></div>

          {/* Clean Category Badge (No Views or Aspect Ratio clutter) */}
          <div className="absolute top-3 left-3 sm:left-5 z-20 pointer-events-none">
            <span className="px-2.5 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-display tracking-wider bg-[#DC2626] text-white uppercase shadow-sm">
              {project.category}
            </span>
          </div>

          {/* Center Play Button Overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-[#DC2626] text-white flex items-center justify-center shadow-xl transition-all duration-300 ${
                isHovered ? 'scale-110 opacity-95' : 'opacity-70 scale-90'
              }`}
            >
              <Play className="w-5 h-5 sm:w-7 sm:h-7 text-white fill-white ml-0.5" />
            </div>
          </div>

          {/* Bottom Details */}
          <div className="absolute bottom-2.5 sm:bottom-4 left-3 sm:left-5 right-3 sm:right-5 z-20 pointer-events-none">
            <div className="text-[9px] sm:text-xs font-mono text-red-400 uppercase tracking-wider font-semibold">
              {project.client} • {project.year}
            </div>
            <h4 className="text-base sm:text-2xl font-bold uppercase tracking-wide text-white font-display mt-0.5 leading-tight">
              {project.title}
            </h4>
            <p className="text-[10px] sm:text-xs text-gray-300 line-clamp-1 sm:line-clamp-2 mt-0.5 max-w-xl font-normal">
              {project.description}
            </p>
          </div>

        </div>

      </div>

      {/* Card Footer */}
      <div className="mt-2 flex items-center justify-between px-1">
        <span className="text-xs sm:text-sm font-display uppercase tracking-wider text-gray-800">
          {project.title}
        </span>
        <span className="text-[11px] sm:text-xs font-display uppercase tracking-wider text-[#DC2626] group-hover:underline flex items-center gap-0.5">
          <span>Watch Reel</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </div>
  );
}

export default function SelectedWork() {
  const isMobile = useIsMobile();
  const [filter, setFilter] = useState('all'); // 'all' | 'vertical' | 'cinematic'
  const [selectedProject, setSelectedProject] = useState(null);

  const filteredProjects = projects.filter((item) => {
    if (filter === 'vertical') return item.aspectRatio === '9/16' || item.category === 'vertical' || item.category === 'Reels / TikTok';
    if (filter === 'cinematic') return item.aspectRatio === '16/9' || item.category === 'cinematic' || item.category === 'Cinematic & Commercial';
    return true;
  });

  return (
    <section id="work" className="py-20 sm:py-24 bg-[#F9F9FB] border-b border-[#E5E7EB] relative overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        
        {/* Section Header & Editorial Filter */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-12 sm:mb-16 pb-6 border-b border-[#E5E7EB] gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 text-xs font-mono font-bold tracking-widest uppercase text-[#DC2626] mb-2">
              <Film className="w-3.5 h-3.5" />
              <span>EDITORIAL SHOWREEL &amp; ARCHIVE</span>
            </div>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold uppercase tracking-wide text-[#111111] font-display leading-none">
              SELECTED WORKS
            </h2>
          </div>

          {/* Category Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 p-1.5 bg-white border border-[#E5E7EB] rounded-2xl sm:rounded-full shadow-2xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-xl sm:rounded-full text-xs font-display tracking-wider uppercase transition-all duration-200 cursor-pointer ${
                filter === 'all'
                  ? 'bg-[#DC2626] text-white shadow-sm'
                  : 'text-gray-600 hover:text-[#111111] hover:bg-gray-100'
              }`}
            >
              All Projects ({projects.length})
            </button>

            <button
              onClick={() => setFilter('vertical')}
              className={`inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl sm:rounded-full text-xs font-display tracking-wider uppercase transition-all duration-200 cursor-pointer ${
                filter === 'vertical'
                  ? 'bg-[#DC2626] text-white shadow-sm'
                  : 'text-gray-600 hover:text-[#111111] hover:bg-gray-100'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Short-Form (9:16)</span>
            </button>

            <button
              onClick={() => setFilter('cinematic')}
              className={`inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl sm:rounded-full text-xs font-display tracking-wider uppercase transition-all duration-200 cursor-pointer ${
                filter === 'cinematic'
                  ? 'bg-[#DC2626] text-white shadow-sm'
                  : 'text-gray-600 hover:text-[#111111] hover:bg-gray-100'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Cinematic (16:9)</span>
            </button>
          </div>
        </div>

        {/* WORK GRID: Compact 2-column mobile layout, desktop remains exactly lg:grid-cols-3 */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4 lg:gap-8 items-start">
          {filteredProjects.map((project) => {
            const isVertical = project.aspectRatio === '9/16';
            return (
              <div
                key={project.id}
                className={
                  isVertical
                    ? 'col-span-1 flex justify-center'
                    : 'col-span-2 md:col-span-2 lg:col-span-2'
                }
              >
                <ProjectCard
                  project={project}
                  onSelectProject={(p) => setSelectedProject(p)}
                  isMobile={isMobile}
                />
              </div>
            );
          })}
        </div>

        {/* Bottom Editorial Quote Bar */}
        <div className="mt-16 sm:mt-20 p-6 sm:p-8 rounded-2xl bg-[#111111] text-white border border-gray-800 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-1 text-center md:text-left">
            <div className="text-[11px] font-mono text-[#DC2626] tracking-widest uppercase">
              EDITORIAL PHILOSOPHY
            </div>
            <p className="text-base sm:text-xl font-bold font-display tracking-wide italic text-gray-100">
              "A great cut is not noticed for its transition, but felt through its rhythm."
            </p>
          </div>
          <div className="flex-shrink-0 w-full sm:w-auto">
            <a
              href="#contact"
              className="inline-flex items-center justify-center space-x-2 w-full sm:w-auto px-6 py-3.5 rounded-full bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-display tracking-wider uppercase transition-all duration-200"
            >
              <span>Book Your Production</span>
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>
        </div>

      </div>

      {/* Video Modal */}
      {selectedProject && (
        <VideoModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </section>
  );
}
