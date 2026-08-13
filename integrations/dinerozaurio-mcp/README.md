# DineroZaurio MCP

Read-only MCP endpoint for exposing DineroZaurio financial data to ChatGPT without giving ChatGPT direct access to the Supabase dashboard or allowing financial writes.

## Endpoints

- `GET /health` - public health check. It returns no financial data.
- `POST /mcp` - MCP JSON-RPC endpoint. Requires `Authorization: Bearer <MCP_API_KEY>`.

## Read-only tools

- `get_financial_overview`
- `get_incomes`
- `get_expenses`
- `get_debts`
- `get_savings_goals`
- `get_month_adjustments`

The Worker only performs Supabase REST `GET` requests. It does not expose create, update or delete tools.

## Required secrets

Configure these as Cloudflare Worker secrets/variables. Do **not** commit their values to GitHub.

- `SUPABASE_URL` - the DineroZaurio Supabase project URL.
- `SUPABASE_SERVICE_ROLE_KEY` - server-side Supabase service-role key. Keep this secret.
- `DINEROZAURIO_USER_ID` - Supabase Auth UUID for the DineroZaurio user whose plan can be read.
- `MCP_API_KEY` - a long random bearer token used by the MCP client.

`FINANCE_TIMEZONE` is set to `Europe/Madrid` in `wrangler.toml` and is not sensitive.

## Deploy

From this directory, once Wrangler is authenticated and the four secret values above are configured:

```powershell
wrangler deploy
```

## Security model

1. The browser app continues using its normal Supabase publishable key and user session.
2. The MCP Worker uses a server-only service-role key.
3. Requests to `/mcp` must contain the separate `MCP_API_KEY` bearer token.
4. The Worker is pinned to a single `DINEROZAURIO_USER_ID` and selects only that user's first plan.
5. No secret value is stored in this repository.
6. The first version is deliberately read-only.

## Current DineroZaurio tables used

- `plans`
- `income_items`
- `expense_items`
- `debt_items`
- `savings_goals`
- `month_adjustments`

## Next external steps

After the code is merged:

1. Add the four secrets to the Cloudflare Worker configuration.
2. Deploy the Worker.
3. Test `/health` and an authenticated MCP `initialize` + `tools/list` request.
4. Add the resulting `/mcp` URL to the ChatGPT Business custom app / MCP configuration and provide the `MCP_API_KEY` there.

Do not paste the Supabase service-role key into ChatGPT or commit it to the repository.
