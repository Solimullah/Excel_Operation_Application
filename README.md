# ExcelFile Operations

A browser-based workbench for the spreadsheet operations that are tedious across multiple
files — compare, merge, split, join, clean, profile and chart — with an export at every step.

**Nothing leaves your machine.** There is no backend, no upload, no account and no storage.
Files are read into the browser tab, transformed in memory, and written back out as a
download. Closing the tab discards everything.

---

## Quick start

**Prerequisites:** Node 22 (see `.nvmrc`).

```bash
nvm use                 # or install Node 22 by any means you prefer
npm install
cp .env.example .env.local
npm run dev             # http://localhost:3000
```

`.env.local` is optional — every setting has a working default.

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server on port 3000, host `0.0.0.0` |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve the built `dist/` — **this is what you verify against** |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint over `src/` |
| `npm run lint:fix` | ESLint with `--fix` |
| `npm run format` | Prettier write |
| `npm run format:check` | Prettier check — CI runs this |
| `npm run test` | Vitest in watch mode |
| `npm run test:run` | Vitest once |
| `npm run test:coverage` | Vitest with a coverage report |
| `npm run validate` | typecheck + lint + test + build, in order |

Run `npm run validate` before you consider a change finished.

---

## Configuration

All configuration is build-time. Vite inlines every `VITE_*` variable into the bundle, so
**everything in `.env.local` is public**. There is no server here and therefore no such
thing as a server-side secret — never put an API key or password in this repository.

See `.env.example` for the full list. Nothing currently reads these values — the app has
no configuration layer yet.

---

## Project structure

```
src/
├── main.tsx                 Entry: createRoot → StrictMode → App
├── app/                     The shell — App.tsx
├── components/
│   ├── layout/              Layout, Sidebar, NavItem
│   └── ui/                  Button, ExportMenu, and other shared primitives
├── features/                One folder per workspace, self-contained
│   ├── files/               File Manager
│   ├── data-view/           Data View
│   ├── cleaning/            Operations & Cleaning
│   ├── compare/             Compare Files
│   ├── merge-split/         Merge & Split
│   ├── vlookup/             VLOOKUP
│   ├── profiler/            Data Profiler
│   ├── formula/             Formula Builder
│   └── charts/              Visualizations
├── lib/
│   └── excel/               The ONLY module that imports xlsx
├── types/                   Shared types
└── styles/                  index.css
```

Each feature owns its components, hooks and pure logic. **Features must not import from
each other** — ESLint enforces this. When two features need the same thing, it moves up
into `src/lib`, `src/components` or `src/types`.

---

## Testing

```bash
npm run test              # watch
npm run test:coverage     # with coverage thresholds
```

Vitest with jsdom. Co-locate tests beside the code as `thing.test.ts`.

Test with **awkward** data, not tidy data: a duplicate row, an all-blank row, a leading-`+`
phone number, a leading-zero postcode, and a key missing from row 0. Those are the cases
that have historically produced wrong exports. `src/lib/excel/index.test.ts` covers the
value-fidelity contract.

**Testing a data change is not finished until you have opened the exported file.** The Data
View renders only the first 100 rows and charts only the first 20, so the screen is not the
artefact — the download is.

---

## Docker

```bash
docker compose up dev      # Vite dev server, hot reload, :3000
docker compose up app      # production nginx image, :8080
```

The production image is a two-stage build: Node 22 compiles, nginx serves. It runs as a
non-root user with a read-only filesystem and a restrictive CSP. Because Vite inlines
configuration at build time, environment-specific values are **build args**, not runtime
env vars:

```bash
docker build --build-arg VITE_BASE_PATH=/tools/ -t excelfile-operations .
```

---

## Deployment

`npm run build` emits a static `dist/`. Anything that serves a folder will host this —
nginx, Caddy, S3 + CloudFront, Netlify, Vercel, GitHub Pages, an internal file server.

Two requirements:

1. **SPA fallback** — unmatched routes must serve `index.html` (see `nginx.conf`).
2. **Do not cache `index.html`** — hashed assets under `/assets/` are immutable and should
   be cached for a year; `index.html` must not be, or clients pin to a stale bundle.

Set `VITE_BASE_PATH` if deploying under a path prefix rather than at the domain root.

---

## Restructure

The move from the original flat layout into `src/` has been carried out. The one-time
migration script has been removed; it lives in git history if ever needed.

**There is no error boundary.** A render error in any panel unmounts the whole tree and the
user loses every loaded file with no explanation. Worth adding.

## Documentation

Working documentation lives in [`context/`](context/), starting with
[`context/README.md`](context/README.md). Read it before making changes — particularly
[`context/system-rules.md`](context/system-rules.md), which records the constraints that
are not obvious from any single file:

- All processing stays client-side; spreadsheets are customer data.
- Column shape is derived from **row zero** — a key missing there is invisible everywhere.
- `raw: false` on read is deliberate and keeps phone numbers and leading zeros intact.
- `CleaningPanel` is never unmounted, because it owns the operation queue.

---

## A note on the naming

Several surfaces say "AI" — "ExcelAI", "VLOOKUP AI", "Formula AI", "Smart Insights". **No
inference happens anywhere in this application.** Every result is produced by local,
deterministic code: template substitution, set membership, `Map` lookups and arithmetic.
The names are branding, not behaviour. Renaming them is an open decision.
