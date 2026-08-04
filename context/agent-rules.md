# Agent Rules

Rules for any AI agent (Claude Code, Copilot, Cursor, custom SDK agents) working on this
repository. These are operational rules layered on top of `system-rules.md`, which is the
non-negotiable substrate.

Verified against the code on **2026-08-25**.

> **Never cite line numbers in documentation you write here.** Line references rot within
> weeks. Reference symbol names and file paths instead.

---

## 1. Read context first, every task

Before touching code, read in this order:

1. `context/system-rules.md` — what you must not break
2. `context/architecture.md` — where things live and why
3. `context/coding-conventions.md` — how to match the local style
4. `context/features-functionalities.md` — what already exists, so you don't rebuild it

For product-behaviour tasks, also read `context/business-overview.md`. For anything visual,
read `context/eGENTIC-design-guide.md` **and** the styling section of
`coding-conventions.md` — the app does not currently follow the guide, and that gap is
unresolved, so you need both.

Skipping this is the most common cause of bad changes here. This codebase carries
non-obvious properties that are invisible from the file you happen to be editing: the
row-zero column derivation, the `raw: false` export contract, the deliberately
never-unmounted `CleaningPanel`, and the fact that nothing labelled "AI" performs any
inference.

---

## 2. Confirm before changing behaviour

- **Presentational changes** — proceed, then report what changed.
- **Functional changes** — ask first, explicitly, even when they look like a natural part
  of the task. Restyling a table is presentational; changing which rows survive a transform
  is not.
- **Show the plan before editing.** Locate the file, quote the current code, describe the
  change and any decision it forces, then wait.
- When a decision is genuinely open, present **options with a recommendation** rather than a
  survey.

---

## 3. Never commit or push unprompted

- Finish the work, report it, leave it unstaged. The diff gets reviewed before it lands.
- Commits carry the repository owner's identity only. **Do not add a `Co-Authored-By:
  Claude` trailer** or any other agent attribution.
- Note: this directory is **not currently a git repository** (`git init` has never been
  run). Do not initialise one as a side effect of another task — it is the owner's call.
  Until then, treat every edit as unrecoverable and say what you changed.

---

## 4. Data-integrity tripwires

If your change touches any of these, re-read `system-rules.md` §§1–4 and call the change
out explicitly:

- `readExcelFile` — especially the `raw: false` and `defval: ""` options, and the
  first-sheet-only read
- `downloadExcelFile` — the `bookType` mapping and the extension rewrite
- `App.handleFileUpdate` — the row-zero `Object.keys` column derivation
- `processData` in `CleaningPanel.tsx` — the transform engine and its `switch`
- `handlePerformVlookup` in `VlookupPanel.tsx` — the per-row column-naming defect
- `handleMerge` / `handleSplit` in `MergePanel.tsx` — header union and row chunking
- **Anything that introduces a network call or persistence.** There are currently none.
  Adding either is a product decision, not an implementation detail.

**Special tripwire:** any change that makes an exported file's contents, column set or
filename differ from before must be stated plainly in your report, even when it is an
improvement. Users diff these files.

---

## 5. Keep new logic pure and extractable

There is **no test suite** — no runner, no test script, no test files. That is the single
biggest quality gap in the project, and it means every change is verified by hand.

Until a suite exists:

- **Write new pure logic as standalone functions in `utils/` as `.ts`**, with the React
  binding separate. Keep React out of `utils/` entirely, so a runner added later needs no
  DOM.
- When you find yourself writing a non-trivial pure function inside a component, move it.
  `processData` and the merge/split logic are the standing examples of logic that should
  have been extracted and was not.
- **Proposing a test setup is welcome. Adding one silently as part of another change is
  not** — it touches `package.json` and the project's tooling story.

---

## 6. Verify by running the app, not by reasoning

**This is not optional and not ceremony.** A spreadsheet tool fails in ways that read
correctly in the diff: a column that vanishes because it was missing from row 0, a number
that becomes a date, a `0` that renders blank.

```bash
npm run build     # confirm it succeeded — grep the output for "built in"
npm run preview   # serves the built ./dist
```

- **Always confirm the build succeeded first.** A failed build leaves the previous bundle
  being served, so the result looks *stale* rather than broken — which reads as "my change
  did nothing".
- **For any change touching data: open the exported file.** Do not stop at the on-screen
  table. Data View shows only the first 100 rows and charts only the first 20, so the
  screen is not the artefact — the download is.
- **Test with a messy workbook**, not a clean one: mixed types, blank cells, a column
  missing from the first row, a leading-zero postcode, a `+` phone number, duplicate keys.
  Those are the cases that break.
- Type-check with `npm run lint` (`tsc --noEmit`) — but note `strict` is off, so it will
  not catch null and undefined mistakes for you.

---

## 7. Prefer existing patterns over new ones

This codebase is small and deliberately stays that way. Before adding a dependency,
abstraction or pattern, check whether one already covers the case:

| If you want to… | Use the existing… |
|---|---|
| Read a spreadsheet | `readExcelFile` in `src/lib/excel/index.ts` — never call `XLSX.read` directly |
| Write any file out | `downloadExcelFile` in `src/lib/excel/index.ts` |
| Offer a download UI | `ExportMenu`, which calls back with an `ExportFormat` |
| Add a button | `Button` from `@/components/ui/Button` — variants, sizes, `isLoading` |
| Add a row/column transform | a `case` in `processData`, plus the member on `CleaningAction['type']` |
| Add a tab | the `AppTab` enum, a `NavItem` in `Layout.tsx`, **and both ternary chains** in `App.tsx`, plus a new `src/features/<name>/` folder |
| Pick a file in a panel | the `selectedFileId` + self-healing `useEffect` idiom used by every panel |
| Show an empty state | the early-return centred card with a `lucide-react` icon |
| Generate an ID | `crypto.randomUUID()` |
| Name a derived file | suffix the original stem — `_modified`, `_processed`, `_part_N` |
| Style anything | stock Tailwind classes matching the surrounding file — there is no config to extend |

**Do not touch the export path when asked to change a table or a chart.** Confirm the data
still reaches `downloadExcelFile` and leave it alone; it is the piece users depend on most
and the least visible when broken.

---

## 8. Do not add "AI" to something because it is labelled AI

Four surfaces are named as though they use a model — the sidebar's "VLOOKUP AI", "Formula
AI" and "Smart Insights", and the "ExcelAI" wordmark. **None of them do**, and the dead
`GEMINI_API_KEY` defines in `vite.config.ts` plus the `@google/genai` importmap entry make
it look as though one is half-wired.

- Do not "finish" that integration on your own initiative.
- Do not send row data to any model, service or endpoint. See `system-rules.md` §1.
- Removing the dead references is sanctioned cleanup; adding a live one is a product
  decision that needs asking, with a data-handling answer attached.

---

## 9. Do not treat these documents as ground truth

The previous occupants of `context/` described a **completely different application** — an
IMAP email analytics tool with an Express backend — and survived here long enough to be
read as authoritative. They have since been deleted. If you find a claim in these documents
that does not match the code, assume the document is wrong, not the code.

- **Verify a claim against the code before acting on it**, especially a data-safety claim.
- When you find a document wrong, say so and offer to fix it — do not quietly work around
  it.
- When you change behaviour these documents describe, update them in the same change.
- Every document here carries a "verified against the code on" date. Update it when you
  re-verify, not when you edit prose.
