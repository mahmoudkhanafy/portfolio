# Mahmoud Khaled — portfolio

The video portfolio of Mahmoud Khaled, video editor and videographer in Giza / Cairo. Arabic first
(`/`), English at `/en/`. Every piece has its own page and link preview, plays with sound on one tap,
and ends on a pre-written WhatsApp message.

This branch (`orange`) is the "paper" look: ink on warm paper with one burnt orange, his portrait in
black and white on an orange block, a dark band where a video plays, and the sections Work, About,
Process and Contact. The video side (pipeline, frames, phone, rows, player, motion) is the same as
on the black site's branch; only its colours follow the page.

**Adding a video is documented for Mahmoud in [ADD-A-VIDEO.md](ADD-A-VIDEO.md)** (Arabic, then English).

## Run it locally

Needs Node 22.12+ (CI uses 24) and ffmpeg (`brew install ffmpeg` on macOS, `apt-get install ffmpeg` on
Ubuntu). ffmpeg is only needed when a video in `work/` is new or changed.

```sh
npm ci
npm run dev            # http://localhost:4750/mahmoud-khaled/ (media is prepared first)
npm run build          # production build in dist/
npm run serve          # serves dist/ like GitHub Pages, on the local network too
```

`SITE_URL` (origin, used for link previews and canonical URLs) and `BASE_PATH` (repo sub-path) control
where the build expects to live. They default to `http://localhost:4750` and `/mahmoud-khaled/`; CI
takes them from GitHub Pages. To test link previews from a phone on the same Wi-Fi, build with the
LAN address: `SITE_URL=http://192.168.x.x:4750 npm run build && npm run serve`.

## Publish on GitHub Pages

1. Create a repository and push `main`.
2. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
3. Every push to `main` runs **Deploy site** (`.github/workflows/deploy.yml`). The site lives at
   `https://<user>.github.io/<repo>/`; a custom domain set in the Pages settings also works (the base
   path then becomes `/` automatically).

**Test** (`.github/workflows/test.yml`) runs the unit and end-to-end suites on pushes and pull
requests. It is deliberately separate from deployment, so a flaky browser never holds back a new video.

## How it works

```
work/*.mp4|mov + *.yml ─▶ scripts/media/build.ts ─▶ public/media/…  +  src/generated/catalog.json
                                                                         │
site/portrait.png ────────────────────────────────────────────────────────┤
                                                                         ▼
                                                   Astro pages (src/pages) ─▶ dist/ ─▶ GitHub Pages
```

- **Media pipeline** (`scripts/media/`): validates `work/` and reports problems in Arabic and English
  (as GitHub annotations and a job summary in CI); encodes two H.264/AAC MP4s per video with the index
  at the front — `hd` (1080 class) and `sd` (720 class) — at the video's true shape with square pixels
  (a 9:16 video stored squeezed into a square comes out 9:16), never spending much more than the source's
  own bitrate; picks the cover frame; renders AVIF/WebP covers, a blurred placeholder and a
  1200×630 link-preview image under 300 KB; processes the portrait. Results are cached by content hash
  in `.media-cache/` (restored between CI runs), so only new or changed files are processed.
- **Site** (`src/`): static Astro pages, fonts self-hosted, no third-party requests. The only
  JavaScript is the player (`src/scripts/player.ts`, ~2.5 KB gzipped), the share button and the
  motion script (`src/scripts/motion.ts`, inlined), plus a small inline script in `<head>`.
- **Frames**: each frame takes its video's own shape at the largest size that fits the screen with its
  play button, so nothing is stretched or cropped: films run wide, squares stay square. On screens
  760 px and wider, vertical reels stand in a drawn iPhone (in shades of the site's orange, measured on Apple's photo;
  `src/lib/phone.ts`, drawn in `Player.astro`): the reel fills its 9:19.5 screen at rest and eases to
  its whole 9:16 frame when it plays with sound. On phones a frame runs edge to edge when it fits and
  otherwise sits centred.
- **Rows** (`src/lib/rows.ts`): on wider screens the pieces sit in rows in Mahmoud's order, every
  piece in a row at one height so the row fills the width and titles line up. A framed reel counts as
  its phone. Films get a row of their own and the next pieces move up to finish the row before; the
  screen's shape picks two, three or four a row so a row fits the screen.
- **Motion** ("Captions"): text builds the way his reels build captions. The hero line pops on word by
  word with «حكايتك» / "yours" in orange and «حكايتك» stretching with kashida; headings, feed titles and
  the services build as they come into view, and a video's title as its page opens
  (`src/lib/words.ts`, `Words.astro`, `src/styles/motion.css`, `src/scripts/motion.ts`). Screen
  readers read every line whole; with Reduce Motion or without JavaScript the text is simply there.
- **Play here, open there**: tapping a picture plays it where it is; tapping a title (it carries an
  arrow) opens its page, and the frame glides there and back (a view transition named per page
  change in `Base.astro`). "All work" returns to the same piece.
- **Player**: a tap creates the `<video>` inside the same gesture (sound works on iOS), picks `hd` or
  `sd` from the frame's pixel size and the Network Information API, keeps the cover up until the first
  frame plays, drops to `sd` on stalls or errors at the same moment, and ends on a WhatsApp card. In the
  home feed, the piece in view previews muted on its lightest file on phones (after the first scroll)
  and on hover with a mouse — never under reduced motion or Save-Data; "play with sound" then picks the
  file for the screen.
- **Link previews**: every page has absolute Open Graph and Twitter tags, `hreflang` alternates and
  JSON-LD (`Person` on home, `VideoObject` per piece). The home card (`public/og-home.jpg`) and the
  wordmark used on per-video cards are rendered from `site/brand/templates/` with `npm run brand`.

## Changing things

| What | Where |
|---|---|
| Videos, titles, order, covers | `work/` — see ADD-A-VIDEO.md |
| Portrait | replace `site/portrait.png` (transparent PNG), then `npm run brand -- og-home` |
| Contact details | `src/lib/contact.ts` |
| Interface text, bio, services | `src/lib/i18n.ts` |
| Colours, type scale | `src/styles/tokens.css` (contrast is checked by `tests/unit/contrast.test.ts`) |
| Brand artwork (icons, wordmark, home card) | `site/brand/templates/`, then `npm run brand` |

## Tests

```sh
npm run check          # astro check (TypeScript), after `npm run media`
npm test               # unit tests (Vitest), including a real ffmpeg pipeline run
npm run build:e2e      # production build pointed at the test server
npm run test:e2e       # Playwright: desktop Chromium + mobile WebKit (iPhone)
npm run lighthouse     # Lighthouse on the production build (writes reports/lighthouse/)
```

The end-to-end suite runs against `scripts/serve.ts`, which serves the build the way GitHub Pages does:
sub-path, trailing-slash redirects, `404.html` with a 404 status, byte ranges for video and gzip. It
covers both languages, link previews (absolute, reachable, < 300 KB), playback with sound, keyboard
start, `hd` → `sd` fallback, the end card, one-video-at-a-time, muted previews, reduced motion, 404s,
shared URLs with tracking parameters, page weight, axe accessibility checks, frames (true shape,
whole on screen with the play button, one height per row, full rows in his order at six screen
sizes), motion (word-by-word builds, orange key words, kashida without layout shift, reduced motion, no
JavaScript), the phone frame (9:19.5 screen, fill and whole, clear of its island, Safari's round
corners) and the rules (a picture plays in place, a title opens its page, the glide pairs one frame
each way, "All work" returns to the piece). `build:e2e` adds the
test pieces in `tests/fixtures/work/` to the videos in `work/`: one with quotes, HTML, emoji and long
unbroken hashtags and links in every text, so escaping and phone overflow are checked against pasted
text, and test cards in four more shapes (9:16 stored squeezed into a square, a 9:19.5 screen
recording, 2.39:1 and 1:1), whose circles show any stretch.

`tests/unit/hdr.int.test.ts` tone-maps an iPhone-style HLG clip; it runs where ffmpeg has `zscale`
(Ubuntu's, as on the CI runners) and is skipped with Homebrew's ffmpeg, which lacks it.

## Limits to know

- GitHub rejects files over 100 MB, and the browser upload stops at 25 MB (see ADD-A-VIDEO.md).
- Every video ever uploaded stays in the repository's history, and deploys check out the full
  history to date each piece, so replacing videos often makes the repository and each deploy grow.
- A GitHub Pages site may be at most 1 GB. Each piece publishes about 10–20 MB of video, so the
  site holds roughly 50–100 pieces; hide or delete old ones (or move video to external hosting)
  before then.
- On the first deploy, watch the `configure-pages` step. If it fails with "Resource not accessible
  by integration", give the build job `pages: write` in `.github/workflows/deploy.yml`.

## Credits

- Typefaces: [Noto Sans Arabic](https://fonts.google.com/noto/specimen/Noto+Sans+Arabic) and
  [Barlow Condensed](https://fonts.google.com/specimen/Barlow+Condensed) (SIL Open Font License),
  subset and checked in under `site/fonts/` (its README has the commands).
- Icons: [Simple Icons](https://simpleicons.org) (CC0-1.0) for WhatsApp and Instagram,
  [Lucide](https://lucide.dev) (ISC) for the interface.
