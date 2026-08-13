import worker from './worker.js';

function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...extraHeaders
    }
  });
}

async function proxyJson(url) {
  const response = await fetch(url, {
    headers: { Accept: 'application/json' }
  });
  const text = await response.text();
  return new Response(text, {
    status: response.status,
    headers: {
      'Content-Type': response.headers.get('Content-Type') || 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
}

function oauthChallenge(origin) {
  return `Bearer resource_metadata="${origin}/.well-known/oauth-protected-resource", scope="email profile"`;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const supabase = env.SUPABASE_URL?.replace(/\/$/, '');

    if (!supabase) {
      return json({ error: 'SUPABASE_URL is not configured' }, 503);
    }

    if (
      url.pathname === '/.well-known/oauth-authorization-server' ||
      url.pathname === '/.well-known/oauth-authorization-server/mcp' ||
      url.pathname === '/mcp/.well-known/oauth-authorization-server'
    ) {
      return proxyJson(`${supabase}/.well-known/oauth-authorization-server/auth/v1`);
    }

    if (
      url.pathname === '/.well-known/openid-configuration' ||
      url.pathname === '/.well-known/openid-configuration/mcp' ||
      url.pathname === '/mcp/.well-known/openid-configuration'
    ) {
      return proxyJson(`${supabase}/auth/v1/.well-known/openid-configuration`);
    }

    if (url.pathname === '/mcp' && request.method === 'GET') {
      return json(
        { error: 'unauthorized', message: 'OAuth authorization is required.' },
        401,
        { 'WWW-Authenticate': oauthChallenge(url.origin) }
      );
    }

    return worker.fetch(request, env, ctx);
  }
};
