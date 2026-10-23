import fs from "node:fs";
import path from "node:path";

const [inputArg, outputArg] = process.argv.slice(2);
if (!inputArg || !outputArg) {
  throw new Error("Uso: node scripts/normalize-bank.mjs <entrada> <salida>");
}

const input = JSON.parse(fs.readFileSync(path.resolve(inputArg), "utf8"));
const rawQuestions = Array.isArray(input)
  ? input
  : input.questions ?? input.preguntas ?? input.items ?? [];

const textOf = (raw) =>
  [
    raw.question,
    raw.prompt,
    raw.sentence,
    ...(raw.statements ?? []).map((item) => item.statement),
    ...(raw.items ?? []).map((item) => item.requirement),
  ]
    .filter(Boolean)
    .join(" ");

function inferCategory(text) {
  const value = text.toLowerCase();
  if (/copilot|agente analyst|agente researcher|azure openai/.test(value)) return "Microsoft Copilot";
  if (/entra|identity secure score|autenticaci|mfa|sspr|acceso condicional|administrador global/.test(value)) return "Microsoft Entra";
  if (/purview|data loss prevention|dlp|information protection|insider risk|communication compliance|retenci|etiqueta de confidencialidad|dspm/.test(value)) return "Microsoft Purview";
  if (/defender|endpoint|amenaza|antimalware|phishing/.test(value)) return "Defender";
  if (/sharepoint/.test(value)) return "SharePoint";
  if (/\bteams\b/.test(value)) return "Teams";
  if (/exchange|outlook|correo electr[oó]nico|buz[oó]n/.test(value)) return "Exchange";
  if (/microsoft 365|office 365|centro de administraci[oó]n/.test(value)) return "Microsoft 365";
  return "General";
}

function inferTopic(text, category) {
  const value = text.toLowerCase();
  if (/licencia|licenciamiento|facturaci|costo|pago por uso/.test(value)) return `${category} · Licenciamiento y costos`;
  if (/seguridad|secure score|mfa|autenticaci|amenaza|riesgo/.test(value)) return `${category} · Seguridad`;
  if (/agente|copilot studio|researcher|analyst/.test(value)) return `${category} · Agentes e IA`;
  if (/administraci|configuraci|directiva|portal/.test(value)) return `${category} · Administración`;
  if (/cumplimiento|confidencial|retenci|dlp|purview/.test(value)) return `${category} · Cumplimiento`;
  return `${category} · Fundamentos`;
}

const asOptions = (value) => {
  if (Array.isArray(value)) return value.map((label, index) => ({ id: String(index + 1), label: String(label) }));
  if (value && typeof value === "object") return Object.entries(value).map(([id, label]) => ({ id, label: String(label) }));
  return [];
};

function mappingOptions(raw, item, index) {
  if (Array.isArray(raw.available_options)) return raw.available_options.map(String);
  if (!raw.available_options || typeof raw.available_options !== "object") return [];
  const keys = Object.keys(raw.available_options);
  const requirement = String(item.requirement ?? "").toLowerCase();
  const matchingKey = keys.find((key) => requirement.includes(key.toLowerCase()));
  const key = matchingKey ?? keys[index] ?? keys[0];
  const list = raw.available_options[key];
  return Array.isArray(list) ? list.map(String) : [];
}

function explanationFor(raw) {
  if (raw.explanation) return String(raw.explanation);
  if (raw.correct_answer_text) {
    const answer = Array.isArray(raw.correct_answer_text)
      ? raw.correct_answer_text.join(" y ")
      : raw.correct_answer_text;
    return `La respuesta esperada es ${answer}. Revise este concepto en la documentación oficial de Microsoft Learn y relacione la capacidad con el escenario descrito.`;
  }
  return "Compare cada selección con la respuesta esperada y repase el concepto en Microsoft Learn. El banco original no incluía una explicación técnica ampliada.";
}

const supported = new Set([
  "multiple_choice",
  "multiple_choice_multi_select",
  "true_false_group",
  "dropdown_selection",
  "mapping",
]);

const questions = rawQuestions.flatMap((raw, index) => {
  const type = raw.type;
  if (!supported.has(type)) return [];
  const text = textOf(raw);
  const category = inferCategory(text);
  const base = {
    id: `q-${raw.id ?? index + 1}`,
    sourceId: raw.id ?? index + 1,
    type,
    prompt: String(raw.question ?? raw.prompt ?? "Pregunta sin enunciado"),
    category,
    topic: inferTopic(text, category),
    explanation: explanationFor(raw),
  };

  if (type === "multiple_choice") {
    return [{ ...base, options: asOptions(raw.options), correctAnswer: String(raw.correct_answer ?? "") }];
  }
  if (type === "multiple_choice_multi_select") {
    return [{ ...base, options: asOptions(raw.options), correctAnswers: (raw.correct_answers ?? []).map(String) }];
  }
  if (type === "true_false_group") {
    return [{
      ...base,
      rows: (raw.statements ?? []).map((item, rowIndex) => ({
        id: `row-${rowIndex + 1}`,
        statement: String(item.statement ?? `Afirmación ${rowIndex + 1}`),
        correctAnswer: Boolean(item.correct_answer),
      })),
    }];
  }
  if (type === "dropdown_selection") {
    return [{
      ...base,
      sentence: String(raw.sentence ?? raw.question ?? "Complete la oración"),
      options: Array.isArray(raw.options) ? raw.options.map(String) : Object.values(raw.options ?? {}).map(String),
      correctAnswer: String(raw.correct_answer ?? ""),
    }];
  }
  return [{
    ...base,
    rows: (raw.items ?? []).map((item, rowIndex) => ({
      id: `row-${rowIndex + 1}`,
      prompt: String(item.requirement ?? item.prompt ?? `Elemento ${rowIndex + 1}`),
      options: mappingOptions(raw, item, rowIndex),
      correctAnswer: String(item.correct_answer ?? ""),
    })),
  }];
});

const output = {
  metadata: {
    name: "Banco de preguntas Microsoft 365",
    schemaVersion: 2,
    language: input.metadata?.language ?? "es-MX",
    totalQuestions: questions.length,
    supportedTypes: [...supported],
    notes: "Esquema normalizado para el simulador. Se conservó el identificador original en sourceId.",
  },
  questions,
};

fs.writeFileSync(path.resolve(outputArg), `${JSON.stringify(output, null, 2)}\n`);
console.log(`Banco normalizado: ${questions.length} preguntas -> ${outputArg}`);
