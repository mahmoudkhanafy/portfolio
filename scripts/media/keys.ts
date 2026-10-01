import { createHash } from 'node:crypto';

/** Bump when encoding settings change, so every video is re-encoded once. */
export const VIDEO_PIPELINE_VERSION = 3;
/** Bump when cover or still rendering changes, so every image is re-rendered once. (Link-preview cards
    re-render on their own when their design changes: scripts/media/og.ts.) */
export const IMAGE_PIPELINE_VERSION = 6;

const short = (text: string): string => createHash('sha256').update(text).digest('hex').slice(0, 10);

export const videoKey = (sourceHash: string): string => short(`video:v${VIDEO_PIPELINE_VERSION}:${sourceHash}`);

export const imageKey = (sourceHash: string, cover: number | null): string => short(`image:v${IMAGE_PIPELINE_VERSION}:${sourceHash}:${cover ?? 'auto'}`);
