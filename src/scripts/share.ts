/**
 * [data-share] buttons: the system share sheet where there is one (phones, WhatsApp's browser),
 * otherwise copy the link. Buttons stay hidden when neither works.
 */
const announcer = document.getElementById('announcer');

for (const button of document.querySelectorAll<HTMLButtonElement>('button[data-share]')) {
  const url = button.dataset.share ?? location.href;
  const title = button.dataset.shareTitle ?? document.title;
  const canShare = typeof navigator.share === 'function';
  const canCopy = typeof navigator.clipboard?.writeText === 'function';
  if (!canShare && !canCopy) continue;
  button.hidden = false;

  button.addEventListener('click', async () => {
    if (canShare) {
      try {
        await navigator.share({ title, url });
        return;
      } catch (error) {
        if ((error as DOMException).name === 'AbortError') return;
      }
    }
    if (!canCopy) return;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      return;
    }
    const message = button.dataset.copied ?? '';
    button.classList.add('is-copied');
    button.setAttribute('data-feedback', message);
    if (announcer) {
      announcer.textContent = '';
      requestAnimationFrame(() => (announcer.textContent = message));
    }
    window.setTimeout(() => {
      button.classList.remove('is-copied');
      button.removeAttribute('data-feedback');
    }, 2200);
  });
}
