const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_MODEL = Deno.env.get("GEMINI_MODEL") || "gemini-2.5-flash";

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

function buildPriceComparisonPrompt(ingredients: Array<Record<string, unknown>>) {
  const ingredientList = Array.isArray(ingredients)
    ? ingredients
        .map((item) => `- ${item.name || "ingrediente"} ${item.quantity || 1}${item.unit ? ` ${item.unit}` : ""}`)
        .join("\n")
    : "";

  return `Busca y compara precios para los siguientes ingredientes en estos supermercados españoles: Carrefour, Mercadona, Bon Preu, Charter, y cualquier otro que encuentres disponible online.

Ingredientes a buscar:
${ingredientList}

Devuelve SOLO un JSON válido, sin markdown, explicaciones ni texto adicional. Estructura exacta:

{
  "ingredients": [
    {
      "name": "nombre del ingrediente",
      "quantity": 1,
      "unit": "kg",
      "results": [
        {
          "supermarket": "Nombre del supermercado",
          "price": 2.50,
          "currency": "EUR",
          "product_name": "nombre exacto del producto",
          "availability": "available/out_of_stock/unavailable",
          "url": "enlace al producto si está disponible"
        }
      ]
    }
  ],
  "summary": {
    "total_items": 5,
    "supermarkets_compared": ["Carrefour", "Mercadona", "Bon Preu", "Charter"],
    "best_supermarket_overall": "nombre del supermercado con mejor relación precio-cantidad"
  }
}

Reglas importantes:
- Si no encuentras un ingrediente en un supermercado específico, omítelo de ese resultado.
- Busca productos equivalentes si el exacto no existe.
- Intenta encontrar al menos 2-3 opciones de precio por ingrediente.
- Incluye solo supermercados españoles con disponibilidad online.
- Los precios deben ser aproximados pero realistas (de abril 2026).
- Si no puedes encontrar información confiable, devuelve availability como "unavailable".`;
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
          temperature: 0.4,
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

async function handleComparePrices(req: Request) {
  const body = await req.json();
  const ingredients = body.ingredients || [];

  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    return json({ error: "Se requiere un array de ingredientes." }, { status: 400 });
  }

  try {
    const prompt = buildPriceComparisonPrompt(ingredients);
    const result = await callGemini(prompt);

    return json({
      ok: true,
      data: result,
    });
  } catch (error) {
    console.error("Error en comparación de precios:", error);
    return json(
      {
        error: String(error?.message || "Error desconocido al comparar precios."),
      },
      { status: 500 },
    );
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method === "POST") {
    return await handleComparePrices(req);
  }

  return json({ error: "Método no permitido" }, { status: 405 });
});
