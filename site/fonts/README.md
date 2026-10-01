# Fonts

Self-hosted, under the SIL Open Font License (the OFL files here). Astro serves them with
`unicode-range`, so a page downloads only the scripts it shows.

| File | Font | Made from |
| --- | --- | --- |
| `noto-sans-arabic.woff2` | Noto Sans Arabic, Arabic letters | `@fontsource-variable/noto-sans-arabic` `noto-sans-arabic-arabic-wght-normal.woff2` |
| `noto-sans-latin.woff2` | Noto Sans Arabic, Latin letters | the same package's `noto-sans-arabic-latin-wght-normal.woff2` |
| `barlow-condensed-600.woff2` | Barlow Condensed SemiBold | `@fontsource/barlow-condensed` `barlow-condensed-latin-600-normal.woff2` |

The Arabic file keeps standard Arabic (letters, marks, digits, punctuation) and the borrowed letters
Egyptian text uses (پ چ ڤ گ ی), with every shaping feature; a rarer letter shows in the phone's own
Arabic font. Both Noto files keep only the weights the site uses, 400 to 800:

```sh
pyftsubset noto-sans-arabic-arabic-wght-normal.woff2 \
  --unicodes='U+0600-0670,U+067E,U+0686,U+06A4,U+06AF,U+06CC,U+06D4,U+200C-200F,U+FEFF' \
  --layout-features='*' --flavor=woff2 --output-file=arabic-subset.woff2
fonttools varLib.instancer arabic-subset.woff2 wght=400:800 -o site/fonts/noto-sans-arabic.woff2
fonttools varLib.instancer noto-sans-arabic-latin-wght-normal.woff2 wght=400:800 -o site/fonts/noto-sans-latin.woff2
```

The brand renders (`npm run brand`) load the same files through `site/brand/templates/fonts.css`.
