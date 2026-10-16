# Sonoform: tap-to-fill USG reports

An installable, offline web app for iPhone, iPad and Mac. Pick a study, tap chips for each organ, and the report writes itself. Findings come out as full-sentence paragraphs and the impression as short bullets suggested from the positive findings, which you can edit. You can copy the report as plain text, print it, or save it as a Word file on your letterhead. Handwriting with Apple Pencil works on any row.

It is built from the Sonoform design (`reference/sonoform.dc.html`), including all of Sanay's clinical review changes. Its report text is tested to be identical to the design's.

**Live app:** https://saanayy.github.io/medreport/

## Screens

- **Home:** choose a study and see recent drafts with their progress. Tap a draft to resume it; **Edit** lets you delete drafts.
  - **Available:** Whole Abdomen (Male or Female), KUB, and Pelvis (TAS or TVS).
  - **Listed as "Coming soon":** Thyroid & Neck, Scrotum and Obstetric. The design doesn't define their forms yet.
- **Fill:** patient details (the name is required), one card per organ and a Sign-off card for other findings, advice and consultant.
  - Normal picks fill grey; positive findings fill terracotta.
  - A measurement field appears only when the chosen option needs one. A required field that is empty has a terracotta border and a "Required" label.
  - **All normal** works per organ. **Rest normal** marks every untouched row normal, with Undo.
  - **Next** jumps to the next row that is unmarked or missing a required value.
- **Report:** a live preview. It opens as a full-screen sheet on iPhone, as a side sheet on iPad, and sits in the right-hand column on Mac.
  - **Edit** lets you change the impression; **Reset** goes back to the suggestion.
  - **Copy text** and **Save as Word** stay blocked until the patient name and every required value are filled.
- **Settings:** letterhead (institution, department, address), consultants (one signs by default), resident name, advice phrases (one is the default), appearance, and filled or tinted positive chips.

## Layouts

- **Below 1024 px (iPhone, iPad portrait):** one column, a sticky header with a progress ring, a scrolling organ strip, and a bottom dock with Next, Rest normal and Report.
- **1024–1279 px (iPad landscape):** an organ sidebar with progress and the Next, Rest normal and View report buttons.
- **1280 px and wider (MacBook):** a top bar, the organ sidebar, the form, and the live report.
- **Touch screens** get 44 px controls; a mouse or trackpad gets the Mac's denser 36 px controls.
- **Paired organs** (kidneys, ovaries, pleural spaces) sit side by side when there is room.

## Patient data

Nothing leaves the device. There is no server and no account. Drafts and settings live in the browser's storage on each device, so a phone and a Mac keep separate drafts. A draft left completely empty is discarded. **Settings → Delete all drafts** clears everything, with Undo.

## Hosting and installing

The app is a folder of static files and needs HTTPS for offline use. On GitHub Pages: **Settings → Pages → Deploy from a branch**, branch `main`, folder `/ (root)`.

- **iPhone or iPad:** open the link in Safari, then **Share → Add to Home Screen**.
- **Mac:** open the link in Safari, then **File → Add to Dock**.

After the first visit the app works offline. A published change reaches each device the second time the app is opened.

## Changing the form

The form and all report wording are in `js/schema.js`:

- `ORG` lists the organs, rows, options, measurement fields and detail panels.
- `W` holds one writer per organ that turns marks into findings sentences and impression lines.
- `STUDIES` sets which organs each study uses.
- `DEFAULT_SETTINGS` holds the starting letterhead, consultants and advice phrases.

The comment at the top of `schema.js` explains each key.

## Development

```
npm run serve     # http://localhost:8080
npm test          # report text, progress and export rules vs. the Sonoform design
npm run fixtures  # regenerate tests/fixtures.json by running the design's own code
```

`tools/make-fixtures.mjs` runs the logic inside `reference/sonoform.dc.html` on the cases in `tests/cases.mjs`. The tests then check that the app gives the same findings, impression, progress counts and export blockers. If you change wording on purpose, change it in `js/schema.js` and update the expected output in `tests/fixtures.json`.

If you add a file to the app, list it in `FILES` in `sw.js` and bump `VERSION`.

## Layout

```
index.html              markup for the screens
css/app.css             styles (design tokens, light/dark, phone/iPad/Mac layouts)
fonts/                  Instrument Sans and Source Serif 4 (self-hosted for offline use)
js/schema.js            the form, report wording, studies, default settings
js/engine.js            marks → findings, impression, progress, plain text (no DOM)
js/app.js               screens, input, drafts, settings, copy/print/Word
js/ink.js               Apple Pencil handwriting
js/docx.js              Word export (no libraries)
sw.js, manifest.webmanifest, icons/   offline + install
tests/, tools/, reference/            tests against the Sonoform design
```
