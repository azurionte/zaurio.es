const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_MODEL = Deno.env.get("GEMINI_MODEL") || "gemini-2.5-flash";
const GEMINI_IMAGE_MODEL = Deno.env.get("GEMINI_IMAGE_MODEL") || "gemini-2.5-flash-image";

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
    "- Cada plato debe incluir un array steps con objetos de pasos concretos, claros y en orden.",
    "- En cada paso no asumas ingredientes no listados ni utensilios especiales.",
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
    '{"strategy":"...","batchingTips":["..."],"days":[{"date":"YYYY-MM-DD","meals":{"breakfast":{"title":"...","summary":"...","prep_minutes":15,"difficulty":"facil","calories":420,"servings":2,"nutrition":{"protein_g":25,"carbs_g":40,"fats_g":14,"fiber_g":7},"ingredients":[{"name":"...","quantity":300,"unit":"g","category":"Verduras","pantry":false,"spice":false,"freezable":false,"thaw_lead_hours":0}],"steps":[{"title":"Preparar","text":"...","timer_minutes":0,"image_prompt":"..."}]}}}],"freezerItems":[{"ingredient":"...","quantity":400,"unit":"g","mealDate":"YYYY-MM-DD","mealKey":"dinner","mealTitle":"...","thawLeadHours":12}]}',
    "",
    "Cada day.meals solo debe contener las comidas seleccionadas en el perfil.",
  ].join("\n");
}

function buildPriceComparisonPrompt(ingredients: Array<Record<string, unknown>>) {
  const ingredientList = Array.isArray(ingredients)
    ? ingredients.map((item) => `- ${item.name || "ingrediente"} ${item.quantity || 1}${item.unit ? ` ${item.unit}` : ""}`).join("\n")
    : "";

  return `Compara precios para los siguientes ingredientes en los supermercados españoles Carrefour, Mercadona, Bon Preu y Charter, y provee resultados en formato JSON sin markdown ni texto adicional. Usa precios reales aproximados de abril de 2026.

Ingredientes:
${ingredientList}

Reglas importantes:
- Si la cantidad requerida es pequeña (menos de 500g o 500ml), considera que los productos se venden en paquetes más grandes y proporciona el precio por unidad del paquete más pequeño disponible, pero especifica que es para una cantidad mayor.
- Por ejemplo, si se necesitan 200g de mantequilla y el mínimo es 500g, muestra el precio de 500g como referencia pero indica "Precio para paquete de 500g (mínimo disponible)".
- Busca productos equivalentes si el exacto no existe.
- Incluye al menos 2-3 opciones de precio por ingrediente cuando sea posible.
- Devuelve solo supermercados españoles con disponibilidad online.
- Los precios deben ser aproximados pero realistas.

Devuelve exactamente esta estructura JSON:
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
          "url": "enlace al producto si está disponible",
          "note": "Precio para paquete de 500g (mínimo disponible)" // opcional si aplica
        }
      ]
    }
  ],
  "summary": {
    "total_items": 5,
    "supermarkets_compared": ["Carrefour", "Mercadona", "Bon Preu", "Charter"],
    "best_supermarket_overall": "nombre del supermercado con mejor relación precio-cantidad"
  }
}`;
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
    '{"title":"...","summary":"...","prep_minutes":18,"difficulty":"facil","calories":510,"servings":2,"nutrition":{"protein_g":30,"carbs_g":45,"fats_g":18,"fiber_g":8},"ingredients":[{"name":"...","quantity":250,"unit":"g","category":"Despensa","pantry":false,"spice":false,"freezable":false,"thaw_lead_hours":0}],"steps":[{"title":"Preparar","text":"...","timer_minutes":0,"image_prompt":"..."}],"tags":["..."]}',
  ].filter(Boolean).join("\n");
}

function buildCookingGuidancePrompt(input: Record<string, unknown>) {
  const profile = (input.profile || {}) as Record<string, unknown>;
  const meal = (input.meal || {}) as Record<string, unknown>;
  const ingredients = Array.isArray(meal.ingredients) ? meal.ingredients : [];

  return [
    "Genera una guia de cocina paso a paso en espanol para una sola receta.",
    "Devuelve solo JSON valido, sin markdown ni texto adicional.",
    "Reglas importantes:",
    "- Devuelve entre 3 y 6 pasos.",
    "- Cada paso debe ser concreto, corto y accionable.",
    "- No asumas preferencias personales del usuario.",
    "- No inventes ingredientes, salsas, guarniciones ni utensilios especiales que no esten en la receta.",
    "- Usa solo los ingredientes listados y tecnicas razonables para ese plato.",
    "- No uses frases vagas como 'ajusta a tu gusto' salvo que sea imprescindible.",
    "- Si un paso requiere espera o coccion, indica timer_minutes.",
    "- Cada paso debe incluir image_prompt para una ilustracion tipo libro de cocina.",
    "- El image_prompt nunca debe pedir personas, manos, dedos, brazos, caras ni ninguna parte del cuerpo humano.",
    "- El image_prompt nunca debe pedir letras, palabras, etiquetas, envases con texto, UI ni carteles.",
    "- El image_prompt debe centrarse en alimentos y utensilios, no en acciones hechas por una mano humana.",
    "- Cada paso debe incluir image_search_query en ingles, de 3 a 8 palabras, pensada para buscar una foto de stock parecida sin personas y sin texto.",
    "",
    "Contexto del perfil:",
    buildProfileSummary(profile),
    "",
    `Receta: ${meal.title || "sin titulo"}.`,
    `Tipo de comida: ${mealLabels[String(input.mealKey || meal.mealKey || "meal")] || input.mealKey || meal.mealKey || "comida"}.`,
    `Resumen: ${meal.summary || "sin resumen"}.`,
    `Tiempo total estimado: ${meal.prep_minutes || meal.prepMinutes || 20} minutos.`,
    `Dificultad: ${meal.difficulty || "media"}.`,
    `Raciones: ${meal.servings || 1}.`,
    `Ingredientes: ${JSON.stringify(ingredients)}.`,
    "",
    "Forma JSON exacta:",
    '{"steps":[{"title":"Preparar verduras","text":"Lava el calabacin y corta en juliana el pimiento rojo.","timer_minutes":0,"image_prompt":"Realistic home kitchen scene showing sliced zucchini and red pepper cut into thin strips on a wooden board, clean overhead food photography, no text."}]}',
  ].join("\n");
}

function buildStepImagePrompt(input: Record<string, unknown>) {
  const meal = (input.meal || {}) as Record<string, unknown>;
  const step = (input.step || {}) as Record<string, unknown>;
  const sceneGoal = String(step.image_prompt || step.text || "").trim();

  return [
    "Create a top-down cooking illustration in a clean, modern, semi-flat digital cookbook style.",
    `Dish: ${meal.title || "Weekly dish"}.`,
    `Meal summary: ${meal.summary || ""}`,
    `Current step: ${sceneGoal || step.text || "Cooking step"}.`,
    "Style: soft gradients, smooth shading, slightly rounded stylized shapes, warm lighting, subtle highlights, minimal texture, vector-like finish, wooden surface background, ingredients clearly separated, not photorealistic.",
    "Show only the exact visual state of this step, not a later step and not the final plated dish.",
    "If this step prepares an empty bowl, tray, pan or pot, show it empty or only with what this step has already added.",
    "If this step cuts ingredients, show the raw ingredient plus a few cut pieces and the knife resting on the board, with no human hand.",
    "Never add cooked rice, sauces, garnishes or other ingredients unless this exact step explicitly says they are already there.",
    "Show only food, ingredients and cookware from this step.",
    "Never include people, hands, fingers, arms, faces or any human body part.",
    "Never include text, words, letters, labels, menu cards, captions or package text.",
  ].filter(Boolean).join(" ");
}

function buildProfileSummaryClean(profile: Record<string, unknown>) {
  const meals = Array.isArray(profile.plannedMeals) ? profile.plannedMeals : ["breakfast", "lunch", "dinner"];
  const household = Array.isArray(profile.householdMembers) ? profile.householdMembers : [];

  return [
    `Alergias y limites: ${(profile.allergies as string[] || []).join(", ") || "ninguno concreto"}${profile.allergyNotes ? `. Notas: ${profile.allergyNotes}` : ""}.`,
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
    profile.lunchPrepNightBefore ? "Prefiere cocinar el almuerzo la noche anterior." : "El almuerzo se cocina el mismo dia.",
  ].filter(Boolean).join("\n");
}

function buildWeekPromptV2(input: Record<string, unknown>) {
  const profile = (input.profile || {}) as Record<string, unknown>;
  const meals = Array.isArray(profile.plannedMeals) ? profile.plannedMeals.map(String) : ["breakfast", "lunch", "dinner"];
  const mealList = meals.map((meal) => `- ${meal}: ${mealLabels[meal] || meal}`).join("\n");
  const carryover = Array.isArray(profile.carryoverIngredients) ? profile.carryoverIngredients as Array<Record<string, unknown>> : [];

  return [
    "Genera un menu semanal realista en espanol para una app de planificacion de cocina.",
    `La semana debe empezar en la fecha ${input.startDate}.`,
    "Reglas importantes:",
    "- Devuelve solo JSON valido, sin markdown ni texto adicional.",
    "- Deben ser exactamente 7 dias consecutivos.",
    "- Usa cantidades metricas y unidades de este conjunto: g, kg, ml, l, unit.",
    "- Para especias o condimentos no hace falta exactitud; puedes usar quantity 1, unit 'unit' y spice true.",
    "- Prioriza reutilizar ingredientes entre dias para simplificar la compra.",
    "- Si el perfil incluye ingredientes disponibles de semanas anteriores, intenta reaprovecharlos de forma natural cuando encajen.",
    "- Ajusta las porciones al numero de personas indicado.",
    "- Cada plato debe incluir calorias aproximadas, tiempo de preparacion, dificultad y lista de ingredientes.",
    "- Cada plato debe incluir un array steps con entre 7 y 10 pasos pequenos y concretos.",
    "- Cada paso debe tener una sola accion principal o una pareja minima de acciones inseparables.",
    "- Cada paso debe indicar donde queda lo preparado al terminar: bandeja, bol, olla, sarten, tabla o plato.",
    "- Si la receta usa horno, intenta preparar antes la bandeja o recipiente donde iran los ingredientes.",
    "- No asumas ingredientes no listados ni utensilios especiales.",
    "- Si un ingrediente seria razonable congelarlo, marca freezable true y un thaw_lead_hours aproximado.",
    "- Los platos deben sonar apetecibles, caseros y factibles entre semana.",
    "",
    "Contexto del perfil:",
    buildProfileSummaryClean(profile),
    carryover.length
      ? `Ingredientes disponibles para reaprovechar: ${carryover.map((item) => `${item.name || "ingrediente"} ${item.quantity || 0}${item.unit || ""}`).join(", ")}.`
      : "",
    "",
    "Comidas a devolver en cada dia:",
    mealList,
    "",
    "La forma JSON exacta debe ser:",
    '{"strategy":"...","batchingTips":["..."],"days":[{"date":"YYYY-MM-DD","meals":{"breakfast":{"title":"...","summary":"...","prep_minutes":15,"difficulty":"facil","calories":420,"servings":2,"nutrition":{"protein_g":25,"carbs_g":40,"fats_g":14,"fiber_g":7},"ingredients":[{"name":"...","quantity":300,"unit":"g","category":"Verduras","pantry":false,"spice":false,"freezable":false,"thaw_lead_hours":0}],"steps":[{"title":"Preparar bandeja","text":"Forra una bandeja con papel de horno, pon unas gotas de aceite y dejala lista.","timer_minutes":0,"image_prompt":"..."}]}}}],"freezerItems":[{"ingredient":"...","quantity":400,"unit":"g","mealDate":"YYYY-MM-DD","mealKey":"dinner","mealTitle":"...","thawLeadHours":12}]}',
    "",
    "Cada day.meals solo debe contener las comidas seleccionadas en el perfil.",
  ].join("\n");
}

function buildSwapPromptV2(input: Record<string, unknown>) {
  const profile = (input.profile || {}) as Record<string, unknown>;
  const target = (input.target || {}) as Record<string, unknown>;
  const targetReasons = (target.reasons || {}) as Record<string, unknown>;
  const currentMeal = (target.currentMeal || {}) as Record<string, unknown>;
  const reasons = Array.isArray(targetReasons.reasons) ? targetReasons.reasons.map(String).join(", ") : "cambio general";
  const ingredients = Array.isArray(targetReasons.ingredients) ? targetReasons.ingredients.map(String).join(", ") : "ninguno";
  const carryover = Array.isArray(profile.carryoverIngredients) ? profile.carryoverIngredients as Array<Record<string, unknown>> : [];

  return [
    "Genera una alternativa de plato en espanol para sustituir una receta de una semana de menu.",
    "Devuelve solo JSON valido, sin markdown ni texto adicional.",
    "Debe mantener el mismo mealKey, respetar alergias y objetivos, y seguir intentando reutilizar ingredientes del resto de la semana si encaja.",
    "Si el perfil incluye ingredientes disponibles de semanas anteriores, intenta aprovecharlos si ayudan a la compra.",
    "Evita repetir el plato original y evita los ingredientes marcados como problema.",
    "Incluye entre 7 y 10 pasos pequenos y concretos, con una sola accion principal por paso cuando sea posible.",
    "Cada paso debe indicar donde queda lo preparado al terminar.",
    "",
    "Contexto del perfil:",
    buildProfileSummaryClean(profile),
    carryover.length
      ? `Ingredientes disponibles para reaprovechar: ${carryover.map((item) => `${item.name || "ingrediente"} ${item.quantity || 0}${item.unit || ""}`).join(", ")}.`
      : "",
    "",
    `Comida a sustituir: ${target.mealKey} en fecha ${target.date}.`,
    `Plato actual: ${currentMeal.title || "sin titulo"}.`,
    `Ingredientes a evitar si es posible: ${ingredients}.`,
    `Motivo del cambio: ${reasons}.`,
    input.existingWeek ? `Resumen de la semana actual: ${JSON.stringify(input.existingWeek)}` : "",
    "",
    "Forma JSON exacta:",
    '{"title":"...","summary":"...","prep_minutes":18,"difficulty":"facil","calories":510,"servings":2,"nutrition":{"protein_g":30,"carbs_g":45,"fats_g":18,"fiber_g":8},"ingredients":[{"name":"...","quantity":250,"unit":"g","category":"Despensa","pantry":false,"spice":false,"freezable":false,"thaw_lead_hours":0}],"steps":[{"title":"Preparar base","text":"Coloca un bol grande en la encimera y dejalo listo para mezclar.","timer_minutes":0,"image_prompt":"..."}],"tags":["..."]}',
  ].filter(Boolean).join("\n");
}

function buildCookingGuidancePromptV2(input: Record<string, unknown>) {
  const profile = (input.profile || {}) as Record<string, unknown>;
  const meal = (input.meal || {}) as Record<string, unknown>;
  const ingredients = Array.isArray(meal.ingredients) ? meal.ingredients : [];

  return [
    "Genera una guia de cocina paso a paso en espanol para una sola receta.",
    "Devuelve solo JSON valido, sin markdown ni texto adicional.",
    "Reglas importantes:",
    "- Devuelve entre 8 y 10 pasos.",
    "- Cada paso debe ser concreto, corto y accionable.",
    "- Cada paso debe contener una sola accion principal o una pareja minima de acciones inseparables.",
    "- Cada paso debe poder leerse bien desde lejos en una pantalla de movil.",
    "- Usa una sola frase corta por paso siempre que sea posible.",
    "- Maximo orientativo: 22 palabras por paso.",
    "- No metas varios ingredientes distintos en un mismo paso si se pueden separar.",
    "- Si cortas, lavas o pelas ingredientes diferentes, separalos en pasos distintos cuando sea razonable.",
    "- Despues de cada accion indica donde queda ese ingrediente o mezcla: bandeja, bol, olla, sarten, tabla o plato.",
    "- Si la receta usa horno, el primer paso debe preparar la bandeja o recipiente.",
    "- Si la receta usa olla o sarten, prepara antes el recipiente donde iras reservando ingredientes.",
    "- No asumas preferencias personales del usuario.",
    "- No inventes ingredientes, salsas, guarniciones ni utensilios especiales que no esten en la receta.",
    "- Usa solo los ingredientes listados y tecnicas razonables para ese plato.",
    "- No uses frases vagas como 'ajusta a tu gusto' salvo que sea imprescindible.",
    "- Si un paso requiere espera o coccion, indica timer_minutes.",
    "- Si un paso requiere espera o coccion, indica tambien timer_label con una accion corta y util para el aviso, por ejemplo: 'Retirar del horno', 'Escurrir arroz' o 'Dar la vuelta al pollo'.",
    "- Cada paso debe incluir image_prompt para una ilustracion tipo libro de cocina.",
    "- El image_prompt debe describir SOLO lo que se ve en ese instante concreto del paso.",
    "- El image_prompt no debe adelantarse a pasos futuros ni mostrar el plato terminado si aun no toca.",
    "- Si el paso es preparar un bol, bandeja, olla o sarten para despues, ese recipiente debe verse vacio o solo con lo ya anadido en ese paso.",
    "- Si el paso es cortar o pelar ingredientes, el image_prompt debe mostrar ingredientes crudos enteros, algunas piezas ya cortadas y el cuchillo apoyado, pero nunca manos humanas.",
    "- Si el paso termina dejando algo en una bandeja, bol, olla, sarten, tabla o plato, el image_prompt debe reflejar ese destino exacto.",
    "- El image_prompt nunca debe pedir personas, manos, dedos, brazos, caras ni ninguna parte del cuerpo humano.",
    "- El image_prompt nunca debe pedir letras, palabras, etiquetas, envases con texto, UI ni carteles.",
    "- El image_prompt debe seguir este estilo: vista cenital o casi cenital, ilustracion digital semi-plana, moderna y limpia, gradientes suaves, sombreado liso, formas ligeramente redondeadas, colores vivos pero naturales, luz calida, textura minima, acabado casi vectorial, fondo de madera suave, ingredientes bien separados y faciles de leer, estetica acogedora de libro de cocina, nada fotorealista.",
    "- Cada paso debe incluir image_search_query con 3 a 8 palabras utiles para buscar una foto publica parecida sin personas y sin texto.",
    "- image_search_query debe describir la misma escena exacta del paso actual, no el plato completo.",
    "",
    "Contexto del perfil:",
    buildProfileSummaryClean(profile),
    "",
    `Receta: ${meal.title || "sin titulo"}.`,
    `Tipo de comida: ${mealLabels[String(input.mealKey || meal.mealKey || "meal")] || input.mealKey || meal.mealKey || "comida"}.`,
    `Resumen: ${meal.summary || "sin resumen"}.`,
    `Tiempo total estimado: ${meal.prep_minutes || meal.prepMinutes || 20} minutos.`,
    `Dificultad: ${meal.difficulty || "media"}.`,
    `Raciones: ${meal.servings || 1}.`,
    `Ingredientes: ${JSON.stringify(ingredients)}.`,
    "",
    "Forma JSON exacta:",
    '{"steps":[{"title":"Preparar bol","text":"Coloca un bol grande vacio en la encimera y dejalo listo para mezclar.","timer_minutes":0,"timer_label":"","image_prompt":"Top-down semi-flat digital illustration of a clean empty mixing bowl on a wooden counter, ready for ingredients, warm light, no people, no hands, no text.","image_search_query":"empty mixing bowl overhead"},{"title":"Cortar verduras","text":"Lava el calabacin. Corta el calabacin en medias rodajas y el pimiento en tiras. Dejalos juntos sobre la tabla.","timer_minutes":0,"timer_label":"","image_prompt":"Top-down semi-flat digital illustration of one whole zucchini, several zucchini slices, one red pepper partly cut into strips, and a kitchen knife resting on a wooden board, no cooked food, no people, no hands, no text.","image_search_query":"cut zucchini pepper board"}]}',
  ].join("\n");
}

function splitVerboseStep(step: Record<string, unknown>, index: number) {
  const normalized = normalizeStepPayload(step, index);
  const sourceText = String(normalized.text || "").trim();
  if (!sourceText) return [];

  const sentences = sourceText
    .split(/(?<=[.!?])\s+|;\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (sentences.length <= 1 && sourceText.length <= 120) {
    return [normalized];
  }

  return sentences.map((sentence, sentenceIndex) => ({
    title: sentenceIndex === 0 ? normalized.title : `${normalized.title} ${sentenceIndex + 1}`,
    text: sentence,
    timer_minutes: sentenceIndex === sentences.length - 1 ? normalized.timer_minutes : 0,
    timer_label: sentenceIndex === sentences.length - 1 ? normalized.timer_label : "",
    image_prompt: normalized.image_prompt,
    image_search_query: normalized.image_search_query,
  }));
}

function expandAtomicSteps(rawSteps: Array<Record<string, unknown>>) {
  const normalized = rawSteps
    .map((step, index) => normalizeStepPayload(step, index))
    .filter((step) => step.text);
  const exploded = rawSteps
    .flatMap((step, index) => splitVerboseStep(step, index))
    .map((step, index) => normalizeStepPayload(step, index))
    .filter((step) => step.text);
  return exploded.length > 10 ? normalized : exploded;
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

  // Extract JSON from the response, in case there's extra text
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Gemini no devolvió JSON válido.");
  }

  try {
    return JSON.parse(jsonMatch[0]);
  } catch (parseError) {
    throw new Error(`Error al parsear JSON de Gemini: ${parseError.message}`);
  }
}

async function callGeminiImage(prompt: string) {
  if (!GEMINI_API_KEY) {
    throw new Error("Falta GEMINI_API_KEY en los secrets de Supabase.");
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_IMAGE_MODEL}:generateContent`,
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
          responseModalities: ["TEXT", "IMAGE"],
        },
      }),
    },
  );

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error?.message || "No he podido generar la ilustracion.");
  }

  const parts = payload?.candidates?.[0]?.content?.parts || [];
  const imagePart = parts.find((part: Record<string, unknown>) => (part.inlineData || part.inline_data));
  const inlineData = imagePart?.inlineData || imagePart?.inline_data;
  if (!inlineData?.data || !inlineData?.mimeType && !inlineData?.mime_type) {
    throw new Error("No he recibido una imagen util para este paso.");
  }

  return {
    mimeType: inlineData.mimeType || inlineData.mime_type || "image/png",
    data: inlineData.data,
  };
}

function normalizeStepPayload(raw: Record<string, unknown>, index: number) {
  return {
    title: String(raw.title || `Paso ${index + 1}`).trim(),
    text: String(raw.text || raw.description || "").trim(),
    timer_minutes: Number(raw.timer_minutes || 0) || 0,
    timer_label: String(raw.timer_label || raw.timerLabel || "").trim(),
    image_prompt: String(raw.image_prompt || "").trim(),
    image_search_query: String(raw.image_search_query || raw.imageSearchQuery || "").trim(),
  };
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
    steps: Array.isArray(raw.steps)
      ? raw.steps.map((step, index) => typeof step === "string"
        ? { title: `Paso ${index + 1}`, text: step, timer_minutes: 0, timer_label: "", image_prompt: "" }
        : normalizeStepPayload(step as Record<string, unknown>, index)).filter((step) => step.text)
      : [],
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

    if (action === "compare_prices") {
      const ingredients = Array.isArray(body.ingredients) ? body.ingredients : [];
      if (!ingredients.length) {
        return json({ ok: false, error: "Se requiere un array de ingredientes para comparar." }, { status: 400 });
      }
      const rawResult = await callGemini(buildPriceComparisonPrompt(ingredients));
      return json({ ok: true, data: rawResult });
    }

    if (action === "cook_guidance") {
      const rawGuidance = await callGemini(buildCookingGuidancePromptV2(body));
      const steps = Array.isArray(rawGuidance.steps)
        ? expandAtomicSteps(rawGuidance.steps as Array<Record<string, unknown>>)
        : [];
      return json({ ok: true, steps });
    }

    if (action === "generate_step_image") {
      try {
        const image = await callGeminiImage(buildStepImagePrompt(body));
        return json({ ok: true, image, imageAvailable: true });
      } catch (error) {
        return json({
          ok: true,
          image: null,
          imageAvailable: false,
          imageError: error instanceof Error ? error.message : "No he podido generar la ilustracion.",
        });
      }
    }

    if (action === "swap_meal") {
      const rawMeal = await callGemini(buildSwapPromptV2(body));
      return json({ ok: true, meal: normalizeMealPayload(rawMeal) });
    }

    const rawPlan = await callGemini(buildWeekPromptV2(body));
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
