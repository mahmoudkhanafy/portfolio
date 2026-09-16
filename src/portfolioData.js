/**
 * MAHMOUD KHALED — PORTFOLIO DATA CONFIGURATION
 * 
 * Standalone media and content hub.
 * To update projects, metrics, services, or links, simply edit this file.
 * The UI automatically reflects changes made here.
 */

const base = import.meta.env.BASE_URL || '/';
export const getAssetUrl = (path) => `${base}${path.replace(/^\//, '')}`;

export const personalInfo = {
  name: "Mahmoud Khaled",
  title: "Video Editor & Videographer",
  tagline: "Crafting High-Retention Visual Stories & Cinematic Experiences",
  shortBio: "Specializing in commercial short-form content, viral retention strategies (Reels / TikTok), motion design, high-contrast editorial color grading, and professional video production. Based in Egypt, collaborating with creators, agencies, and brands.",
  location: "Giza / Cairo, Egypt • Available Across Egypt",
  whatsappUrl: "https://wa.me/201156379179",
  phoneNumber: "+20 115 637 9179",
  phoneUrl: "tel:+201156379179",
  email: "mahmoud.kh.hanafy@gmail.com",
  instagramUrl: "https://www.instagram.com/mahmoud_khaled.0?stkn=cTk0c3h0ODh3ZWts&utm_source=qr",
  heroPortrait: getAssetUrl("mahmoud.png"), // Served from public/ or root
  availability: "AVAILABLE FOR SELECT PROJECTS — 2026"
};

export const metrics = [
  {
    value: "1+",
    label: "Years of Experience",
    subtext: "Focused on short-form & Reels editing"
  },
  {
    value: "+30",
    label: "Completed Projects",
    subtext: "Crafted for creators & local businesses"
  },
  {
    value: "+2M",
    label: "Views Generated",
    subtext: "Across TikTok, Instagram Reels, and YouTube Shorts"
  }
];

export const services = [
  {
    number: "01",
    title: "Short-Form Video Editing (TikTok / Reels)",
    description: "Algorithmic pacing, 3-second hook retention, kinetic captions, seamless jump-cuts, and psychological sound design calibrated for maximum platform distribution.",
    deliverables: ["9:16 Vertical Master", "Subtitles / Captions", "Sound FX & Audio Mix", "Platform Optimization"],
    tag: "HIGH RETENTION"
  },
  {
    number: "02",
    title: "Commercial & Brand Promos",
    description: "High-impact narrative editing that elevates brand prestige. Premium rhythm, bespoke pacing, and editorial motion designed to convert viewers into clients.",
    deliverables: ["16:9 & 9:16 Deliverables", "Story & Script Sync", "Licensed Soundtrack Mix", "Revision Rounds"],
    tag: "BRAND PRESTIGE"
  },
  {
    number: "03",
    title: "Motion Graphics & Title Animation",
    description: "Kinetic typography, 3D track-ins, sleek lower thirds, editorial callouts, and UI animations that provide polished visual hierarchy.",
    deliverables: ["After Effects Renders", "Custom HUDs / Overlays", "Clean Graphic Elements", "Alpha Channel Assets"],
    tag: "VISUAL POLISH"
  },
  {
    number: "04",
    title: "Advanced Color Grading & Audio Engineering",
    description: "Transforming flat Log profiles (S-Log3, C-Log, D-Log) into rich cinematic Rec.709 film emulsions with precision skin tone preservation, multi-band audio cleaning, and deep impact bass.",
    deliverables: ["Color Space Transform", "Film Emulation LUTs", "Vocal De-Noise & Master", "SFX Layering"],
    tag: "COLOR & SOUND"
  },
  {
    number: "05",
    title: "On-Location Videography & Shooting",
    description: "Hands-on cinematography with gimbal stability, cinematic framing, dynamic camera movement, and on-set creative direction for brands and commercial shoots in Egypt.",
    deliverables: ["4K 10-bit Raw Capture", "Gimbal & Handheld Movement", "Lighting & Mic Setup", "Creative Shotlist"],
    tag: "PRODUCTION"
  }
];

export const toolkit = [
  { name: "Adobe Premiere Pro", category: "NLE Master", proficiency: "Expert", icon: "Premiere" },
  { name: "DaVinci Resolve", category: "Color & Grading", proficiency: "Advanced", icon: "DaVinci" },
  { name: "Adobe After Effects", category: "Motion & VFX", proficiency: "Advanced", icon: "AfterEffects" },
  { name: "Adobe Photoshop", category: "Thumbnails & Asset Design", proficiency: "Proficient", icon: "Photoshop" },
  { name: "Canva", category: "Rapid Graphic Layouts", proficiency: "Fast Turnaround", icon: "Canva" }
];

export const projects = [
  {
    id: 1,
    title: "High-Retention Fitness Reel",
    category: "Reels / TikTok",
    aspectRatio: "9/16",
    metrics: "+480K Views",
    tagline: "Dynamic hook structure with high completion rate and sound design.",
    client: "Fitness & Athlete Coaching",
    description: "Rapid beat-synchronized cutting, sound effects with custom risers, kinetic subtitle typography, and punch-in reframing tailored for maximum engagement on Instagram Reels and TikTok.",
    videoUrl: getAssetUrl("videos/reel1.mp4"),
    previewVideoUrl: getAssetUrl("videos/reel1.mp4"),
    fullVideoUrl: getAssetUrl("videos/reel1.mp4"),
    thumbnailUrl: getAssetUrl("thumbnails/reel1.jpg"),
    tags: ["9:16 Reel", "Hook Retention", "Sound Design", "Fitness"],
    year: "2026"
  },
  {
    id: 2,
    title: "Creator Educational & Hook Architecture",
    category: "Reels / TikTok",
    aspectRatio: "9/16",
    metrics: "+620K Views",
    tagline: "Fast-paced visual storytelling engineered for authority and retention.",
    client: "Digital Creator & Personal Brand",
    description: "Constructed with punch-ins, kinetic typography, B-roll overlays, and spatial audio cues to maintain viewer retention past the critical 3-second window.",
    videoUrl: getAssetUrl("videos/reel2.mp4"),
    previewVideoUrl: getAssetUrl("videos/reel2.mp4"),
    fullVideoUrl: getAssetUrl("videos/reel2.mp4"),
    thumbnailUrl: getAssetUrl("thumbnails/reel2.jpg"),
    tags: ["Reels / TikTok", "Hook Strategy", "Motion Graphics"],
    year: "2026"
  },
  {
    id: 3,
    title: "Commercial Brand Talking Head",
    category: "Reels / TikTok",
    aspectRatio: "9/16",
    metrics: "+340K Views",
    tagline: "High-converting corporate talking-head with crisp graphics and pacing.",
    client: "Commercial Agency & Brand",
    description: "Professional audio mastering, multi-angle jump cuts, seamless visual popups, and branded typography that elevates educational and commercial presentations.",
    videoUrl: getAssetUrl("videos/reel3.mp4"),
    previewVideoUrl: getAssetUrl("videos/reel3.mp4"),
    fullVideoUrl: getAssetUrl("videos/reel3.mp4"),
    thumbnailUrl: getAssetUrl("thumbnails/reel3.jpg"),
    tags: ["Brand Promo", "Talking Head", "Audio Polish"],
    year: "2026"
  },
  {
    id: 4,
    title: "Event & Institutional Coverage",
    category: "Reels / TikTok",
    aspectRatio: "9/16",
    metrics: "+290K Views",
    tagline: "Atmospheric on-ground event highlights with cinematic color pass.",
    client: "Cultural & Corporate Event",
    description: "Dynamic speed ramps, stabilizer passes, bespoke sound design, and color grading turning on-site footage into an engaging recap video.",
    videoUrl: getAssetUrl("videos/reel4.mov"),
    previewVideoUrl: getAssetUrl("videos/reel4.mov"),
    fullVideoUrl: getAssetUrl("videos/reel4.mov"),
    thumbnailUrl: getAssetUrl("thumbnails/reel4.jpg"),
    tags: ["Event Highlight", "Color Pass", "Speed Ramps"],
    year: "2026"
  },
  {
    id: 5,
    title: "Dynamic Lifestyle & Social Cut",
    category: "Reels / TikTok",
    aspectRatio: "9/16",
    metrics: "+510K Views",
    tagline: "Fast, rhythmic social media edit with organic transitions.",
    client: "Lifestyle & Social Brand",
    description: "Rhythmic cuts synchronized to music pulses, sound effects layering, and vibrant color grading designed to capture attention in the feed.",
    videoUrl: getAssetUrl("videos/reel5.mp4"),
    previewVideoUrl: getAssetUrl("videos/reel5.mp4"),
    fullVideoUrl: getAssetUrl("videos/reel5.mp4"),
    thumbnailUrl: getAssetUrl("thumbnails/reel5.jpg"),
    tags: ["Lifestyle", "Rhythm Cut", "Social Media"],
    year: "2026"
  },
  {
    id: 6,
    title: "Cinematic Commercial & Production Film",
    category: "Cinematic & Commercial",
    aspectRatio: "16/9",
    metrics: "+180K Views",
    tagline: "Wide-aspect commercial hero promo with high-dynamic range color grading.",
    client: "Commercial Production & Film",
    description: "Cinematic 16:9 widescreen showcase featuring cinematic color grading, rich orchestral sound mixing, and seamless pacing for broadcast and YouTube.",
    videoUrl: getAssetUrl("videos/cinematic1.mp4"),
    previewVideoUrl: getAssetUrl("videos/cinematic1.mp4"),
    fullVideoUrl: getAssetUrl("videos/cinematic1.mp4"),
    thumbnailUrl: getAssetUrl("thumbnails/cinematic1.jpg"),
    tags: ["16:9 Cinematic", "Color Grading", "Sound Mix"],
    year: "2026"
  }
];

export const editorialQuotes = [
  {
    quote: "A great cut is not noticed for its transition, but felt through its rhythm.",
    author: "Mahmoud Khaled"
  }
];
