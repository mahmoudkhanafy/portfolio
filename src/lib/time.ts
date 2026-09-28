const pad = (n: number): string => String(n).padStart(2, '0');

/** Seconds → "m:ss" (or "h:mm:ss"), floored so it matches what video players display. */
export function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/** Seconds → SMPTE-style "HH:MM:SS:FF" at the given frame rate. */
export function timecode(seconds: number, fps = 25): string {
  const rate = Math.max(1, Math.round(fps));
  const frames = Math.max(0, Math.floor(seconds * rate + 1e-6));
  const whole = Math.floor(frames / rate);
  return `${pad(Math.floor(whole / 3600))}:${pad(Math.floor((whole % 3600) / 60))}:${pad(whole % 60)}:${pad(frames % rate)}`;
}

/** Seconds → ISO 8601 duration for schema.org, e.g. "PT1M4S" (at least one second). */
export function isoDuration(seconds: number): string {
  const total = Math.max(1, Math.round(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `PT${h ? `${h}H` : ''}${m ? `${m}M` : ''}${s ? `${s}S` : ''}`;
}

const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

/**
 * Reads a time written by hand: 12, 12.5, "1:04", "0:05.5", "1:02:03", also with Arabic-Indic digits.
 * Returns seconds, or null when the value is not a readable time.
 */
export function parseTime(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) && value >= 0 ? value : null;
  if (typeof value !== 'string') return null;
  const text = value.trim().replace(/[٠-٩]/g, (d) => String(ARABIC_DIGITS.indexOf(d)));
  if (!/^\d+(?::\d{1,2}){0,2}(?:\.\d+)?$/.test(text)) return null;
  const parts = text.split(':').map(Number);
  if (parts.slice(1).some((p) => p >= 60)) return null;
  return parts.reduce((acc, p) => acc * 60 + p, 0);
}
