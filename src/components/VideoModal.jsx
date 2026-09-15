import React, { useEffect, useRef, useState } from 'react';
import { X, MessageCircle, Play, Pause, Volume2, VolumeX, Maximize, Minimize } from 'lucide-react';
import { personalInfo } from '../portfolioData';

export default function VideoModal({ project, onClose }) {
  const videoRef = useRef(null);
  const modalContainerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false); // Initializes unmuted since user explicitly clicked
  const [isBuffering, setIsBuffering] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const lastTimeUpdateRef = useRef(0);

  // Hardware decoding & memory cleanup on component unmount
  useEffect(() => {
    return () => {
      if (videoRef.current) {
        try {
          videoRef.current.pause();
          videoRef.current.removeAttribute('src');
          videoRef.current.load();
        } catch (err) {}
      }
    };
  }, []);

  // Track Fullscreen changes (Desktop & Android)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !document.fullscreenElement) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [onClose]);

  // Throttled time update to eliminate mobile UI thread stutter & excessive React re-renders
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const now = performance.now();
    if (now - lastTimeUpdateRef.current >= 250) {
      lastTimeUpdateRef.current = now;
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  // Unmuted playback handler upon user click/tap with browser restriction fallback
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = 0;
    video.muted = false;
    video.volume = 1.0;

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true);
          setIsMuted(false);
        })
        .catch((err) => {
          console.warn("Unmuted autoplay restricted by browser policy, falling back to muted:", err);
          video.muted = true;
          setIsMuted(true);
          video
            .play()
            .then(() => setIsPlaying(true))
            .catch(() => setIsPlaying(false));
        });
    } else {
      setIsMuted(false);
    }
  }, [project]);

  if (!project) return null;

  const isVertical = project.aspectRatio === '9/16';
  const videoSrc = project.videoUrl || project.fullVideoUrl;
  const whatsappProjectLink = `${personalInfo.whatsappUrl}?text=${encodeURIComponent(
    `Hi Mahmoud, I saw your project "${project.title}" on your portfolio and I would like to discuss a video editing project with you.`
  )}`;

  const formatTime = (timeInSeconds) => {
    if (isNaN(timeInSeconds) || timeInSeconds === null || !isFinite(timeInSeconds)) return '00:00';
    const mins = Math.floor(timeInSeconds / 60);
    const secs = Math.floor(timeInSeconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleSeek = (e) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(async () => {
          if (videoRef.current) {
            videoRef.current.muted = true;
            setIsMuted(true);
            await videoRef.current.play();
            setIsPlaying(true);
          }
        });
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    const nextMuted = !video.muted;
    video.muted = nextMuted;
    if (!nextMuted) {
      video.volume = 1.0;
    }
    setIsMuted(nextMuted);
  };

  // Robust Mobile & Desktop Fullscreen Handler (Pillarboxed on Desktop)
  const handleFullscreen = async (e) => {
    e.stopPropagation();
    const video = videoRef.current;
    const container = modalContainerRef.current;
    if (!video || !container) return;

    // 1. Mobile Safari (iOS) requires native video fullscreen:
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isIOS && video.webkitEnterFullscreen) {
      video.webkitEnterFullscreen();
      return;
    }

    // 2. Desktop & Android: Fullscreen the container (keeps custom controls & strict aspect ratio)
    try {
      if (!document.fullscreenElement) {
        if (container.requestFullscreen) {
          await container.requestFullscreen();
        } else if (container.webkitRequestFullscreen) {
          await container.webkitRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (err) {
      console.error("Fullscreen error:", err);
    }
  };

  const handleClose = async () => {
    // Release mobile GPU decoding buffers & RAM immediately
    if (videoRef.current) {
      try {
        videoRef.current.pause();
        videoRef.current.removeAttribute('src');
        videoRef.current.load();
      } catch (err) {}
    }
    if (document.fullscreenElement) {
      try {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      } catch (err) {}
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-5 md:p-8 bg-black/95 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
      onClick={handleClose}
    >
      {/* Strict Geometry Container: Pillarboxed on Desktop Fullscreen, Landscape/Vertical Phone Frame in Normal View */}
      <div
        ref={modalContainerRef}
        className={
          isVertical
            ? `${
                isFullscreen
                  ? 'h-screen max-h-screen aspect-[9/16] w-auto mx-auto my-auto rounded-none border-0'
                  : 'h-[78vh] max-h-[720px] aspect-[9/16] w-auto mx-auto rounded-3xl border-[3px]'
              } overflow-hidden bg-black shadow-2xl relative ${
                showControls && !isFullscreen ? 'border-zinc-800/90' : 'border-transparent'
              } flex flex-col justify-center items-center select-none transition-colors duration-300`
            : `${
                isFullscreen
                  ? 'w-full h-screen max-h-screen aspect-video mx-auto my-auto rounded-none border-0'
                  : 'w-full max-w-4xl max-h-[75vh] aspect-video mx-auto rounded-2xl sm:rounded-3xl border-[3px]'
              } overflow-hidden bg-black shadow-2xl relative ${
                showControls && !isFullscreen ? 'border-zinc-800/90' : 'border-transparent'
              } flex flex-col justify-center items-center select-none transition-colors duration-300`
        }
        onClick={(e) => e.stopPropagation()}
      >
        {/* Landscape Smartphone Camera Notch (Hidden on vertical and when fullscreen) */}
        {!isVertical && !isFullscreen && (
          <div
            className={`w-1.5 h-6 rounded-full bg-zinc-900 border border-white/10 absolute left-2 top-1/2 -translate-y-1/2 z-40 pointer-events-none hidden sm:block shadow-xs transition-opacity duration-300 ${
              showControls ? 'opacity-100' : 'opacity-0'
            }`}
          ></div>
        )}

        {/* Vertical Phone Top Notch (Hidden when fullscreen) */}
        {isVertical && !isFullscreen && (
          <div
            className={`hidden sm:flex absolute top-3 left-1/2 -translate-x-1/2 w-20 h-4 bg-black rounded-full z-40 items-center justify-center space-x-1.5 border border-white/10 pointer-events-none shadow-md transition-opacity duration-300 ${
              showControls ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-[#1A1A24]"></div>
            <div className="w-2 h-2 rounded-full bg-[#0D0D14] border border-blue-900/30"></div>
          </div>
        )}

        {/* ISOLATED CLOSE BUTTON: Pinned at top-right, toggles with showControls */}
        <button
          onClick={handleClose}
          className={`absolute top-3 right-3 z-50 p-2.5 rounded-full bg-black/70 text-white backdrop-blur-md hover:bg-black transition cursor-pointer active:scale-95 shadow-xl border border-white/10 ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          } transition-opacity duration-300`}
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top-Left Category & Direct WhatsApp Quick Badge */}
        <div
          className={`absolute top-3 left-3 z-40 flex items-center gap-2 pointer-events-auto ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          } transition-opacity duration-300`}
        >
          <span className="px-2.5 py-1 rounded-full text-[10px] font-display tracking-wider uppercase bg-[#DC2626] text-white shadow-md">
            {project.category}
          </span>
          <a
            href={whatsappProjectLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1.5 py-1 px-3 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white text-[10px] font-display tracking-wider uppercase transition-colors border border-white/10 shadow-md"
          >
            <MessageCircle className="w-3 h-3 text-emerald-400" />
            <span className="hidden sm:inline">WhatsApp</span>
          </a>
        </div>

        {/* Video Canvas: Tapping Screen Toggles UI ONLY (Never pauses/plays) */}
        <div
          onClick={() => setShowControls((prev) => !prev)}
          className="relative w-full h-full flex items-center justify-center cursor-pointer touch-manipulation"
        >
          {/* HTML5 Video Element: object-contain prevents any distortion, stretching, or cropping */}
          <video
            ref={videoRef}
            src={videoSrc}
            playsInline
            webkit-playsinline="true"
            disablePictureInPicture
            preload="auto"
            autoPlay
            loop
            muted={isMuted}
            onTimeUpdate={handleTimeUpdate}
            onSeeked={() => {
              if (videoRef.current) {
                lastTimeUpdateRef.current = performance.now();
                setCurrentTime(videoRef.current.currentTime);
              }
            }}
            onLoadedMetadata={() => {
              if (videoRef.current) {
                setDuration(videoRef.current.duration);
              }
            }}
            onPlay={() => {
              setIsPlaying(true);
              setIsBuffering(false);
            }}
            onPause={() => {
              setIsPlaying(false);
              if (videoRef.current) {
                setCurrentTime(videoRef.current.currentTime);
              }
            }}
            onWaiting={() => setIsBuffering(true)}
            onPlaying={() => setIsBuffering(false)}
            onCanPlay={() => setIsBuffering(false)}
            onLoadedData={() => setIsBuffering(false)}
            className="w-full h-full object-contain pointer-events-none"
          >
            <source src={videoSrc} type={videoSrc?.endsWith('.mov') ? 'video/quicktime' : 'video/mp4'} />
            <source src={videoSrc} type="video/mp4" />
            Your browser does not support the video tag.
          </video>

          {/* Subtle Buffering Loading Spinner Overlay */}
          {isBuffering && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/30 pointer-events-none">
              <div className="w-10 h-10 border-[3px] border-white/20 border-t-[#DC2626] rounded-full animate-spin"></div>
            </div>
          )}

          {/* Center Play Button Overlay when Paused (Visible only when showControls is true) */}
          {!isPlaying && !isBuffering && (
            <div
              className={`absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-[1px] transition-opacity duration-300 ${
                showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlay();
                }}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#DC2626] text-white flex items-center justify-center shadow-2xl transform hover:scale-110 active:scale-95 transition-all cursor-pointer"
                aria-label="Play video"
              >
                <Play className="w-8 h-8 sm:w-10 sm:h-10 text-white fill-white ml-1" />
              </button>
            </div>
          )}
        </div>

        {/* NEAT CONTROLS & TIMELINE SCRUBBER BAR: Positioned right at bottom edge */}
        <div
          onClick={(e) => e.stopPropagation()}
          className={`absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-3.5 sm:p-4 flex flex-col gap-2 z-40 ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          } transition-opacity duration-300`}
        >
          {/* Project Title & Clean Meta */}
          <div className="flex items-center justify-between text-white pointer-events-auto">
            <div className="min-w-0 pr-2">
              <h3 className="text-sm sm:text-base font-bold uppercase tracking-wide font-display text-white line-clamp-1 leading-tight">
                {project.title}
              </h3>
              <p className="text-[10px] text-zinc-400 font-mono">
                {project.client} • {project.year}
              </p>
            </div>
          </div>

          {/* Interactive Range Scrubber Seek Bar */}
          <div className="w-full flex items-center pointer-events-auto">
            <input
              type="range"
              min="0"
              max={duration || 100}
              step="0.1"
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#DC2626]"
              aria-label="Video seek scrubber"
            />
          </div>

          {/* Playback Controls Row: Play/Pause, Timestamps, Mute, Fullscreen */}
          <div className="flex items-center justify-between pointer-events-auto text-white">
            {/* Left: Play/Pause Toggle + Formatted Timestamps */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlay();
                }}
                className="w-7 h-7 rounded-full bg-white/15 hover:bg-[#DC2626] flex items-center justify-center text-white transition-colors cursor-pointer active:scale-90"
                aria-label={isPlaying ? 'Pause video' : 'Play video'}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5 fill-white" /> : <Play className="w-3.5 h-3.5 fill-white ml-0.5" />}
              </button>
              <span className="font-mono text-xs text-zinc-400 select-none">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            {/* Right: Audio Mute/Unmute + Fullscreen Buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={toggleMute}
                className="p-1.5 text-white hover:text-[#DC2626] transition-colors cursor-pointer active:scale-90 rounded-lg hover:bg-white/10 flex items-center justify-center"
                aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-white" />}
              </button>
              <button
                onClick={handleFullscreen}
                className="p-1.5 text-white hover:text-[#DC2626] transition-colors cursor-pointer active:scale-90 rounded-lg hover:bg-white/10 flex items-center justify-center"
                aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
