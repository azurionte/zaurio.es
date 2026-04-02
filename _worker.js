const DEFAULT_SUPABASE_URL = "https://adpjitccwwvlydrtvvqk.supabase.co";
const VELOCICHEF_PUSH_KEY_PATH = "/api/velocichef/push-public-key";
const VELOCICHEF_PUSH_SEND_PATH = "/api/velocichef/push/send-due";
const VELOCICHEF_STEP_IMAGE_PATH = "/api/velocichef/step-image";
const VELOCICHEF_DEFAULT_IMAGE_MODEL = "@cf/black-forest-labs/flux-1-schnell";

function rewriteEmprezaurioHtml(html) {
  const version = Date.now().toString();
  return html
    .replace(/(\.\/app\/app\.css)\?v=[^"' >]+/g, `$1?v=${version}`)
    .replace(/(\.\/app\/app\.js)\?v=[^"' >]+/g, `$1?v=${version}`)
    .replace(/(\.\/app\/app\.css)(?!\?)/g, `$1?v=${version}`)
    .replace(/(\.\/app\/app\.js)(?!\?)/g, `$1?v=${version}`);
}

function jsonResponse(body, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("Content-Type", "application/json; charset=utf-8");
  if (!headers.has("Cache-Control")) {
    headers.set("Cache-Control", "no-store");
  }
  return new Response(JSON.stringify(body), {
    ...init,
    headers,
  });
}

function encodeUtf8(value) {
  return new TextEncoder().encode(value);
}

function concatBytes(...parts) {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
}

function base64UrlToUint8Array(value) {
  const normalized = String(value || "").replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4 || 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function uint8ArrayToBase64Url(bytes) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function uint8ArrayToBase64(bytes) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.slice(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

function uint32ToBytes(value) {
  return new Uint8Array([
    (value >>> 24) & 255,
    (value >>> 16) & 255,
    (value >>> 8) & 255,
    value & 255,
  ]);
}

function parseDerEcdsaSignature(signatureBytes) {
  if (signatureBytes.length === 64) return signatureBytes;
  if (signatureBytes[0] !== 0x30) {
    throw new Error("Firma ECDSA en formato no soportado.");
  }
  let offset = 2;
  if (signatureBytes[offset] !== 0x02) throw new Error("Firma ECDSA invalida.");
  offset += 1;
  const rLength = signatureBytes[offset];
  offset += 1;
  const r = signatureBytes.slice(offset, offset + rLength);
  offset += rLength;
  if (signatureBytes[offset] !== 0x02) throw new Error("Firma ECDSA invalida.");
  offset += 1;
  const sLength = signatureBytes[offset];
  offset += 1;
  const s = signatureBytes.slice(offset, offset + sLength);

  const rNormalized = r[0] === 0 ? r.slice(1) : r;
  const sNormalized = s[0] === 0 ? s.slice(1) : s;
  const result = new Uint8Array(64);
  result.set(rNormalized.slice(-32), 32 - Math.min(32, rNormalized.length));
  result.set(sNormalized.slice(-32), 64 - Math.min(32, sNormalized.length));
  return result;
}

async function hmacSha256(keyBytes, dataBytes) {
  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, dataBytes));
}

async function hkdfExtract(salt, ikm) {
  return hmacSha256(salt, ikm);
}

async function hkdfExpand(prk, info, length) {
  let previous = new Uint8Array(0);
  let output = new Uint8Array(0);
  let counter = 1;

  while (output.length < length) {
    previous = await hmacSha256(prk, concatBytes(previous, info, new Uint8Array([counter])));
    output = concatBytes(output, previous);
    counter += 1;
  }

  return output.slice(0, length);
}

async function createVapidJwt(env, audience) {
  const publicKeyRaw = base64UrlToUint8Array(env.VAPID_PUBLIC_KEY || "");
  const privateKeyRaw = String(env.VAPID_PRIVATE_KEY || "");
  if (publicKeyRaw.length !== 65 || !privateKeyRaw) {
    throw new Error("Faltan VAPID_PUBLIC_KEY o VAPID_PRIVATE_KEY.");
  }

  const x = uint8ArrayToBase64Url(publicKeyRaw.slice(1, 33));
  const y = uint8ArrayToBase64Url(publicKeyRaw.slice(33, 65));

  const privateKey = await crypto.subtle.importKey(
    "jwk",
    {
      kty: "EC",
      crv: "P-256",
      x,
      y,
      d: privateKeyRaw,
      ext: true,
      key_ops: ["sign"],
    },
    {
      name: "ECDSA",
      namedCurve: "P-256",
    },
    false,
    ["sign"],
  );

  const header = uint8ArrayToBase64Url(encodeUtf8(JSON.stringify({
    typ: "JWT",
    alg: "ES256",
  })));
  const payload = uint8ArrayToBase64Url(encodeUtf8(JSON.stringify({
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 12),
    sub: env.VAPID_SUBJECT || "mailto:hola@zaurio.es",
  })));
  const unsigned = `${header}.${payload}`;
  const signatureBuffer = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    privateKey,
    encodeUtf8(unsigned),
  );
  const signature = parseDerEcdsaSignature(new Uint8Array(signatureBuffer));
  return `${unsigned}.${uint8ArrayToBase64Url(signature)}`;
}

async function encryptPushPayload(subscription, payloadText) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const userPublicKeyBytes = base64UrlToUint8Array(subscription.p256dh);
  const authSecretBytes = base64UrlToUint8Array(subscription.auth);
  const userPublicKey = await crypto.subtle.importKey(
    "raw",
    userPublicKeyBytes,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    [],
  );
  const serverKeys = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"],
  );
  const sharedSecret = new Uint8Array(await crypto.subtle.deriveBits(
    { name: "ECDH", public: userPublicKey },
    serverKeys.privateKey,
    256,
  ));
  const serverPublicKeyBytes = new Uint8Array(await crypto.subtle.exportKey("raw", serverKeys.publicKey));
  const keyInfo = concatBytes(
    encodeUtf8("WebPush: info"),
    new Uint8Array([0]),
    userPublicKeyBytes,
    serverPublicKeyBytes,
  );
  const keyPrk = await hkdfExtract(authSecretBytes, sharedSecret);
  const ikm = await hkdfExpand(keyPrk, keyInfo, 32);
  const contentPrk = await hkdfExtract(salt, ikm);
  const cek = await hkdfExpand(contentPrk, concatBytes(encodeUtf8("Content-Encoding: aes128gcm"), new Uint8Array([0])), 16);
  const nonce = await hkdfExpand(contentPrk, concatBytes(encodeUtf8("Content-Encoding: nonce"), new Uint8Array([0])), 12);
  const plainText = concatBytes(encodeUtf8(payloadText), new Uint8Array([0x02]));
  const aesKey = await crypto.subtle.importKey(
    "raw",
    cek,
    { name: "AES-GCM" },
    false,
    ["encrypt"],
  );
  const cipherText = new Uint8Array(await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: nonce },
    aesKey,
    plainText,
  ));
  const recordSize = 4096;
  const header = concatBytes(
    salt,
    uint32ToBytes(recordSize),
    new Uint8Array([serverPublicKeyBytes.length]),
    serverPublicKeyBytes,
  );
  return concatBytes(header, cipherText);
}

async function sendWebPush(env, subscription, payload) {
  const endpoint = String(subscription.endpoint || "");
  const audience = new URL(endpoint).origin;
  const token = await createVapidJwt(env, audience);
  const body = await encryptPushPayload(subscription, JSON.stringify(payload));

  return fetch(endpoint, {
    method: "POST",
    headers: {
      TTL: "2419200",
      Urgency: payload.kind === "thaw" ? "high" : "normal",
      "Content-Encoding": "aes128gcm",
      "Content-Type": "application/octet-stream",
      Authorization: `vapid t=${token}, k=${env.VAPID_PUBLIC_KEY}`,
    },
    body,
  });
}

async function supabaseAdminFetch(env, path, init = {}) {
  const supabaseUrl = env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY en el worker.");
  }

  const headers = new Headers(init.headers || {});
  headers.set("apikey", serviceRoleKey);
  headers.set("Authorization", `Bearer ${serviceRoleKey}`);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(`${supabaseUrl}/rest/v1${path}`, {
    ...init,
    headers,
  });
}

async function readSupabaseJson(env, path) {
  const response = await supabaseAdminFetch(env, path, { method: "GET" });
  if (!response.ok) {
    throw new Error(`Supabase devolvio ${response.status} al leer ${path}.`);
  }
  return response.json();
}

async function fetchDueReminders(env, limit = 50) {
  const nowIso = encodeURIComponent(new Date().toISOString());
  return readSupabaseJson(
    env,
    `/velocichef_reminders?select=id,user_id,payload&delivered_at=is.null&trigger_at=lte.${nowIso}&order=trigger_at.asc&limit=${limit}`,
  );
}

async function fetchSubscriptionsForUser(env, userId) {
  return readSupabaseJson(
    env,
    `/velocichef_push_subscriptions?select=endpoint,p256dh,auth&enabled=is.true&user_id=eq.${encodeURIComponent(userId)}`,
  );
}

async function markReminderDelivered(env, reminderId) {
  const response = await supabaseAdminFetch(
    env,
    `/velocichef_reminders?id=eq.${encodeURIComponent(reminderId)}`,
    {
      method: "PATCH",
      headers: {
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        delivered_at: new Date().toISOString(),
      }),
    },
  );
  if (!response.ok) {
    throw new Error(`No pude marcar el recordatorio ${reminderId} como entregado.`);
  }
}

async function disableSubscription(env, endpoint) {
  await supabaseAdminFetch(
    env,
    `/velocichef_push_subscriptions?endpoint=eq.${encodeURIComponent(endpoint)}`,
    {
      method: "PATCH",
      headers: {
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        enabled: false,
        updated_at: new Date().toISOString(),
      }),
    },
  );
}

async function processDueVelocichefNotifications(env, limit = 50) {
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) {
    return {
      ok: false,
      error: "Faltan claves VAPID en el worker.",
    };
  }

  const reminders = await fetchDueReminders(env, limit);
  const stats = {
    ok: true,
    scanned: Array.isArray(reminders) ? reminders.length : 0,
    delivered: 0,
    skipped: 0,
    invalidSubscriptions: 0,
    errors: [],
  };

  for (const reminder of reminders || []) {
    const payload = {
      title: reminder.payload?.title || "VelociChef",
      body: reminder.payload?.body || "Tienes un recordatorio pendiente.",
      url: reminder.payload?.url || "https://herramientas.zaurio.es/velocichef/",
      icon: reminder.payload?.icon || "/velocichef/assets/store_icon.png",
      badge: reminder.payload?.badge || "/velocichef/assets/store_icon.png",
      tag: reminder.payload?.tag || reminder.id,
      kind: reminder.payload?.kind || "meal",
    };

    let subscriptions = [];
    try {
      subscriptions = await fetchSubscriptionsForUser(env, reminder.user_id);
    } catch (error) {
      stats.errors.push(error instanceof Error ? error.message : "No pude leer suscripciones.");
      continue;
    }

    if (!subscriptions.length) {
      stats.skipped += 1;
      continue;
    }

    let sentToAnyDevice = false;

    for (const subscription of subscriptions) {
      try {
        const response = await sendWebPush(env, subscription, payload);
        if (response.ok || response.status === 201) {
          sentToAnyDevice = true;
          continue;
        }

        if (response.status === 404 || response.status === 410) {
          stats.invalidSubscriptions += 1;
          await disableSubscription(env, subscription.endpoint);
          continue;
        }

        const message = await response.text().catch(() => "");
        stats.errors.push(`Push ${response.status} para ${subscription.endpoint}: ${message}`);
      } catch (error) {
        stats.errors.push(error instanceof Error ? error.message : "Fallo enviando web push.");
      }
    }

    if (sentToAnyDevice) {
      try {
        await markReminderDelivered(env, reminder.id);
        stats.delivered += 1;
      } catch (error) {
        stats.errors.push(error instanceof Error ? error.message : "No pude cerrar el recordatorio.");
      }
    } else {
      stats.skipped += 1;
    }
  }

  return stats;
}

async function sha256Hex(value) {
  const digest = await crypto.subtle.digest("SHA-256", encodeUtf8(String(value || "")));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function sanitizeVelocichefSearchQuery(value) {
  const stopWords = new Set([
    "de", "la", "el", "los", "las", "del", "con", "sin", "para", "por", "una", "un",
    "unos", "unas", "que", "este", "esta", "estos", "estas", "realistic", "realistico",
    "kitchen", "home", "scene", "clean", "close", "closeup", "overhead", "mobile",
    "friendly", "showing", "show", "step", "current", "dish", "meal", "style", "text",
    "labels", "captions", "watermarks", "focus", "only", "action", "ingredients", "needed",
    "this", "recipe", "no", "and", "the", "a", "an",
  ]);

  return String(value || "")
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/[^0-9A-Za-zÀ-ÿ\s-]/g, " ")
    .split(/\s+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 1)
    .filter((part) => !stopWords.has(part.toLowerCase()))
    .slice(0, 10)
    .join(" ");
}

function buildVelocichefStepImagePrompt(body) {
  const meal = body?.meal || {};
  const step = body?.step || {};
  const sceneGoal = String(step.image_prompt || step.imagePrompt || step.text || "").trim();

  return [
    "Warm editorial cookbook illustration.",
    meal.title ? `Dish: ${meal.title}.` : "",
    meal.summary ? `Summary: ${meal.summary}.` : "",
    step.title ? `Step title: ${step.title}.` : "",
    sceneGoal ? `Scene goal: ${sceneGoal}.` : "",
    "Show only food, ingredients, cookware, trays, bowls, pans or boards that belong to this step.",
    "No humans, no hands, no fingers, no arms, no faces, no body parts, no chef.",
    "Prefer overhead or three-quarter angle, clean composition, cookbook style, softly stylized illustration.",
    "No text, no labels, no UI, no watermark.",
  ].filter(Boolean).join(" ");
}

function buildVelocichefStepSearchQuery(body) {
  const meal = body?.meal || {};
  const step = body?.step || {};
  const explicit = String(step.image_search_query || step.imageSearchQuery || body?.searchQuery || "").trim();
  if (explicit) return `${sanitizeVelocichefSearchQuery(explicit)} food overhead`.trim();

  const combined = [
    meal.title || "",
    step.title || "",
    step.text || "",
    step.image_prompt || step.imagePrompt || "",
  ].filter(Boolean).join(" ");

  const sanitized = sanitizeVelocichefSearchQuery(combined);
  return `${sanitized || sanitizeVelocichefSearchQuery(meal.title || "home cooking")} food overhead`.trim();
}

function getVelocichefImageCacheKey(prompt, searchQuery) {
  return `${prompt}__${searchQuery}`;
}

async function readVelocichefCachedImage(prompt, searchQuery) {
  const cacheKey = await sha256Hex(getVelocichefImageCacheKey(prompt, searchQuery));
  return caches.default.match(new Request(`https://zaurio.es${VELOCICHEF_STEP_IMAGE_PATH}?cache=${cacheKey}`));
}

async function writeVelocichefCachedImage(prompt, searchQuery, response) {
  const cacheKey = await sha256Hex(getVelocichefImageCacheKey(prompt, searchQuery));
  await caches.default.put(
    new Request(`https://zaurio.es${VELOCICHEF_STEP_IMAGE_PATH}?cache=${cacheKey}`),
    response,
  );
}

async function normalizeWorkersAiImagePayload(aiResult) {
  if (!aiResult) return null;

  if (typeof aiResult === "object" && typeof aiResult.image === "string") {
    return {
      data: aiResult.image,
      mimeType: aiResult.mimeType || "image/png",
    };
  }

  const response = aiResult instanceof Response ? aiResult : new Response(aiResult);
  const buffer = await response.arrayBuffer();
  if (!buffer.byteLength) return null;

  return {
    data: uint8ArrayToBase64(new Uint8Array(buffer)),
    mimeType: response.headers.get("content-type") || "image/png",
  };
}

async function generateWorkersAiStepImage(env, prompt) {
  if (!env.AI || typeof env.AI.run !== "function") {
    return {
      image: null,
      configured: false,
      error: "Workers AI no esta configurado en este worker.",
    };
  }

  try {
    const aiResult = await env.AI.run(
      env.VELOCICHEF_IMAGE_MODEL || VELOCICHEF_DEFAULT_IMAGE_MODEL,
      { prompt },
    );
    const image = await normalizeWorkersAiImagePayload(aiResult);
    if (!image?.data) {
      return {
        image: null,
        configured: true,
        error: "Workers AI no devolvio una imagen util.",
      };
    }
    return {
      image: {
        src: `data:${image.mimeType || "image/png"};base64,${image.data}`,
        mimeType: image.mimeType || "image/png",
        provider: "workers-ai",
      },
      configured: true,
      error: "",
    };
  } catch (error) {
    return {
      image: null,
      configured: true,
      error: error instanceof Error ? error.message : "Workers AI no pudo generar la imagen.",
    };
  }
}

async function searchPexelsStepImage(env, searchQuery) {
  if (!env.PEXELS_API_KEY) {
    return {
      image: null,
      configured: false,
      error: "Pexels no esta configurado en este worker.",
    };
  }

  try {
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(searchQuery)}&per_page=1&orientation=portrait&size=medium`,
      {
        headers: {
          Authorization: env.PEXELS_API_KEY,
        },
      },
    );

    if (!response.ok) {
      const message = await response.text().catch(() => "");
      return {
        image: null,
        configured: true,
        error: `Pexels devolvio ${response.status}${message ? `: ${message}` : ""}`,
      };
    }

    const payload = await response.json().catch(() => ({}));
    const photo = Array.isArray(payload?.photos) ? payload.photos[0] : null;
    if (!photo?.src) {
      return {
        image: null,
        configured: true,
        error: "Pexels no encontro una foto para esta busqueda.",
      };
    }

    return {
      image: {
        src: photo.src.large || photo.src.large2x || photo.src.portrait || photo.src.medium,
        mimeType: "image/jpeg",
        provider: "pexels",
        attributionLabel: photo.photographer
          ? `Foto de ${photo.photographer} en Pexels`
          : "Foto de apoyo en Pexels",
        attributionUrl: photo.url || "https://www.pexels.com",
      },
      configured: true,
      error: "",
    };
  } catch (error) {
    return {
      image: null,
      configured: true,
      error: error instanceof Error ? error.message : "Pexels no pudo devolver una foto.",
    };
  }
}

async function resolveVelocichefStepImage(env, body) {
  const prompt = buildVelocichefStepImagePrompt(body);
  const searchQuery = buildVelocichefStepSearchQuery(body);
  const providerErrors = [];

  const aiAttempt = await generateWorkersAiStepImage(env, prompt);
  if (aiAttempt.image) {
    return {
      ok: true,
      imageAvailable: true,
      supportAvailable: true,
      image: aiAttempt.image,
      provider: aiAttempt.image.provider,
      prompt,
      searchQuery,
      providerErrors,
    };
  }
  if (aiAttempt.error) providerErrors.push(aiAttempt.error);

  const pexelsAttempt = await searchPexelsStepImage(env, searchQuery);
  if (pexelsAttempt.image) {
    return {
      ok: true,
      imageAvailable: true,
      supportAvailable: true,
      image: pexelsAttempt.image,
      provider: pexelsAttempt.image.provider,
      prompt,
      searchQuery,
      providerErrors,
    };
  }
  if (pexelsAttempt.error) providerErrors.push(pexelsAttempt.error);

  return {
    ok: true,
    imageAvailable: false,
    supportAvailable: Boolean(aiAttempt.configured || pexelsAttempt.configured),
    image: null,
    prompt,
    searchQuery,
    providerErrors,
    error: providerErrors[providerErrors.length - 1] || "No pude conseguir una imagen para este paso.",
  };
}

async function handleVelocichefApi(request, env, path) {
  if (path === VELOCICHEF_PUSH_KEY_PATH) {
    return jsonResponse({
      publicKey: env.VAPID_PUBLIC_KEY || "",
      configured: Boolean(env.VAPID_PUBLIC_KEY),
    });
  }

  if (path === VELOCICHEF_PUSH_SEND_PATH) {
    if (request.method === "OPTIONS") {
      return new Response("ok");
    }
    if (request.method !== "POST") {
      return jsonResponse({ ok: false, error: "Method not allowed" }, { status: 405 });
    }
    const authHeader = request.headers.get("authorization") || "";
    if (!env.VELOCICHEF_CRON_TOKEN || authHeader !== `Bearer ${env.VELOCICHEF_CRON_TOKEN}`) {
      return jsonResponse({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    try {
      const body = await request.json().catch(() => ({}));
      const limit = Math.max(1, Math.min(200, Number(body.limit || 50)));
      const result = await processDueVelocichefNotifications(env, limit);
      return jsonResponse(result);
    } catch (error) {
      return jsonResponse(
        { ok: false, error: error instanceof Error ? error.message : "No pude despachar avisos." },
        { status: 500 },
      );
    }
  }

  if (path === VELOCICHEF_STEP_IMAGE_PATH) {
    if (request.method === "OPTIONS") {
      return new Response("ok");
    }
    if (request.method !== "POST") {
      return jsonResponse({ ok: false, error: "Method not allowed" }, { status: 405 });
    }

    try {
      const body = await request.json().catch(() => ({}));
      const prompt = buildVelocichefStepImagePrompt(body);
      const searchQuery = buildVelocichefStepSearchQuery(body);
      const cached = await readVelocichefCachedImage(prompt, searchQuery);
      if (cached) return cached;

      const result = await resolveVelocichefStepImage(env, body);
      const response = jsonResponse(result, {
        headers: {
          "Cache-Control": result.imageAvailable
            ? "public, max-age=604800, s-maxage=604800"
            : "public, max-age=1800, s-maxage=1800",
        },
      });
      await writeVelocichefCachedImage(prompt, searchQuery, response.clone());
      return response;
    } catch (error) {
      return jsonResponse(
        { ok: false, error: error instanceof Error ? error.message : "No pude preparar la imagen del paso." },
        { status: 500 },
      );
    }
  }

  return null;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const host = url.hostname;
    let path = url.pathname;
    const search = url.search;

    if (path.startsWith("/api/velocichef/")) {
      const response = await handleVelocichefApi(request, env, path);
      if (response) return response;
    }

    if (path === "/admin" || path === "/admin/" || path === "/admin.html") {
      if (host !== "zaurio.es") {
        return Response.redirect(`https://zaurio.es/admin${url.search}`, 302);
      }
      path = "/admin.html";
    }

    if (path === "/" || path.endsWith("/")) {
      path = `${path}index.html`;
    }

    let folder = "";

    if (path.startsWith("/shared/")) {
      const assetUrl = new URL(path, url.origin);
      return env.ASSETS.fetch(new Request(assetUrl, request));
    }

    if (host === "miercoles.zaurio.es") {
      folder = "/miercoles.zaurio.es";
    } else if (host === "secretos.zaurio.es") {
      folder = "/secretos.zaurio.es";
    } else if (host === "herramientas.zaurio.es") {
      folder = "/herramientas";
    } else if (host === "juegos.zaurio.es") {
      folder = "/juegos.zaurio.es";
    } else if (host === "zaurio.es" || host === "www.zaurio.es") {
      folder = "";
    } else {
      return new Response("Host no reconocido", { status: 404 });
    }

    const candidates = [];
    const hasExtension = /\.[a-z0-9]+$/i.test(path.split("/").pop() || "");

    candidates.push(folder + path);
    if (!hasExtension) {
      candidates.push(`${folder + path}.html`);
      candidates.push(`${folder + path}/index.html`);
    }

    for (const candidate of candidates) {
      const assetUrl = new URL(candidate + search, url.origin);
      const response = await env.ASSETS.fetch(new Request(assetUrl, request));
      if (response.status !== 404) {
        const isEmprezaurioBetaHtml =
          candidate === "/herramientas/emprezaurio/beta/index.html" &&
          (response.headers.get("content-type") || "").includes("text/html");

        if (isEmprezaurioBetaHtml) {
          const html = await response.text();
          const rewritten = rewriteEmprezaurioHtml(html);
          const headers = new Headers(response.headers);
          headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
          return new Response(rewritten, {
            status: response.status,
            statusText: response.statusText,
            headers,
          });
        }
        return response;
      }
    }

    return new Response("No encontrado", { status: 404 });
  },

  async scheduled(controller, env, ctx) {
    const limit = controller.cron === "*/5 * * * *" ? 80 : 50;
    ctx.waitUntil(
      processDueVelocichefNotifications(env, limit).catch((error) => {
        console.error("VelociChef push cron failed:", error);
      }),
    );
  },
};
