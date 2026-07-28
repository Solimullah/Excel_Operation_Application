#!/usr/bin/env bash
#
# migrate-structure.sh — move the flat layout into src/ with a feature-first tree.
#
#   ./scripts/migrate-structure.sh            # dry run: print every action, change nothing
#   ./scripts/migrate-structure.sh --apply    # perform the migration
#
# SAFETY
#   This repository is not under version control at the time of writing. The
#   script refuses to run with --apply unless either:
#     (a) it is inside a clean git working tree, or
#     (b) you pass --i-have-a-backup
#
#   Run `git init && git add -A && git commit -m "baseline"` first. It takes
#   five seconds and makes every step below revertible with `git reset --hard`.
#
# WHAT IT DOES NOT DO
#   - It does not split utils/excelUtils.ts into reader/writer modules. That is
#     a judgement call; the file moves whole to src/lib/excel/index.ts.
#   - It does not touch package.json. Apply those changes separately (the
#     README section "Restructure" has the exact npm pkg set commands).
#   - It does not extract pure logic out of the panel components. That is the
#     follow-up refactor, done one feature at a time with tests.

set -euo pipefail

APPLY=false
FORCE=false

for arg in "$@"; do
  case "$arg" in
    --apply) APPLY=true ;;
    --i-have-a-backup) FORCE=true ;;
    -h|--help) sed -n '2,30p' "$0"; exit 0 ;;
    *) echo "Unknown argument: $arg" >&2; exit 2 ;;
  esac
done

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# --- Colours ---------------------------------------------------------------
if [ -t 1 ]; then
  BOLD=$'\033[1m'; DIM=$'\033[2m'; RED=$'\033[31m'; GREEN=$'\033[32m'
  YELLOW=$'\033[33m'; RESET=$'\033[0m'
else
  BOLD=''; DIM=''; RED=''; GREEN=''; YELLOW=''; RESET=''
fi

log()  { printf '%s\n' "$*"; }
step() { printf '%s==>%s %s\n' "$BOLD" "$RESET" "$*"; }
skip() { printf '%s    skip%s %s\n' "$DIM" "$RESET" "$*"; }
act()  { printf '%s    %s%s %s\n' "$GREEN" "$1" "$RESET" "$2"; }
warn() { printf '%s  !  %s%s\n' "$YELLOW" "$*" "$RESET"; }
die()  { printf '%s  ✗  %s%s\n' "$RED" "$*" "$RESET" >&2; exit 1; }

# --- Preflight -------------------------------------------------------------
USE_GIT=false
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  USE_GIT=true
fi

if [ "$APPLY" = true ]; then
  if [ "$USE_GIT" = true ]; then
    if [ -n "$(git status --porcelain)" ] && [ "$FORCE" = false ]; then
      die "Working tree is dirty. Commit or stash first, or pass --i-have-a-backup."
    fi
  elif [ "$FORCE" = false ]; then
    die "Not a git repository — there is no way to undo this.
     Run:  git init && git add -A && git commit -m 'baseline before restructure'
     Or, if you have a backup elsewhere, re-run with --i-have-a-backup"
  fi
fi

if [ ! -f "App.tsx" ] || [ ! -d "components" ]; then
  die "Expected to find App.tsx and components/ in $ROOT. Has this already been migrated?"
fi

if [ "$APPLY" = false ]; then
  log ""
  warn "DRY RUN — nothing will be modified. Re-run with --apply to perform the migration."
  log ""
fi

# --- Helpers ---------------------------------------------------------------
mk() {
  if [ "$APPLY" = true ]; then mkdir -p "$1"; fi
  act "mkdir" "$1"
}

mv_file() {
  local from="$1" to="$2"
  if [ ! -e "$from" ]; then skip "$from (not found)"; return; fi
  if [ "$APPLY" = true ]; then
    mkdir -p "$(dirname "$to")"
    if [ "$USE_GIT" = true ]; then git mv -f "$from" "$to"; else mv "$from" "$to"; fi
  fi
  act "move " "$from  →  $to"
}

# Apply a sed replacement across every source file under src/.
rewrite() {
  local pattern="$1" label="$2"
  if [ "$APPLY" = true ]; then
    find src -type f \( -name '*.ts' -o -name '*.tsx' \) -print0 \
      | xargs -0 sed -i '' -e "$pattern"
  fi
  act "rewrite" "$label"
}

# ===========================================================================
step "1/6  Create the directory tree"
# ===========================================================================
mk "src/app"
mk "src/components/layout"
mk "src/components/ui"
mk "src/config"
mk "src/features"
mk "src/lib/excel"
mk "src/styles"
mk "src/types"
for f in charts cleaning compare data-view files formula merge-split profiler vlookup; do
  mk "src/features/$f/components"
done

# ===========================================================================
step "2/6  Move shell, types and shared modules"
# ===========================================================================
mv_file "index.tsx"             "src/main.tsx"
mv_file "App.tsx"               "src/app/App.tsx"
mv_file "types.ts"              "src/types/index.ts"
mv_file "utils/excelUtils.ts"   "src/lib/excel/index.ts"

# ===========================================================================
step "3/6  Move shared UI"
# ===========================================================================
mv_file "components/Layout.tsx"     "src/components/layout/Layout.tsx"
mv_file "components/Button.tsx"     "src/components/ui/Button.tsx"
mv_file "components/ExportMenu.tsx" "src/components/ui/ExportMenu.tsx"

# ===========================================================================
step "4/6  Move feature panels"
# ===========================================================================
mv_file "components/FileUpload.tsx"    "src/features/files/components/FileUpload.tsx"
mv_file "components/DataView.tsx"      "src/features/data-view/components/DataView.tsx"
mv_file "components/CleaningPanel.tsx" "src/features/cleaning/components/CleaningPanel.tsx"
mv_file "components/ComparePanel.tsx"  "src/features/compare/components/ComparePanel.tsx"
mv_file "components/MergePanel.tsx"    "src/features/merge-split/components/MergePanel.tsx"
mv_file "components/VlookupPanel.tsx"  "src/features/vlookup/components/VlookupPanel.tsx"
mv_file "components/AnalysisPanel.tsx" "src/features/profiler/components/AnalysisPanel.tsx"
mv_file "components/FormulaPanel.tsx"  "src/features/formula/components/FormulaPanel.tsx"
mv_file "components/ChartPanel.tsx"    "src/features/charts/components/ChartPanel.tsx"

if [ "$APPLY" = true ]; then
  rmdir components utils 2>/dev/null || true
fi
act "rmdir" "components/ utils/  (if empty)"

# ===========================================================================
step "5/6  Rewrite imports to the @/ alias"
# ===========================================================================
# Order matters: the longer './components/X' forms are replaced before the
# bare './X' forms so the two rule sets cannot overlap.

rewrite "s|from '\./components/Layout'|from '@/components/layout/Layout'|g"          "Layout"
rewrite "s|from '\./components/Button'|from '@/components/ui/Button'|g"              "Button (from shell)"
rewrite "s|from '\./components/ExportMenu'|from '@/components/ui/ExportMenu'|g"      "ExportMenu (from shell)"

rewrite "s|from '\./components/FileUpload'|from '@/features/files/components/FileUpload'|g"        "FileUpload"
rewrite "s|from '\./components/DataView'|from '@/features/data-view/components/DataView'|g"        "DataView"
rewrite "s|from '\./components/CleaningPanel'|from '@/features/cleaning/components/CleaningPanel'|g" "CleaningPanel"
rewrite "s|from '\./components/ComparePanel'|from '@/features/compare/components/ComparePanel'|g"  "ComparePanel"
rewrite "s|from '\./components/MergePanel'|from '@/features/merge-split/components/MergePanel'|g"  "MergePanel"
rewrite "s|from '\./components/VlookupPanel'|from '@/features/vlookup/components/VlookupPanel'|g"  "VlookupPanel"
rewrite "s|from '\./components/AnalysisPanel'|from '@/features/profiler/components/AnalysisPanel'|g" "AnalysisPanel"
rewrite "s|from '\./components/FormulaPanel'|from '@/features/formula/components/FormulaPanel'|g"  "FormulaPanel"
rewrite "s|from '\./components/ChartPanel'|from '@/features/charts/components/ChartPanel'|g"       "ChartPanel"

rewrite "s|from '\.\./types'|from '@/types'|g"                    "../types"
rewrite "s|from '\./types'|from '@/types'|g"                      "./types"
rewrite "s|from '\.\./utils/excelUtils'|from '@/lib/excel'|g"     "../utils/excelUtils"
rewrite "s|from '\./utils/excelUtils'|from '@/lib/excel'|g"       "./utils/excelUtils"
rewrite "s|from '\./Button'|from '@/components/ui/Button'|g"      "./Button"
rewrite "s|from '\./ExportMenu'|from '@/components/ui/ExportMenu'|g" "./ExportMenu"
rewrite "s|from '\./App'|from '@/app/App'|g"                      "./App (in main.tsx)"

# ===========================================================================
step "6/6  Update build configuration"
# ===========================================================================
if [ "$APPLY" = true ]; then
  # index.html entry point
  sed -i '' -e 's|src="/index.tsx"|src="/src/main.tsx"|' index.html
fi
act "edit  " "index.html      entry → /src/main.tsx"

# tsconfig.json (@/* → ./src/*) and vite.config.ts (alias → ./src) were already
# pointed at src/ ahead of this migration. Both are harmless before the move —
# nothing used the alias — and correct after it. Verified here rather than
# edited, so a partially-applied run is obvious.
if grep -q '"@/\*": \["\./src/\*"\]' tsconfig.json; then
  skip "tsconfig.json   @/* → ./src/*  (already correct)"
else
  warn "tsconfig.json does not map @/* to ./src/* — fix it before running with --apply."
fi

if grep -q "path.resolve(__dirname, './src')" vite.config.ts; then
  skip "vite.config.ts  alias → ./src  (already correct)"
else
  warn "vite.config.ts alias does not point at ./src — fix it before running with --apply."
fi

# ===========================================================================
log ""
if [ "$APPLY" = true ]; then
  printf '%sMigration complete.%s\n\n' "$BOLD" "$RESET"
  log "Verify now, in this order — do not skip the last one:"
  log "  1.  npm run typecheck      # catches any import the script missed"
  log "  2.  npm run build          # confirm it actually succeeds"
  log "  3.  npm run preview        # then upload a messy workbook and export it"
  log ""
  log "Still to do by hand:"
  log "  - package.json scripts and devDependencies (see README, 'Restructure')"
  log "  - create src/styles/index.css and link it from index.html"
  log "  - update context/architecture.md and context/coding-conventions.md,"
  log "    which both currently state that there is no src/ directory"
else
  printf '%sDry run finished.%s Re-run with --apply when the plan above looks right.\n' "$BOLD" "$RESET"
fi
log ""
