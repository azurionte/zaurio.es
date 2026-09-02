const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_MODEL = Deno.env.get("GEMINI_MODEL") || "gemini-2.5-flash";
const VELOCIRAPTOR_RATIO = 0.35;

function json(body, init) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders,
      ...(init?.headers || {}),
    },
  });
}

function buildPrompt(input) {
  const shape = input.questionCount > 1
    ? '[{"type":"standard","question":"...","choices":["..."],"correct_index":0,"explanation":"...","category":"...","difficulty":"..."},{"type":"speed","question":"...","choices":[{"text":"...","score":140,"rank":1}],"explanation":"...","category":"...","difficulty":"..."}]'
    : '{"type":"standard","question":"...","choices":["..."],"correct_index":0,"explanation":"...","category":"...","difficulty":"..."}';
  const speedCount = input.questionCount > 1
    ? Math.max(1, Math.min(input.questionCount, Math.round(input.questionCount * VELOCIRAPTOR_RATIO)))
    : 0;
  const english = input.language === "en";
  return [
    input.questionCount > 1
      ? (english ? `Generate ${input.questionCount} trivia questions in English.` : `Genera ${input.questionCount} preguntas para un concurso de trivia en espanol.`)
      : (english ? "Generate a single trivia question in English." : "Genera una unica pregunta para un concurso de trivia en espanol."),
    english ? "They must be clear, entertaining, and suitable for a general audience." : "Debe ser clara, entretenida y apta para una audiencia general.",
    english ? `Requested theme: ${input.theme}.` : `Tema solicitado: ${input.theme}.`,
    english ? `Requested tone: ${input.tone}.` : `Tono solicitado: ${input.tone}.`,
    english ? `Difficulty: ${input.difficulty}.` : `Dificultad: ${input.difficulty}.`,
    english ? `Audience: ${input.audience}.` : `Audiencia: ${input.audience}.`,
    english ? `Number of answers: ${input.answerCount}.` : `Numero de respuestas: ${input.answerCount}.`,
    input.customPrompt ? (english ? `Extra host instruction: ${input.customPrompt}.` : `Instruccion extra del anfitrion: ${input.customPrompt}.`) : "",
    english ? "Return only valid JSON, no markdown, no extra text, no comments." : "Devuelve solo JSON valido, sin markdown, sin texto adicional y sin comentarios.",
    english ? "The JSON must follow exactly this shape:" : "El JSON debe seguir exactamente esta forma:",
    shape,
    english ? "Rules:" : "Reglas:",
    english ? "- For standard questions, choices must have exactly the requested amount." : "- En preguntas standard, choices debe tener exactamente el numero pedido.",
    english ? "- For standard questions, correct_index must point to exactly one correct answer." : "- En preguntas standard, correct_index debe apuntar a una unica respuesta correcta.",
    english ? "- For speed questions, choices must be an array of objects with text, score, and rank." : "- En preguntas speed, choices debe ser un array de objetos con text, score y rank.",
    english ? "- For speed questions, every answer must be valid, but some must be better than others." : "- En preguntas speed, todas las respuestas deben ser validas, pero unas mejores que otras.",
    english ? "- For speed questions, rank 1 must be the best and larger ranks must be worse." : "- En preguntas speed, rank 1 debe ser la mejor y rank mayor la peor.",
    english ? "- For speed questions, ranks must be unique and cover every answer from 1 to the requested answer count." : "- En preguntas speed, los ranks deben ser unicos y cubrir todas las respuestas desde 1 hasta el numero de respuestas pedido.",
    english ? "- For speed questions, scores must be positive and strictly decrease as rank gets worse." : "- En preguntas speed, los scores deben ser positivos y bajar estrictamente a medida que empeora el rank.",
    english ? "- CRITICAL: every speed answer must be factually true and genuinely applicable to the exact question. Never include a distractor, joke, category intruder, fictional outsider, or partially false answer." : "- CRITICO: cada respuesta speed debe ser factualmente verdadera y aplicable de verdad a la pregunta exacta. Nunca incluyas distractores, bromas, intrusos de otra categoria, personajes ajenos ni respuestas parcialmente falsas.",
    english ? "- A speed question must have one clear, objective ranking criterion (for example: larger, earlier, higher, faster, closer, more numerous). The ranking must be defensible from factual information." : "- Una pregunta speed debe tener un unico criterio objetivo y claro de ranking (por ejemplo: mayor, anterior, mas alto, mas rapido, mas cercano, mas numeroso). El orden debe poder defenderse con hechos.",
    english ? "- Do NOT rank answers by completeness. Do NOT make near-identical lists by progressively removing, adding, or reordering items." : "- NO ordenes respuestas por completitud. NO hagas listas casi identicas quitando, anadiendo o reordenando elementos progresivamente.",
    english ? "- Speed choices must be meaningfully distinct from each other while all remaining valid candidates for the same comparison." : "- Las opciones speed deben ser claramente distintas entre si, pero todas deben seguir siendo candidatas validas para la misma comparacion.",
    english ? "- If the topic cannot support the requested number of fully valid, objectively rankable answers, choose a different question instead of inventing weak options." : "- Si el tema no permite el numero pedido de respuestas totalmente validas y ordenables objetivamente, elige otra pregunta en vez de inventar opciones flojas.",
    input.questionCount > 1
      ? (english ? `- Exactly ${speedCount} questions must be of type "speed" (35% of the generated set, rounded to the nearest whole question) and the rest "standard".` : `- Exactamente ${speedCount} preguntas deben ser de tipo "speed" (35% del conjunto generado, redondeado a la pregunta entera mas cercana) y el resto "standard".`)
      : "",
    english ? "- Do not repeat options or create ambiguous answers." : "- No repitas opciones ni hagas respuestas ambiguas.",
    english ? "- explanation must be brief, maximum two sentences." : "- explanation debe ser breve, maxima dos frases.",
    input.questionCount > 1 ? (english ? `- You must return exactly ${input.questionCount} questions.` : `- Debes devolver exactamente ${input.questionCount} preguntas.`) : "",
  ].filter(Boolean).join("\n");
}

function buildTranslatePrompt(input) {
  const english = input.language === "en";
  return [
    english
      ? "Translate the following trivia questions into English."
      : "Traduce las siguientes preguntas de trivia al espanol.",
    english
      ? "Return only valid JSON. Keep the same structure and the same number of items."
      : "Devuelve solo JSON valido. Manten la misma estructura y la misma cantidad de elementos.",
    english
      ? "Preserve type, correct_index, score, rank, and array order."
      : "Conserva type, correct_index, score, rank y el orden de los arrays.",
    english
      ? "Translate question, choices text, explanation, category, and difficulty naturally."
      : "Traduce de forma natural question, choices text, explanation, category y difficulty.",
    english
      ? "Do not invent or remove answers."
      : "No inventes ni elimines respuestas.",
    JSON.stringify(input.questions || []),
  ].join("\n");
}

function localizedFallbacks(language) {
  return language === "en"
    ? { category: "Custom", difficulty: "medium" }
    : { category: "Personalizado", difficulty: "media" };
}

function normalizeQuestion(raw, answerCount, language = "es") {
  const fallback = localizedFallbacks(language);
  const type = String(raw.type || "standard").trim();
  if (type === "speed") {
    const choices = Array.isArray(raw.choices) ? raw.choices : [];
    if (choices.length !== answerCount) {
      throw new Error(language === "en"
        ? `Gemini returned ${choices.length} speed options but we expected ${answerCount}.`
        : `Gemini devolvio ${choices.length} opciones speed y esperabamos ${answerCount}.`);
    }
    const normalizedChoices = choices.map((item) => ({
      text: String(item?.text || "").trim(),
      score: Number(item?.score || 0),
      rank: Number(item?.rank || 0),
    }));
    const ranks = normalizedChoices.map((item) => item.rank).sort((a, b) => a - b);
    const expectedRanks = Array.from({ length: answerCount }, (_, index) => index + 1);
    if (ranks.some((rank, index) => rank !== expectedRanks[index])) {
      throw new Error(language === "en"
        ? "Gemini returned invalid or duplicate Velociraptor ranks."
        : "Gemini devolvio ranks Velociraptor invalidos o duplicados.");
    }
    const ranked = [...normalizedChoices].sort((a, b) => a.rank - b.rank);
    if (ranked.some((item) => !item.text || !Number.isFinite(item.score) || item.score <= 0)) {
      throw new Error(language === "en"
        ? "Gemini returned an invalid Velociraptor answer or score."
        : "Gemini devolvio una respuesta o puntuacion Velociraptor invalida.");
    }
    if (ranked.some((item, index) => index > 0 && item.score >= ranked[index - 1].score)) {
      throw new Error(language === "en"
        ? "Velociraptor scores must strictly decrease with rank."
        : "Las puntuaciones Velociraptor deben bajar estrictamente con el rank.");
    }
    return {
      type: "speed",
      question: String(raw.question || "").trim(),
      choices: normalizedChoices,
      explanation: String(raw.explanation || "").trim(),
      category: String(raw.category || fallback.category).trim(),
      difficulty: String(raw.difficulty || fallback.difficulty).trim(),
    };
  }
  const choices = Array.isArray(raw.choices) ? raw.choices.filter(Boolean).map(String) : [];
  if (choices.length !== answerCount) {
    throw new Error(language === "en"
      ? `Gemini returned ${choices.length} options but we expected ${answerCount}.`
      : `Gemini devolvio ${choices.length} opciones y esperabamos ${answerCount}.`);
  }
  const correctIndex = Number(raw.correct_index);
  if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex >= choices.length) {
    throw new Error(language === "en"
      ? "Gemini returned an invalid correct_index."
      : "Gemini devolvio un correct_index invalido.");
  }
  return {
    type: "standard",
    question: String(raw.question || "").trim(),
    choices,
    correct_index: correctIndex,
    explanation: String(raw.explanation || "").trim(),
    category: String(raw.category || fallback.category).trim(),
    difficulty: String(raw.difficulty || fallback.difficulty).trim(),
  };
}

function normalizeComparableText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function deterministicVelociraptorIssue(question) {
  const texts = (question?.choices || []).map((choice) => String(choice?.text || ""));
  const normalized = texts.map(normalizeComparableText);
  if (new Set(normalized).size !== normalized.length) return "duplicate or equivalent answers";

  const tokenSets = normalized.map((text) => new Set(text.split(/\s+/).filter(Boolean)));
  for (let i = 0; i < tokenSets.length; i++) {
    for (let j = i + 1; j < tokenSets.length; j++) {
      const a = tokenSets[i];
      const b = tokenSets[j];
      if (!a.size || !b.size) continue;
      const intersection = [...a].filter((token) => b.has(token)).length;
      const union = new Set([...a, ...b]).size;
      const jaccard = union ? intersection / union : 0;
      const smaller = Math.min(a.size, b.size);
      const containment = smaller ? intersection / smaller : 0;
      if ((smaller >= 4 && jaccard >= 0.82) || (smaller >= 3 && containment >= 0.95)) {
        return "answers are near-duplicates or progressively truncated lists";
      }
    }
  }
  return "";
}

async function callGeminiJson(prompt, temperature = 0.9) {
  if (!GEMINI_API_KEY) throw new Error("Falta GEMINI_API_KEY en los secrets de Supabase.");
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature,
        },
      }),
    },
  );
  const payload = await response.json();
  if (!response.ok) throw new Error(payload?.error?.message || "Gemini no devolvio una respuesta valida.");
  const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini no devolvio contenido util.");
  return JSON.parse(text);
}

async function validateVelociraptorBatch(speedQuestions, language) {
  if (!speedQuestions.length) return { valid: true, issues: [] };
  const english = language === "en";
  const payload = speedQuestions.map((question, index) => ({
    index,
    question: question.question,
    choices: [...(question.choices || [])]
      .sort((a, b) => a.rank - b.rank)
      .map((choice) => ({ text: choice.text, rank: choice.rank })),
  }));
  const prompt = [
    english ? "You are the strict factual quality gate for Velociraptor trivia questions." : "Eres el control de calidad factual estricto de preguntas de trivia Modo Velociraptor.",
    english ? "Return ONLY JSON with this exact shape: {\"valid\":true,\"issues\":[]}." : "Devuelve SOLO JSON con esta forma exacta: {\"valid\":true,\"issues\":[]}.",
    english ? "Set valid=false if ANY question fails ANY rule. Add a short issue for each failure." : "Pon valid=false si CUALQUIER pregunta incumple CUALQUIER regla. Incluye un motivo breve por cada fallo.",
    english ? "Rules for every question:" : "Reglas para cada pregunta:",
    english ? "1. Every single option must be factually true and genuinely belong to the exact comparison asked. There are NO wrong answers in Velociraptor mode." : "1. Todas y cada una de las opciones deben ser factualmente verdaderas y pertenecer de verdad a la comparacion exacta planteada. En Velociraptor NO hay respuestas incorrectas.",
    english ? "2. Reject any distractor, joke, fictional/category intruder, misleading item, or option that only earns points despite being false." : "2. Rechaza cualquier distractor, broma, intruso de otra categoria, elemento enganoso u opcion que reciba puntos pese a ser falsa.",
    english ? "3. The rank from 1 onward must follow one objective factual criterion and be defensible." : "3. El rank desde 1 debe seguir un unico criterio factual objetivo y ser defendible.",
    english ? "4. Reject near-identical answers and answers made by progressively shortening, lengthening, or reordering the same list." : "4. Rechaza respuestas casi identicas y respuestas creadas recortando, ampliando o reordenando progresivamente la misma lista.",
    english ? "5. The question must be good trivia: clear, interesting, and not a contrived completeness-ranking trick." : "5. La pregunta debe ser buena trivia: clara, interesante y no un truco forzado de ordenar por completitud.",
    english ? "Be conservative: if you are not confident every option is valid and the ranking is sound, reject it." : "Se conservador: si no estas seguro de que todas las opciones sean validas y el ranking sea solido, rechazala.",
    JSON.stringify(payload),
  ].join("\n");
  const verdict = await callGeminiJson(prompt, 0.1);
  return {
    valid: verdict?.valid === true,
    issues: Array.isArray(verdict?.issues) ? verdict.issues.map(String) : ["semantic validator rejected the batch"],
  };
}

async function callGemini(input) {
  if (input.mode === "translate") {
    const parsed = await callGeminiJson(buildTranslatePrompt(input), 0.2);
    if (!Array.isArray(parsed) || parsed.length !== input.questions.length) {
      throw new Error(input.language === "en"
        ? "Gemini did not return the exact number of translated questions."
        : "Gemini no devolvio la cantidad exacta de preguntas traducidas.");
    }
    return parsed.map((item) => normalizeQuestion(item, input.answerCount, input.language));
  }

  if (input.questionCount <= 1) {
    const parsed = await callGeminiJson(buildPrompt(input));
    return normalizeQuestion(parsed, input.answerCount, input.language);
  }

  const expectedSpeedCount = Math.max(1, Math.min(input.questionCount, Math.round(input.questionCount * VELOCIRAPTOR_RATIO)));
  let lastReason = "quality validation failed";

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const parsed = await callGeminiJson(buildPrompt(input));
      if (!Array.isArray(parsed) || parsed.length !== input.questionCount) {
        lastReason = input.language === "en" ? "wrong question count" : "cantidad incorrecta de preguntas";
        continue;
      }
      const result = parsed.map((item) => normalizeQuestion(item, input.answerCount, input.language));
      const speedQuestions = result.filter((item) => item.type === "speed");
      if (speedQuestions.length !== expectedSpeedCount) {
        lastReason = input.language === "en"
          ? `Gemini returned ${speedQuestions.length} Velociraptor questions but exactly ${expectedSpeedCount} were required.`
          : `Gemini devolvio ${speedQuestions.length} preguntas Velociraptor pero se exigian exactamente ${expectedSpeedCount}.`;
        continue;
      }

      const deterministicIssue = speedQuestions.map(deterministicVelociraptorIssue).find(Boolean);
      if (deterministicIssue) {
        lastReason = deterministicIssue;
        continue;
      }

      const verdict = await validateVelociraptorBatch(speedQuestions, input.language);
      if (!verdict.valid) {
        lastReason = verdict.issues.join("; ") || "semantic validator rejected the batch";
        continue;
      }
      return result;
    } catch (error) {
      lastReason = error instanceof Error ? error.message : String(error);
    }
  }

  throw new Error(input.language === "en"
    ? `I could not generate a Velociraptor-safe question set after 3 attempts: ${lastReason}`
    : `No he podido generar un lote Velociraptor seguro tras 3 intentos: ${lastReason}`);
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  const language = "es";
  try {
    const body = await request.json().catch(() => ({}));
    const language = body?.language === "en" ? "en" : "es";
    const input = {
      mode: body?.mode === "translate" ? "translate" : "generate",
      language,
      theme: String(body?.theme || (language === "en" ? "general knowledge" : "conocimiento general")),
      tone: String(body?.tone || (language === "en" ? "fun" : "divertido")),
      difficulty: String(body?.difficulty || (language === "en" ? "medium" : "media")),
      audience: String(body?.audience || "general"),
      answerCount: Math.max(4, Math.min(5, Number(body?.answerCount || 5))),
      questionCount: Math.max(1, Math.min(60, Number(body?.questionCount || 1))),
      customPrompt: String(body?.customPrompt || ""),
      questions: Array.isArray(body?.questions) ? body.questions : [],
    };

    if (input.mode === "translate" && !input.questions.length) {
      throw new Error(language === "en" ? "I did not receive any questions to translate." : "No he recibido preguntas para traducir.");
    }

    const result = await callGemini(input);
    return json({
      ok: true,
      question: Array.isArray(result) ? result[0] : result,
      questions: Array.isArray(result) ? result : [result],
    });
  } catch (error) {
    return json(
      {
        ok: false,
        error: error instanceof Error ? error.message : (language === "en" ? "I could not generate the question." : "No he podido generar la pregunta."),
      },
      { status: 500 },
    );
  }
});
