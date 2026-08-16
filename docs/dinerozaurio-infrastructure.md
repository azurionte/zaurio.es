# DineroZaurio infrastructure map

This document records where the important DineroZaurio infrastructure and authentication settings live, so future maintenance does not require rediscovering them.

## GitHub

Repository: `azurionte/zaurio.es`

Relevant application path: `herramientas/dinerozaurio/`

Branches:
- `main` — production code
- `preprod` — DineroZaurio preproduction code

Preproduction hostname:
- `https://preprod.dinerozaurio.zaurio.es`

Production hostname currently used by the application:
- `https://herramientas.zaurio.es/dinerozaurio/`

## Cloudflare Workers

Preproduction Worker:
- `dinerozaurio-preprod`

Specific Worker route:
- `preprod.dinerozaurio.zaurio.es/*` -> `dinerozaurio-preprod`

There is also a broader Zaurio Worker route covering `*.zaurio.es/*`; the explicit PREPROD route must remain present so the dedicated DineroZaurio Worker wins for the PREPROD hostname.

## Supabase

### Production

Project ref:
- `adpjitccwwvlydrtvvqk`

Auth callback used by Google OAuth:
- `https://adpjitccwwvlydrtvvqk.supabase.co/auth/v1/callback`

### Preproduction

Project name:
- `DineroZaurio Preprod`

Project ref:
- `wsdtcsjkssvdqovdpxrq`

Project URL:
- `https://wsdtcsjkssvdqovdpxrq.supabase.co`

Google OAuth callback to authorize:
- `https://wsdtcsjkssvdqovdpxrq.supabase.co/auth/v1/callback`

Application redirect / allowed app URL:
- `https://preprod.dinerozaurio.zaurio.es/`

PREPROD is intentionally isolated from the production Supabase project.

## Google OAuth

Google Cloud project containing the active Zaurio OAuth client:
- Project name: `8-doors`
- Project ID: `doors-2dd2e`

OAuth 2.0 Client ID name:
- `Zaurio.es`

Authorized JavaScript origins should include:
- `https://herramientas.zaurio.es`
- `https://preprod.dinerozaurio.zaurio.es`

Authorized redirect URIs should include:
- `https://adpjitccwwvlydrtvvqk.supabase.co/auth/v1/callback`
- `https://wsdtcsjkssvdqovdpxrq.supabase.co/auth/v1/callback`

Do not commit the Google OAuth client secret to this repository. The secret belongs in Supabase provider configuration / secure credential storage only.

## PREPROD access

PREPROD should use Google OAuth, not email magic links.

The PREPROD guard is in:
- `herramientas/dinerozaurio/preprod-guard.js`

The guard currently restricts access after Google authentication to the authorized test account and keeps the PREPROD environment visually marked.

## Shared assets

DineroZaurio still references shared Zaurio assets under `/shared/...`.

On the dedicated PREPROD hostname those root-relative URLs would otherwise resolve against `preprod.dinerozaurio.zaurio.es`. The PREPROD guard currently rewrites shared asset references to the canonical Zaurio origin so logos/icons continue to load.

## Security notes

- Do not store OAuth client secrets, Supabase service-role keys, Cloudflare API tokens, or other privileged secrets in Git.
- Publishable / anon client keys may appear in client code by design, but authorization must still be enforced through RLS and server-side rules.
- Keep production and PREPROD data/auth projects separate.

## Pending DineroZaurio work

- Finish PREPROD Google provider configuration in Supabase.
- Verify PREPROD auth end-to-end after Google provider is enabled.
- Complete and test financial data rollover behavior between accounting periods.
