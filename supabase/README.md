# Supabase para Trivialodon

## 1. Guardar la clave de Gemini como secret

No metas la clave en el frontend.

En tu proyecto de Supabase, guarda estos secrets:

```bash
supabase secrets set GEMINI_API_KEY=TU_CLAVE_REAL
supabase secrets set GEMINI_MODEL=gemini-2.5-flash
```

Si prefieres hacerlo desde el panel:

- `Project Settings`
- `Edge Functions`
- `Secrets`

## 2. Desplegar la funcion

```bash
supabase functions deploy trivialodon-generate-question
```

## 3. Invocarla desde el frontend

La llamada desde `Trivialodon` sera asi:

```js
const { data, error } = await sb.functions.invoke("trivialodon-generate-question", {
  body: {
    theme: "conocimiento general",
    tone: "divertido",
    difficulty: "media",
    audience: "general",
    answerCount: 5,
    questionCount: 12,
    customPrompt: "Preguntas recientes y sorprendentes",
  },
});
```

La respuesta esperada:

```json
{
  "ok": true,
  "question": {
    "question": "¿...?",
    "choices": ["A", "B", "C", "D", "E"],
    "correct_index": 2,
    "explanation": "Breve explicacion",
    "category": "Personalizado",
    "difficulty": "media"
  },
  "questions": []
}
```

## 4. Nota de seguridad

Como la clave ya se ha pegado en el chat, te recomiendo rotarla cuando terminemos la integracion.
