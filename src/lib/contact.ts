import type { Lang } from './urls.ts';

export const CONTACT = {
  phoneE164: '+201156379179',
  phoneDisplay: '+20 115 637 9179',
  whatsappNumber: '201156379179',
  email: 'mahmoud.kh.hanafy@gmail.com',
  instagramUrl: 'https://www.instagram.com/mahmoud_khaled.0/',
  instagramHandle: 'mahmoud_khaled.0',
} as const;

/** wa.me link, optionally with a prefilled message. */
export function whatsappUrl(text?: string): string {
  const base = `https://wa.me/${CONTACT.whatsappNumber}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

/** The message a client sends: general, or about a specific video (title + link so Mahmoud knows which). */
export function whatsappMessage(lang: Lang, work?: { title: string; url: string }): string {
  if (lang === 'en') {
    return work
      ? `Hi Mahmoud, I saw “${work.title}” on your website and I'd like a video like it.\n${work.url}`
      : "Hi Mahmoud, I saw your work on your website and I'd like to talk about a video.";
  }
  return work
    ? `أهلاً يا محمود، شفت فيديو «${work.title}» على موقعك وعايز فيديو زيه.\n${work.url}`
    : 'أهلاً يا محمود، شفت شغلك على موقعك وحابب أتكلم معاك في فيديو.';
}
