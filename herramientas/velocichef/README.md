# VelociChef

## Push notifications

VelociChef ya registra suscripciones push desde el navegador y guarda recordatorios en Supabase.
El envio real lo hace el worker principal (`/_worker.js`) cada 5 minutos por cron.

### Secrets necesarios en Cloudflare Worker

```bash
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler secret put VAPID_PUBLIC_KEY
wrangler secret put VAPID_PRIVATE_KEY
wrangler secret put VAPID_SUBJECT
wrangler secret put VELOCICHEF_CRON_TOKEN
```

Notas:

- `VAPID_PUBLIC_KEY` debe ser la clave publica base64url sin padding.
- `VAPID_PRIVATE_KEY` debe ser la clave privada base64url sin padding.
- `VAPID_SUBJECT` suele ser algo como `mailto:hola@zaurio.es`.
- `VELOCICHEF_CRON_TOKEN` sirve para disparar manualmente el endpoint protegido de envio si hace falta.

### Endpoint manual de despacho

Con el worker desplegado, puedes forzar un barrido manual:

```bash
curl -X POST "https://herramientas.zaurio.es/api/velocichef/push/send-due" ^
  -H "Authorization: Bearer TU_TOKEN" ^
  -H "Content-Type: application/json" ^
  -d "{\"limit\":50}"
```

### Flujo

1. El usuario acepta notificaciones y se crea una `PushSubscription`.
2. La suscripcion se guarda en `velocichef_push_subscriptions`.
3. Cada cambio de semana/schedule sincroniza `velocichef_reminders`.
4. El cron del worker busca recordatorios vencidos y envia Web Push.

### Generar claves VAPID

Hay un script local para generarlas en Windows:

```bash
powershell -ExecutionPolicy Bypass -File .\herramientas\velocichef\scripts\generate-vapid.ps1
```
