# Business Overview

Verified against the code on **2026-08-25**.

> **Read this caveat first.** §1–§3 and §6–§7 are read directly off the code and the UI.
> **§4 ("Where this fits") and §5 ("Who uses it") are inferred** from the feature set, the
> originating prompt in `migrated_prompt_history/`, and the fact that the repository sits
> in an eGENTIC project folder. They have **not** been confirmed by a product owner.
> Correct them rather than trusting them.

---

## 1. Product identity

| | |
|---|---|
| Package name | `excelfile-operations` v0.0.0 |
| Name in `metadata.json` | **ExcelFile Operations** |
| Name in the UI | **ExcelAI** (sidebar) / **ExcelAI Master** (footer, browser title) |
| Origin | Scaffolded from Google AI Studio — app `96521e5a-6507-4818-ae50-caba7a0fb8d5` |
| Deployment | **None.** No host configuration, CI, or Dockerfile exists. |
| Distribution | Runs locally via `npm run dev`, or as static files from `npm run build` |

🟡 **The branding is inconsistent across five surfaces** — package name, `metadata.json`,
sidebar, footer and `<title>` all differ. Picking one is an open decision
(`project-memory.md` §4).

The `metadata.json` description — *"A powerful Excel manipulation tool powered by Google
Gemini"* — is **factually wrong**. Nothing in the application calls Gemini or any other
model. See §6.

---

## 2. What the system does

A browser-based workbench for the spreadsheet operations that are tedious or error-prone in
Excel itself, especially across **multiple files at once**.

1. **Load** one or many `.xlsx` / `.xls` / `.csv` / `.txt` files into the browser. They stay
   in memory; nothing is uploaded anywhere.
2. **Inspect** — preview the table, and profile each column for type, distinct values,
   missing values and numeric range.
3. **Clean** — queue up an ordered pipeline of operations (deduplicate, drop empty rows,
   case conversion, trim, add/remove prefix) and apply it to the file or to a separate
   result.
4. **Combine across files** — compare two files on a key column, merge many files onto a
   union of their headers, or join columns from one file into another with a VLOOKUP.
5. **Divide** — split one file by a column's values, by row count, or by a row/column
   percentage.
6. **Visualise** — bar, line or pie charts over any two columns.
7. **Export** — download any file or derived result as `.xlsx`, `.csv` or tab-delimited
   `.txt`.

Every operation is local, deterministic and synchronous.

---

## 3. The problem being solved

The operations here are all *possible* in Excel. They are painful in three specific ways
that this tool targets:

- **They span files.** Comparing two exports, merging a dozen partner lists, or pulling
  columns across workbooks means formulas that reference other files, break on move, and
  are hard to audit.
- **They are repetitive.** The same clean-up runs on every new export: strip whitespace,
  normalise case, remove duplicate rows, prefix an ID column. The queued pipeline in
  Operations exists so that sequence is built once and applied, rather than redone by hand.
- **They are risky with customer data.** An online converter or an "upload your CSV" SaaS
  means sending contact lists to a third party. This tool cannot, because it has no
  backend — a property worth stating to anyone who asks where the data goes
  (`system-rules.md` §1).

Splitting is the mirror image: taking one large export and dividing it by a category
column, or into fixed-size batches, is a common hand-operation this automates.

---

## 4. Where this fits *(inferred — confirm before relying on it)*

The feature set reads as **lead-list and contact-data operations**, which is eGENTIC's
domain: merging partner or campaign exports onto a common header set, deduplicating,
splitting a master list by client or campaign for delivery, and enriching one list from
another by email address.

Three details support that reading:

- The two-file features (Compare, VLOOKUP) both default to matching on a **key column**,
  which is how contact lists are reconciled.
- **Split by column value** with filename sanitisation is shaped for producing one
  deliverable file per client or per category.
- `raw: false` on read — preserving `+1555…` and leading zeros as text — matters most for
  phone numbers, postcodes and account IDs.

None of this is stated anywhere in the repository. **Treat it as a hypothesis.**

---

## 5. Who uses it *(inferred — confirm before relying on it)*

Signals point to a small internal audience rather than a released product:

- No authentication, no multi-user concept, no deployment configuration.
- `README.md` is the untouched AI Studio scaffold, aimed at whoever runs it locally.
- A Windows Node runtime (`node.zip`, `node-v20.11.1-win-x64/`) is vendored at the
  repository root — which suggests it was handed to someone on Windows to run without
  installing Node themselves.
- The UI assumes familiarity: no onboarding, no tooltips, no documentation.

The most likely reading is **an internal tool for the eGENTIC team**, run locally by
whoever needs it. Whether it is meant to be shared more widely is an open question.

---

## 6. What it explicitly is not

- **Not an AI product.** Four surfaces are named as though a model is involved — "ExcelAI",
  "VLOOKUP AI", "Formula AI", "Smart Insights" — and `metadata.json` claims it is *"powered
  by Google Gemini"*. **No inference happens anywhere.** Every result is produced by local
  deterministic code. The Gemini references in `vite.config.ts` and `index.html` are
  scaffold leftovers that nothing reads.
- **Not a formula engine.** The Formula Builder produces formula *text* from five
  templates; sending one to the pipeline writes that text into every cell of a column. It
  does not evaluate, and it does not create a live Excel formula.
- **Not a spreadsheet editor.** Cells cannot be edited. Data changes only through the
  defined operations.
- **Not a service.** There is no backend, no account, no storage. Closing the tab loses
  everything.
- **Not deployed.** It runs where you run it.

---

## 7. Constraints a stakeholder should know

| Constraint | Consequence |
|---|---|
| Only the **first worksheet** of a workbook is read | Multi-tab workbooks lose every other tab, silently |
| Columns are taken from the **first row only** | A field missing from row 1 is invisible in views and exports |
| Data View shows **100 rows**; charts show **20** | On-screen previews are not the deliverable — the export is |
| **No undo** | Applying an operation queue overwrites the working copy irreversibly |
| **No persistence** | A page reload discards all loaded files |
| Merge/Split/Compare results are **lost on tab switch** | Download before navigating away |
| Everything runs in one browser tab | Very large files are bounded by available memory |
| **No tests** | Every change is verified by hand |

The first two are the ones most likely to produce a wrong file without anyone noticing.
Both are recorded as rules in `system-rules.md` §2 and as gaps in
`features-functionalities.md`.
