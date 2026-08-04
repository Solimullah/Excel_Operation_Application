# Features & Functionalities

Verified against the code on **2026-08-25**.

Legend: ✅ implemented · 🟡 partial / known gap · 🔵 not built

> References use symbols and file paths, never line numbers.

---

## File Manager — `FileUpload.tsx`

- ✅ **Multi-file upload** — the input carries `multiple`; `handleFilesSelect` in `App.tsx`
  reads them all in parallel via `Promise.all`.
- ✅ **Accepted formats** — `.xlsx`, `.xls`, `.csv`, `.txt`, plus the `text/csv` and
  `text/plain` MIME types.
- ✅ **Re-uploading the same file works** — the input's `value` is reset after each change,
  which is what makes a second selection of the same filename fire an event.
- ✅ **File list** with per-file row and column counts, and a per-file remove button.
- ✅ **Format-aware icon** — `FileText` on a blue tile for `.csv`/`.txt`, `FileSpreadsheet`
  on a green tile otherwise.
- 🟡 **Only the first worksheet is read.** `readExcelFile` takes `workbook.SheetNames[0]`.
  A multi-tab workbook loses every other tab with no warning. There is no sheet picker.
- 🟡 **Columns come from row 0 only.** A key absent from the first row is invisible
  everywhere downstream — see `system-rules.md` §2.
- 🟡 **Errors are a single `alert()`** covering the whole batch. If one file in five fails,
  the message names none of them and the other four still load.
- 🟡 **No duplicate detection.** Uploading the same file twice yields two independent
  entries with different IDs.
- 🔵 **No drag-and-drop.** The upload card looks like a drop zone but is a styled `<label>`
  wrapping a hidden `<input type="file">`. There is no `onDrop` handler.
- 🔵 **No file-size limit, no row cap, no progress indication** beyond a "Processing
  Files…" label on the button.

---

## Operations & Cleaning — `CleaningPanel.tsx`

The transform engine. `processData(data, actions)` applies an ordered list of
`CleaningAction`s and returns new rows.

- ✅ **Queued pipeline** — build up a list of operations, reorder by removing and
  re-adding, then apply. The queue survives tab switches because the panel stays mounted
  (`system-rules.md` §6).
- ✅ **Row-level operations** — `remove_duplicates` (whole-row identity via
  `JSON.stringify`), `remove_empty` (drops rows where every value is blank).
- ✅ **Column-level text operations** — `uppercase`, `lowercase`, `trim`, `add_prefix`,
  `remove_prefix`. Each targets one column.
- ✅ **Two application modes** — *apply to file* (`handleApplyQueue`, calls
  `onUpdateFile` and clears the queue) versus *process to a result* (`handleProcess`,
  appends to a local `processedResults` list and leaves the source file untouched).
- ✅ **Export scope** — a processed result can be the full table or a single extracted
  column (`exportScope`).
- ✅ **Direct column extraction** — `handleExtractColumn` downloads one column immediately,
  in any supported format, without going through the queue.
- ✅ **Receives formulas from the Formula Builder** via the `incomingAction` prop; the
  effect appends it to the queue and switches file if needed.
- 🟡 **`apply_formula` does not calculate anything.** It writes the formula *string* into
  the target column for every row. In an exported `.xlsx` this lands as literal text, not
  as a live formula — SheetJS would need a cell `{ f: … }` for that. The Formula Builder is
  a template generator; treat it as such.
- 🟡 **`remove_duplicates` compares `JSON.stringify(row)`**, so it is sensitive to key
  order and matches only exact whole-row duplicates. There is no "duplicate by column".
- 🟡 **No undo.** `handleApplyQueue` overwrites the file's rows irreversibly.
- 🟡 **No preview of the effect** before applying.
- 🔵 **No find-and-replace, no split-column, no type coercion, no fill-down.**

---

## Data View — `DataView.tsx`

- ✅ **Tabular preview** with sticky-free horizontal scroll (`overflow-x-auto`).
- ✅ **Row cap is stated** — "Showing top 100 of N rows" sits next to the export menu.
- ✅ **Export** via `ExportMenu` → `App.handleDownload` → `<name>_modified.<ext>`.
- 🟡 **Hard-capped at 100 rows** (`data.slice(0, 100)`) with no pagination, no virtualised
  list and no way to see row 101. The export is unaffected and contains everything.
- 🟡 **Every cell is `row[col]?.toString() || ''`**, so a legitimate `0` or `false`
  renders as an empty cell.
- 🔵 **No sorting, no filtering, no search, no column hiding, no cell editing.**

---

## Compare Files — `ComparePanel.tsx`

- ✅ **Key-column comparison** between any two loaded files, choosing a column on each side.
- ✅ **Three result sets** — in A only, in B only, and common (taken as A's rows whose key
  appears in B).
- ✅ **Per-result export** in any supported format, named `comparison_<type>.<ext>`.
- ✅ **Gated on two files** with an explanatory empty state.
- 🟡 **Set membership only.** Keys are stringified into a `Set`; the comparison answers
  "does this key appear on the other side", not "did any field change". There is no
  cell-level diff.
- 🟡 **Duplicate keys are not reported.** They collapse in the `Set` and every matching row
  survives in `common`.
- 🔵 **No three-way compare, no tolerance/fuzzy matching, no change highlighting.**

---

## Merge & Split — `MergePanel.tsx`

Two modes behind one tab. Results accumulate in a local list, newest first, each with its
own export menu. **Results are not written back into `files`** — they exist to be
downloaded.

**Merge**
- ✅ **Union of headers** — every distinct non-blank column across the selected files
  becomes a master header.
- ✅ **Row normalisation** — every row is rebuilt against the master header list with `""`
  for missing values, so the output is rectangular regardless of input shape.
- ✅ **Live header preview** of the current selection before merging.
- ✅ **Requires two or more selected files.**
- 🟡 **Header matching is exact and case-sensitive.** `Email` and `email` become two
  columns. There is no mapping or aliasing step.
- 🔵 **No deduplication across merged files**, and no source-file provenance column.

**Split**
- ✅ **By column value** — groups rows by the distinct values of a chosen column, one
  result per group. Blank values collect under `Empty_Value`, and characters illegal in
  filenames (`<>:"/\|?*`) are replaced with `_`.
- ✅ **By row count** — fixed-size chunks, named `_part_1`, `_part_2`, …
- ✅ **By percentage** — a 1–99 split (clamped) producing exactly two parts, applied to
  either **rows** or **columns**. Column mode slices the header list and rebuilds each row.
- 🟡 **Column-value split has no cardinality guard.** Splitting on a high-cardinality
  column (an ID, an email address) produces one result per row.
- 🟡 **Results are lost on tab switch** — `MergePanel` unmounts, unlike `CleaningPanel`.
  Download before navigating away.
- 🔵 **No ZIP export.** Each result must be downloaded individually.

---

## VLOOKUP — `VlookupPanel.tsx`

- ✅ **Map-backed join** — the lookup file is indexed into a `Map` keyed by the stringified
  lookup column, so the join is linear rather than quadratic.
- ✅ **Multi-column pull** — select any number of columns to bring across in one pass.
- ✅ **Non-matches become `''`** rather than `undefined`, keeping rows rectangular.
- ✅ **Writes back into the source file** via `onUpdateFile`, then clears its selections.
- ✅ **Success banner** naming the column count and the target file.
- ✅ **Gated on two files.**
- 🟡 **The target column name is decided per row** —
  `row[col] !== undefined ? \`Lookup_${col}\` : col`. Rows can therefore receive different
  keys from one operation, and only the name row 0 receives is visible after
  `handleFileUpdate` recomputes `columns`. **This is a real defect** — see
  `system-rules.md` §2.
- 🟡 **Artificial 800 ms `setTimeout`** wraps the work "for UX". It is not doing anything
  useful and blocks nothing.
- 🟡 **Duplicate lookup keys** — the `Map` keeps the last row written, silently. Exact-match
  only; no approximate match, no case-insensitivity, no trimming.
- 🔵 **No preview of match rate** before committing, and no undo afterwards.

---

## Data Profiler ("Smart Insights") — `AnalysisPanel.tsx`

- ✅ **Per-column statistics**, computed locally in a `useEffect`: inferred type, distinct
  count, null count with percentage, and min/max for numeric columns.
- ✅ **Type inference** across three buckets — `number`, `date`, `string` — by testing
  every value with `Number()` / `Date.parse()`.
- ✅ **Card grid** with a type icon per column and a highlighted missing-value count.
- ✅ **Honest framing in the UI** — it is called a *Local Data Profiler* and states that
  statistics are computed in the browser.
- 🟡 **The tab is labelled "Smart Insights" and shows a `Sparkles` icon**, which reads as
  AI. There is no model involved; the panel body corrects this, the nav item does not.
- 🟡 **Type inference is all-or-nothing and order-dependent.** A column is `number` only if
  *every* non-blank value passes `Number()`, `date` only if every value passes
  `Date.parse()` **and** the column was not already numeric, and `string` otherwise. One
  stray value re-types the whole column.
- 🟡 **`Date.parse` is lenient enough to mislabel.** Verified: `"1/2"` and `"12-05"` are
  not numbers but do parse as dates, so a ratio or a product code becomes a `date` column.
  Numbers win first, so a year column like `"2024"` is `number`, never `date`.
- 🟡 **`ColumnStats['type']` declares `'boolean'` and `'unknown'`**, but the code never
  assigns either. Only three of the five members are reachable.
- 🔵 **No mean, median, standard deviation, histogram, outlier detection or correlation.**
- 🔵 **No cross-column or cross-file insight**, and no export of the profile.

---

## Formula Builder ("Formula AI") — `FormulaPanel.tsx`

- ✅ **Five templates** — `SUM`, `AVERAGE`, `CONCATENATE`, `IF`, `VLOOKUP` — each with a
  description.
- ✅ **Column substitution** — `{col1}` / `{col2}` placeholders are replaced with the
  chosen column names.
- ✅ **Copy to clipboard** with a two-second confirmation state.
- ✅ **Send to the Operations pipeline** — hands the formula to `CleaningPanel` as an
  `apply_formula` action targeting a named new column, and switches tab.
- 🟡 **No AI**, despite the name and the tab label. It is `String.replace` over five
  hard-coded templates.
- 🟡 **Substitution inserts column *names*, not cell references.** The output is
  `=SUM(Revenue)`, which is not a valid Excel formula unless `Revenue` is a defined name.
- 🟡 **`.replace()` without a global flag** replaces only the first occurrence of each
  placeholder — fine for the current five templates, a trap for any new one that repeats
  `{col1}`.
- 🟡 **Sending to the pipeline writes the formula as text**, not as a live formula. See
  Operations above.
- 🔵 **No natural-language input, no formula validation, no evaluation, no custom templates.**

---

## Visualizations — `ChartPanel.tsx`

- ✅ **Three chart types** — bar, line and pie — via `recharts`, in a
  `ResponsiveContainer`.
- ✅ **Axis selection** — any column for X, any column for Y, with the Y value coerced by
  `Number(row[y]) || 0`.
- ✅ **Sensible defaults** — X falls back to the first column, Y to the second.
- ✅ **Five-colour series palette** (`COLORS`), cycled for pie cells.
- 🟡 **Hard-capped at the first 20 rows** (`data.slice(0, 20)`), and unlike Data View this
  cap is **not stated in the UI**. A chart over a 10,000-row file silently shows 20 points.
- 🟡 **No aggregation.** Rows are plotted as-is; repeated X values produce repeated
  categories rather than a grouped total. There is no count/sum/average mode.
- 🟡 **Non-numeric Y values become `0`** rather than being reported.
- 🟡 **`ChartConfig` in `types.ts` is unused**, and its `'scatter'` member is unrenderable —
  `ChartPanel` supports only `'bar' | 'line' | 'pie'`.
- 🔵 **No chart export** — charts cannot be saved as an image or added to an export.

---

## Export — `ExportMenu.tsx` + `src/lib/excel/index.ts`

- ✅ **Four menu entries** offering three real formats: Excel Workbook (`.xlsx`), CSV, and
  Text tab-delimited (`.txt`).
- ✅ **One export path** — `downloadExcelFile` builds a workbook, appends a single sheet
  named `Sheet1`, and calls `XLSX.writeFile` with the matching `bookType`. The browser
  download is triggered by SheetJS itself.
- ✅ **Extension is always corrected** to match the chosen format.
- ✅ **Exports are unaffected by view caps** — Data View shows 100 rows and exports all of
  them.
- 🟡 **Two of the four menu entries are identical.** "CSV UTF-8 (Comma)" and "CSV (Comma
  delimited)" both call `onExport('csv')` and produce byte-identical files. The names
  imply an encoding choice that does not exist.
- 🟡 **Every export is a single sheet named `Sheet1`.** No multi-sheet workbooks.
- 🟡 **No styling, column widths, freeze panes or number formats** in exported workbooks.
- 🔵 **No PDF or JSON export.**

---

## Shell, navigation and UI — `App.tsx`, `Layout.tsx`, `Button.tsx`

- ✅ **Nine-tab fixed sidebar**, grouped as File Manager above a "Workspace" heading.
- ✅ **Active-tab styling** — `indigo-50` background with `indigo-700` text.
- ✅ **Live file count** in the sidebar footer.
- ✅ **Per-tab heading and subtitle** in the main area.
- ✅ **Empty-state routing** — every tab but File Manager shows a prompt with a button back
  to the File Manager when no files are loaded.
- ✅ **Shared `Button`** with four variants, three sizes and a loading spinner.
- 🟡 **Several panels hand-roll `<button>` elements** instead of using `Button`.
- 🟡 **Branding is inconsistent** — the sidebar says "ExcelAI", the footer "ExcelAI Master",
  `index.html`'s `<title>` "ExcelAI Master", `metadata.json` "ExcelFile Operations", and
  `package.json` `excelfile-operations`.
- 🟡 **Off-brand styling.** Stock Tailwind indigo/gray with shadows, against an eGENTIC
  guide that permits neither. See `coding-conventions.md` and `project-memory.md` §4.
- 🔵 **No dark mode, no responsive sidebar** (fixed `w-64`, `ml-64`), **no keyboard
  shortcuts**, and almost **no accessibility work**: there is not a single `aria-*`
  attribute in the codebase, no focus management and no live regions. The only ARIA present
  is three `role` attributes — `menu`/`menuitem` in `ExportMenu` and `group` in
  `ChartPanel` — none of which carry the labelling or state they imply.

---

## Cross-cutting

- ✅ **Fully client-side.** No network request of any kind is made by this application.
- ✅ **No persistence**, by design — a reload clears all state.
- 🟡 **No AI anywhere**, despite four AI-suggesting labels. `vite.config.ts` still defines
  `API_KEY` / `GEMINI_API_KEY` and `index.html` still maps `@google/genai`; nothing reads
  either.
- 🟡 **`index.html` links `/index.css`**, which does not exist — a 404 on every load.
- 🟡 **No tests, no ESLint, no CI.** `npm run lint` is `tsc --noEmit`, and `strict` is off.
- 🟡 **`node.zip` (29 MB) and `node-v20.11.1-win-x64/`** sit unignored at the repo root.
- 🔵 **No deployment configuration** — no Dockerfile, no CI workflow, no host config.
