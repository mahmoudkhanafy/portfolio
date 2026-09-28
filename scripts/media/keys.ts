import { createHash } from 'node:crypto';

/** Bump when encoding settings change, so every video is re-encoded once. */
export const VIDEO_PIPELINE_VERSION = 3;
/** Bump when cover/OG rendering changes, so every image is re-rendered once. */
export const IMAGE_PIPELINE_VERSION = 4;

const short = (text: string): string => createHash('sha256').update(text).digest('hex').slice(0, 10);

export const videoKey = (sourceHash: string): string => short(`video:v${VIDEO_PIPELINE_VERSION}:${sourceHash}`);

export const imageKey = (sourceHash: string, cover: number | null, brandHash: string): string =>
  short(`image:v${IMAGE_PIPELINE_VERSION}:${sourceHash}:${cover ?? 'auto'}:${brandHash}`);
