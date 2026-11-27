import {handleDinoPush,runDinoPush} from './handler.mjs';
const DEFAULT_SUPABASE_URL='https://adpjitccwwvlydrtvvqk.supabase.co';
const origin='https://herramientas.zaurio.es';
const credentials='/dinofit_push_credentials?singleton=eq.true';
const cors={'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'authorization, content-type, apikey','Access-Control-Allow-Methods':'POST, OPTIONS','Vary':'Origin'};
const json=(body,init={})=>Response.json(body,{...init,headers:{'Cache-Control':'no-store',...cors,...init.headers}});
const runtime={SUPABASE_URL:Deno.env.get('SUPABASE_URL')||DEFAULT_SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY:Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||''};
async function settings(){
 const r=await supabaseAdminFetch(runtime,credentials+'&select=cron_key,vapid_public,vapid_private');
 if(!r.ok)throw Error('Credentials unavailable');
 const keys=(await r.json())[0];if(!keys)throw Error('Credentials unavailable');
 return keys;
}
async function readyKeys(keyset){
 if(keyset.vapid_public&&keyset.vapid_private)return keyset;
 const generated=await crypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},true,['sign','verify']);
 const publicRaw=await crypto.subtle.exportKey('raw',generated.publicKey);
 const privateJwk=await crypto.subtle.exportKey('jwk',generated.privateKey);
 const r=await supabaseAdminFetch(runtime,credentials+'&vapid_public=is.null',{method:'PATCH',
  body:JSON.stringify({vapid_public:uint8ArrayToBase64Url(new Uint8Array(publicRaw)),vapid_private:privateJwk.d})});
 if(!r.ok)throw Error('No se pudo preparar el permiso.');
 return settings();
}
function match(a,b){
 if(typeof a!=='string'||typeof b!=='string'||a.length!==64||b.length!==64)return false;
 let mismatch=0;for(let i=0;i<64;i++)mismatch|=a.charCodeAt(i)^b.charCodeAt(i);
 return mismatch===0;
}
Deno.serve(async request=>{
 const url=new URL(request.url),prefix=/^.*\/dinofit-push\//.exec(url.pathname)?.[0];
 if(!prefix)return json({ok:false,message:'No encontrado.'},{status:404});
 const action=url.pathname.slice(prefix.length);
 const isCron=action==='cron';
 if(request.method==='OPTIONS'&&!isCron&&request.headers.get('Origin')===origin)return new Response(null,{status:204,headers:cors});
 if(request.method!=='POST')return json({ok:false,message:'Método no permitido.'},{status:405});
 if(!isCron&&(request.headers.get('Origin')!==origin||!request.headers.get('Authorization')))
  return json({ok:false,message:'Entra en DinoFit para gestionar avisos.'},{status:401});
 if(isCron&&!/^[a-f0-9]{64}$/.test(request.headers.get('X-DinoFit-Cron')||''))return json({ok:false},{status:401});
 try{
  let keyset=await settings();
  if(isCron&&!match(request.headers.get('X-DinoFit-Cron'),keyset.cron_key))return json({ok:false},{status:401});
  // The private cron primes the keys and avoids doing expensive key creation
  // during an untrusted browser request.
  if(isCron)keyset=await readyKeys(keyset);
  const env={...runtime,VAPID_PUBLIC_KEY:keyset.vapid_public,VAPID_PRIVATE_KEY:keyset.vapid_private};
  const tools={admin:supabaseAdminFetch,post:sendWebPush,json,defaultUrl:DEFAULT_SUPABASE_URL,expectedOrigin:origin,routePrefix:prefix};
  if(isCron){await runDinoPush(env,tools);return json({ok:true})}
  return handleDinoPush(request,env,tools);
 }catch{console.error('DinoFit push runtime failed');return json({ok:false,message:'No se pudo conectar con el servicio de avisos.'},{status:503})}
});

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

async function sendWebPush(env, subscription, payload, options={}) {
  const endpoint = String(subscription.endpoint || "");
  const audience = new URL(endpoint).origin;
  const token = await createVapidJwt(env, audience);
  const body = await encryptPushPayload(subscription, JSON.stringify(payload));

  return fetch(endpoint, {
    method: "POST",
    headers: {
      TTL: String(options.ttl ?? 600),
      Urgency: payload.urgency || (payload.kind === "thaw" ? "high" : "normal"),
      "Content-Encoding": "aes128gcm",
      "Content-Type": "application/octet-stream",
      Authorization: `vapid t=${token}, k=${env.VAPID_PUBLIC_KEY}`,
    },
    body,
    redirect: "error",
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

