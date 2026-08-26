# System Rules

Non-negotiable constraints. Violating any of these is grounds for rejecting a change.

Verified against the code on **2026-08-25**. Rules reference symbols, not line numbers.

---

## 1. All processing stays in the browser

The application has **no backend**. Spreadsheets users load here are customer data —
contact lists, lead exports, commercial records — and today they never leave the tab.

- **Never add an upload endpoint, a proxy, or any outbound request carrying row data.**
  There is currently no `fetch`, `XMLHttpRequest`, `WebSocket` or `navigator.sendBeacon`
  anywhere in the codebase. Keep it that way.
- **Never add analytics or error telemetry** that could carry column names, cell values or
  file names off the machine.
- **`localStorage` holds exactly one key: `excelai-theme`.** That is the light/dark
  preference and nothing else. Never store spreadsheet data, column names, file names or
  anything derived from a loaded workbook — not in `localStorage`, `sessionStorage`,
  IndexedDB, cookies or the File System Access API. A reload must still clear every row
  the user loaded. ESLint enforces this: `App.tsx` is the only file permitted to touch
  storage at all.
- The Data Profiler says so to the user in as many words: *"All statistics are calculated
  locally in your browser."* Do not make that sentence false.

If a feature genuinely requires a server, that is a product decision requiring explicit
sign-off, not a refactor.

## 2. Column shape is derived from row zero — keep rows uniform

`columns` is computed as `Object.keys(data[0])` in **two** places: `readExcelFile` when a
file is loaded, and `App.handleFileUpdate` after every transform. Every table render and
every export iterates `columns`.

**A key that exists on some rows but not on row 0 is invisible.** It will not render, and
`json_to_sheet` will not export it.

So: **any transform that adds or renames a key must apply it to every row, unconditionally.**

- `processData` in `CleaningPanel` is correct here — every branch `map`s over all rows.
- `handlePerformVlookup` in `VlookupPanel` is **not**. It picks the target column name
  per row (`row[col] !== undefined ? \`Lookup_${col}\` : col`), so two rows can receive
  different keys from the same operation. Whichever name row 0 happens to get is the only
  one that survives. Decide the name once, before the `map`, and use it for every row.

Do not copy the `VlookupPanel` pattern. When you touch that function, fix it.

## 3. Never mutate the user's source file

The application reads a file into memory and never writes back to disk in place.

- Transforms produce **new arrays** — `processData` and every panel use `map`/`filter`, not
  in-place mutation. Keep it that way; `files` state is compared by reference.
- Exports always go to a **new filename**. `handleDownload` appends `_modified`,
  `CleaningPanel` appends `_processed`, `MergePanel` appends `_split_…` / `_part_…`.
  Never emit a download whose name matches the uploaded file exactly.
- `handleFileUpdate` **replaces a file's rows irreversibly** — there is no undo, no history
  and no confirmation. Anything that calls it is destroying the user's working copy.
  Adding a new caller is a functional change: ask first (`agent-rules.md` §2).

## 4. Export fidelity is the product

Users come here to get a file out. The export path is the least visible thing when it
breaks and the most damaging.

- **`raw: false` in `readExcelFile` is deliberate.** It keeps cell values as formatted
  strings, so leading `+`, leading zeros and long numeric IDs survive the round trip.
  Removing it silently corrupts phone numbers, postcodes and account numbers. If a panel
  needs a number, it converts locally — as `AnalysisPanel` and `ChartPanel` already do.
- **`defval: ""` is deliberate.** It keeps every row keyed identically, which is what
  makes §2 tolerable at all.
- `downloadExcelFile` is the single export path. Route new exports through it rather than
  calling `XLSX.writeFile` directly, so the extension and `bookType` stay consistent.
- **Do not change export behaviour while working on a table or a view.** Confirm the data
  still reaches `downloadExcelFile` and leave it alone.

## 5. No AI dependency, and no API key, without a decision

Despite the naming — "ExcelAI", "VLOOKUP AI", "Formula AI", "Smart Insights" — this
application performs **no inference of any kind**. Every panel is deterministic local code.

- Every scaffold leftover has been deleted: the `GEMINI_API_KEY` defines, the
  `@google/genai` importmap entry, and the generated `metadata.json`. **Do not
  reintroduce them.**
- **Wiring up a real model is a product decision**, not an implementation detail: it breaks
  §1 the moment row data is sent to a provider. Ask first, and expect the answer to require
  a data-handling story.
- Never commit an API key, and never add a `.env.local` to version control.

## 6. Do not unmount `CleaningPanel`

`CleaningPanel` is rendered permanently and hidden with a `hidden` class, unlike every
other panel. It owns the operation queue and the processed-results list, both of which are
destroyed by an unmount.

Refactoring it to match the conditional-rendering pattern of its siblings silently discards
the user's queued work on every tab switch. If you need to change how panels are rendered,
this one is the exception that must survive.

## 7. Boundaries that require human review

Changes to any of the following need explicit approval, not just a clean `npm run lint`:

- `src/lib/excel/index.ts` — both functions, and particularly the `raw` / `defval` options
- `App.handleFileUpdate` — every destructive edit in the app funnels through it
- `processData` in `CleaningPanel.tsx` — the transform engine
- `handlePerformVlookup` in `VlookupPanel.tsx` — see §2
- `handleMerge` / `handleSplit` in `MergePanel.tsx` — header normalisation and row chunking
- Anything introducing persistence, a network call, or a new dependency
- Anything that changes an exported file's contents, column set or name
