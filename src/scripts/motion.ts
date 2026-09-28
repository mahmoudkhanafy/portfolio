/**
 * Builds headings, feed titles and the services list ([data-build="view"]) as they come into view, the
 * way Mahmoud's reels build captions: .is-building, and src/styles/motion.css pops the words on in
 * turn. Whatever is already on screen as this starts shows at once (.is-built), so arriving back at a
 * piece shows it as it was; anything keyboard focus reaches first builds at once. Runs only where the
 * <head> script allowed motion (html.motion), and marks that it started (html.motion-ready).
 */
const root = document.documentElement;
const TATWEEL = '\u0640';

/**
 * Stretches a word with kashida as it pops on, then relaxes it, like the key words in his captions.
 * A copy laid over the word (.w__stretch) draws the stretch into the room after it, still empty
 * because the next word waits for it; the word keeps its width, so nothing on the page moves.
 * Skipped when this starts after the word has appeared, or when the line has too little room left.
 */
function stretchWhenShown(word: HTMLElement): void {
  const text = word.textContent ?? '';
  const at = Number(word.dataset.kashida);
  word.addEventListener(
    'animationstart',
    () => {
      const box = word.offsetParent;
      if (!(box instanceof HTMLElement)) return;
      const copy = document.createElement('span');
      copy.className = 'w__stretch';
      const show = (n: number): void => {
        copy.textContent = text.slice(0, at) + TATWEEL.repeat(n) + text.slice(at);
      };
      show(6);
      word.append(copy);
      const perKashida = (copy.offsetWidth - word.offsetWidth) / 6;
      const room = getComputedStyle(word).direction === 'rtl' ? word.offsetLeft : box.clientWidth - word.offsetLeft - word.offsetWidth;
      const most = perKashida > 0 ? Math.min(6, Math.floor(room / perKashida)) : 0;
      if (most < 2) return void copy.remove();
      show(0);
      word.classList.add('is-stretching');
      // Out one kashida at a time as the pop lands, a beat, then back: about 600 ms in all.
      for (let n = 1; n <= most; n++) setTimeout(() => show(n), 110 + (n - 1) * 36);
      for (let n = most - 1; n >= 0; n--) setTimeout(() => show(n), 340 + (most - 1 - n) * 50);
      setTimeout(() => {
        copy.remove();
        word.classList.remove('is-stretching');
      }, 340 + most * 50);
    },
    { once: true },
  );
}

function start(): void {
  root.classList.add('motion-ready');
  const seen = new WeakSet<Element>();
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const first = !seen.has(entry.target);
        seen.add(entry.target);
        if (!entry.isIntersecting) continue;
        if (first) build(entry.target, 'is-built');
        // A build starts once the text is whole on screen, or, for text too tall for that, once it is
        // 15% of the screen in; never at its first pixel, and never left waiting at the bottom edge.
        else if (entry.intersectionRatio > 0.99 || entry.boundingClientRect.top < (entry.rootBounds?.height ?? innerHeight) * 0.85) build(entry.target, 'is-building');
      }
    },
    { threshold: [0, 0.25, 0.5, 0.75, 1] },
  );
  const build = (el: Element, state: 'is-built' | 'is-building'): void => {
    if (el.classList.contains('is-built') || el.classList.contains('is-building')) return;
    el.classList.add(state);
    observer.unobserve(el);
  };
  for (const el of document.querySelectorAll('[data-build="view"]')) observer.observe(el);
  addEventListener('focusin', (event) => {
    const el = (event.target as Element | null)?.closest?.('[data-build="view"]');
    if (el) build(el, 'is-building');
  });
  const stretched = document.querySelector<HTMLElement>('.w[data-kashida]');
  if (stretched) stretchWhenShown(stretched);
}

if (root.classList.contains('motion')) start();

/*
 * A page translator rewrites a line in place; html.translated then shows each line whole (motion.css).
 * Chrome marks <html> itself, this catches the others (Safari, Firefox, Edge). The kashida copy
 * (.w__stretch) is this script's own. Watches with or without motion: the words are spans either way.
 */
const ours = (node: Node): boolean => node instanceof Element && node.classList.contains('w__stretch');
const translator = new MutationObserver((records) => {
  const rewritten = records.some((record) => {
    const at = record.target instanceof Element ? record.target : record.target.parentElement;
    if (at?.closest('.w__stretch')) return false;
    return record.type === 'characterData' || ![...record.addedNodes, ...record.removedNodes].every(ours);
  });
  if (!rewritten) return;
  root.classList.add('translated');
  translator.disconnect();
});
for (const words of document.querySelectorAll('.words')) {
  translator.observe(words.parentElement ?? words, { subtree: true, childList: true, characterData: true });
}
