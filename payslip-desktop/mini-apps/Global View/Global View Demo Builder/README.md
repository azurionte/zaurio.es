# GlobalView Demo Builder — v0.1.1

New self-contained module in **Demo Building Tools → Global View → GlobalView Demo Builder**.

## Purpose

Create a calendar-year scenario for a fictitious or authorized employee population, visualize deviations, edit events at line level, and produce GlobalView-style files for the months selected by the analyst. The tool keeps planning and import tracking separate.

## Current scope

- Australia: P2001 (absences, 11 fields) and P2010 (time wage types, 23 fields) based on the 2027 examples provided for review.
- Nine additional country shells: US, Canada, Spain, Mexico, UK, China, Germany, Netherlands and France. They are **not export-ready**; configure their fields, formats and routing before use.
- **Create a new country from scratch** or duplicate a country profile and configure its data types, SAP fields, defaults, scenario rules and transport metadata.
- Deterministic seeded scenario generation. Per-rule employee share, event count, quantity, duration, fixed amounts, weekday starts and per-month intensity (including one-click seasonal presets).
- Annual/monthly views, monthly warning signals, employee event table, editing, custom notes and a basic audit trail.
- TXT import (UTF-16LE + BOM; HEADR / NAME / CTEXT / FIELD / FSPEC / DATA / TRAIL); preservation of source header and row order for unchanged imported records.
- Month, quarter, half-year, full-year, or custom month range selection; the tool exports one TXT per included infotype in a ZIP. The event's start date determines its export batch. Ongoing absences appear in monthly views without duplication in later TXT batches.
- Download checkpoints, manual confirmation of uploads, notes and revisioned project snapshots for handover.
- Fully client-side, with no added runtime dependency or third-party SaaS service. Files and projects remain on the device unless the analyst explicitly exports/shares a project snapshot.

## Guided workflow (v0.1.1)

On every launch, the application opens **Countries**, with separate **Preparation** and **Import** percentages for every country in the selected year. A new country/year begins at 0% / 0%, even if Australia ships with a configured reference format and sample event patterns. Selecting a country opens its five preparation steps directly: no project-creation dialog is required.

### Phase 1: Preparation

1. **Country setup (20%)**: inspect the country's import schemas, codes and defaults; explicitly confirm the configuration. New countries have no export-ready schema until one is configured.
2. **Employees (20%)**: paste approved demo employee IDs, import existing TXT records, or explicitly choose 76 synthetic employees for testing.
3. **Event patterns (20%)**: adjust the probability, frequency, amounts, absences and per-month activity weights; explicitly confirm the patterns.
4. **Generate & review (20%)**: generate a deterministic year, inspect the 12-month bar chart, click a month to see employee-level events, resolve validation blockers.
5. **Approve plan (20%)**: approve the specific configuration, roster and event revisions. Modifying any of them invalidates the approval and blocks new exports until reviewed again.

### Phase 2: Import

- Open **Import** for the same country/year. Select one month, a quarter, six months, the entire year or a custom contiguous period.
- Download one UTF-16LE TXT per chosen infotype inside a ZIP. Downloaded and confirmed-uploaded states are kept separate.
- After successfully uploading into GlobalView, mark the bundle as **Uploaded** and add an audit note.
- Import progress counts **months with planned events whose current records are all confirmed uploaded**. A download alone never increases the percentage. Months with no events do not prevent 100% completion.
- Use **Handover & notes** inside the country flow for snapshots and analyst notes. Automatic cross-device synchronization is not yet implemented.

Projects saved by v0.1 remain in local storage and can be reopened from the country/year board; the redesign does not reset them. Old projects without an explicit approval do not silently become approved.

## Compatibility and security boundaries

- The supplied example documents and employee identifiers are **not** stored in the public GitHub repository. Only schemas, labels, example routing and **synthetic data** are used in the source and tests.
- The original examples established *reference-compatible serialization* for Australia P2001/P2010. No direct GlobalView test-system upload has yet been performed; real import acceptance, dynamic header semantics and month-boundary behavior must be signed off with the GV team.
- P0008, P0015 and P0267 are not yet configured for export; actual sample templates are necessary.
- Country variations may involve employee-specific calendars, eligibility, wage types, subtypes, absence groups, pay periods and collision rules. v0.1.1 uses simple probabilities, limits, weekdays and basic overlap checks, **not** a complete SAP payroll validation model.
- Data is stored locally in the application's browser storage. Do not use live confidential employee data outside an authorized corporate environment. Versioned snapshot sharing is **manual**; automatic multi-user synchronization, identity, access controls, conflict resolution and server audit logs are not implemented.
- Reference filename routing values observed for Australia are **examples only** and may need confirmation per environment; do not assume a successful UTF-16LE export guarantees successful import.
- Existing project records included in downloaded bundles are marked as exported. The randomizer does not overwrite exported or imported records. It does not automatically read upload results from SAP.

## Technical structure

- `index.html`: responsive UI using the existing DBT dark palette.
- `core.js`: country and event model, deterministic generator, validation, TXT parser/serializer and zero-dependency ZIP writer.
- `app.js`: retained local project state and existing edit/import/export operations.
- `workflow.js`: guided completion calculation, revisioned plan approval and per-month upload status.
- `guided.js`: country-first UI with five preparation steps and import phase.
- `core.test.js`, `workflow.test.js`: synthetic tests; `ui-smoke.cjs`: Chromium end-to-end acceptance with screenshots.

DBT loads the module through its mini-app navigation, and the same five runtime files are mirrored to the existing mini-app distribution feed as a versioned package. No database credentials or personal employee records are embedded.

### Run tests

```bash
node "payslip-desktop/mini-apps/Global View/Global View Demo Builder/core.test.js"
node "payslip-desktop/mini-apps/Global View/Global View Demo Builder/workflow.test.js"
```

### Versioning

Module version: **0.1.1**. Parent DBT version remains independent. The v0.1.1 module does not pretend to be an SAP-certified transport client; validation of target-environment acceptance remains an operational gate.
