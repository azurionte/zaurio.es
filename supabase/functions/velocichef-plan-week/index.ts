const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_MODEL = Deno.env.get("GEMINI_MODEL") || "gemini-2.5-flash";

const mealLabels: Record<string, string> = {
  breakfast: "desayuno",
  lunch: "almuerzo",
  snack: "merienda",
  dinner: "cena",
  bites: "colaciones entre comidas",
};

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

function normalizeUnit(unit: unknown) {
  const value = String(unit || "unit").toLowerCase();
  const map: Record<string, string> = {
    unidad: "unit",
    unidades: "unit",
    unit: "unit",
    units: "unit",
    g: "g",
    gr: "g",
    gramos: "g",
    kg: "kg",
    kilo: "kg",
    kilos: "kg",
    ml: "ml",
    l: "l",
    litro: "l",
    litros: "l",
  };
  return map[value] || "unit";
}

function unitToBase(quantity: unknown, unit: unknown) {
  const normalized = normalizeUnit(unit);
  const amount = Number(quantity || 0) || 0;
  if (normalized === "kg") return { amount: amount * 1000, unit: "g" };
  if (normalized === "l") return { amount: amount * 1000, unit: "ml" };
  return { amount, unit: normalized };
}

function formatQuantity(quantity: number, unit: string) {
  const base = unitToBase(quantity, unit);
  if (base.unit === "g" && base.amount >= 1000) {
    return `${(base.amount / 1000).toFixed(base.amount % 1000 === 0 ? 0 : 2)} kg`;
  }
  if (base.unit === "ml" && base.amount >= 1000) {
    return `${(base.amount / 1000).toFixed(base.amount % 1000 === 0 ? 0 : 2)} l`;
  }
  if (base.unit === "unit") {
    return `${base.amount || 1} ud`;
  }
  return `${Number(base.amount.toFixed(base.amount >= 10 ? 0 : 1))} ${base.unit}`;
}

function buildProfileSummary(profile: Record<string, unknown>) {
  const meals = Array.isArray(profile.plannedMeals) ? profile.plannedMeals : ["breakfast", "lunch", "dinner"];
  const household = Array.isArray(profile.householdMembers) ? profile.householdMembers : [];

  return [
    `Alergias y límites: ${(profile.allergies as string[] || []).join(", ") || "ninguno concreto"}${profile.allergyNotes ? `. Notas: ${profile.allergyNotes}` : ""}.`,
    `Cosas que le gustan: ${(profile.likes as string[] || []).join(", ") || "sin preferencias marcadas"}.`,
    `Cosas que no le gustan: ${(profile.dislikes as string[] || []).join(", ") || "sin descartes concretos"}${profile.dietaryNotes ? `. Notas extra: ${profile.dietaryNotes}` : ""}.`,
    `Nivel de cocina deseado: ${profile.cookingStyle || "balanced"}.`,
    `Objetivos alimentarios: ${(profile.goalTags as string[] || []).join(", ") || "comer balanceado y variado"}.`,
    `Comidas a planificar: ${meals.map((meal) => mealLabels[String(meal)] || meal).join(", ")}.`,
    `Personas para cocinar: ${profile.householdCount || 1}.`,
    household.length
      ? `Miembros del hogar: ${household.map((member: Record<string, unknown>) => `${member.name || "Persona"} (${member.sameAsMe ? "mismas reglas" : member.notes || "reglas propias"})`).join("; ")}.`
      : "",
    `Horario de almuerzo: ${profile.lunchTime || "14:30"}.`,
    `Horario de cena: ${profile.dinnerTime || "21:00"}.`,
    profile.lunchPrepNightBefore ? "Prefiere cocinar el almuerzo la noche anterior." : "El almuerzo se cocina el mismo día.",
  ].filter(Boolean).join("\n");
}

function buildWeekPrompt(input: Record<string, unknown>) {
  const profile = (input.profile || {}) as Record<string, unknown>;
  const meals = Array.isArray(profile.plannedMeals) ? profile.plannedMeals.map(String) : ["breakfast", "lunch", "dinner"];
  const mealList = meals.map((meal) => `- ${meal}: ${mealLabels[meal] || meal}`).join("\n");

  return [
    "Genera un menu semanal realista en espanol para una app de planificacion de cocina.",
    `La semana debe empezar en la fecha ${input.startDate}.`,
    "Reglas importantes:",
    "- Devuelve solo JSON valido, sin markdown ni texto adicional.",
    "- Deben ser exactamente 7 dias consecutivos.",
    "- Usa cantidades metricas y unidades de este conjunto: g, kg, ml, l, unit.",
    "- Para especias o condimentos no hace falta exactitud; puedes usar quantity 1, unit 'unit' y spice true.",
    "- Prioriza reutilizar ingredientes entre dias para simplificar la compra.",
    "- Ajusta las porciones al numero de personas indicado.",
    "- Cada plato debe incluir calorias aproximadas, tiempo de preparacion, dificultad y lista de ingredientes.",
    "- Si un ingrediente seria razonable congelarlo, marca freezable true y un thaw_lead_hours aproximado.",
    "- Los platos deben sonar apetecibles, caseros y factibles entre semana.",
    "",
    "Contexto del perfil:",
    buildProfileSummary(profile),
    "",
    "Comidas a devolver en cada dia:",
    mealList,
    "",
    "La forma JSON exacta debe ser:",
    '{"strategy":"...","batchingTips":["..."],"days":[{"date":"YYYY-MM-DD","meals":{"breakfast":{"title":"...","summary":"...","prep_minutes":15,"difficulty":"facil","calories":420,"servings":2,"nutrition":{"protein_g":25,"carbs_g":40,"fats_g":14,"fiber_g":7},"ingredients":[{"name":"...","quantity":300,"unit":"g","category":"Verduras","pantry":false,"spice":false,"freezable":false,"thaw_lead_hours":0}]}}}],"freezerItems":[{"ingredient":"...","quantity":400,"unit":"g","mealDate":"YYYY-MM-DD","mealKey":"dinner","mealTitle":"...","thawLeadHours":12}]}',
    "",
    "Cada day.meals solo debe contener las comidas seleccionadas en el perfil.",
  ].join("\n");
}

function buildSwapPrompt(input: Record<string, unknown>) {
  const profile = (input.profile || {}) as Record<string, unknown>;
  const target = (input.target || {}) as Record<string, unknown>;
  const targetReasons = (target.reasons || {}) as Record<string, unknown>;
  const currentMeal = (target.currentMeal || {}) as Record<string, unknown>;
  const reasons = Array.isArray(targetReasons.reasons) ? targetReasons.reasons.map(String).join(", ") : "cambio general";
  const ingredients = Array.isArray(targetReasons.ingredients) ? targetReasons.ingredients.map(String).join(", ") : "ninguno";

  return [
    "Genera una alternativa de plato en espanol para sustituir una receta de una semana de menu.",
    "Devuelve solo JSON valido, sin markdown ni texto adicional.",
    "Debe mantener el mismo mealKey, respetar alergias y objetivos, y seguir intentando reutilizar ingredientes del resto de la semana si encaja.",
    "Evita repetir el plato original y evita los ingredientes marcados como problema.",
    "",
    "Contexto del perfil:",
    buildProfileSummary(profile),
    "",
    `Comida a sustituir: ${target.mealKey} en fecha ${target.date}.`,
    `Plato actual: ${currentMeal.title || "sin titulo"}.`,
    `Ingredientes a evitar si es posible: ${ingredients}.`,
    `Motivo del cambio: ${reasons}.`,
    input.existingWeek ? `Resumen de la semana actual: ${JSON.stringify(input.existingWeek)}` : "",
    "",
    "Forma JSON exacta:",
    '{"title":"...","summary":"...","prep_minutes":18,"difficulty":"facil","calories":510,"servings":2,"nutrition":{"protein_g":30,"carbs_g":45,"fats_g":18,"fiber_g":8},"ingredients":[{"name":"...","quantity":250,"unit":"g","category":"Despensa","pantry":false,"spice":false,"freezable":false,"thaw_lead_hours":0}],"tags":["..."]}',
  ].filter(Boolean).join("\n");
}

async function callGemini(prompt: string) {
  if (!GEMINI_API_KEY) {
    throw new Error("Falta GEMINI_API_KEY en los secrets de Supabase.");
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.8,
        },
      }),
    },
  );

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error?.message || "Gemini no devolvió una respuesta válida.");
  }

  const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Gemini no devolvió contenido útil.");
  }
  return JSON.parse(text);
}

function normalizeMealPayload(raw: Record<string, unknown>) {
  const ingredients = Array.isArray(raw.ingredients)
    ? raw.ingredients.map((ingredient) => ({
        name: String((ingredient as Record<string, unknown>).name || "").trim(),
        quantity: Number((ingredient as Record<string, unknown>).quantity || 0) || 0,
        unit: normalizeUnit((ingredient as Record<string, unknown>).unit),
        category: String((ingredient as Record<string, unknown>).category || "Otros"),
        pantry: !!(ingredient as Record<string, unknown>).pantry,
        spice: !!(ingredient as Record<string, unknown>).spice,
        freezable: !!(ingredient as Record<string, unknown>).freezable,
        thawLeadHours: Number((ingredient as Record<string, unknown>).thaw_lead_hours || 0) || 0,
      })).filter((ingredient) => ingredient.name)
    : [];

  return {
    title: String(raw.title || "Plato semanal").trim(),
    summary: String(raw.summary || "").trim(),
    prep_minutes: Number(raw.prep_minutes || 20) || 20,
    difficulty: String(raw.difficulty || "media").trim(),
    calories: Number(raw.calories || 0) || 0,
    servings: Number(raw.servings || 1) || 1,
    nutrition: {
      protein_g: Number((raw.nutrition as Record<string, unknown>)?.protein_g || 0) || 0,
      carbs_g: Number((raw.nutrition as Record<string, unknown>)?.carbs_g || 0) || 0,
      fats_g: Number((raw.nutrition as Record<string, unknown>)?.fats_g || 0) || 0,
      fiber_g: Number((raw.nutrition as Record<string, unknown>)?.fiber_g || 0) || 0,
    },
    ingredients,
    tags: Array.isArray(raw.tags) ? raw.tags.map(String) : [],
  };
}

function aggregateShopping(days: Array<Record<string, unknown>>) {
  const bucket = new Map<string, Record<string, unknown>>();

  days.forEach((day) => {
    const meals = (day.meals || {}) as Record<string, Record<string, unknown>>;
    Object.entries(meals).forEach(([mealKey, meal]) => {
      (meal.ingredients as Array<Record<string, unknown>> || []).forEach((ingredient) => {
        const base = unitToBase(ingredient.quantity, ingredient.unit);
        const key = `${String(ingredient.name).toLowerCase()}__${base.unit}`;
        const entry = bucket.get(key) || {
          name: ingredient.name,
          quantity: 0,
          unit: base.unit,
          category: ingredient.category,
          refs: [],
        };
        entry.quantity = Number(entry.quantity || 0) + base.amount;
        (entry.refs as Array<Record<string, unknown>>).push({
          date: day.date,
          mealKey,
          mealTitle: meal.title,
        });
        bucket.set(key, entry);
      });
    });
  });

  return Array.from(bucket.values()).map((item) => ({
    ...item,
    displayQuantity: formatQuantity(Number(item.quantity || 0), String(item.unit || "unit")),
    pantryStatus: "need",
  }));
}

function deriveFreezerItems(days: Array<Record<string, unknown>>, rawFreezerItems: Array<Record<string, unknown>> = []) {
  if (rawFreezerItems.length) {
    return rawFreezerItems.map((item) => ({
      ingredient: item.ingredient,
      quantity: Number(item.quantity || 0) || 0,
      unit: normalizeUnit(item.unit),
      mealDate: item.mealDate,
      mealKey: item.mealKey,
      mealTitle: item.mealTitle,
      thawLeadHours: Number(item.thawLeadHours || 12) || 12,
    }));
  }

  const freezerItems: Array<Record<string, unknown>> = [];
  days.forEach((day) => {
    const meals = (day.meals || {}) as Record<string, Record<string, unknown>>;
    Object.entries(meals).forEach(([mealKey, meal]) => {
      (meal.ingredients as Array<Record<string, unknown>> || []).forEach((ingredient) => {
        if (!ingredient.freezable) return;
        freezerItems.push({
          ingredient: ingredient.name,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          mealDate: day.date,
          mealKey,
          mealTitle: meal.title,
          thawLeadHours: ingredient.thawLeadHours || 12,
        });
      });
    });
  });
  return freezerItems;
}

function normalizeWeekPlan(raw: Record<string, unknown>, startDate: string) {
  const days = Array.isArray(raw.days) ? raw.days : [];
  if (days.length !== 7) {
    throw new Error("Gemini no devolvió exactamente 7 días.");
  }

  const normalizedDays = days.map((day, index) => {
    const meals = (day as Record<string, unknown>).meals || {};
    return {
      date: String((day as Record<string, unknown>).date || new Date(startDate).toISOString().slice(0, 10)),
      meals: Object.fromEntries(
        Object.entries(meals as Record<string, Record<string, unknown>>).map(([mealKey, meal]) => [mealKey, normalizeMealPayload(meal)]),
      ),
    };
  });

  return {
    strategy: String(raw.strategy || "").trim(),
    batchingTips: Array.isArray(raw.batchingTips) ? raw.batchingTips.map(String) : [],
    startDate,
    endDate: normalizedDays[normalizedDays.length - 1]?.date || startDate,
    days: normalizedDays,
    shoppingList: aggregateShopping(normalizedDays),
    freezerItems: deriveFreezerItems(normalizedDays, Array.isArray(raw.freezerItems) ? raw.freezerItems as Array<Record<string, unknown>> : []),
  };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const action = String(body.action || "generate_week");
    const startDate = String(body.startDate || new Date().toISOString().slice(0, 10));

    if (action === "swap_meal") {
      const rawMeal = await callGemini(buildSwapPrompt(body));
      return json({ ok: true, meal: normalizeMealPayload(rawMeal) });
    }

    const rawPlan = await callGemini(buildWeekPrompt(body));
    return json({ ok: true, plan: normalizeWeekPlan(rawPlan, startDate) });
  } catch (error) {
    return json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "No he podido generar el menú.",
      },
      { status: 500 },
    );
  }
});
