const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
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

function eq(value: string) {
  return encodeURIComponent(value);
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

function missingTable(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || "");
  return message.includes("PGRST205") || message.includes("Could not find the table");
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(request.url);

    if (request.method === "GET") {
      const country = cleanCountry(url.searchParams.get("country"));
      const filter = country ? `&country_code=eq.${eq(country)}` : "";
      const employees = await supabase(
        `dbt_celergo_employees?select=country_code,employee_id,monthly_salary,source,created_by_device,created_at,updated_at&active=eq.true${filter}&order=country_code.asc,employee_id.asc`,
        { method: "GET" },
      );
      const inactiveEmployees = await supabase(
        `dbt_celergo_employees?select=country_code,employee_id,updated_at&active=eq.false${filter}&order=country_code.asc,employee_id.asc`,
        { method: "GET" },
      );
      let deletions: unknown[] = [];
      try {
        deletions = await supabase(
          `dbt_celergo_employee_deletions?select=country_code,employee_id,deleted_by_device,deleted_at${filter}&order=country_code.asc,employee_id.asc`,
          { method: "GET" },
        ) || [];
      } catch (error) {
        if (!missingTable(error)) throw error;
      }
      const deletionMap = new Map<string, Record<string, unknown>>();
      for (const row of (deletions || []) as Record<string, unknown>[]) {
        deletionMap.set(`${row.country_code}|${row.employee_id}`, row);
      }
      for (const row of (inactiveEmployees || []) as Record<string, unknown>[]) {
        const key = `${row.country_code}|${row.employee_id}`;
        if (!deletionMap.has(key)) {
          deletionMap.set(key, {
            country_code: row.country_code,
            employee_id: row.employee_id,
            deleted_by_device: null,
            deleted_at: row.updated_at,
          });
        }
      }
      return json({ ok: true, employees: employees || [], deletions: Array.from(deletionMap.values()) });
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
      try {
        await supabase(
          `dbt_celergo_employee_deletions?country_code=eq.${eq(country)}&employee_id=eq.${eq(employeeId)}`,
          { method: "DELETE" },
        );
      } catch (error) {
        if (!missingTable(error)) throw error;
      }
      return json({ ok: true, employee: Array.isArray(data) ? data[0] : data });
    }

    if (request.method === "DELETE") {
      const input = await request.json().catch(() => ({}));
      const country = cleanCountry(input.country || input.country_code || url.searchParams.get("country"));
      const employeeId = cleanEmployeeId(input.employeeId || input.employee_id || url.searchParams.get("employeeId"));
      const device = String(input.device || input.deleted_by_device || "").trim().slice(0, 120);

      if (!VALID_COUNTRIES.has(country)) {
        return json({ ok: false, error: "Unsupported country." }, { status: 400 });
      }
      if (!validEmployeeId(employeeId)) {
        return json({ ok: false, error: "Invalid employee ID." }, { status: 400 });
      }

      await supabase(
        `dbt_celergo_employees?country_code=eq.${eq(country)}&employee_id=eq.${eq(employeeId)}`,
        { method: "PATCH", body: JSON.stringify({ active: false }) },
      );
      const deletion = {
        country_code: country,
        employee_id: employeeId,
        deleted_by_device: device || null,
        source: "dbt-monthly-changes",
        deleted_at: new Date().toISOString(),
      };
      let data: unknown = deletion;
      let warning = "";
      try {
        data = await supabase("dbt_celergo_employee_deletions?on_conflict=country_code,employee_id", {
          method: "POST",
          body: JSON.stringify(deletion),
        });
      } catch (error) {
        if (!missingTable(error)) throw error;
        warning = "Deletion tombstone table is not deployed yet.";
      }
      return json({ ok: true, deletion: Array.isArray(data) ? data[0] : data, warning });
    }

    return json({ ok: false, error: "Method not allowed." }, { status: 405 });
  } catch (error) {
    console.error(error);
    return json({ ok: false, error: error instanceof Error ? error.message : "Unexpected error." }, { status: 500 });
  }
});
