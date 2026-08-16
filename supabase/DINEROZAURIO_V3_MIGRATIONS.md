# DineroZaurio v3 — Supabase migration lineage

Environment: PREPROD (`wsdtcsjkssvdqovdpxrq`)

PROD is intentionally not modified. Production remains the recovery/reference source until explicit v3 promotion approval.

The PREPROD database records the canonical executed SQL in `supabase_migrations.schema_migrations`. The v3 migration lineage currently is:

| Version | Migration |
| --- | --- |
| `20260816151350` | `create_dinerozaurio_v3_core_schema` |
| `20260816162327` | `dz3_funding_relative_recurrences` |
| `20260816162609` | `dz3_effective_rule_versions` |
| `20260816162904` | `dz3_mutation_audit_triggers` |
| `20260816163056` | `dz3_balance_observation_scope` |
| `20260816163450` | `dz3_complete_audit_coverage` |
| `20260816164706` | `dz3_trace_child_mutations_to_plan` |
| `20260816204225` | `remove_dinerozaurio_legacy_preprod_tables` |
| `20260816204541` | `remove_dinerozaurio_legacy_preprod_tables` — idempotent repeat during final verification; no additional data effect |
| `20260816204555` | `remove_dinerozaurio_legacy_bootstrap` |

## Current database contract

After the v3 cutover, the DineroZaurio PREPROD financial model consists only of the `dz3_*` tables. The old financial tables (`plans`, `income_items`, `expense_items`, `debt_items`, `savings_goals`, `month_adjustments` and temporary PREPROD bootstrap/draft tables) were deliberately removed after migration and authenticated runtime validation.

The obsolete `bootstrap_dinerozaurio_preprod()` function was also removed because it referenced the retired tables.

`profiles` is not part of the financial engine and was not removed because it is shared authentication/profile infrastructure.

## Recovery

- Git history preserves deleted legacy application code.
- PROD preserves the legacy financial source data.
- `dz3_migration_map` preserves source-to-target traceability for the migrated PREPROD user data.
- PREPROD's `supabase_migrations.schema_migrations` preserves the exact executed SQL for all executed migrations above.

The repeated cleanup migration is explicitly documented rather than rewriting migration history. It was safe because every statement used `IF EXISTS`.

No migration in this lineage should be applied to PROD merely by merging `preprod`. Production cutover requires an explicit migration plan and explicit approval.