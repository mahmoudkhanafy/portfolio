import { describe, expect, it } from 'vitest';
import { pieceOf, PHONE_SHAPE } from '../../src/lib/phone.ts';
import { FEED_ROWS, layRows, type RowLayout } from '../../src/lib/rows.ts';

const REEL = 9 / 16;
const FILM = 16 / 9;
const POST = 4 / 5;
const SQUARE = 1;
const SCOPE = 2.39;
const TALL = 9 / 19.5;
const CLASSIC = 4 / 3;

const lay = (ratios: number[], layout: RowLayout) => layRows(ratios.map(pieceOf), layout);
/** The pieces (by their place in Mahmoud's order) in each row, as the screen shows them. */
const rows = (ratios: number[], layout: RowLayout = FEED_ROWS.wide): number[][] => {
  const byOrder = lay(ratios, layout)
    .map((place, piece) => ({ ...place, piece }))
    .sort((a, b) => a.order - b.order);
  const out: number[][] = [];
  for (const { row, piece } of byOrder) (out[row] ??= []).push(piece);
  return out;
};

describe('layRows', () => {
  it('fills rows with two, three or four reels in their phones by the shape of the screen, in order', () => {
    const reels = Array.from({ length: 9 }, () => REEL);
    expect(rows(reels, FEED_ROWS.tall)).toEqual([[0, 1], [2, 3], [4, 5], [6, 7], [8]]);
    expect(rows(reels, FEED_ROWS.narrow)).toEqual([[0, 1, 2], [3, 4, 5], [6, 7, 8]]);
    expect(rows(reels)).toEqual([[0, 1, 2], [3, 4, 5], [6, 7, 8]]);
    expect(rows(reels, FEED_ROWS.short)).toEqual([[0, 1, 2, 3], [4, 5, 6, 7], [8]]);
  });

  it('gives a film a row of its own, and moves the next pieces up to finish the row before it', () => {
    // Mahmoud's seed order: reel, film, reel, 4:5 event, reel, reel.
    const seed = [REEL, FILM, REEL, POST, REEL, REEL];
    expect(rows(seed)).toEqual([[0, 2, 3], [1], [4, 5]]);
    expect(rows(seed, FEED_ROWS.tall)).toEqual([[0, 2], [1], [3, 4], [5]]);
  });

  it('on short, wide screens takes one piece fewer in a row with a post, so every phone keeps its play button', () => {
    expect(rows([REEL, FILM, REEL, POST, REEL, REEL], FEED_ROWS.short)).toEqual([[0, 2, 3], [1], [4, 5]]);
  });

  it('keeps his order exactly when the shapes allow it', () => {
    expect(rows([FILM, REEL, REEL, REEL, SCOPE, POST, POST])).toEqual([[0], [1, 2, 3], [4], [5, 6]]);
  });

  it('lets a moderately wide piece share its row with the pieces after it', () => {
    expect(rows([CLASSIC, REEL, REEL, REEL])).toEqual([[0, 1], [2, 3]]);
  });

  it('sizes a full row by its own pieces, and one that is not full like a row of reels', () => {
    const ratios = [REEL, FILM, REEL, POST, REEL, REEL, TALL, SQUARE, SCOPE, REEL];
    const shapes = ratios.map((r) => pieceOf(r).shape);
    for (const layout of Object.values(FEED_ROWS)) {
      const places = lay(ratios, layout);
      for (const row of rows(ratios, layout)) {
        const own = row.reduce((total, piece) => total + shapes[piece]!, 0);
        const { count, sum } = places[row[0]!]!;
        expect(row.every((piece) => places[piece]!.count === count && places[piece]!.sum === sum)).toBe(true);
        if (own >= layout.least) expect([count, sum]).toEqual([row.length, own]);
        else expect([count, sum >= own, sum <= layout.typical.sum]).toEqual([Math.max(row.length, layout.typical.count), true, true]);
      }
    }
  });

  it('keeps every row but the last full for work shaped like his', () => {
    const mixes = [
      [REEL, FILM, REEL, POST, REEL, REEL],
      [REEL, REEL, FILM, REEL, POST, POST, REEL, FILM, REEL, REEL, SQUARE, REEL],
      [FILM, FILM, REEL, REEL, REEL, REEL, POST, REEL],
    ];
    for (const ratios of mixes) {
      for (const layout of Object.values(FEED_ROWS)) {
        const places = lay(ratios, layout);
        for (const row of rows(ratios, layout).slice(0, -1)) expect(places[row[0]!]!.count, JSON.stringify(row)).toBe(row.length);
      }
    }
  });

  it('sizes a last row that is not full like a row of phones, instead of stretching it across', () => {
    expect(lay([REEL, REEL, REEL, REEL], FEED_ROWS.wide).at(-1)).toMatchObject({ count: 3, sum: 3 * PHONE_SHAPE });
    expect(lay([REEL, REEL, REEL], FEED_ROWS.tall).at(-1)).toMatchObject({ count: 2, sum: 2 * PHONE_SHAPE });
    expect(lay([REEL, REEL, REEL, REEL, REEL], FEED_ROWS.short).at(-1)).toMatchObject({ count: 4, sum: 4 * PHONE_SHAPE });
  });

  it('never makes a play button narrower than it needs, on the phone’s screen, and places every piece once', () => {
    const mixes = [
      [TALL, SCOPE, SQUARE, REEL, TALL, POST, FILM, TALL],
      [SQUARE, SQUARE, TALL, TALL, TALL, SCOPE, REEL],
      [POST, FILM, CLASSIC, REEL, TALL, SQUARE, POST, REEL, REEL],
    ];
    for (const ratios of mixes) {
      for (const layout of Object.values(FEED_ROWS)) {
        const places = lay(ratios, layout);
        expect(places.map((p) => p.order).sort((a, b) => a - b)).toEqual(ratios.map((_, i) => i));
        places.forEach((place, i) => {
          const { shape, screen } = pieceOf(ratios[i]!);
          const width = (shape * screen * (layout.width - (place.count - 1) * layout.gap)) / place.sum;
          expect(width, `piece ${i}`).toBeGreaterThanOrEqual(layout.minPiece - 0.5);
        });
      }
    }
  });
});
