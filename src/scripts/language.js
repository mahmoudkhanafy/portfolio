// @ts-check
/*
 * Offers the other language to a visitor whose device reads it and who has not picked one yet: a bar
 * over the bottom of the screen, so nothing on the page moves, written in the language it offers. Not a
 * redirect: search engines read pages as an English browser, and would never see the Arabic.
 *
 * The <head> script (src/scripts/head.js) adds this file once the page has loaded, so it never competes
 * with what the page shows first. It is published as written (plain JavaScript, no imports), and keeps
 * its rule (offerFor) exported for the unit tests.
 */

/** Where the visitor's own pick of language is remembered (localStorage). */
export const CHOSEN_KEY = 'language';

/**
 * The other language to offer on a page, or null. The device's first language the site has decides,
 * and a device in neither reads English; once a visitor has picked a language, the site stops asking.
 * @param {'ar' | 'en'} page
 * @param {readonly string[]} languages
 * @param {string | null} chosen
 * @returns {'ar' | 'en' | null}
 */
export function offerFor(page, languages, chosen) {
  if (chosen || languages.length === 0) return null;
  const known = languages.map((tag) => tag.split('-')[0]?.toLowerCase()).find((code) => code === 'ar' || code === 'en');
  const preferred = known === 'ar' ? 'ar' : 'en';
  return preferred === page ? null : preferred;
}

// The bar's copy, in the language it offers.
const copy = {
  ar: { line: 'الموقع موجود بالعربي كمان', action: 'اقرأه بالعربي', closeLabel: 'اقفل' },
  en: { line: 'This site is in English too', action: 'Read in English', closeLabel: 'Close' },
};

const css = `
.offer {
  position: fixed;
  z-index: 20;
  inset-inline: var(--gutter);
  bottom: max(1rem, env(safe-area-inset-bottom));
  display: flex;
  align-items: center;
  gap: 0.75rem;
  max-width: 30rem;
  margin-inline: auto;
  padding: 0.5rem;
  padding-inline-start: 1.1rem;
  border: 1px solid var(--rule-strong);
  border-radius: var(--radius-frame);
  background: var(--raised);
  box-shadow: 0 1rem 2.5rem rgb(0 0 0 / 0.7);
}
.offer[hidden] {
  display: none;
}
.offer p {
  flex: 1;
  margin: 0;
  color: var(--white);
  font-size: var(--step--1);
  font-weight: 500;
  line-height: 1.4;
}
/* Quiet: gold stays the one primary action, WhatsApp. */
.offer .button--ghost {
  padding-inline: 1.1rem;
  font-size: var(--step--1);
  white-space: nowrap;
}
.offer__close {
  color: var(--dim);
}
.offer__close:hover {
  color: var(--white);
}
@media (prefers-reduced-motion: no-preference) {
  .offer:not([hidden]) {
    animation: offer-in 360ms var(--ease-cut) both;
  }
}
@keyframes offer-in {
  from {
    opacity: 0;
    transform: translateY(1rem);
  }
}
@media print {
  .offer {
    display: none;
  }
}
`;


// Lucide "x", drawn as src/components/Icon.astro draws its icons.
const closeIcon =
  '<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';

/** @param {'ar' | 'en'} lang @param {string} address @param {() => void} onClose */
function showOffer(lang, address, onClose) {
  const { line, action, closeLabel } = copy[lang];
  const style = document.createElement('style');
  style.textContent = css;
  const bar = document.createElement('aside');
  bar.id = 'language-offer';
  bar.className = 'offer';
  bar.lang = lang;
  bar.dir = lang === 'ar' ? 'rtl' : 'ltr';
  bar.setAttribute('aria-label', line);
  const text = document.createElement('p');
  text.textContent = line;
  const link = document.createElement('a');
  link.className = 'button button--ghost';
  link.hreflang = lang;
  link.textContent = action;
  // To the same place on the other page: a #reel-… or #about is the same on both.
  const follow = () => void (link.href = address + location.hash);
  follow();
  addEventListener('hashchange', follow);
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'button button--icon offer__close';
  button.setAttribute('aria-label', closeLabel);
  button.innerHTML = closeIcon;
  button.addEventListener('click', () => {
    onClose();
    bar.hidden = true;
  });
  bar.append(text, link, button);
  document.body.append(style, bar);
}

if (typeof document !== 'undefined') {
  const page = document.documentElement.lang === 'en' ? 'en' : 'ar';
  const other = document.querySelector(`link[rel="alternate"][hreflang="${page === 'ar' ? 'en' : 'ar'}"]`);
  /** @param {string} lang */
  const choose = (lang) => {
    try {
      localStorage.setItem(CHOSEN_KEY, lang);
    } catch {}
  };
  let chosen = null;
  try {
    chosen = localStorage.getItem(CHOSEN_KEY);
  } catch {}
  // Arriving from this page's other language (the language switch, or the bar's own link) picks this one.
  if (other instanceof HTMLLinkElement && document.referrer === other.href) choose((chosen = page));
  // A 404 page names no other version, and offers none.
  const offered = other instanceof HTMLLinkElement && offerFor(page, navigator.languages ?? [navigator.language], chosen);
  if (offered) showOffer(offered, /** @type {HTMLLinkElement} */ (other).href, () => choose(page));
}
