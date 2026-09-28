export type RenditionId = 'hd' | 'sd';

export interface RenditionInfo {
  id: RenditionId;
  width: number;
  /** Average bits per second. */
  bitrate: number;
}

/** What the browser reveals about the connection (Network Information API; absent on iOS). */
export interface NetworkHints {
  saveData?: boolean;
  effectiveType?: string;
  /** Estimated Mb/s. */
  downlink?: number;
}

const SLOW = ['slow-2g', '2g', '3g'];

/**
 * sd when the visitor saves data, the connection is slow, or the frame is small enough that
 * sd already looks sharp; otherwise hd. Stalls later switch hd to sd (see StallGuard).
 */
export function chooseRendition(renditions: RenditionInfo[], ctx: { cssWidth: number; dpr: number; net?: NetworkHints }): RenditionId {
  const hd = renditions.find((r) => r.id === 'hd');
  const sd = renditions.find((r) => r.id === 'sd');
  if (!sd) return 'hd';
  if (!hd) return 'sd';
  const net = ctx.net ?? {};
  if (net.saveData) return 'sd';
  if (net.effectiveType && SLOW.includes(net.effectiveType)) return 'sd';
  if (typeof net.downlink === 'number' && net.downlink > 0 && net.downlink * 1e6 * 0.7 < hd.bitrate) return 'sd';
  const needed = ctx.cssWidth * Math.min(3, Math.max(1, ctx.dpr));
  return needed <= sd.width * 1.15 ? 'sd' : 'hd';
}

/**
 * The file a muted preview plays: the lightest one. Previews start as the visitor scrolls past, so
 * sharpness nobody is watching yet shouldn't cost their data; "play with sound" chooses again.
 */
export function previewRendition(renditions: RenditionInfo[]): RenditionId {
  return renditions.reduce((light, r) => (r.bitrate < light.bitrate ? r : light)).id;
}

/**
 * Watches playback for stalls: one stall longer than `maxStallMs`, or `maxWaits` stalls within
 * `windowMs`, means the connection cannot keep up and the lighter rendition should take over.
 */
export class StallGuard {
  private readonly maxStallMs: number;
  private readonly maxWaits: number;
  private readonly windowMs: number;
  private waits: number[] = [];
  private stalledSince: number | null = null;

  constructor(opts: { maxStallMs?: number; maxWaits?: number; windowMs?: number } = {}) {
    this.maxStallMs = opts.maxStallMs ?? 2_500;
    this.maxWaits = opts.maxWaits ?? 3;
    this.windowMs = opts.windowMs ?? 20_000;
  }

  waiting(now: number): void {
    this.stalledSince ??= now;
    this.waits.push(now);
  }

  playing(): void {
    this.stalledSince = null;
  }

  shouldDowngrade(now: number): boolean {
    this.waits = this.waits.filter((t) => now - t <= this.windowMs);
    if (this.stalledSince !== null && now - this.stalledSince >= this.maxStallMs) return true;
    return this.waits.length >= this.maxWaits;
  }
}

/** Muted previews move and spend data, so they wait for the visitor and respect their settings. */
export function canPreview(ctx: { reducedMotion: boolean; saveData: boolean; interacted: boolean }): boolean {
  return ctx.interacted && !ctx.reducedMotion && !ctx.saveData;
}
