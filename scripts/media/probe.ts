import { displaySize } from './ladder.ts';

export interface Probe {
  /** Display size (pixel shape and rotation applied). */
  width: number;
  height: number;
  rotation: number;
  duration: number;
  fps: number;
  hasAudio: boolean;
  transfer: string | null;
  bitrate: number | null;
  codec: string | null;
  /** Bits per second of the video stream alone, when known or estimable. */
  videoBitrate: number | null;
}

interface RawStream {
  codec_type?: string;
  codec_name?: string;
  bit_rate?: string;
  width?: number;
  height?: number;
  sample_aspect_ratio?: string;
  avg_frame_rate?: string;
  r_frame_rate?: string;
  duration?: string;
  color_transfer?: string;
  disposition?: { attached_pic?: number };
  tags?: { rotate?: string };
  side_data_list?: Array<{ rotation?: number }>;
}

interface RawProbe {
  streams?: RawStream[];
  format?: { duration?: string; bit_rate?: string };
}

/** "30000/1001" → 29.97; "0/0" or missing → 0. */
function frameRate(value: string | undefined): number {
  if (!value) return 0;
  const [num, den] = value.split('/').map(Number);
  return num && den ? num / den : 0;
}

/** A pixel's width over its height: "9:16" → 0.5625; "0:1" (unknown), "N/A" or missing → 1. */
function pixelAspect(value: string | undefined): number {
  const [num, den] = (value ?? '').split(':').map(Number);
  return num && den && num > 0 && den > 0 ? num / den : 1;
}

/** Reads `ffprobe -show_streams -show_format -of json` output. */
export function parseProbe(json: unknown): Probe {
  const data = (json ?? {}) as RawProbe;
  const streams = data.streams ?? [];
  const video = streams.find((s) => s.codec_type === 'video' && s.disposition?.attached_pic !== 1 && s.width && s.height);
  if (!video?.width || !video.height) throw new Error('No video stream found');

  const matrixRotation = video.side_data_list?.find((d) => typeof d.rotation === 'number')?.rotation;
  const rotation = matrixRotation ?? (Number(video.tags?.rotate ?? 0) || 0);
  const duration = Number(data.format?.duration ?? video.duration);
  if (!Number.isFinite(duration) || duration <= 0) throw new Error('The video has no usable duration');
  const bitrate = Number(data.format?.bit_rate);
  const total = Number.isFinite(bitrate) && bitrate > 0 ? bitrate : null;
  const own = Number(video.bit_rate);
  const audio = streams.filter((s) => s.codec_type === 'audio').reduce((sum, s) => sum + (Number(s.bit_rate) || 128_000), 0);
  const videoBitrate = Number.isFinite(own) && own > 0 ? own : total !== null ? Math.max(0, total - audio) || null : null;

  return {
    ...displaySize({ width: video.width, height: video.height }, rotation, pixelAspect(video.sample_aspect_ratio)),
    rotation,
    duration,
    fps: frameRate(video.avg_frame_rate) || frameRate(video.r_frame_rate) || 30,
    hasAudio: streams.some((s) => s.codec_type === 'audio'),
    transfer: video.color_transfer ?? null,
    bitrate: total,
    codec: video.codec_name ?? null,
    videoBitrate,
  };
}

/** HLG (phones) and PQ (HDR10) need tone-mapping to look right as SDR H.264. */
export const isHdr = (probe: Probe): boolean => probe.transfer === 'arib-std-b67' || probe.transfer === 'smpte2084';
