// The script at the top of every page's <head> (src/layouts/Base.astro inlines it, so it runs before
// the first paint). Base.astro drops whole-line // comments and indentation as it inlines it, so every
// page carries only the code: keep comments on lines of their own, never after code or in /* */.
(() => {
  const root = document.documentElement;
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Arriving at a #fragment (#reel-<slug>, #about) jumps there: the page's smooth scrolling is for
  // links within it, so it waits until the page has loaded.
  if (location.hash) {
    root.style.scrollBehavior = 'auto';
    addEventListener('load', () => requestAnimationFrame(() => root.style.removeProperty('scroll-behavior')), { once: true });
  }
  // Text builds like Mahmoud's captions only where JavaScript runs and the visitor allows motion
  // (src/styles/motion.css). If the motion script has not started 4 s in (a failed download), the
  // text is shown plain.
  if (!still && 'IntersectionObserver' in window) {
    root.classList.add('motion');
    setTimeout(() => root.classList.contains('motion-ready') || root.classList.remove('motion'), 4000);
  }

  // The frame glides between a piece in the feed and its page (a cross-document view transition).
  // Only the piece being opened, or returned to, is named as the page changes, and only while it is
  // on screen, so no other frame moves and none flies off screen: .is-gliding on its phone or
  // player, or on its "More work" thumbnail. Slugs are plain ASCII, so paths are compared as they are.
  const slugOf = (url) => {
    if (!url) return null;
    try {
      const address = new URL(url, location.href);
      const match = address.origin === location.origin && /\/work\/([^/?#]+)\//.exec(address.pathname);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  };
  const onScreen = (el) => {
    if (el.getClientRects().length === 0) return false;
    const { top, bottom } = el.getBoundingClientRect();
    return bottom > 0 && top < innerHeight;
  };
  const glide = (slug) => {
    for (const el of document.querySelectorAll('.is-gliding')) el.classList.remove('is-gliding');
    const frame = slug && [...document.querySelectorAll('[data-frame]')].find((el) => el.dataset.frame === slug && onScreen(el));
    if (frame) frame.classList.add('is-gliding');
    return frame ? slug : null;
  };
  // The page being left hands the slug it named to the next one, which names the same piece, so the
  // two sides always pair: Safari 18 has no Navigation API to say where a page came from, and after
  // Back, document.referrer still names the page this one was first opened from.
  const handed = () => {
    try {
      return sessionStorage.getItem('gliding');
    } catch {
      return null;
    }
  };
  const hand = (slug) => {
    try {
      if (slug) sessionStorage.setItem('gliding', slug);
      else sessionStorage.removeItem('gliding');
    } catch {}
  };
  // "All work" comes back to #reel-<slug>: hold the first frame until that piece has arrived, and
  // jump to it before the page is revealed, so its frame glides into its own slot.
  const coming = handed();
  const arriving = coming && !slugOf(location.href) && location.hash === `#reel-${coming}` ? coming : null;
  if (arriving && !still) {
    const expect = document.createElement('link');
    expect.rel = 'expect';
    expect.href = `#reel-${arriving}`;
    expect.setAttribute('blocking', 'render');
    document.head.append(expect);
  }
  let fresh = true;
  let clicked;
  // Where a plain click on a link goes; one that opens another tab or window leaves this page be.
  addEventListener('click', (event) => {
    const link = event.target.closest?.('a[href]');
    if (link) clicked = event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.defaultPrevented ? undefined : link.href;
  });
  addEventListener('pageshow', (event) => event.persisted && (clicked = undefined));
  addEventListener('pageswap', (event) => {
    if (event.viewTransition) hand(glide(slugOf(event.activation?.entry?.url ?? clicked) ?? slugOf(location.href)));
  });
  addEventListener('pagereveal', (event) => {
    // Only on the first reveal: a page restored by Back keeps the scroll it had.
    if (fresh && arriving) document.getElementById(`reel-${arriving}`)?.scrollIntoView({ block: 'start', behavior: 'instant' });
    fresh = false;
    const slug = handed();
    hand(null);
    if (!event.viewTransition) return glide(null);
    glide(slug);
    event.viewTransition.finished.finally(() => glide(null));
  });
})();
