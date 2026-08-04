# Architecture

Verified against the code on **2026-08-25**.

> **No line numbers in this document.** Reference symbols and file paths — those survive
> edits.

## Topology

There is **no backend**. This is a static single-page application. Every byte of user data
is read, transformed and written inside the browser tab.

```
Browser tab
  ├── index.html               Vite host page: Tailwind CDN + ESM importmap
  ├── src/main.tsx             createRoot → StrictMode → App
  └── src/app/App.tsx          The only shell: owns all state, switches tabs
        └── components/layout/Layout.tsx   Sidebar nav + main content
              └── features/<name>/components/  one panel per tab
                    └── src/lib/excel  ──►  SheetJS (xlsx)
                                                   ↕
                                            File input / file download
```

No server, no database, no API, no authentication, no telemetry, no analytics, and **no
LLM call of any kind**. `npm run build` produces static assets; anything that can serve a
folder can host this.

### The Gemini leftovers

The project was scaffolded from Google AI Studio, and two dead references survive:

- `vite.config.ts` defines `process.env.API_KEY` and `process.env.GEMINI_API_KEY` from
  `env.GEMINI_API_KEY`.
- `index.html` maps `@google/genai` in its importmap.

**Nothing imports either.** No module in this repository references `@google/genai`,
`API_KEY` or any network client. The names "ExcelAI", "VLOOKUP AI", "Formula AI" and
"Smart Insights" in the UI are branding, not behaviour — all four are local deterministic
code. See `system-rules.md` §5 before adding a real AI dependency.

### Two dependency declarations, one runtime

Dependencies are declared **twice**, and it matters:

- `package.json` — what `npm install` fetches, and what Vite bundles in `npm run build`.
- The `index.html` importmap — bare-specifier URLs pointing at `esm.sh`.

Vite's bundling wins in both `dev` and `build`, so the importmap is effectively inert
today. But it is still in the HTML, so a version bump made in only one place leaves the two
disagreeing. **Change both, or delete the importmap.** The importmap also lists
`@google/genai`, which is in neither `package.json` nor any import statement.

Tailwind arrives from `cdn.tailwindcss.com` as a `<script>` tag — there is **no Tailwind
build step, no `tailwind.config.js` and no PostCSS**. Consequences in
`coding-conventions.md`.

`index.html` also links `/index.css`, which **does not exist**. It 404s on every page load.
Harmless, but it means there is no stylesheet layer at all.

## Entry points

| File | Role |
|---|---|
| `index.html` | Host page, mounts `#root`, loads Tailwind CDN and the importmap |
| `src/main.tsx` | `createRoot` → `React.StrictMode` → `App`. Throws if `#root` is missing. |
| `src/app/App.tsx` | The one shell: owns every piece of application state, renders the active tab |
| `src/components/layout/Layout.tsx` | Fixed 16rem sidebar, nav items, file count, main scroll container |

There is exactly one shell and one entry point. Do not add a second.

## Project layout

The application lives under `src/`, organised **by feature rather than by file type**.

```
src/
├── main.tsx               Entry: createRoot -> StrictMode -> App
├── vite-env.d.ts          Typed import.meta.env
├── app/                   The shell: App.tsx, ErrorBoundary.tsx
├── components/
│   ├── layout/            Layout
│   └── ui/                Button, ExportMenu - shared by 2+ features
├── features/              One folder per workspace, self-contained
│   ├── files/  data-view/  cleaning/  compare/  merge-split/
│   └── vlookup/  profiler/  formula/  charts/
├── lib/
│   ├── excel/             The ONLY module that imports xlsx
│   ├── logger.ts  errors.ts
├── config/                env.ts, constants.ts
├── types/                 Shared types
└── styles/                index.css
```

Each feature owns its own components, and gains `hooks/` and `lib/` subfolders as logic is
extracted. **Features must not import from one another** — ESLint enforces this. When two
features need the same thing, it moves up into `lib/`, `components/` or `types/`.

Tests are co-located as `thing.test.ts` beside the code. Only the cross-cutting harness
(`setup.ts`, `fixtures.ts`) lives in the top-level `tests/`.

`@/*` maps to `./src/*` in both `tsconfig.json` and `vite.config.ts`, and **every
cross-directory import uses it**. Relative imports are reserved for siblings within the
same folder.

## Navigation

`App.tsx` holds `activeTab: AppTab` and renders one panel per value. `AppTab` is an enum in
`src/types/index.ts` with nine members; `Layout.tsx` renders a `NavItem` for each.

| `AppTab` | Sidebar label | Page heading | Component |
|---|---|---|---|
| `UPLOAD` | File Manager | File Manager | `FileUpload` |
| `CLEANING` | Operations | Operations & Cleaning | `CleaningPanel` |
| `VIEW` | Data View | Data Overview | `DataView` |
| `COMPARE` | Compare Files | Compare Files | `ComparePanel` |
| `MERGE` | Merge / Split | Merge & Split Tool | `MergePanel` |
| `VLOOKUP` | VLOOKUP AI | VLOOKUP Tool | `VlookupPanel` |
| `ANALYSIS` | Smart Insights | Data Profiler | `AnalysisPanel` |
| `FORMULA` | Formula AI | Formula Builder | `FormulaPanel` |
| `VISUALIZE` | Visualizations | Visualization | `ChartPanel` |

The heading and subtitle for each tab are **two chained ternaries inlined in `App.tsx`'s
JSX**, not a lookup table. Adding a tab means editing four places: the `AppTab` enum, the
`NavItem` list in `Layout.tsx`, and both ternary chains in `App.tsx`.

Every tab except `UPLOAD` renders an empty-state prompt when `files.length === 0`, returned
early from `renderContent`. Several panels add their own second gate — `ComparePanel` and
`VlookupPanel` require **two** files and say so.

### `CleaningPanel` is mounted permanently — on purpose

In `renderContent`, every panel is conditionally rendered *except* `CleaningPanel`, which is
always mounted and hidden with a `className` toggle:

```jsx
<div className={activeTab === AppTab.CLEANING ? 'block' : 'hidden'}>
  <CleaningPanel … />
</div>
```

This is deliberate. `CleaningPanel` owns the operation `queue` and the `processedResults`
list. A conditionally-rendered panel unmounts on navigation and loses both. **Do not
"tidy" this into the same pattern as the others** — you will silently delete the user's
queued operations every time they switch tabs.

The other panels do lose their state on navigation, and that is the accepted trade-off
today. If a panel gains state worth preserving, either apply this same pattern or hoist the
state into `App.tsx`.

## Data model

Three types in `src/types/index.ts` carry everything:

```ts
ExcelRow      = { [key: string]: any }          // one row, keyed by column name
UploadedFile  = { id, name, data: ExcelRow[], columns: string[] }
```

`id` is a `crypto.randomUUID()` assigned at upload. `columns` is **derived from the first
row only** — `Object.keys(jsonData[0])` in `readExcelFile`, and `Object.keys(newData[0])`
again in `App.handleFileUpdate`. Everything that renders or exports a table iterates
`columns`, so a key present on row 5 but absent on row 0 is invisible everywhere. See
`system-rules.md` §2.

`ChartConfig` and `CleaningAction` are also in `src/types/`. `ChartConfig` is **declared but
never imported** — `ChartPanel` holds the same fields as three separate `useState` calls,
and its `type` union includes `'scatter'`, which `ChartPanel` cannot render.

## State

All application state lives in `App.tsx`. There is no store, no context, no persistence.

| What | Where | Lifetime |
|---|---|---|
| Uploaded files and their data | `useState<UploadedFile[]>` in `App.tsx` | Page session |
| Upload in progress | `isProcessing` in `App.tsx` | Page session |
| Active tab | `activeTab` in `App.tsx` | Page session |
| Formula → Operations handoff | `pendingCleaningAction` in `App.tsx` | Until consumed |
| Operation queue, processed results | `useState` in `CleaningPanel` | Page session (see above) |
| Merge/split results | `useState` in `MergePanel` | Until tab switch |
| Comparison result | `useState` in `ComparePanel` | Until tab switch |
| Per-panel file/column selections | `useState` in each panel | Until tab switch |

**Nothing is written to `localStorage`, `sessionStorage`, IndexedDB or a cookie.** A page
reload discards every uploaded file. This is a genuine property of the product, not an
oversight — see `system-rules.md` §1.

`App.tsx` exposes exactly two mutators to its children:

- `handleFileUpdate(fileId, newData)` — replaces a file's rows and recomputes `columns`.
  Used by `CleaningPanel` and `VlookupPanel`.
- `handleDownload(fileId, format)` — exports a file as `<name>_modified.<ext>`.
  Used by `DataView` via `ExportMenu`.

Panels that produce *derived* artefacts rather than editing a file — `ComparePanel`,
`MergePanel` — hold results locally and call `downloadExcelFile` directly. They never write
back into `files`.

### The Formula → Operations bridge

`FormulaPanel` cannot modify data itself. Its "add to pipeline" button calls
`App.handleAddToPipeline`, which packages the formula as a `CleaningAction` of type
`apply_formula`, stores it in `pendingCleaningAction`, and switches `activeTab` to
`CLEANING`. `CleaningPanel`'s effect on `incomingAction` appends it to the queue, switches
the selected file if needed, and calls `onActionHandled` to clear the bridge.

This is the only cross-panel communication in the app. It works because `CleaningPanel`
is permanently mounted.

## The I/O boundary

`src/lib/excel/index.ts` is the only module that touches SheetJS, and the only place data
enters or leaves the browser. Two functions:

**`readExcelFile(file)`** — `FileReader.readAsArrayBuffer` → `XLSX.read(type: 'array')` →
`sheet_to_json` on `workbook.SheetNames[0]`. Two options are load-bearing:

- `defval: ""` — empty cells become empty strings rather than missing keys, which keeps
  CSV column alignment intact.
- `raw: false` — values arrive as **formatted strings**, so a phone number like `+1555…`
  survives instead of being coerced to a number. This is why every panel does its own
  `Number(...)` conversion.

It reads **only the first sheet**. Other tabs in a workbook are silently discarded.

**`downloadExcelFile(data, fileName, format)`** — `json_to_sheet` → `book_new` →
`book_append_sheet(…, "Sheet1")` → `writeFile` with a `bookType` of `xlsx`, `csv` or `txt`
(tab-delimited). It rewrites the extension to match the format.

`XLSX.writeFile` triggers the browser download itself; there is no blob or object-URL
handling anywhere in the codebase.

## Build and run

- **Dev:** `npm run dev` — Vite dev server on port 3000, `host: '0.0.0.0'`.
- **Build:** `npm run build` — `vite build` to `dist/`.
- **Preview:** `npm run preview` — serves the built `dist/`. This is what you screenshot.
- **Type-check:** `npm run lint` — `tsc --noEmit`. Not a linter; there is no ESLint.
- **Tests:** **none.** There is no test script, no test runner and no test file.

`node.zip` (29 MB) and `node-v20.11.1-win-x64/` sit at the repository root and are not
listed in `.gitignore`. They are a vendored Windows Node runtime, unrelated to the build.
