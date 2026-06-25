const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const VALID_COUNTRIES = new Set([
  "AU", "BR", "CA", "CA 6.30", "CN", "DE", "FR", "GB", "GB TAX", "IE",
  "IN", "JP", "MA", "MX", "NL", "SG", "UAE", "US", "US 6.30",
]);

function json(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders,
      ...(init?.headers || {}),
    },
  });
}

function cleanCountry(value: unknown) {
  return String(value || "").trim().toUpperCase();
}

function cleanEmployeeId(value: unknown) {
  return String(value || "").trim().replace(/\s+/g, "");
}

function validEmployeeId(value: string) {
  return /^[A-Za-z0-9._-]{2,32}$/.test(value);
}

function validSalary(value: number) {
  return Number.isFinite(value) && value > 0 && value <= 10000000;
}

async function supabase(path: string, init: RequestInit = {}) {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    throw new Error("Supabase service configuration is missing.");
  }
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SERVICE_KEY,
      authorization: `Bearer ${SERVICE_KEY}`,
      "content-type": "application/json",
      prefer: "return=representation,resolution=merge-duplicates",
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(text || `Supabase request failed with ${res.status}`);
  }
  return text ? JSON.parse(text) : null;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(request.url);

    if (request.method === "GET") {
      const country = cleanCountry(url.searchParams.get("country"));
      const filter = country ? `&country_code=eq.${encodeURIComponent(country)}` : "";
      const data = await supabase(
        `dbt_celergo_employees?select=country_code,employee_id,monthly_salary,source,created_by_device,created_at,updated_at&active=eq.true${filter}&order=country_code.asc,employee_id.asc`,
        { method: "GET" },
      );
      return json({ ok: true, employees: data || [] });
    }

    if (request.method === "POST") {
      const input = await request.json().catch(() => ({}));
      const country = cleanCountry(input.country || input.country_code);
      const employeeId = cleanEmployeeId(input.employeeId || input.employee_id);
      const monthlySalary = Number(input.monthlySalary ?? input.monthly_salary);
      const device = String(input.device || input.created_by_device || "").trim().slice(0, 120);

      if (!VALID_COUNTRIES.has(country)) {
        return json({ ok: false, error: "Unsupported country." }, { status: 400 });
      }
      if (!validEmployeeId(employeeId)) {
        return json({ ok: false, error: "Invalid employee ID." }, { status: 400 });
      }
      if (!validSalary(monthlySalary)) {
        return json({ ok: false, error: "Invalid monthly salary." }, { status: 400 });
      }

      const row = {
        country_code: country,
        employee_id: employeeId,
        monthly_salary: Math.round(monthlySalary * 100) / 100,
        created_by_device: device || null,
        source: "dbt-monthly-changes",
        active: true,
      };
      const data = await supabase("dbt_celergo_employees?on_conflict=country_code,employee_id", {
        method: "POST",
        body: JSON.stringify(row),
      });
      return json({ ok: true, employee: Array.isArray(data) ? data[0] : data });
    }

    return json({ ok: false, error: "Method not allowed." }, { status: 405 });
  } catch (error) {
    console.error(error);
    return json({ ok: false, error: error instanceof Error ? error.message : "Unexpected error." }, { status: 500 });
  }
});
