# Presentation Brief — ExcelFile Operations

**Purpose of this file.** A self-contained, verified description of the application, written
so it can be pasted into a fresh Claude conversation (claude.ai, no repo access) to generate
a deck in any format — PowerPoint, Google Slides, Keynote outline, a one-pager, or speaker
notes.

Everything below was checked against the code on **2026-08-25**. Where something is
inferred rather than read off the code, it is marked.

> **Suggested prompt to use with this file:**
> *"Here is a brief describing an internal web application. Build me a 12-slide deck for a
> technical team presentation. Use only the colour palette and typography rules in the
> Design section — no other colours. Keep the honesty of the 'Open items' section; do not
> soften it."*

---

## 1. Identity

| | |
|---|---|
| Package name | `excelfile-operations` v0.0.0 |
| Name in metadata | ExcelFile Operations |
| Name in the UI | ExcelAI / ExcelAI Master |
| One-line description | A browser-based workbench for the spreadsheet operations that are tedious across multiple files — compare, merge, split, join, clean, profile and chart — with nothing ever leaving your machine. |
| Audience for the deck | Internal team, technical and semi-technical |

⚠️ **The naming is inconsistent across five surfaces.** Pick one for the deck and note the
inconsistency as an open item rather than hiding it.

---

## 2. The problem

Everything this tool does is *possible* in Excel. Three things make it painful:

- **Work that spans files.** Comparing two exports, merging a dozen lists onto a common
  header set, or pulling columns from one workbook into another means cross-file formulas
  that break when a file moves and are near-impossible to audit.
- **Work that repeats.** The same clean-up runs on every new export — trim whitespace,
  normalise case, drop duplicate rows, prefix an ID column — and gets redone by hand every
  time.
- **Work with customer data.** The convenient online tools all require uploading contact
  lists to somebody else's server.

---

## 3. The shape of the answer

A static single-page app. **No backend, no database, no account, no upload.** Files are
read into the browser tab, transformed in memory, and written back out as a download.

```
Browser tab
  └── React 19 SPA ──► SheetJS (xlsx) ──► file download
        (no network calls at all)
```

Four stages per session:

1. **Load** — one or many `.xlsx` / `.xls` / `.csv` / `.txt` files.
2. **Inspect** — preview the table; profile every column for type, distinct values, missing
   values, numeric range.
3. **Operate** — clean, compare, merge, split, join, chart.
4. **Export** — `.xlsx`, `.csv` or tab-delimited `.txt`.

Everything is local, deterministic and synchronous. **There is no AI**, despite the naming —
an earlier scaffold included a Gemini integration and it was never wired up.

---

## 4. The nine workspaces

| # | Workspace | What it does |
|---|---|---|
| 1 | **File Manager** | Upload and remove files; shows row and column counts |
| 2 | **Operations** | Queue an ordered pipeline of cleaning steps and apply it |
| 3 | **Data View** | Preview the table; export in any format |
| 4 | **Compare Files** | Key-column comparison of two files: in-A-only, in-B-only, common |
| 5 | **Merge / Split** | Merge many files onto a union of headers; split one file three ways |
| 6 | **VLOOKUP** | Join columns from a lookup file into a source file on a key |
| 7 | **Smart Insights** | Per-column data profile — type, distinct, nulls, min/max |
| 8 | **Formula Builder** | Generate Excel formula text from five templates |
| 9 | **Visualizations** | Bar, line and pie charts over any two columns |

**A detail worth a slide:** the Operations pipeline is *queued*, not immediate. You compose
the sequence, then choose whether to apply it to the file (destructive, in memory) or
produce a separate result — which is what makes a repeated clean-up a one-click operation
the second time.

**A second detail:** Split has three modes — by the distinct values of a column (one file
per client or category, with filenames sanitised), by fixed row count (batching), or by a
row/column percentage. That covers most of why people split a file by hand.

---

## 5. Why client-only is the headline, not a limitation

Worth its own slide, because it is the strongest thing about the product:

- **No file ever leaves the machine.** There is no `fetch`, no upload endpoint, no
  telemetry, no analytics anywhere in the codebase.
- **Nothing is stored.** No `localStorage`, no cookies, no database. Closing the tab clears
  everything.
- **No account, no key, no vendor.** It runs from a folder of static files.

For contact lists and lead data, that is a compliance answer, not just a technical one.

---

## 6. Technology

| Layer | Choice |
|---|---|
| UI | React 19, TypeScript 5.8 |
| Build | Vite 6 |
| Spreadsheet I/O | SheetJS (`xlsx`) |
| Charts | `recharts` |
| Icons | `lucide-react` |
| Styling | Tailwind, loaded from CDN |
| Backend | *(none)* |
| Tests | *(none)* |

About 2,850 lines in total: 2,561 across 12 components, a 175-line shell, 35 lines of
shared types and a single 64-line I/O module. The whole spreadsheet read/write surface is
two functions.

---

## 7. Two engineering details worth showing

**Value fidelity is a deliberate choice.** The reader is configured with `raw: false`, so
cell values arrive as formatted strings rather than being coerced to numbers. That is what
keeps `+49…` phone numbers, leading-zero postcodes and long account IDs intact through a
round trip. Panels convert to numbers locally where they actually need to. It is a one-word
option that decides whether the tool is trustworthy with real data.

**Merge normalises rather than concatenates.** Merging builds a master header set across
every selected file, then rebuilds every row against it with blanks for missing fields. The
output is rectangular no matter how mismatched the inputs were — which is the difference
between a merge that works on real exports and one that works on demo data.

---

## 8. Open items — do not soften these

State them plainly; they are the honest half of the deck.

| Item | Impact |
|---|---|
| **The "AI" branding is empty** | Four surfaces are named as though a model is involved and the metadata claims it is "powered by Google Gemini". Nothing performs inference. Needs a rename or a real decision. |
| **Only the first worksheet is read** | Multi-tab workbooks lose every other tab, silently. No sheet picker. |
| **Columns are read from the first row only** | A field missing from row 1 is invisible in every view and every export. |
| **A VLOOKUP defect** | The joined column's name is decided per row, so only the first row's naming survives. Real data loss. |
| **No undo** | Applying an operation queue overwrites the working copy irreversibly. |
| **No tests, no CI, no linter** | ~2,600 lines verified entirely by hand; TypeScript `strict` is off. |
| **Off-brand UI** | Stock Tailwind indigo with drop shadows, against an eGENTIC guide that permits neither. |
| **Not deployed, not version-controlled** | No host config, and no git repository. |

---

## 9. Design section — for the deck itself

Use the **eGENTIC corporate palette only**. Full detail in `eGENTIC-design-guide.md`.

**Primary:** Blue `#204D6E` · Light Blue `#0069AA` · Dark Blue `#163650` · Gray `#7C8488` ·
Light Gray `#95A2AC` · Dark Gray `#59606C`
**Backgrounds only:** Cyan `#91C9E7` · Light Cyan `#E5F2FC`
**Accents, selective use:** Orange `#EB8A40` · Yellow `#FFAF22` · Blue Black `#091828`

**Typography:** Roboto — Black for headings, Bold for subheadings, Regular for body. Inter
is the only permitted substitute. No other typeface.

**Rules:** no drop shadows anywhere. No green and no red — they are not in the palette, so
encode status with an icon, a label or an accent rule in Orange. A Blue→Orange gradient is
an approved accent treatment. Logo clear space equals the logo's own height.

⚠️ **The application itself does not follow this guide** — it uses stock Tailwind indigo and
grey with shadows. The deck should follow the guide; do not sample colours from screenshots
of the app.

---

## 10. Suggested narrative arc

1. Title
2. The problem — three pains, one slide
3. What it is — one screenshot, one sentence
4. The four stages: load → inspect → operate → export
5. The nine workspaces — the grid table from §4
6. Deep dive: the queued Operations pipeline
7. Deep dive: merge and the three split modes
8. **Client-only** — the privacy/compliance slide (§5)
9. Technology and shape of the codebase
10. Two engineering details (§7) — for a technical audience
11. Open items (§8) — unsoftened
12. What's next / decisions needed
