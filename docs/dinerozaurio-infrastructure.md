# DineroZaurio v3 infrastructure map

This document records the current PREPROD infrastructure after the v3 cutover.

## GitHub

Repository: `azurionte/zaurio.es`

Branches:
- `main` — production; untouched by v3 PREPROD cutover
- `preprod` — DineroZaurio v3 construction and validation

Application paths on `preprod`:
- root redirect: `herramientas/dinerozaurio/index.html`
- v3 runtime: `herramientas/dinerozaurio/v3/`
- architecture: `herramientas/dinerozaurio/v3/ARCHITECTURE.md`
- implementation status: `herramientas/dinerozaurio/v3/IMPLEMENTATION_STATUS.md`

Preproduction hostname:
- `https://preprod.dinerozaurio.zaurio.es`

The PREPROD root redirects to `/v3/`.

## Cloudflare

PREPROD Worker:
- `dinerozaurio-preprod`

Deployment workflow:
- `.github/workflows/dinerozaurio-preprod-deploy.yml`

Assets directory:
- `herramientas/dinerozaurio`

The PREPROD worker deploys only the isolated `preprod` branch. No automatic production promotion exists.

## Supabase

### Production — reference only

Project ref:
- `adpjitccwwvlydrtvvqk`

Production remains the legacy data/reference source until explicit cutover approval. V3 development must not write to it.

### PREPROD v3

Project:
- `DineroZaurio Preprod`
- ref `wsdtcsjkssvdqovdpxrq`

Project URL:
- `https://wsdtcsjkssvdqovdpxrq.supabase.co`

The v3 domain uses normalized `dz3_*` tables with RLS and audit coverage. Migrated legacy data retains traceability to its source.

Google OAuth callback:
- `https://wsdtcsjkssvdqovdpxrq.supabase.co/auth/v1/callback`

Allowed application URL:
- `https://preprod.dinerozaurio.zaurio.es/`

## Authentication

The v3 web runtime uses Supabase OAuth and the authenticated user's RLS context. The removed legacy `preprod-guard.js` is no longer part of the runtime.

The application remains visibly marked as PREPROD in the v3 UI.

## MCP

PREPROD MCP source:
- `integrations/dinerozaurio-mcp/`

The PREPROD MCP is configured for the PREPROD Supabase project and imports the same pure v3 Financial Core used by the web runtime. It uses per-user OAuth bearer authentication plus the public Supabase publishable key; it must never use a service-role key.

The production MCP on `main` is not modified by PREPROD branch changes.

## Bank integration

The domain, persistence model, provider contract, bank-sync service and reconciliation engine exist. Live synchronization still requires selection/configuration of an Open Banking provider and provider credentials.

## AI integration

Scenario, Decision, audit and typed AI contracts exist. A live conversational chat still requires selection/configuration of an LLM/backend. The LLM must not become the financial calculator or write directly to financial tables.

## Security rules

- never commit privileged OAuth, bank-provider, LLM-provider, Supabase service-role or Cloudflare credentials;
- publishable Supabase keys are public client configuration, but RLS must remain enabled;
- PREPROD and PROD data/projects stay isolated;
- PROD writes/cutover require explicit approval;
- every financial figure exposed by UI/MCP must remain explainable from the v3 ledger.
