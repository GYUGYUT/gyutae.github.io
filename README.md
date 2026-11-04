# Portfolio (GitHub Pages)

This repository hosts my **personal portfolio** on GitHub Pages.

## Preview locally

This is a static site, so you can preview it quickly.

- macOS:

```bash
open index.html
```

## What to edit (recommended)

Update these in `index.html`:

- Name / affiliation / bio
- Links: GitHub, Google Scholar, LinkedIn, email
- Research topics (2–3)
- Projects (3–6)
- Publications & talks

## CV upload

Upload your CV as `assets/cv.pdf` and the top button will point to it.

## Achievement sync

Achievement data now lives in `data/achievements.json`.

When you add or edit publications, patents, scholarships, awards, certifications, or service entries, run:

```bash
node scripts/sync-achievements.mjs
```

Optional publication fields used by the redesigned layout:

- `venueShort` — short venue tag shown as a badge (e.g. `WACV`, `ACCV`)
- `category` — `conference`, `journal`, or `domestic` (CV grouping)
- `note` — small annotation such as `SCIE · JCR Q1`
- `distinction` — e.g. `Oral`

The headline numbers in the hero (`.stats`) and the "Selected Work" cards are hand-written in
`index.html`; update them when the counts change.

This updates:

- `index.html`
- `assets/cv.html`
- `assets/cv.pdf`
