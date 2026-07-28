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

See `.env.example` for the full list. Read it through `src/config/env.ts`, which parses,
defaults and validates in one place, rather than touching `import.meta.env` directly.

---

## Project structure

```
src/
├── main.tsx                 Entry: createRoot → StrictMode → ErrorBoundary → App
├── app/                     The shell — App.tsx, ErrorBoundary
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
│   ├── excel/               The ONLY module that imports xlsx
│   ├── logger.ts            Level-gated console logger
│   └── errors.ts            Typed error taxonomy
├── config/                  env.ts, constants.ts
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

`tests/fixtures.ts` provides `messyRows` — deliberately awkward data covering the cases
that have historically produced wrong exports: a duplicate row, an all-blank row, a
leading-`+` phone number, a leading-zero code, and a key that is missing from row 0. Prefer
it over clean fixtures.

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

If you are looking at a flat repository with `App.tsx` at the root, the migration to the
layout above has not been run yet.

```bash
# 1. Create a rollback point. Do not skip this.
git init && git add -A && git commit -m "baseline before restructure"

# 2. Review the plan.
./scripts/migrate-structure.sh

# 3. Apply it.
./scripts/migrate-structure.sh --apply

# 4. Install the tooling the new configs expect.
npm i -D vitest @vitest/coverage-v8 jsdom \
        @testing-library/react @testing-library/jest-dom @testing-library/user-event \
        eslint @eslint/js typescript-eslint globals \
        eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-react-refresh \
        eslint-plugin-jsx-a11y eslint-plugin-import eslint-import-resolver-typescript \
        eslint-config-prettier prettier

# 5. Add the scripts.
npm pkg set scripts.typecheck="tsc --noEmit"
npm pkg set scripts.lint="eslint ."
npm pkg set scripts.lint:fix="eslint . --fix"
npm pkg set scripts.format="prettier --write ."
npm pkg set scripts.format:check="prettier --check ."
npm pkg set scripts.test="vitest"
npm pkg set scripts.test:run="vitest run"
npm pkg set scripts.test:coverage="vitest run --coverage"
npm pkg set scripts.validate="npm run typecheck && npm run lint && npm run test:run && npm run build"
npm pkg set engines.node=">=22"

# 6. Verify.
npm run validate
npm run preview     # then load a messy workbook and export it
```

---

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
inference happens anywhere in this application.** Every result is produced by local
deterministic code. The project was scaffolded from Google AI Studio and the branding
outlived the integration, which was never wired up. See `context/project-memory.md` §4.
