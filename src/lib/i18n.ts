import type { Lang } from './urls.ts';
import type { Caption } from './words.ts';

export type WorkType = 'reel' | 'event' | 'brand' | 'film';
export const WORK_TYPES: readonly WorkType[] = ['reel', 'event', 'brand', 'film'];

const TYPE_LABELS: Record<WorkType, Record<Lang, string>> = {
  reel: { ar: 'ريل', en: 'Reel' },
  event: { ar: 'تغطية فعالية', en: 'Event' },
  brand: { ar: 'براند', en: 'Brand' },
  film: { ar: 'سينمائي', en: 'Film' },
};

export function typeLabel(type: WorkType, lang: Lang): string {
  return TYPE_LABELS[type][lang];
}

/** "6 فيديوهات" / "6 videos", following Arabic plural forms. */
export function videoCount(n: number, lang: Lang): string {
  if (lang === 'en') return `${n} ${n === 1 ? 'video' : 'videos'}`;
  switch (new Intl.PluralRules('ar').select(n)) {
    case 'one':
      return 'فيديو واحد';
    case 'two':
      return 'فيديوهين';
    case 'few':
      return `${n} فيديوهات`;
    default:
      return `${n} فيديو`;
  }
}

export interface Strings {
  skip: string;
  name: string;
  role: string;
  place: string;
  heroCaption: Caption;
  switchLabel: string;
  switchName: string;
  whatsapp: string;
  instagram: string;
  seeWork: string;
  workHeading: string;
  playWithSound: string;
  playLabel: (title: string, duration: string) => string;
  tapForSound: string;
  videoPage: string;
  messageAbout: string;
  replay: string;
  ended: string;
  playError: string;
  openFile: string;
  allWork: string;
  forClient: (client: string) => string;
  share: string;
  copyLink: string;
  copied: string;
  moreWork: string;
  likeThis: string;
  aboutHeading: string;
  about: string;
  servicesHeading: string;
  services: string[];
  toolsHeading: string;
  contactHeading: Caption;
  contactLead: string;
  call: string;
  email: string;
  saveContact: string;
  homeTitle: string;
  homeDescription: string;
  workTitle: (title: string) => string;
  workFallbackDescription: string;
  portraitAlt: string;
  ogHomeAlt: string;
  ogWorkAlt: (title: string) => string;
  notFoundTitle: string;
  notFoundBody: string;
  backHome: string;
  rights: (year: number) => string;
}

export const TOOLS = ['Premiere Pro', 'After Effects', 'DaVinci Resolve', 'Photoshop'] as const;

export const ui: Record<Lang, Strings> = {
  ar: {
    skip: 'انتقل للمحتوى',
    name: 'محمود خالد',
    role: 'مونتير ومصوّر فيديو',
    place: 'الجيزة، القاهرة',
    heroCaption: { text: 'مونتاج ريلز، كتابة متحركة، تغطية فعاليات وبراندات', key: 'كتابة متحركة', stretch: 'متحركة' },
    switchLabel: 'Read this site in English',
    switchName: 'English',
    whatsapp: 'كلّمني على واتساب',
    instagram: 'إنستجرام',
    seeWork: 'شوف الشغل',
    workHeading: 'الشغل',
    playWithSound: 'شغّل بالصوت',
    playLabel: (title, duration) => `شغّل بالصوت: «${title}»، مدته ${duration}`,
    tapForSound: 'اضغط للصوت',
    videoPage: 'صفحة الفيديو',
    messageAbout: 'كلّمني عن فيديو زي ده',
    replay: 'شغّله تاني',
    ended: 'الفيديو خلص',
    playError: 'الفيديو ده مش راضي يشتغل هنا.',
    openFile: 'افتح ملف الفيديو',
    allWork: 'كل الشغل',
    forClient: (client) => `لـ ${client}`,
    share: 'شارك الفيديو',
    copyLink: 'انسخ اللينك',
    copied: 'اتنسخ اللينك',
    moreWork: 'شغل تاني',
    likeThis: 'عايز فيديو زي ده؟',
    aboutHeading: 'عنّي',
    about:
      'أنا محمود، مونتير ومصوّر فيديو من الجيزة. بعمل مونتاج ريلز لصنّاع المحتوى بكتابة متحركة بالعربي والإنجليزي، وبغطّي الفعاليات وتفعيلات البراندات، وبعمل قطع سينمائية قصيرة.',
    servicesHeading: 'بعمل إيه',
    services: ['مونتاج ريلز وفيديوهات قصيرة', 'كتابة متحركة وموشن جرافيك', 'تغطية فعاليات وتفعيلات براندات', 'تلوين وتصحيح ألوان'],
    toolsHeading: 'بشتغل على',
    contactHeading: { text: 'يلا نشتغل سوا', key: 'سوا' },
    contactLead: 'ابعتلي فكرتك على واتساب، أو اختار الطريقة اللي تريحك.',
    call: 'اتصل بيا',
    email: 'ابعت إيميل',
    saveContact: 'احفظ رقمي',
    homeTitle: 'محمود خالد — مونتير ومصوّر فيديو في الجيزة',
    homeDescription: 'مونتاج ريلز بكتابة متحركة، تغطية فعاليات وبراندات، وقطع سينمائية قصيرة. شوف الشغل وكلّمني على واتساب.',
    workTitle: (title) => `${title} — محمود خالد`,
    workFallbackDescription: 'فيديو من شغل محمود خالد، مونتير ومصوّر فيديو في الجيزة.',
    portraitAlt: 'محمود خالد، لابس بدلة سودة ومربّع إيديه',
    ogHomeAlt: 'محمود خالد، مونتير ومصوّر فيديو',
    ogWorkAlt: (title) => `لقطة من «${title}»`,
    notFoundTitle: 'الصفحة دي مش موجودة',
    notFoundBody: 'يمكن اللينك اتغيّر أو اتكتب غلط.',
    backHome: 'ارجع لشغل محمود',
    rights: (year) => `© ${year} محمود خالد`,
  },
  en: {
    skip: 'Skip to content',
    name: 'Mahmoud Khaled',
    role: 'Video editor & videographer',
    place: 'Giza, Cairo',
    heroCaption: { text: 'Reels, kinetic captions, events and brands', key: 'kinetic captions' },
    switchLabel: 'اقرأ الموقع باللغة العربية',
    switchName: 'العربية',
    whatsapp: 'Message me on WhatsApp',
    instagram: 'Instagram',
    seeWork: 'See the work',
    workHeading: 'Work',
    playWithSound: 'Play with sound',
    playLabel: (title, duration) => `Play with sound: “${title}”, ${duration} long`,
    tapForSound: 'Tap for sound',
    videoPage: 'Video page',
    messageAbout: 'Message me about one like this',
    replay: 'Replay',
    ended: 'Video ended',
    playError: "This video won't play here.",
    openFile: 'Open the video file',
    allWork: 'All work',
    forClient: (client) => `For ${client}`,
    share: 'Share this video',
    copyLink: 'Copy link',
    copied: 'Link copied',
    moreWork: 'More work',
    likeThis: 'Want a video like this?',
    aboutHeading: 'About',
    about:
      "I'm Mahmoud, a video editor and videographer based in Giza. I edit reels for content creators with Arabic and English kinetic captions, cover events and brand activations, and make short cinematic pieces.",
    servicesHeading: 'What I do',
    services: ['Reel and short-form editing', 'Kinetic captions and motion graphics', 'Event and brand-activation coverage', 'Colour grading'],
    toolsHeading: 'Tools',
    contactHeading: { text: "Let's work together", key: 'together' },
    contactLead: 'Send me your idea on WhatsApp, or pick whichever way suits you.',
    call: 'Call me',
    email: 'Send an email',
    saveContact: 'Save my contact',
    homeTitle: 'Mahmoud Khaled — Video editor & videographer in Giza',
    homeDescription: 'Reels with kinetic captions, event and brand coverage, short cinematic pieces. Watch the work and message me on WhatsApp.',
    workTitle: (title) => `${title} — Mahmoud Khaled`,
    workFallbackDescription: 'A video by Mahmoud Khaled, video editor and videographer in Giza.',
    portraitAlt: 'Mahmoud Khaled in a black suit, arms crossed',
    ogHomeAlt: 'Mahmoud Khaled, video editor and videographer',
    ogWorkAlt: (title) => `A frame from “${title}”`,
    notFoundTitle: "This page doesn't exist",
    notFoundBody: 'The link may have changed or been mistyped.',
    backHome: "Back to Mahmoud's work",
    rights: (year) => `© ${year} Mahmoud Khaled`,
  },
};
