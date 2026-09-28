/**
 * Progressive enhancement for [data-player] frames rendered by Player.astro.
 *
 * - "Play with sound" (a tap anywhere on the frame) creates the <video> inside the same tap, so iOS
 *   allows sound, picks hd or sd, and keeps the cover up until the first frame plays.
 * - In the home feed, the piece in view previews muted on its lightest file (phones, after the first
 *   scroll) or on hover (mouse), unless the visitor prefers reduced motion or saves data.
 * - Stalls or errors on hd switch to sd at the same moment; an end card offers WhatsApp and replay.
 */
import { canPreview, chooseRendition, previewRendition, StallGuard, type RenditionId, type RenditionInfo } from '../lib/player-logic.ts';

interface Rendition extends RenditionInfo {
  src: string;
  height: number;
}

interface Connection {
  saveData?: boolean;
  effectiveType?: string;
  downlink?: number;
}

type Mode = 'idle' | 'preview' | 'watch';

const connection = (navigator as Navigator & { connection?: Connection }).connection;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const touchFirst = matchMedia('(hover: none)');
const players = new Set<Player>();

function pauseAllExcept(keep: Player): void {
  for (const player of players) if (player !== keep) player.pause();
}

class Player {
  readonly root: HTMLElement;
  readonly inFeed: boolean;
  private readonly media: HTMLElement;
  private readonly renditions: Rendition[];
  private readonly title: string;
  private readonly guard = new StallGuard();
  private video: HTMLVideoElement | null = null;
  private current: RenditionId | null = null;
  /** The loaded file was chosen for watching, not only for a muted preview. */
  private chosen = false;
  private mode: Mode = 'idle';
  private started = false;
  private stallTimer = 0;

  constructor(root: HTMLElement) {
    this.root = root;
    // The picture's box: the frame itself, or the part of a phone's screen that eases to whole.
    this.media = root.querySelector<HTMLElement>('.player__media') ?? root;
    this.inFeed = root.closest('[data-reel]') !== null;
    this.renditions = JSON.parse(root.dataset.renditions ?? '[]') as Rendition[];
    this.title = root.dataset.title ?? '';
    this.part('.player__play')?.addEventListener('click', () => this.watch());
    this.part('.player__sound')?.addEventListener('click', () => this.watch());
    this.part('.player__replay')?.addEventListener('click', () => this.replay());
    players.add(this);
  }

  get isWatching(): boolean {
    return this.mode === 'watch' && this.video !== null && !this.video.paused;
  }

  private part<T extends HTMLElement = HTMLElement>(selector: string): T | null {
    return this.root.querySelector<T>(selector);
  }

  private choose(): Rendition {
    const id = chooseRendition(this.renditions, {
      cssWidth: this.root.getBoundingClientRect().width,
      dpr: window.devicePixelRatio || 1,
      net: connection ? { saveData: connection.saveData, effectiveType: connection.effectiveType, downlink: connection.downlink } : undefined,
    });
    return this.renditions.find((r) => r.id === id) ?? this.renditions[0]!;
  }

  private lightest(): Rendition {
    const id = previewRendition(this.renditions);
    return this.renditions.find((r) => r.id === id) ?? this.renditions[0]!;
  }

  private ensureVideo(): HTMLVideoElement {
    if (this.video) return this.video;
    const video = document.createElement('video');
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.preload = 'auto';
    video.setAttribute('aria-label', this.title);
    video.setAttribute('dir', 'ltr');
    video.setAttribute('controlslist', 'nodownload');
    video.addEventListener('playing', () => this.onPlaying());
    video.addEventListener('waiting', () => this.onWaiting());
    video.addEventListener('ended', () => this.onEnded());
    video.addEventListener('error', () => this.onError());
    video.addEventListener('play', () => {
      if (this.mode === 'watch') pauseAllExcept(this);
    });
    this.media.prepend(video);
    this.video = video;
    return video;
  }

  private load(rendition: Rendition): HTMLVideoElement {
    const video = this.ensureVideo();
    if (this.current !== rendition.id) {
      video.src = rendition.src;
      this.current = rendition.id;
      this.started = false;
      this.root.classList.remove('is-live'); // the cover returns until the new file plays
    }
    return video;
  }

  /** Plays from the start with sound. Must run inside the visitor's tap or key press. */
  watch(): void {
    const fromPreview = this.mode === 'preview';
    // A preview ran on the lightest file; watching picks the file for this screen and connection.
    const video = this.chosen ? this.ensureVideo() : this.load(this.choose());
    this.chosen = true;
    this.mode = 'watch';
    this.root.classList.remove('is-previewing', 'is-ended');
    this.root.classList.add('is-watching', 'is-loading');
    this.part('.player__sound')!.hidden = true;
    this.part('.player__end')!.hidden = true;
    this.part('.player__error')!.hidden = true;
    video.loop = false;
    video.muted = false;
    video.controls = true;
    if (fromPreview || video.ended) video.currentTime = 0;
    pauseAllExcept(this);
    // A preview that was already playing fires no new "playing" event, so the resolved play() also ends loading.
    video
      .play()
      .then(() => this.root.classList.remove('is-loading'))
      .catch((error: unknown) => this.onPlayRejected(error));
    this.describeMedia();
    video.focus({ preventScroll: true });
  }

  preview(): void {
    if (this.mode !== 'idle' || [...players].some((p) => p.isWatching)) return;
    const video = this.current ? this.ensureVideo() : this.load(this.lightest());
    video.muted = true;
    video.loop = true;
    video.controls = false;
    this.mode = 'preview';
    this.root.classList.add('is-previewing');
    this.part('.player__sound')!.hidden = false;
    video.play().catch(() => this.stopPreview());
  }

  stopPreview(): void {
    if (this.mode !== 'preview') return;
    this.video?.pause();
    this.mode = 'idle';
    this.root.classList.remove('is-previewing', 'is-live', 'is-loading');
    this.part('.player__sound')!.hidden = true;
  }

  pause(): void {
    if (this.mode === 'preview') this.stopPreview();
    else this.video?.pause();
  }

  replay(): void {
    const video = this.video;
    if (!video) return;
    this.part('.player__end')!.hidden = true;
    this.root.classList.remove('is-ended');
    video.currentTime = 0;
    video.play().catch((error: unknown) => this.onPlayRejected(error));
    video.focus({ preventScroll: true });
  }

  private onPlaying(): void {
    this.root.classList.add('is-live');
    this.root.classList.remove('is-loading');
    this.started = true;
    this.guard.playing();
  }

  private onWaiting(): void {
    // The first buffer fill is not a stall; only count waits once playback has started on hd.
    if (!this.started || this.current !== 'hd' || !this.renditions.some((r) => r.id === 'sd')) return;
    this.guard.waiting(performance.now());
    window.clearTimeout(this.stallTimer);
    this.stallTimer = window.setTimeout(() => this.checkStall(), 2_600);
    this.checkStall();
  }

  private checkStall(): void {
    if (this.current === 'hd' && this.video && !this.video.paused && this.guard.shouldDowngrade(performance.now())) this.downgrade();
  }

  private downgrade(): void {
    const video = this.video;
    const sd = this.renditions.find((r) => r.id === 'sd');
    if (!video || !sd) return;
    const resumeAt = video.currentTime;
    const keepPlaying = this.mode !== 'idle';
    this.current = 'sd';
    this.started = false;
    video.src = sd.src;
    video.addEventListener(
      'loadedmetadata',
      () => {
        if (resumeAt > 0) video.currentTime = resumeAt;
        if (keepPlaying) video.play().catch((error: unknown) => this.onPlayRejected(error));
      },
      { once: true },
    );
  }

  private onError(): void {
    if (this.current === 'hd' && this.renditions.some((r) => r.id === 'sd')) {
      this.downgrade();
      return;
    }
    this.root.classList.remove('is-loading', 'is-previewing');
    if (this.mode === 'preview') {
      this.stopPreview();
      return;
    }
    this.part('.player__error')!.hidden = false;
  }

  private onPlayRejected(error: unknown): void {
    const name = (error as DOMException | undefined)?.name;
    if (name === 'AbortError') return; // a newer src or pause replaced this play() call
    this.root.classList.remove('is-loading');
    // Blocked by the browser: hand over to the native controls so the visitor can press play.
    if (name === 'NotAllowedError') this.root.classList.add('is-live');
  }

  private onEnded(): void {
    if (this.mode !== 'watch') return;
    const video = this.video!;
    const hadFocus = this.root.contains(document.activeElement);
    const end = this.part('.player__end')!;
    this.root.classList.add('is-ended');
    end.hidden = false;
    const status = this.part('.player__status');
    if (status) status.textContent = this.root.dataset.ended ?? '';
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    (video as HTMLVideoElement & { webkitExitFullscreen?: () => void }).webkitExitFullscreen?.();
    if (hadFocus) end.querySelector<HTMLElement>('a, button')?.focus({ preventScroll: true });
  }

  private describeMedia(): void {
    if (!('mediaSession' in navigator) || typeof MediaMetadata === 'undefined') return;
    const artwork = this.root.dataset.artwork;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: this.title,
      artist: this.root.dataset.artist ?? '',
      artwork: artwork ? [{ src: artwork, type: 'image/jpeg' }] : [],
    });
  }
}

const all = [...document.querySelectorAll<HTMLElement>('[data-player]')].map((root) => new Player(root));
const feed = all.filter((player) => player.inFeed);

if (feed.length > 0) {
  let interacted = false;
  const allowed = (): boolean => canPreview({ reducedMotion: reducedMotion.matches, saveData: Boolean(connection?.saveData), interacted });
  const ratios = new Map<Element, number>();
  const byRoot = new Map(feed.map((player) => [player.root as Element, player]));

  // Phones: preview the piece that fills most of the screen.
  const update = (): void => {
    if (!touchFirst.matches) return;
    if (!allowed()) {
      feed.forEach((player) => player.stopPreview());
      return;
    }
    let best: Player | undefined;
    let bestRatio = 0.6;
    for (const [root, ratio] of ratios) {
      if (ratio >= bestRatio) {
        best = byRoot.get(root);
        bestRatio = ratio;
      }
    }
    for (const player of feed) if (player !== best) player.stopPreview();
    best?.preview();
  };

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) ratios.set(entry.target, entry.intersectionRatio);
      update();
    },
    { threshold: [0, 0.3, 0.6, 0.8, 1] },
  );
  feed.forEach((player) => observer.observe(player.root));

  const markInteracted = (): void => {
    if (interacted) return;
    interacted = true;
    update();
  };
  addEventListener('scroll', markInteracted, { passive: true });
  addEventListener('touchstart', markInteracted, { passive: true });

  // Mouse: preview on hover.
  for (const player of feed) {
    player.root.addEventListener('pointerenter', (event) => {
      if (event.pointerType === 'mouse' && canPreview({ reducedMotion: reducedMotion.matches, saveData: Boolean(connection?.saveData), interacted: true })) player.preview();
    });
    player.root.addEventListener('pointerleave', (event) => {
      if (event.pointerType === 'mouse') player.stopPreview();
    });
  }

  reducedMotion.addEventListener('change', update);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) feed.forEach((player) => player.stopPreview());
    else update();
  });
}
