const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_MODEL = Deno.env.get("GEMINI_MODEL") || "gemini-2.5-flash";

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
  const speedCount = Math.max(1, Math.round(input.questionCount * 0.2));
  return [
    input.questionCount > 1
      ? `Genera ${input.questionCount} preguntas para un concurso de trivia en espanol.`
      : "Genera una unica pregunta para un concurso de trivia en espanol.",
    "Debe ser clara, entretenida y apta para una audiencia general.",
    `Tema solicitado: ${input.theme}.`,
    `Tono solicitado: ${input.tone}.`,
    `Dificultad: ${input.difficulty}.`,
    `Audiencia: ${input.audience}.`,
    `Numero de respuestas: ${input.answerCount}.`,
    input.customPrompt ? `Instruccion extra del anfitrion: ${input.customPrompt}.` : "",
    "Devuelve solo JSON valido, sin markdown, sin texto adicional y sin comentarios.",
    "El JSON debe seguir exactamente esta forma:",
    shape,
    "Reglas:",
    "- En preguntas standard, choices debe tener exactamente el numero pedido.",
    "- En preguntas standard, correct_index debe apuntar a una unica respuesta correcta.",
    "- En preguntas speed, choices debe ser un array de objetos con text, score y rank.",
    "- En preguntas speed, todas las respuestas deben ser validas, pero unas mejores que otras.",
    "- En preguntas speed, rank 1 debe ser la mejor y rank mayor la peor.",
    `- Si devuelves varias preguntas, exactamente ${speedCount} deben ser de tipo "speed" y el resto "standard".`,
    "- No repitas opciones ni hagas respuestas ambiguas.",
    "- explanation debe ser breve, maxima dos frases.",
    input.questionCount > 1 ? `- Debes devolver exactamente ${input.questionCount} preguntas.` : "",
  ].filter(Boolean).join("\n");
}

function normalizeQuestion(raw, answerCount) {
  const type = String(raw.type || "standard").trim();
  if (type === "speed") {
    const choices = Array.isArray(raw.choices) ? raw.choices : [];
    if (choices.length !== answerCount) {
      throw new Error(`Gemini devolvio ${choices.length} opciones speed y esperabamos ${answerCount}.`);
    }
    return {
      type: "speed",
      question: String(raw.question || "").trim(),
      choices: choices.map((item) => ({
        text: String(item?.text || "").trim(),
        score: Number(item?.score || 0),
        rank: Number(item?.rank || 0),
      })),
      explanation: String(raw.explanation || "").trim(),
      category: String(raw.category || "Personalizado").trim(),
      difficulty: String(raw.difficulty || "media").trim(),
    };
  }
  const choices = Array.isArray(raw.choices) ? raw.choices.filter(Boolean).map(String) : [];
  if (choices.length !== answerCount) {
    throw new Error(`Gemini devolvio ${choices.length} opciones y esperabamos ${answerCount}.`);
  }
  const correctIndex = Number(raw.correct_index);
  if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex >= choices.length) {
    throw new Error("Gemini devolvio un correct_index invalido.");
  }
  return {
    type: "standard",
    question: String(raw.question || "").trim(),
    choices,
    correct_index: correctIndex,
    explanation: String(raw.explanation || "").trim(),
    category: String(raw.category || "Personalizado").trim(),
    difficulty: String(raw.difficulty || "media").trim(),
  };
}

async function callGemini(input) {
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
            parts: [
              {
                text: buildPrompt(input),
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.9,
        },
      }),
    },
  );

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error?.message || "Gemini no devolvio una respuesta valida.");
  }

  const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Gemini no devolvio contenido util.");
  }

  const parsed = JSON.parse(text);
  if (input.questionCount > 1) {
    if (!Array.isArray(parsed) || parsed.length !== input.questionCount) {
      throw new Error("Gemini no devolvio la cantidad exacta de preguntas.");
    }
    return parsed.map((item) => normalizeQuestion(item, input.answerCount));
  }
  return normalizeQuestion(parsed, input.answerCount);
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
    const input = {
      theme: String(body?.theme || "conocimiento general"),
      tone: String(body?.tone || "divertido"),
      difficulty: String(body?.difficulty || "media"),
      audience: String(body?.audience || "general"),
      answerCount: Math.max(4, Math.min(5, Number(body?.answerCount || 5))),
      questionCount: Math.max(1, Math.min(60, Number(body?.questionCount || 1))),
      customPrompt: String(body?.customPrompt || ""),
    };

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
        error: error instanceof Error ? error.message : "No he podido generar la pregunta.",
      },
      { status: 500 },
    );
  }
});
