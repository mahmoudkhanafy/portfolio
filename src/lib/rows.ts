/**
 * The feed's rows on wider screens. Pieces keep Mahmoud's order, and every piece in a row gets one
 * height, its width set by its shape, so together they fill the row: frames and titles line up
 * whatever shapes sit side by side. A row takes the next pieces until it is full; a wide piece (a
 * film) never joins a row that has begun, and a piece that would squeeze its neighbours below their
 * play button waits. The pieces after a waiting one move up to finish the row, so similar shapes
 * end up together and a film gets a row of its own.
 *
 * On these screens a vertical reel stands in the phone frame (lib/phone.ts): it counts as the phone's
 * outline, and its play button needs room on the phone's screen, not on the outline.
 */

import { PHONE_SHAPE, type Piece } from './phone.ts';

export interface RowLayout {
  /** A row stops taking pieces once they are this wide per unit of height (three reels in their phones are 1.4388). */
  fill: number;
  /** A row that can take no more is stretched across only if it is at least this wide per unit of height. */
  least: number;
  /** No row gets wider than this per unit of height, so no row gets too short. */
  max: number;
  /** The row's width at the narrowest screen this layout is used on, the gap between pieces, and the narrowest a play button's frame (a phone's screen) may get, in px. */
  width: number;
  gap: number;
  minPiece: number;
  /** A row that isn't full (usually the last) is sized as if it held this: a full row of reels. */
  typical: { count: number; sum: number };
}

export interface RowPlace {
  row: number;
  /** Position on the screen, counting from the first piece. */
  order: number;
  /** The pieces a row's width is shared between, and their summed width per unit of height. */
  count: number;
  sum: number;
}

/**
 * The rows were first tuned for bare 9:16 reels; a reel in its phone is narrower for its height, so
 * every width per unit of height scales with it and rows keep their counts.
 */
const SCALE = PHONE_SHAPE / (9 / 16);

/**
 * The layouts Reel.astro picks between by the shape of the screen, so a row fits the screen's height
 * and still fills its width: two phones a row on tall screens (tablets), three on most, four on wide
 * ones (laptop windows). `width` and `gap` are the feed's at the narrowest screen each is used on, less
 * a scrollbar: 760 px (tall), 860 px (narrow), 1100 px (wide), 1150 px (short).
 */
export const FEED_ROWS = {
  tall: { fill: 1.1 * SCALE, least: 0.9 * SCALE, max: 2 * SCALE, width: 685, gap: 23, minPiece: 224, typical: { count: 2, sum: 2 * PHONE_SHAPE } },
  narrow: { fill: 1.65 * SCALE, least: 1.3 * SCALE, max: 2.6 * SCALE, width: 783, gap: 25, minPiece: 224, typical: { count: 3, sum: 3 * PHONE_SHAPE } },
  wide: { fill: 1.65 * SCALE, least: 1.3 * SCALE, max: 2.6 * SCALE, width: 1010, gap: 30, minPiece: 224, typical: { count: 3, sum: 3 * PHONE_SHAPE } },
  short: { fill: 2.2 * SCALE, least: 1.75 * SCALE, max: 3.4 * SCALE, width: 1060, gap: 31, minPiece: 224, typical: { count: 4, sum: 4 * PHONE_SHAPE } },
} satisfies Record<string, RowLayout>;

export type FeedLayout = keyof typeof FEED_ROWS;

/** Landscape at 1.3:1 and wider, as orientationOf has it. */
const WIDE = 1.3;

export function layRows(pieces: readonly Piece[], layout: RowLayout): RowPlace[] {
  const shape = (piece: number): number => pieces[piece]!.shape;
  /** How wide a piece's play-button frame is per unit of the row's height. */
  const button = (piece: number): number => pieces[piece]!.shape * pieces[piece]!.screen;
  const places: RowPlace[] = new Array(pieces.length);
  const waiting = pieces.map((_, piece) => piece);
  const fits = (members: number[], sum: number): boolean => {
    if (sum > layout.max) return false;
    const height = (layout.width - (members.length - 1) * layout.gap) / sum;
    return members.every((piece) => button(piece) * height >= layout.minPiece);
  };

  // A full row is shared by its own pieces. One that isn't full is sized like a row of reels, as far
  // as that keeps its narrowest piece at least as wide as a play button.
  const size = (members: number[], sum: number): Pick<RowPlace, 'count' | 'sum'> => {
    if (sum >= layout.least) return { count: members.length, sum };
    const count = Math.max(members.length, layout.typical.count);
    const narrowest = Math.min(...members.map(button));
    const cap = (narrowest * (layout.width - (count - 1) * layout.gap)) / layout.minPiece;
    return { count, sum: Math.max(sum, Math.min(layout.typical.sum, cap)) };
  };

  let order = 0;
  for (let row = 0; waiting.length > 0; row++) {
    const members = [waiting.shift()!];
    let sum = shape(members[0]!);
    while (sum < layout.fill) {
      const next = waiting.findIndex((piece) => shape(piece) < WIDE && fits([...members, piece], sum + shape(piece)));
      if (next < 0) break;
      const [piece] = waiting.splice(next, 1);
      members.push(piece!);
      sum += shape(piece!);
    }
    members.sort((a, b) => a - b);
    for (const piece of members) places[piece] = { row, order: order++, ...size(members, sum) };
  }
  return places;
}
