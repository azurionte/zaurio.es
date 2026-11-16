# GlobalView Demo Builder — v0.1

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

## How to use

1. Create a project, select **Australia**, choose the calendar year and provide the employee numbers. The sample roster of 76 is **fictional**.
2. Open **Event planner**. Choose a scenario, use the probability, yearly count and month-intensity controls, then **Save this pattern**. Click **Generate events**.
3. Review annual/monthly charts and the detailed employee records. Adjust outliers and annotate exceptions.
4. Optionally import existing GlobalView TXT files in **Employees & events**. The importer detects duplicate unchanged rows.
5. In **Export center**, select the exact range of months and infotypes; review counts/warnings; download the ZIP.
6. Record upload confirmation **only after loading the files in GlobalView**. A file download is not confirmation of upload.
7. Use **Share snapshot** and **Import snapshot** to hand work to another analyst with a revision checkpoint; import is explicit replacement, never automatic merging.
8. Under **Country setup**, use **Build a country from scratch**. Fill in the system and client values, create each data format, configure fields, mark source roles, enter header/routing values and add scenarios. Export templates for newly created countries must be validated by the owning GlobalView team.

## Compatibility and security boundaries

- The supplied example documents and employee identifiers are **not** stored in the public GitHub repository. Only schemas, labels, example routing and **synthetic data** are used in the source and tests.
- The original examples established *reference-compatible serialization* for Australia P2001/P2010. No direct GlobalView test-system upload has yet been performed; real import acceptance, dynamic header semantics and month-boundary behavior must be signed off with the GV team.
- P0008, P0015 and P0267 are not yet configured for export; actual sample templates are necessary.
- Country variations may involve employee-specific calendars, eligibility, wage types, subtypes, absence groups, pay periods and collision rules. v0.1 uses simple probabilities, limits, weekdays and basic overlap checks, **not** a complete SAP payroll validation model.
- Data is stored locally in the application's browser storage. Do not use live confidential employee data outside an authorized corporate environment. Versioned snapshot sharing is **manual**; automatic multi-user synchronization, identity, access controls, conflict resolution and server audit logs are not implemented.
- Reference filename routing values observed for Australia are **examples only** and may need confirmation per environment; do not assume a successful UTF-16LE export guarantees successful import.
- Existing project records included in downloaded bundles are marked as exported. The randomizer does not overwrite exported or imported records. It does not automatically read upload results from SAP.

## Technical structure

- `index.html`: responsive UI using the existing DBT dark palette.
- `core.js`: country and event model, deterministic generator, validation, TXT parser/serializer and zero-dependency ZIP writer.
- `app.js`: local project state, pages, editing, audit log, import/export and handovers.
- `core.test.js`: synthetic Node.js smoke tests.

DBT loads the module through its mini-app navigation, and the same three runtime files are mirrored to the existing mini-app distribution feed as a versioned package. No database credentials or personal employee records are embedded.

### Run tests

```bash
node "payslip-desktop/mini-apps/Global View/Global View Demo Builder/core.test.js"
```

### Versioning

Module version: **0.1**. Parent DBT version remains independent. The v0.1 module does not pretend to be an SAP-certified transport client; validation of target-environment acceptance remains an operational gate.
