export interface Size {
  width: number;
  height: number;
}

export interface RenditionPlan {
  id: 'hd' | 'sd';
  width: number;
  height: number;
  crf: number;
  maxrateKbps: number;
  bufsizeKbps: number;
  audioKbps: number;
  fpsMax: number;
}

/** Floors to an even number (H.264 4:2:0 needs even sizes); the epsilon absorbs float error like 719.9999. */
export const even = (n: number): number => Math.max(2, 2 * Math.floor((n + 1e-6) / 2));

const clamp = (value: number, low: number, high: number): number => Math.min(high, Math.max(low, value));

/**
 * The size a player shows: the stored pixels at their true shape, then quarter-turn rotations applied.
 * Non-square pixels (a 9:16 video squeezed into 1080×1080, HDV, DV) are stretched along the squeezed
 * side, so no stored detail is thrown away.
 */
export function displaySize(coded: Size, rotation = 0, pixelAspect = 1): Size {
  const shaped =
    pixelAspect >= 1
      ? { width: Math.round(coded.width * pixelAspect), height: coded.height }
      : { width: coded.width, height: Math.round(coded.height / pixelAspect) };
  const quarterTurn = Math.abs(Math.round(rotation / 90)) % 2 === 1;
  return quarterTurn ? { width: shaped.height, height: shaped.width } : shaped;
}

function fit(src: Size, shortMax: number, longMax: number): Size {
  const scale = Math.min(1, shortMax / Math.min(src.width, src.height), longMax / Math.max(src.width, src.height));
  return { width: even(src.width * scale), height: even(src.height * scale) };
}

/** What the upload itself spent on video: re-encoding can't add detail, so it shouldn't add bits. */
export interface SourceRate {
  videoKbps: number | null;
  codec: string | null;
}

/** HEVC, AV1 and VP9 pack more quality per bit than H.264, so their H.264 copy needs more room. */
const EFFICIENT_CODECS = ['hevc', 'h265', 'av1', 'vp9'];

/**
 * Two progressive MP4s per video: "hd" (1080 class) and "sd" (720 class) for slow networks.
 * Sources already at or below 720 get a single rendition. With the source bitrate known, hd is capped
 * near it (×1.15 for H.264, ×1.6 for newer codecs) and sd at 60% of hd.
 */
export function planRenditions(src: Size, source?: SourceRate): RenditionPlan[] {
  const hdSize = fit(src, 1080, 1920);
  const hdLadder = clamp(Math.round(((hdSize.width * hdSize.height) / 1000) * 3.5), 1500, 6000);
  const factor = EFFICIENT_CODECS.includes((source?.codec ?? '').toLowerCase()) ? 1.6 : 1.15;
  const hdRate = source?.videoKbps ? Math.min(hdLadder, Math.max(600, Math.round(source.videoKbps * factor))) : hdLadder;
  const hd: RenditionPlan = { id: 'hd', ...hdSize, crf: 21, maxrateKbps: hdRate, bufsizeKbps: hdRate * 2, audioKbps: 128, fpsMax: 60 };
  const sdSize = fit(src, 720, 1280);
  if (sdSize.width === hdSize.width && sdSize.height === hdSize.height) return [hd];
  const sdLadder = clamp(Math.round(((sdSize.width * sdSize.height) / 1000) * 3), 800, 2500);
  const sdRate = source?.videoKbps ? Math.min(sdLadder, Math.max(400, Math.round(hdRate * 0.6))) : sdLadder;
  return [hd, { id: 'sd', ...sdSize, crf: 23, maxrateKbps: sdRate, bufsizeKbps: sdRate * 2, audioKbps: 96, fpsMax: 30 }];
}
