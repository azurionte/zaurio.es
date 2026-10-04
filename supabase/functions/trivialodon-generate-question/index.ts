const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const TRIVIALODON_RELAY_TOKEN = Deno.env.get("TRIVIALODON_RELAY_TOKEN");
const KUTUN_TRIVIA_ENDPOINT = "https://tynnjgnpkzwhyblwevrt.supabase.co/functions/v1/trivialodon-openai";
const OPENAI_MODEL = "gpt-5.6-terra";
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_MODEL = Deno.env.get("GEMINI_MODEL") || "gemini-2.5-flash";
const VELOCIRAPTOR_RATIO = 0.35;
const MAX_AI_BATCH_SIZE = 10;
const MAX_AI_CONCURRENCY = 3;
const AI_TIMEOUT_MS = 35000;

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
    ? (Number.isInteger(input.speedCountOverride)
      ? Math.max(0, Math.min(input.questionCount, input.speedCountOverride))
      : Math.max(1, Math.min(input.questionCount, Math.round(input.questionCount * VELOCIRAPTOR_RATIO))))
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

async function fetchWithTimeout(url, init, timeoutMs = AI_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function standardQuestionSchema(answerCount) {
  return {
    type: "object",
    additionalProperties: false,
    required: ["type","question","choices","correct_index","explanation","category","difficulty"],
    properties: {
      type: { type: "string", enum: ["standard"] },
      question: { type: "string" },
      choices: { type: "array", minItems: answerCount, maxItems: answerCount, items: { type: "string" } },
      correct_index: { type: "integer", minimum: 0, maximum: answerCount - 1 },
      explanation: { type: "string" },
      category: { type: "string" },
      difficulty: { type: "string" },
    },
  };
}

function speedQuestionSchema(answerCount) {
  return {
    type: "object",
    additionalProperties: false,
    required: ["type","question","choices","explanation","category","difficulty"],
    properties: {
      type: { type: "string", enum: ["speed"] },
      question: { type: "string" },
      choices: {
        type: "array",
        minItems: answerCount,
        maxItems: answerCount,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["text","score","rank"],
          properties: {
            text: { type: "string" },
            score: { type: "integer", minimum: 1 },
            rank: { type: "integer", minimum: 1, maximum: answerCount },
          },
        },
      },
      explanation: { type: "string" },
      category: { type: "string" },
      difficulty: { type: "string" },
    },
  };
}

function questionSetSchema(questionCount, answerCount) {
  return {
    type: "object",
    additionalProperties: false,
    required: ["questions"],
    properties: {
      questions: {
        type: "array",
        minItems: questionCount,
        maxItems: questionCount,
        items: { anyOf: [standardQuestionSchema(answerCount), speedQuestionSchema(answerCount)] },
      },
    },
  };
}

function extractOpenAIText(payload) {
  if (typeof payload?.output_text === "string") return payload.output_text;
  for (const item of payload?.output || []) {
    for (const part of item?.content || []) {
      if (part?.type === "output_text" && typeof part?.text === "string") return part.text;
    }
  }
  return "";
}

async function callOpenAIJson(prompt, questionCount, answerCount) {
  if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not configured.");
  const response = await fetchWithTimeout("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      store: false,
      reasoning: { effort: "low" },
      max_output_tokens: Math.min(8000, 1800 + questionCount * 550),
      instructions: "You are the factual trivia engine for Trivialodon. Accuracy matters more than cleverness. Follow the requested language and all Velociraptor rules exactly.",
      input: prompt + "\nReturn the result under the top-level key questions.",
      text: {
        format: {
          type: "json_schema",
          name: "trivialodon_question_batch",
          strict: true,
          schema: questionSetSchema(questionCount, answerCount),
        },
      },
    }),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.error?.message || `OpenAI request failed (${response.status}).`);
  const text = extractOpenAIText(payload);
  if (!text) throw new Error("OpenAI returned no usable output.");
  const parsed = JSON.parse(text);
  if (!Array.isArray(parsed?.questions)) throw new Error("OpenAI returned an invalid question set.");
  return parsed.questions;
}

async function callGeminiJson(prompt) {
  if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured.");
  const response = await fetchWithTimeout(
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
          temperature: 0.8,
        },
      }),
    },
  );
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.error?.message || `Gemini request failed (${response.status}).`);
  const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned no usable output.");
  return JSON.parse(text);
}

function unwrapQuestions(parsed) {
  if (Array.isArray(parsed)) return parsed;
  if (Array.isArray(parsed?.questions)) return parsed.questions;
  return [];
}

function validateGeneratedBatch(raw, input, expectedCount, expectedSpeedCount) {
  const items = unwrapQuestions(raw);
  if (items.length !== expectedCount) throw new Error(`Expected ${expectedCount} questions, got ${items.length}.`);
  const normalized = items.map((item) => normalizeQuestion(item, input.answerCount, input.language));
  const speed = normalized.filter((item) => item.type === "speed");
  if (speed.length !== expectedSpeedCount) throw new Error(`Expected ${expectedSpeedCount} Velociraptor questions, got ${speed.length}.`);
  const issue = speed.map(deterministicVelociraptorIssue).find(Boolean);
  if (issue) throw new Error(issue);
  const promptKeys = normalized.map((item) => normalizeComparableText(item.question));
  if (new Set(promptKeys).size !== promptKeys.length) throw new Error("duplicate questions in batch");
  for (const item of normalized.filter((q) => q.type !== "speed")) {
    const keys = item.choices.map(normalizeComparableText);
    if (new Set(keys).size !== keys.length) throw new Error("duplicate standard answers");
  }
  return normalized;
}

function buildBatchPlan(total) {
  let remaining = total;
  let remainingSpeed = total > 1
    ? Math.max(1, Math.min(total, Math.round(total * VELOCIRAPTOR_RATIO)))
    : 0;
  const plans = [];
  while (remaining > 0) {
    const count = Math.min(MAX_AI_BATCH_SIZE, remaining);
    const speedCount = remainingSpeed > 0
      ? Math.min(count, Math.max(0, Math.round((count * remainingSpeed) / remaining)))
      : 0;
    plans.push({ count, speedCount });
    remaining -= count;
    remainingSpeed -= speedCount;
  }
  if (remainingSpeed !== 0 && plans.length) plans[plans.length - 1].speedCount += remainingSpeed;
  return plans;
}

async function callKutunOpenAI(input, plan) {
  if (!TRIVIALODON_RELAY_TOKEN) throw new Error("TRIVIALODON_RELAY_TOKEN not configured.");

  const standardCount = plan.count - plan.speedCount;
  const tasks = [];

  const invoke = async (type, count) => {
    if (!count) return [];
    const response = await fetchWithTimeout(KUTUN_TRIVIA_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-trivialodon-relay-token": TRIVIALODON_RELAY_TOKEN,
      },
      body: JSON.stringify({
        type,
        count,
        language: input.language,
        theme: input.theme,
        tone: input.tone,
        difficulty: input.difficulty,
        audience: input.audience,
        answerCount: input.answerCount,
        customPrompt: input.customPrompt,
      }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || payload?.ok !== true || !Array.isArray(payload?.questions)) {
      throw new Error(payload?.error || `Kutun OpenAI relay failed (${response.status}).`);
    }
    return payload.questions;
  };

  if (standardCount) tasks.push(invoke("standard", standardCount));
  if (plan.speedCount) tasks.push(invoke("speed", plan.speedCount));

  const chunks = await Promise.all(tasks);
  return chunks.flat();
}

async function generateProviderBatch(input, plan) {
  let openAIError = "";

  try {
    const raw = await callKutunOpenAI(input, plan);
    return {
      questions: validateGeneratedBatch(raw, input, plan.count, plan.speedCount),
      provider: "openai_kutun",
    };
  } catch (error) {
    openAIError = error instanceof Error ? error.message : String(error);
  }

  if (GEMINI_API_KEY) {
    const batchInput = { ...input, questionCount: plan.count, speedCountOverride: plan.speedCount };
    const raw = await callGeminiJson(buildPrompt(batchInput));
    return {
      questions: validateGeneratedBatch(raw, input, plan.count, plan.speedCount),
      provider: "gemini_fallback",
    };
  }

  throw new Error(openAIError || "No AI provider is configured.");
}

async function generateValidatedBatch(input, plan) {
  let lastReason = "generation failed";
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      return await generateProviderBatch(input, plan);
    } catch (error) {
      lastReason = error instanceof Error ? error.message : String(error);
    }
  }
  throw new Error(`Batch failed after 2 attempts: ${lastReason}`);
}

async function callGemini(input) {
  if (input.mode === "translate") {
    const prompt = buildTranslatePrompt(input);
    const raw = await callGeminiJson(prompt + "\nReturn a JSON object with top-level key questions.");
    const speedCount = input.questions.filter((item) => item?.type === "speed").length;
    const translated = validateGeneratedBatch(raw, input, input.questions.length, speedCount);
    translated.provider = "gemini_translate";
    return translated;
  }

  const plans = buildBatchPlan(input.questionCount);
  const results = new Array(plans.length);
  let cursor = 0;

  async function worker() {
    while (true) {
      const index = cursor++;
      if (index >= plans.length) return;
      results[index] = await generateValidatedBatch(input, plans[index]);
    }
  }

  await Promise.all(Array.from(
    { length: Math.min(MAX_AI_CONCURRENCY, plans.length) },
    () => worker(),
  ));

  const questions = results.flatMap((item) => item.questions);
  const providers = [...new Set(results.map((item) => item.provider))];
  questions.provider = providers.length === 1 ? providers[0] : "mixed";
  return questions;
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
    const provider = result?.provider || "openai_kutun";
    return json({
      ok: true,
      provider,
      model: provider.startsWith("openai") ? OPENAI_MODEL : GEMINI_MODEL,
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
