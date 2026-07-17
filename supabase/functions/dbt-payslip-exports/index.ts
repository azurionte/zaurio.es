const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

function json(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), { ...init, headers: { "Content-Type": "application/json; charset=utf-8", ...corsHeaders, ...(init?.headers || {}) } });
}

function value(input: unknown, max = 120) {
  return String(input || "").trim().slice(0, max);
}

async function supabase(path: string, init: RequestInit = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: SERVICE_KEY, authorization: `Bearer ${SERVICE_KEY}`, "content-type": "application/json", prefer: "return=representation,resolution=merge-duplicates", ...(init.headers || {}) },
  });
  const text = await response.text();
  if (!response.ok) throw new Error(text || `Supabase request failed with ${response.status}`);
  return text ? JSON.parse(text) : [];
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    if (request.method === "GET") {
      const url = new URL(request.url);
      const country = value(url.searchParams.get("country"), 8).toUpperCase();
      const period = value(url.searchParams.get("period"));
      const filters = [country ? `country_code=eq.${encodeURIComponent(country)}` : "", period ? `period_key=eq.${encodeURIComponent(period)}` : ""].filter(Boolean).join("&");
      const rows = await supabase(`dbt_payslip_exports?select=country_code,period_key,client_code,employee_count,downloaded_at&order=country_code.asc${filters ? `&${filters}` : ""}`);
      return json({ ok: true, exports: rows || [] });
    }
    if (request.method === "POST") {
      const input = await request.json().catch(() => ({}));
      const country = value(input.country || input.country_code, 8).toUpperCase();
      const period = value(input.period || input.period_key);
      const client = value(input.client || input.client_code, 40);
      const count = Math.max(0, Math.min(100000, Number(input.employeeCount || input.employee_count) || 0));
      if (!country || !period) return json({ ok: false, error: "Country and period are required." }, { status: 400 });
      const rows = await supabase("dbt_payslip_exports?on_conflict=country_code,period_key,client_code", { method: "POST", body: JSON.stringify({ country_code: country, period_key: period, client_code: client, employee_count: count, downloaded_by_device: value(input.device) || null, downloaded_at: new Date().toISOString() }) });
      return json({ ok: true, export: Array.isArray(rows) ? rows[0] : rows });
    }
    return json({ ok: false, error: "Method not allowed." }, { status: 405 });
  } catch (error) {
    console.error(error);
    return json({ ok: false, error: error instanceof Error ? error.message : "Unexpected error." }, { status: 500 });
  }
});
