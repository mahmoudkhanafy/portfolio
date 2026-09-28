# Motion and the phone frame: design

Date: 2026-09-27 · Status: for the owner's review. Builds on
[2026-09-23-portfolio-design.md](2026-09-23-portfolio-design.md) and replaces its "Motion" paragraph and
its description of the hero caption (§3). Everything else there still holds.

## 1. Intent

**What the owner said**

- The site feels still; it needs movement. Asked what the movement is for, he chose *show his craft*:
  the site should move the way Mahmoud's own edits do.
- Of three directions shown as moving samples, he chose **A, Captions** (text builds the way his
  reels build captions) over **B, Cuts** (editing transitions on the video frames) and **C, Scrub**
  (motion tied to the scroll position).
- Vertical reels should stand in a **phone frame on wider screens**, drawn to match the official photo
  he supplied pixel for pixel (the newest iPhone in **cherry**, from apple.com), with the reel
  **filling the phone**.
- He loves the frame gliding between the grid and a video's page, and wants **clear rules** for
  playing a video in place versus opening its page, the same for framed and unframed pieces.
- "Make it production ready with everything agreed." He is a developer, not a designer, and left the
  remaining design calls to Claude.

**Calls made on his behalf (he deferred, and saw each one working)**

- **Filled at rest, whole while watching.** Filling the 9:19.5 phone screen cuts about 9% off each side
  of a 9:16 reel, where his captions often reach. So covers and muted previews fill the phone, and
  playing with sound eases the reel back to its whole frame.
- **No whip between pages** (from B). The frame gliding between pages does that job and builds on the
  cover transition the site already has.
- **Laptops and tablets only.** On a phone the visitor is already holding a phone; a drawn one only
  shrinks the video.

**Success criteria**

1. On first load, the hero line builds word by word like one of his captions and is complete within
   about 3.5 s. Nothing visible moves while it builds (layout shift stays 0).
2. Headings, feed titles and the services build once, as they come into view. Under Reduce Motion or
   without JavaScript, all text is simply there, and screen readers read it whole at any moment.
3. On screens 760 px and wider, every vertical reel stands in the phone frame of §3. Laid over the
   owner's photo at the same size, its edges, island, lens and buttons match within about a pixel.
4. Tapping a picture always plays it where it is. Tapping a title always opens its page, and the
   frame glides there. Back returns to the same piece, and the frame glides back into its slot.
5. Nothing regresses: every unit and end-to-end test passes (updated where the phone changes the
   geometry), the home page stays under the 12 KB JavaScript budget, and Lighthouse (mobile) stays at
   95 or more in all four categories on the home page and a video page.

## 2. Motion: "Captions"

Mahmoud's reels build captions word by word as they are spoken, turn the key word gold, and stretch
Arabic words with kashida (ـ). The site's text does the same, at a few chosen moments only.

| Moment | When | What happens |
|---|---|---|
| Hero line | On load, after the name and role have wiped in (from 1.15 s) | Words pop on one by one, 270 ms apart, with an extra 240 ms after a comma. The key phrase is gold: «كتابة متحركة» / "kinetic captions". In Arabic, «متحركة» stretches with kashida and relaxes again; the next word waits for it (about 600 ms). |
| Section headings | When whole on screen (text too tall for that: once 15% of the screen in) | Words pop on 210 ms apart. The contact heading's key word is gold: «سوا» / "together". Single-word headings just pop. |
| Feed titles | When in view | Words pop on 150 ms apart. |
| Services | When the list is in view | Items pop on 170 ms apart; each item's rule draws in from the reading start. |
| Video page title | Once the frame has landed (from 0.65 s) | Words pop on 190 ms apart. |
| Kept as is | | The name and role wipes, muted previews and the hover underline. The "See the work" cue now starts at 3.9 s, after the hero line. |

**The pop**: 180 ms. A word appears at once at 80% of its size and 0.22 em lower, then settles into
place with a slight overshoot (`cubic-bezier(0.34, 1.56, 0.64, 1)`), like the pops in his captions.
It is fully opaque from its first frame, so there are no half-transparent frames for contrast checks
to catch. Durations and curves become tokens in `src/styles/tokens.css`.

**Rules**

- The text is in the page from the start, whole, for search engines and screen readers. Words are
  split into spans at build time. Screen readers read each line from a visually hidden copy of it and
  the spans are hidden from them, since some screen readers (VoiceOver on iOS) read separate spans as
  separate items. Hidden words use `opacity: 0`, so links stay focusable, and a title reached by
  keyboard builds at once.
- Each word is its own inline block, and inline blocks follow the line's direction, so a run in the
  other script ("Nike Air Max 2024" in an Arabic title) stays together as one unit.
- Words are hidden only when motion is allowed. A tiny inline script in `<head>` adds `motion` to
  `<html>` when JavaScript runs and the visitor does not prefer reduced motion. Without it, no build
  runs and the text is plain.
- The hero line and the video page title are timed in CSS, so they do not wait for any script to
  download. Headings, feed titles and services build from a small module (`src/scripts/motion.ts`,
  about 1 KB) using `IntersectionObserver`.
- Something already on screen when the module starts is shown at once, without a build. That covers
  arriving at a piece from its page.
- Each moment builds once per page view.
- Arriving at a `#fragment` (`#reel-<slug>`, `#about`) jumps straight there: the site's smooth
  scrolling is for links within a page, so it is off until the page has loaded.
- The kashida stretch never moves anything. It is drawn in an overlay copy of the word that extends
  into the space of the words not yet shown, while the word itself keeps its width. It runs only if
  the module is ready before «متحركة» appears; otherwise it is skipped.
- Gold marks come from `src/lib/i18n.ts` (which words are key); splitting and marking live in a new
  `src/lib/words.ts`.

## 3. The phone frame

**Where**: pieces narrower than 0.6 of their height (9:16 reels and taller, such as screen
recordings), on screens 760 px and wider, which is where the feed lays out in rows. It applies in the
feed and on the video's own page. Square, 4:5 and landscape pieces keep plain frames. Phones keep
today's edge-to-edge frames.

**Drawn in CSS only**: no image to download, sharp at any size, decorative (`aria-hidden`, no pointer
events). Every size is a share of the phone's outer width: the phone takes its width from its stage
(container units), and its parts take theirs from the phone, which is itself a size container.
Measured on the owner's photo (2528 × 1228 px, phone 2523 × 1210):

| Part | Measure (% of the phone's width unless noted) |
|---|---|
| Outline | width / height 0.4796 |
| Corners | superellipse, exponent 2.6: `border-radius: 22.8%` with `corner-shape: superellipse(1.38)`; browsers without `corner-shape` get round corners at 18.2% |
| Metal rim | 0 to 1.57: dark edge, body, highlight line, falloff |
| Groove, glass line | 1.57 to 1.65, 1.65 to 1.82, then a soft fade to black by 2.75 |
| Bezel | black, to 3.64 |
| Screen | 9:19.5; corners 19.16 (superellipse) or 14.56 (round) |
| Island | 21.57 × 8.35, 6.94 from the top, centred; lens ⌀ 2.5 in the centre of its right end, inside a faint ⌀ 4.5 ring |
| Buttons (% of height) | right side 31.1 to 42.9; left: action 20.6 to 25.2, volume 28.6 to 36.0 and 38.0 to 45.5; standing out 0.58 (right) and 0.5 (left) |
| Antenna break | right rim, 10.3 to 11.3 of the height, matte |
| Cherry | edge #150c0d, body #452a2e, highlight #93707a, falloff #231012, groove #060304, glass #484a49, antenna #2b171a; light from the right |

**Filled at rest, whole while watching**

- On these screens the player itself is the phone's screen (9:19.5). The cover and the muted preview
  fill it, and the island floats over them, as in the photo.
- "Play with sound" eases the cover and the video from filled to the whole 9:16 frame, over 560 ms on
  the site's `--ease-cut`. The blurred preview image the player already carries shows above and below,
  and the island sits in the band above, clear of the video.
- The play button, the duration, "Tap for sound", the end card and the error message all stay inside
  the screen, clear of its rounded corners.
- Under Reduce Motion the switch happens without easing.

**Layout**

- On these screens, `src/lib/rows.ts` counts a framed reel as 0.4796 wide (its outline).
- Rows of phones are taller than rows of bare reels, so the breakpoints in `Reel.astro` move to keep
  every full row on one screen at the six tested sizes: two a row below 860 px or on screens taller
  than wide; three from 860 px on screens up to about 1.56:1; four from 1150 px on wider screens
  (1280×720, 1440×900 and 1366×657 laptop windows) and from 1472 px on windows under 933 px tall. A row
  holding a 4:5 post may take one piece fewer, so every phone keeps room for its play button.
- The play-button minimum applies to the phone's screen, not its outline.
- A phone is never narrower than 15.1 rem, so its screen keeps the play button's 14 rem; on very
  short screens it is then taller than the window, as plain frames already are.
- On the video page, the phone's column is as wide as the phone at the page's frame height.

## 4. Play here, open there

The same five rules for every piece, framed or not:

1. **The picture plays, right there.** Tapping or clicking a video frame plays it with sound where it
   is; nobody leaves the page to watch.
2. **The title opens its page.** Every feed title carries an arrow in a circle, like the one beside
   "See the work", pointing the reading way. The arrow nudges forward on hover and keyboard focus. It
   is decorative, so the link's name stays the title. Small thumbnails under "More work" are links too.
3. **The frame glides.** Only the frame of the piece being opened, or returned to, carries the
   transition name: the `<head>` script adds `.is-gliding` (`view-transition-name: frame`) to it on
   `pageswap` in the old page and on `pagereveal` in the new, so no other frame moves. That is the
   phone (framed reels on wider screens) or the player (everything else), or a "More work" thumbnail.
   It replaces today's static `cover-<slug>` names. It moves in 620 ms on `--ease-cut` while the rest
   cross-fades. A frame is named only while it is on screen, so none ever flies off screen. Arriving
   at `#reel-<slug>`, a render-blocking `<link rel="expect">` waits for that piece and the feed jumps
   to it before it is revealed.
4. **Back lands where you left.** «كل الشغل» links to `#reel-<slug>` on the home page instead of
   `#work`. Each feed piece carries that id, with a scroll margin, so it arrives in view and the frame
   glides into its own slot.
5. **Phones and Reduce Motion.** On phones: the same rules without the phone frame. Under Reduce
   Motion: no glide (as today), no builds, no easing. Every tap still does the same thing.

## 5. Accessibility and performance

- Semantics are unchanged: the play button keeps its name ("Play with sound: «title», 0:30 long"),
  titles are links, back is a link.
- The focus ring is unchanged; the title arrow's nudge also happens on `:focus-visible`.
- JavaScript: `motion.ts` is about 1 KB on top of the player; the home page stays under the 12 KB test
  budget.
- Layout shift: builds use opacity and transform only, and the kashida stretch is an overlay.
- Largest paint: unchanged (the portrait on the home page, the cover on a video page). Neither is
  hidden or delayed.
- Browser support:
  - `corner-shape` is Chromium-only for now; others get round corners about a pixel off at site
    sizes.
  - Browsers without view transitions change pages without the glide.
  - No scroll-driven animations are used.

## 6. Testing

**Unit (Vitest)**

- `words.ts`: Arabic and English splitting, punctuation kept with its word, key marks, the kashida
  point, which must come after a letter that joins forward.
- `rows.ts`: rows keep their counts per layout with the phone ratio, and the play-button minimum is
  checked on the screen.

**End to end (Playwright, both projects)**

- **Motion**
  - The hero line ends with every word shown and the key words gold.
  - No `layout-shift` entries appear during the build.
  - Headings and titles build when scrolled to.
  - Under Reduce Motion, and with JavaScript off, all text is visible at once and no word is
    animated.
- **Frames**
  - Framed reels show the phone at 760 px and wider, and no phone on phones.
  - The screen is 9:19.5, and the cover and video files keep the true shape.
  - The phone and its play button fit the first screen of the feed and of the video page.
  - Rows keep one height, fill the width and keep his order at the six tested sizes.
  - After "Play with sound", the video's box is 9:16 and sits inside the screen.
- **Rules**
  - Clicking a picture plays it and leaves the URL alone. Clicking a title opens its page.
  - One frame on each side of a page change carries the glide's name, and none at rest.
  - The back link targets `#reel-<slug>` and arrives with that frame in view.
- **Accessibility**: axe finds no serious or critical issues.

**Manual**

- The owner's Chrome at phone and laptop sizes; Mobile Safari in the iOS Simulator.
- Lighthouse on the production build.
- The overlay check against the photo.
- Refreshed screenshots in `docs/screenshots/`.

## 7. Out of scope

- B: cut transitions on the video frames, and the page whip.
- C: scroll-scrubbed motion.
- A phone frame on phones, or around square, 4:5 and landscape pieces.
- Realistic mockup details: gloss, notch.
- Instagram's own interface around the reels.
- A showreel.
- Pushing or deploying, which is the owner's call.
