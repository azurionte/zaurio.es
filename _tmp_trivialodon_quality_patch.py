from pathlib import Path

FRONT = Path('juegos.zaurio.es/trivialodon/index.html')
BACK = Path('supabase/functions/trivialodon-generate-question/index.ts')

front = FRONT.read_text(encoding='utf-8')
replacements = {
    'speedReadyInfo:"Modo Velociraptor! Cada respuesta se bloquea al instante y da puntos distintos.",': 'speedReadyInfo:"¡VELOCIRAPTOR! Todas son correctas · mejor respuesta = más puntos · cada opción se bloquea al elegirla.",',
    'speedCountdownNotice:"Atencion: se acerca un Modo Velociraptor!",': 'speedCountdownNotice:"⚠️ ¡ATENCIÓN! Todas las respuestas son correctas, pero unas son MEJORES que otras y dan más puntos. Elige rápido: cuando alguien escoge una opción, queda bloqueada.",',
    'speedReadyInfo:"Velociraptor Mode! Each answer locks instantly and gives different points.",': 'speedReadyInfo:"VELOCIRAPTOR! Every answer is correct · better answer = more points · each option locks when chosen.",',
    'speedCountdownNotice:"Heads up: Velociraptor Mode is coming!",': 'speedCountdownNotice:"⚠️ ATTENTION! Every answer is correct, but some are BETTER than others and score more points. Choose fast: once someone picks an option, it locks.",',
    'const total = answersVisible ? Math.max(1, Number(state.game.answerSeconds || 15)) : Math.max(1, Number(state.game.questionLeadSeconds || 6));': 'const total = answersVisible ? Math.max(1, Number(state.game.answerSeconds || 15)) : Math.max(1, Number(question.leadSeconds || state.game.questionLeadSeconds || 6));',
    'const leadMs = Math.max(0, Number(state.game.questionLeadSeconds || 6)) * 1000;': 'const leadSeconds = prepared.type === "speed" ? Math.max(8, Number(state.game.questionLeadSeconds || 6)) : Math.max(0, Number(state.game.questionLeadSeconds || 6)); const leadMs = leadSeconds * 1000;',
    'state.game.question = {type:prepared.type || "standard",prompt:prepared.prompt, category:prepared.category, choices:prepared.choices, correct:prepared.correct, scores:prepared.scores || [], ranking:prepared.ranking || [], answersVisibleAt, endAt:answersVisibleAt + answerMs, responses:{}, revealed:false, explanation:prepared.explanation || ""};': 'state.game.question = {type:prepared.type || "standard",prompt:prepared.prompt, category:prepared.category, choices:prepared.choices, correct:prepared.correct, scores:prepared.scores || [], ranking:prepared.ranking || [], leadSeconds, answersVisibleAt, endAt:answersVisibleAt + answerMs, responses:{}, revealed:false, explanation:prepared.explanation || ""};',
}
for old, new in replacements.items():
    if old not in front:
        raise SystemExit(f'frontend marker missing: {old[:100]}')
    front = front.replace(old, new, 1)
FRONT.write_text(front, encoding='utf-8')

back = BACK.read_text(encoding='utf-8')
old_rules = '''    english ? "- For speed questions, scores must be positive and strictly decrease as rank gets worse." : "- En preguntas speed, los scores deben ser positivos y bajar estrictamente a medida que empeora el rank.",
    input.questionCount > 1'''
new_rules = '''    english ? "- For speed questions, scores must be positive and strictly decrease as rank gets worse." : "- En preguntas speed, los scores deben ser positivos y bajar estrictamente a medida que empeora el rank.",
    english ? "- CRITICAL: every speed answer must be factually true and genuinely applicable to the exact question. Never include a distractor, joke, category intruder, fictional outsider, or partially false answer." : "- CRITICO: cada respuesta speed debe ser factualmente verdadera y aplicable de verdad a la pregunta exacta. Nunca incluyas distractores, bromas, intrusos de otra categoria, personajes ajenos ni respuestas parcialmente falsas.",
    english ? "- A speed question must have one clear, objective ranking criterion (for example: larger, earlier, higher, faster, closer, more numerous). The ranking must be defensible from factual information." : "- Una pregunta speed debe tener un unico criterio objetivo y claro de ranking (por ejemplo: mayor, anterior, mas alto, mas rapido, mas cercano, mas numeroso). El orden debe poder defenderse con hechos.",
    english ? "- Do NOT rank answers by completeness. Do NOT make near-identical lists by progressively removing, adding, or reordering items." : "- NO ordenes respuestas por completitud. NO hagas listas casi identicas quitando, anadiendo o reordenando elementos progresivamente.",
    english ? "- Speed choices must be meaningfully distinct from each other while all remaining valid candidates for the same comparison." : "- Las opciones speed deben ser claramente distintas entre si, pero todas deben seguir siendo candidatas validas para la misma comparacion.",
    english ? "- If the topic cannot support the requested number of fully valid, objectively rankable answers, choose a different question instead of inventing weak options." : "- Si el tema no permite el numero pedido de respuestas totalmente validas y ordenables objetivamente, elige otra pregunta en vez de inventar opciones flojas.",
    input.questionCount > 1'''
if old_rules not in back:
    raise SystemExit('backend rules marker missing')
back = back.replace(old_rules, new_rules, 1)

start = back.index('async function callGemini(input) {')
end = back.index('\n\nDeno.serve', start)
new_call = r'''function normalizeComparableText(value) {
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
}'''
back = back[:start] + new_call + back[end:]
BACK.write_text(back, encoding='utf-8')

print('Trivialodon UX and Velociraptor quality patch applied')
