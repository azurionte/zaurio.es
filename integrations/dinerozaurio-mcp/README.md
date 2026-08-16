# DineroZaurio v3 MCP — PREPROD

Read-only MCP adapter over the DineroZaurio v3 Financial Core.

The MCP does **not** contain an alternative finance calculator. It loads the authenticated user's `dz3_*` state through Supabase RLS and calls the same pure v3 Financial Core used by the PREPROD web runtime.

## Security model

- Supabase OAuth bearer token identifies the user.
- The Worker validates the bearer with Supabase Auth.
- Supabase REST requests use the publishable key plus that user's bearer token.
- RLS remains the tenant/data boundary.
- No service-role key is used.
- MCP tools are read-only.

## PREPROD isolation

`wrangler.toml` points to the isolated PREPROD Supabase project and deploys a separate Worker named `dinerozaurio-mcp-preprod`.

The production MCP Worker is not reused or overwritten by PREPROD deployment. Production remains unchanged until explicit promotion approval.

## Tools

- `get_financial_overview`
- `get_period_snapshot`
- `get_financial_timeline`
- `get_current_position`
- `evaluate_purchase`
- `get_incomes`
- `get_expenses`
- `get_debts`
- `get_savings_goals`

Financial period and purchase results are generated through `herramientas/dinerozaurio/v3/application/financial-service.js` and therefore share the same salary-cycle semantics, evidence hierarchy, recurrence engine, debt engine, projection logic and missing-funding logic as the web app.

## Truth rules

`bank_actual > user_confirmed > forecast`

If current account truth is missing or stale, `evaluate_purchase` must return that the position requires confirmation rather than invent a balance.

## Endpoints

- `GET /health`
- `GET /.well-known/oauth-protected-resource`
- `POST /mcp`

## Deployment

`.github/workflows/dz-v3-mcp-preprod-deploy.yml` deploys only the isolated PREPROD Worker when v3 MCP/core code changes on the `preprod` branch.

There is no automatic production promotion.