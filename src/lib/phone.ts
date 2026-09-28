/**
 * The phone frame vertical reels stand in on wider screens (spec §3): the newest iPhone in cherry,
 * measured on Apple's photo (the phone 1210 × 2523 px). Player.astro draws it in CSS from the same
 * numbers, as shares of the phone's width; the rows lay a framed reel out at the phone's outline.
 */

/** Pieces narrower than this (width per unit of height) stand in the phone: 9:16 reels and taller. */
export const FRAMED_BELOW = 0.6;
/** The phone's outline, width per unit of height. */
export const PHONE_SHAPE = 0.4796;
/** The black bezel around the screen, as a share of the phone's width. */
export const BEZEL = 0.0364;
/** The screen's share of the phone's width. */
export const SCREEN_SHARE = 1 - 2 * BEZEL;
/** The screen's shape as drawn: 9:19.5 to within 0.2%. */
export const SCREEN_SHAPE = SCREEN_SHARE / (1 / PHONE_SHAPE - 2 * BEZEL);

export const isFramed = (ratio: number): boolean => ratio < FRAMED_BELOW;

/** How a piece stands in the feed's rows on wider screens. */
export interface Piece {
  /** Width per unit of height: the video's own shape, or the phone's outline for a framed reel. */
  shape: number;
  /** The share of that width the play button sits in: the phone's screen, or all of it. */
  screen: number;
}

export const pieceOf = (ratio: number): Piece => (isFramed(ratio) ? { shape: PHONE_SHAPE, screen: SCREEN_SHARE } : { shape: ratio, screen: 1 });

const round = (n: number): number => Math.round(n * 1e4) / 1e4;

/**
 * How much a framed piece's picture is scaled in the screen: at rest it fills the screen (a 9:16 reel
 * loses a little of each side), and while it plays it shows whole (a taller one gets bands).
 */
export function screenScales(ratio: number): { fill: number; whole: number } {
  const k = ratio / SCREEN_SHAPE;
  return { fill: round(Math.max(1, k)), whole: round(Math.min(1, k)) };
}
