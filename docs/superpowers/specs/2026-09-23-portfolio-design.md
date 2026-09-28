# Mahmoud Khaled — portfolio site: design

Date: 2026-09-23 · Status: approved by brief (owner asked for no questions; every open choice below
is the recommended option, recorded with its reason).

## 1. Intent

**What the owner said**

- Portfolio for Mahmoud Khaled, video editor and videographer in Giza / Cairo. A gift.
- Clients meet it on phones, from WhatsApp and Instagram, replacing bare Google Drive links.
  They must be able to watch the videos smoothly and then message him.
- Make him look professional; easy for him (a non-developer) to add new work.
- Fast on mobile 4G; quick start and smooth playback, including iOS Safari.
- Every video has its own shareable link with a proper WhatsApp / Instagram preview.
- Static hosting on GitHub Pages via GitHub Actions, working under a repo sub-path.
- Accessible (keyboard, screen readers, reduced motion, contrast).
- Unit tests, Playwright e2e (desktop Chromium + mobile WebKit), manual Chrome pass with
  screenshots at phone and desktop sizes, Lighthouse scores on the production build.
- Local commits only, no attribution lines, no GitHub repo, no push.
- The phone view opened from WhatsApp is the view that decides.

**Assumptions I made (not stated by the owner)**

- The audience is Egyptian and the work is Arabic, so the site is Arabic-first (RTL) with a full
  English version for non-Arabic clients.
- The owner's other build runs on port 4321; this one runs on **4747**.
- Mahmoud's exact role on each piece (shot vs. edited) is unknown, so per-piece role lines are left
  empty rather than guessed; the field exists for him to fill in.
- No dates, view counts, client counts or other metrics are shown, because none were given.

**Success criteria**

1. A WhatsApp link to any page previews with an image, a title and a description.
2. On a mid-range phone over 4G, a tapped video begins within about a second and keeps playing.
3. From any video, messaging Mahmoud on WhatsApp is one tap, with the message pre-filled.
4. Adding a video is: upload the file (+ optional small text file) on github.com, wait for the
   green check. Documented step by step in Arabic and English.
5. Lighthouse (mobile) ≥ 95 on Performance / Accessibility / Best Practices / SEO for the home and
   a video page; axe finds no serious or critical issues.

## 2. The work (from watched frames + local Whisper transcripts)

| Source | Slug | What it is | Format |
|---|---|---|---|
| reel1.mp4 | `muscle-up-basics` | Calisthenics coach's educational reel on muscle-up prerequisites (8–10 clean pull-ups, explosive and chest-to-bar pull-ups, straight-bar dips, transition). Arabic/English kinetic type, curved text, picture-in-picture demos, deep red grade. | 1:1 · 30.5 s · 30 fps |
| reel2.mp4 | `skin-and-pain` | Faith-and-science explainer: a Quranic verse and the pain/heat receptors in human skin. Gold kinetic type, paper-texture graphic scenes with window-light shadows, fire effects, B-roll. | 1:1 · 45 s · 30 fps |
| reel3.mp4 | `blood-sugar-test` | Medical explainer: why not to prick the thumb/index finger for glucose tests, and the right technique. Animated captions, icon list lower-thirds, B-roll cards on a light background. | 1:1 · 63.6 s · 30 fps |
| reel4.mov | `nimun-recap` | Event recap for the NIMUN Model UN conference: committee sessions, placards, chairs, campus breaks, closing applause; music-driven, warm grade, event branding on every shot. HEVC 10-bit source. | 4:5 · 28.5 s · 25 fps |
| reel5.mp4 | `v7-sampling-night` | Brand activation recap for V7 vitamin sparkling drink: night sampling event, cans handed out, reactions, logo end card; handheld, music-driven. | 1:1 · 21.8 s · 24 fps |
| cinematic1.mp4 | `running-film` | Cinematic running piece: speed ramps, motion-blur transitions, tight footwork angles among palms and lawns; music only. | 16:9 · 19.4 s · 30 fps |

Services shown on the site are only those visible in this work: short-form/reel editing, kinetic
typography and motion graphics, event and brand-activation coverage, color. Tools as given:
Premiere Pro, After Effects, DaVinci Resolve, Photoshop.

## 3. Creative direction — "Caption"

(Revised during the design pass: the first direction, "Tally" — near-black, a red REC accent,
monospace timecode labels, middle-dot meta lines — matched the stock look of generated video
portfolios. This one comes from Mahmoud's own medium instead.)

His signature is Arabic kinetic captions, and his clients live inside Instagram Reels. The site
speaks that language: a true-black screen where every video gets the whole phone, and one
colour — his caption gold — marking what matters, the way his captions mark the key word.

- **Palette**: screen `#000000`, white `#FFFFFF` for display type, text `#D6D6D6`, dim `#8F8F8F`,
  caption gold `#E8B100` (lifted from the gold sampled in his reel, ~`#C89800`), rule `#2A2A2A`.
  Gold appears only on the primary action, the caption highlight and the focus ring; black text
  sits on gold. Dark only, with `<meta name="darkreader-lock">`.
- **Type**: one family, *Alexandria* (variable, by Egyptian designer Mohamed Gaber): 800 for his
  name, on one line sized to its frame so the caption never covers his face, 700–800 for headings, 300–500 for text; tabular figures for durations. No letter-spacing
  on Arabic, no all-caps labels, no monospace data labels.
- **Hero**: his cut-out portrait standing in a caption-gold block (black suit on gold), his name
  set huge beneath, and one kinetic caption line that types in word by word with a gold box
  moving across it, then comes to rest as plain text. The one orchestrated motion on the page.
- **Work on phones**: a reels feed. Each piece shows whole on one screen with the first line of its
  title; after the visitor first scrolls, the piece in view plays muted and loops like a reel; tapping it or
  "Play with sound" restarts it from the start with sound and native controls. Title,
  description and the WhatsApp action sit below the picture, never on it.
- **Work on wide screens**: rows in Mahmoud's order (`src/lib/rows.ts`). Every piece in a row gets
  one height and its width from its shape, so each row fills the width and its frames and titles
  line up whatever shapes sit side by side. A film gets a row of its own (at three reels a row, a
  full-width 16:9 frame stands as tall as the reels); when it can't join a row, the next pieces move
  up to finish that row, so similar shapes end up together and his first piece always leads. The
  screen's shape picks two reels a row (tablets), three, or four (short, wide laptops), so a row fits
  the screen's height. A last row that isn't full keeps the size of a row of reels. Hover or focus
  previews muted; click plays with sound in place.
- **Frames**: every frame takes its video's true shape, at the largest size that fits the width
  and the height its page allows, so nothing is stretched or cropped and the play button is always
  on screen: the phone feed allows `100svh − 7rem` (the frame and the first line of its title), the
  grid `100svh − 2rem`, a work page `100svh − 9rem` on phones and `− 10rem` on wide screens (the
  frame below the header and the back link, on arrival). On phones a frame runs edge to edge when it
  fits and otherwise sits centred with rounded corners. No frame gets narrower than the play button
  (14 rem); a narrow frame gets a smaller play button so the duration stays beside it, and only the
  narrowest move the duration to the top.
- **End card**: when a video ends, the frame offers *Replay* and the gold *Message me about a
  video like this*.
- **Motion**: the hero caption on load; then the "See the work" arrow drops through its circle three
  times and rests (hover or focus draws its underline from the reading start and drops it once, and
  the link glides to the work); the muted previews; and cross-page view transitions of covers. All
  of it is removed under `prefers-reduced-motion`; previews also stop for Save-Data.

## 4. Information architecture

- `/` (ar) and `/en/`: header (name mark, language switch, WhatsApp icon) → hero → work feed →
  about (short bio, services, tools) → contact (WhatsApp, Instagram, call, email, save contact) →
  footer. Every piece in the feed carries its own WhatsApp action, so no floating button is needed.
- `/work/<slug>/` and `/en/work/<slug>/`: player first, then title, meta line (type · duration
  · aspect · client), description, the WhatsApp action pre-filled with the video's title and link,
  share (Web Share API, falling back to copy link), then "more work" links.
- `/404.html` bilingual. `sitemap-index.xml`, `robots.txt`, `mahmoud-khaled.vcf`.

## 5. Architecture

```
work/                      ← Mahmoud edits only this folder
  <slug>.mp4|mov|…          source video (any common format, ≤100 MB)
  <slug>.yml                small info file (optional but recommended)
site/portrait.png          portrait master (trimmed cut-out)
scripts/media/*.mjs        media pipeline (Node, ffmpeg, sharp)  → public/media/, src/generated/catalog.json
src/                       Astro site (pages, components, styles, player script)
tests/unit, tests/e2e      Vitest, Playwright
.github/workflows          deploy (Pages) + test
```

### 5.1 Content model (`work/<slug>.yml`)

| Field | Required | Meaning |
|---|---|---|
| `title` | yes | Arabic title |
| `title_en` | no | English title (falls back to `title`, marked `lang="ar"`) |
| `description`, `description_en` | no | One or two sentences |
| `type` | no | `reel` (default) · `event` · `brand` · `film` |
| `client` | no | Shown as "for …" |
| `role` | no | What he did, e.g. تصوير ومونتاج |
| `cover` | no | Second (or `m:ss`) for the cover frame; auto-picked if missing |
| `order` | no | Lower shows earlier; missing counts as 0, so new work lands on top; ties → newest first |
| `video` | no | Video file name if it differs from the `.yml` name |
| `hidden` | no | `true` hides it without deleting |

A video with no `.yml` is still published (title from its file name) with a build warning. A
`.yml` whose video is missing, bad YAML, an unknown `type` or a slug collision fails the build
with a message that names the file and the fix, in Arabic and English.

### 5.2 Media pipeline (`npm run media`)

1. Discover and validate entries; compute a SHA-256 of each source.
2. Probe with ffprobe (display size, duration, fps, audio, HDR transfer). The display size applies
   the pixel aspect ratio, then rotation: a 9:16 video stored squeezed into 1080×1080 with its pixels
   flagged 9:16 is stretched back along the squeezed side to 1080×1920, so no stored detail is lost.
3. Encode two H.264 High / AAC MP4s at the display shape with square pixels, `+faststart`,
   `yuv420p`, BT.709 tags, GOP 2 s:
   - `hd`: native size capped to 1080 on the short side, CRF 21, maxrate from area (≤ 6 Mb/s).
   - `sd`: 720 on the short side (1280 long side max), CRF 23, maxrate ≤ 2.5 Mb/s, AAC 96k.
   - HDR (HLG/PQ) sources are tone-mapped when `zscale` is available.
4. Cover frame (manual `cover` time or ffmpeg `thumbnail` pick) → AVIF/WebP at 480/720/1080
   (+1440 for landscape) and a JPEG fallback; a 16-px LQIP data URI; the dominant colour.
5. OG image 1200×630 JPEG (< 300 KB): blurred-fill background, the frame, a play badge and a
   pre-rendered bilingual wordmark.
6. Portrait → trimmed AVIF/WebP/PNG at three widths.
7. Write `src/generated/catalog.json` (typed by `src/lib/catalog.ts`).

Outputs are content-addressed (`media/<slug>/hd.<hash8>.mp4`), so unchanged sources are skipped.
CI persists `public/media` with `actions/cache` and installs ffmpeg only when something needs
encoding.

### 5.3 Player (progressive enhancement, ~4 KB)

- Server HTML: `<picture>` cover (lazy except above the fold) + a real `<button>` named "Play with
  sound: “<title>”, 0:30 long" — the name starts with the words on the button, so voice control can
  say them. `<noscript>` holds a plain `<video controls preload="none">` for no-JS.
- On tap, in the same task: create the `<video playsinline controls>`, pick a rendition, `play()`
  with sound. The cover stays until `playing` fires, so there is no black flash.
- Rendition choice (pure, unit tested): `sd` if Save-Data, 2G/3G, the downlink estimate × 0.7 is
  below the `hd` bitrate, or the rendered width × DPR (DPR clamped to 1–3) is within 1.15 × the `sd`
  width; otherwise `hd`.
- Stall guard: while on `hd`, a stall over 2.5 s or three `waiting` events in 20 s switches to
  `sd` at the same time position. Errors fall back to `sd`, then show a message and a direct link.
- One video at a time; Media Session metadata; the end card on `ended`.
- Muted previews (phones: the piece in view after the first scroll; wide screens: hover/focus)
  play the lightest rendition, so scrolling past doesn't spend a visitor's data on sharpness nobody
  is watching yet. "Play with sound" restarts from the start on the rendition chosen above: the
  same file (instant) when that is the lightest, otherwise a fresh load behind the cover.
  No preview under reduced motion, Save-Data, or before the visitor has interacted.

### 5.4 Site build

- Astro static output, `base` = `BASE_PATH` (default `/mahmoud-khaled/`) and `site` = `SITE_URL`
  (default `http://localhost:4747`); CI takes both from `actions/configure-pages`.
- `trailingSlash: 'always'`, directory output; every internal URL goes through one helper that
  joins `BASE_URL`, and every meta URL goes through one helper that makes it absolute.
- Per page: title, description, canonical, `hreflang` alternates, Open Graph (`og:image` with
  width/height/alt/type, `og:video` for pieces), Twitter card, JSON-LD (`Person` on home,
  `VideoObject` on pieces). A static bilingual home OG card, rendered once from HTML with the
  real fonts.
- Fonts self-hosted from `@fontsource-variable/*` with `unicode-range` subsets; the Arabic subset
  is preloaded. No third-party requests at all.

## 6. Accessibility

Semantic landmarks, one `h1` per page, skip link, visible focus ring (tally red + offset),
44 px minimum targets, `lang`/`dir` on the page and on mixed-language runs, the play button's
accessible name includes the title and duration, focus moves to the video once playing, the end
card is announced politely, reduced motion removes motion, and contrast meets AA (checked in
tests). The burned-in Arabic captions in the talking-head reels act as open captions; every piece
also has a text description.

## 7. Performance budget (mobile, per page, before video)

HTML ≤ 30 KB · CSS inlined ≤ 20 KB · JS ≤ 8 KB · fonts ≤ 70 KB · LCP image ≤ 80 KB. No layout
shift from covers (explicit aspect ratios) or fonts (metric-matched fallbacks).

## 8. Testing

- **Unit (Vitest)**: rendition ladder math, entry validation and error messages, catalog
  ordering, URL helpers (base + absolute), WhatsApp link builder, duration/timecode formatting,
  rendition choice and the stall guard.
- **E2E (Playwright)** against the production build served at the sub-path by a local server that
  mimics GitHub Pages (Range requests, directory index, 404.html). Projects: `desktop-chromium`
  (the Chrome channel, because open-source Chromium lacks H.264) and `mobile-webkit` (iPhone).
  Covers: home and piece rendering in both languages, no failed requests, OG tags absolute and
  the images reachable and under 300 KB, playback starts and advances, `hd` failure falls back to
  `sd`, keyboard play, end card, language switch, 404, no horizontal overflow, reduced motion,
  axe, and frames: the frame, the cover and the video file share the video's true shape; every
  frame and its play button fit on the first screen of its page; every frame in a row has one
  height, full rows fill the width and keep his order, at six screen sizes from a tablet to a
  1366×768 laptop. The e2e build adds test pieces from `tests/fixtures/work/`: one whose texts hold
  quotes, HTML, `&`, emoji and long unbroken hashtags and links, so escaping and overflow are
  checked against what Mahmoud might paste; and test cards in four more shapes (9:16 stored
  squeezed into a square, a 9:19.5 screen recording, 2.39:1, 1:1), whose circles show any stretch.
- **HDR**: an integration test tone-maps an HLG clip wherever ffmpeg has `zscale` (the Ubuntu
  runners); macOS Homebrew ffmpeg lacks it, so it is skipped there.
- **Manual**: the owner's Chrome at phone and desktop sizes with screenshots (Dark Reader locked
  out by the meta tag, verified in the DOM), real Mobile Safari in the iOS Simulator, and
  Lighthouse on the production build.

## 9. Deploy

- `deploy.yml`: push to `main` or manual → checkout (full history for "newest first") → Node →
  `configure-pages` → restore media cache → ffmpeg only if needed → `npm ci` → unit tests →
  build with the Pages origin and base path → upload artifact → `deploy-pages`.
- `test.yml`: on PRs and pushes → build + unit + Playwright (both projects). It does not gate
  deploy, so a flaky browser never blocks Mahmoud's new video.
- Validated locally with `actionlint`.

## 10. Out of scope (YAGNI)

CMS, analytics, contact forms, HLS/DASH, AV1/VP9 renditions, service worker, light theme,
category filters (the `type` field keeps that door open).
