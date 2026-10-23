import {
  CATEGORIES,
  QUESTION_TYPES,
  type Category,
  type LoadResult,
  type MappingRow,
  type Question,
  type QuestionOption,
  type QuestionType,
  type QuestionFigure,
} from "@/src/types";

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const asString = (value: unknown, fallback = "") =>
  typeof value === "string" || typeof value === "number"
    ? String(value)
    : fallback;

const asRecordArray = (value: unknown): UnknownRecord[] =>
  Array.isArray(value) ? value.filter(isRecord) : [];

const asStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value
        .filter((item) => typeof item === "string" || typeof item === "number")
        .map(String)
    : [];

const asBoolean = (value: unknown): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string")
    return ["true", "sí", "si", "yes", "1"].includes(value.toLowerCase());
  return false;
};

const isQuestionType = (value: unknown): value is QuestionType =>
  typeof value === "string" &&
  QUESTION_TYPES.includes(value as QuestionType);

const isCategory = (value: unknown): value is Category =>
  typeof value === "string" && CATEGORIES.includes(value as Category);

export function inferCategory(text: string): Category {
  const value = text.toLowerCase();
  if (/copilot|agente analyst|agente researcher|azure openai/.test(value))
    return "Microsoft Copilot";
  if (
    /entra|identity secure score|autenticaci|mfa|sspr|acceso condicional|administrador global/.test(
      value,
    )
  )
    return "Microsoft Entra";
  if (
    /purview|data loss prevention|\bdlp\b|information protection|insider risk|communication compliance|retenci|etiqueta de confidencialidad|dspm/.test(
      value,
    )
  )
    return "Microsoft Purview";
  if (/defender|endpoint|amenaza|antimalware|phishing/.test(value))
    return "Defender";
  if (/sharepoint/.test(value)) return "SharePoint";
  if (/\bteams\b/.test(value)) return "Teams";
  if (/exchange|outlook|correo electr[oó]nico|buz[oó]n/.test(value))
    return "Exchange";
  if (/microsoft 365|office 365|centro de administraci[oó]n/.test(value))
    return "Microsoft 365";
  return "General";
}

export function inferTopic(text: string, category: Category): string {
  const value = text.toLowerCase();
  if (/licencia|licenciamiento|facturaci|costo|pago por uso/.test(value))
    return `${category} · Licenciamiento y costos`;
  if (/seguridad|secure score|mfa|autenticaci|amenaza|riesgo/.test(value))
    return `${category} · Seguridad`;
  if (/agente|copilot studio|researcher|analyst/.test(value))
    return `${category} · Agentes e IA`;
  if (/administraci|configuraci|directiva|portal/.test(value))
    return `${category} · Administración`;
  if (/cumplimiento|confidencial|retenci|\bdlp\b|purview/.test(value))
    return `${category} · Cumplimiento`;
  return `${category} · Fundamentos`;
}

function normalizeOptions(value: unknown): QuestionOption[] {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => {
      if (isRecord(item)) {
        const label = asString(item.label ?? item.text ?? item.value);
        return label
          ? [{ id: asString(item.id, String(index + 1)), label }]
          : [];
      }
      const label = asString(item);
      return label ? [{ id: String(index + 1), label }] : [];
    });
  }
  if (isRecord(value)) {
    return Object.entries(value).flatMap(([id, label]) => {
      const text = asString(label);
      return text ? [{ id, label: text }] : [];
    });
  }
  return [];
}

function normalizeFigures(value: unknown): QuestionFigure[] {
  return asRecordArray(value).flatMap((item) => {
    const src = asString(item.src);
    // Only bundled figures; imported banks cannot inject remote tracking URLs.
    if (!/^\/ms700\/[a-zA-Z0-9-]+\.(?:png|webp)$/.test(src)) return [];
    return [{ src, page: Number(item.page) || 0, caption: asString(item.caption), originalCaption: asString(item.originalCaption) }];
  });
}

function allQuestionText(raw: UnknownRecord): string {
  return [
    raw.prompt,
    raw.question,
    raw.sentence,
    ...asRecordArray(raw.rows).map((item) => item.statement ?? item.prompt),
    ...asRecordArray(raw.statements).map((item) => item.statement),
    ...asRecordArray(raw.items).map((item) => item.requirement),
  ]
    .map((value) => asString(value))
    .filter(Boolean)
    .join(" ");
}

function mappingOptions(
  rawOptions: unknown,
  row: UnknownRecord,
  index: number,
): string[] {
  if (Array.isArray(rawOptions)) return asStringArray(rawOptions);
  if (!isRecord(rawOptions)) return [];
  const keys = Object.keys(rawOptions);
  const prompt = asString(row.requirement ?? row.prompt).toLowerCase();
  const matching = keys.find((key) => prompt.includes(key.toLowerCase()));
  return asStringArray(rawOptions[matching ?? keys[index] ?? keys[0]]);
}

function fallbackExplanation(raw: UnknownRecord): string {
  const existing = asString(raw.explanation ?? raw.explicacion);
  if (existing) return existing;
  const correctText = raw.correct_answer_text;
  const answer = Array.isArray(correctText)
    ? asStringArray(correctText).join(" y ")
    : asString(correctText);
  if (answer) {
    return `La respuesta esperada es ${answer}. Relacione la capacidad con el escenario y repase el concepto en Microsoft Learn.`;
  }
  return "Compare su selección con la respuesta esperada. El banco importado no incluye una explicación técnica ampliada.";
}

function normalizeQuestion(
  raw: UnknownRecord,
  index: number,
  warnings: string[],
): Question | null {
  if (!isQuestionType(raw.type)) {
    warnings.push(`Elemento ${index + 1}: tipo desconocido; se omitió.`);
    return null;
  }

  const id = asString(raw.id ?? raw.sourceId, `q-${index + 1}`);
  const normalizedId = id.startsWith("q-") ? id : `q-${id}`;
  const prompt = asString(
    raw.prompt ?? raw.question,
    "Pregunta sin enunciado",
  );
  const text = allQuestionText(raw);
  const category = isCategory(raw.category)
    ? raw.category
    : inferCategory(text);
  const topic = asString(raw.topic, inferTopic(text, category));
  const explanation = fallbackExplanation(raw);
  const sourceId =
    typeof raw.sourceId === "string" || typeof raw.sourceId === "number"
      ? raw.sourceId
      : typeof raw.id === "string" || typeof raw.id === "number"
        ? raw.id
        : index + 1;
  const base = {
    id: normalizedId,
    sourceId,
    prompt,
    category,
    topic,
    explanation,
    context: asString(raw.context),
    figures: normalizeFigures(raw.figures),
    solutionFigures: normalizeFigures(raw.solutionFigures),
    sourcePages: Array.isArray(raw.sourcePages) ? raw.sourcePages.filter((v): v is number => typeof v === "number") : [],
    originalText: asString(raw.originalText),
    translationNote: asString(raw.translationNote),
  };

  switch (raw.type) {
    case "practical":
      return { ...base, type: "practical", practiceKind: raw.practiceKind === "hotspot" || raw.practiceKind === "drag_drop" ? raw.practiceKind : "simulation" };
    case "multiple_choice": {
      const options = normalizeOptions(raw.options);
      if (!options.length)
        warnings.push(`${normalizedId}: no contiene opciones utilizables.`);
      return {
        ...base,
        type: raw.type,
        options,
        correctAnswer: asString(raw.correctAnswer ?? raw.correct_answer),
      };
    }
    case "multiple_choice_multi_select": {
      const options = normalizeOptions(raw.options);
      if (!options.length)
        warnings.push(`${normalizedId}: no contiene opciones utilizables.`);
      return {
        ...base,
        type: raw.type,
        options,
        correctAnswers: asStringArray(
          raw.correctAnswers ?? raw.correct_answers,
        ),
      };
    }
    case "true_false_group": {
      const rawRows = asRecordArray(raw.rows).length
        ? asRecordArray(raw.rows)
        : asRecordArray(raw.statements);
      const rows = rawRows.map((row, rowIndex) => ({
        id: asString(row.id, `row-${rowIndex + 1}`),
        statement: asString(
          row.statement ?? row.prompt,
          `Afirmación ${rowIndex + 1}`,
        ),
        correctAnswer: asBoolean(row.correctAnswer ?? row.correct_answer),
      }));
      if (!rows.length)
        warnings.push(`${normalizedId}: no contiene afirmaciones.`);
      return { ...base, type: raw.type, rows };
    }
    case "dropdown_selection": {
      const options = Array.isArray(raw.options)
        ? asStringArray(raw.options)
        : normalizeOptions(raw.options).map((option) => option.label);
      return {
        ...base,
        type: raw.type,
        sentence: asString(raw.sentence, prompt),
        options,
        correctAnswer: asString(raw.correctAnswer ?? raw.correct_answer),
      };
    }
    case "mapping": {
      const rawRows = asRecordArray(raw.rows).length
        ? asRecordArray(raw.rows)
        : asRecordArray(raw.items);
      const rows: MappingRow[] = rawRows.map((row, rowIndex) => ({
        id: asString(row.id, `row-${rowIndex + 1}`),
        prompt: asString(
          row.prompt ?? row.requirement,
          `Elemento ${rowIndex + 1}`,
        ),
        options: asStringArray(row.options).length
          ? asStringArray(row.options)
          : mappingOptions(raw.available_options, row, rowIndex),
        correctAnswer: asString(row.correctAnswer ?? row.correct_answer),
      }));
      if (!rows.length)
        warnings.push(`${normalizedId}: no contiene elementos para relacionar.`);
      return { ...base, type: raw.type, rows };
    }
  }
}

export function normalizeQuestionBank(
  payload: unknown,
  sourceName = "Banco importado",
): LoadResult {
  const warnings: string[] = [];
  const root = isRecord(payload) ? payload : null;
  const items = Array.isArray(payload)
    ? payload
    : root && Array.isArray(root.questions)
      ? root.questions
      : root && Array.isArray(root.preguntas)
        ? root.preguntas
        : root && Array.isArray(root.items)
          ? root.items
          : [];

  if (!items.length) {
    return {
      questions: [],
      warnings: [
        "No se encontró una colección de preguntas en el archivo. Use un arreglo o una propiedad questions.",
      ],
      sourceName,
    };
  }

  const seen = new Map<string, number>();
  const questions = items.flatMap((item, index) => {
    if (!isRecord(item)) {
      warnings.push(`Elemento ${index + 1}: formato no válido; se omitió.`);
      return [];
    }
    const question = normalizeQuestion(item, index, warnings);
    if (!question) return [];
    const duplicate = seen.get(question.id) ?? 0;
    seen.set(question.id, duplicate + 1);
    if (duplicate) {
      warnings.push(`${question.id}: identificador duplicado; se renombró.`);
      return [{ ...question, id: `${question.id}-${duplicate + 1}` } as Question];
    }
    return [question];
  });

  return { questions, warnings, sourceName };
}

export async function loadDefaultQuestionBank(): Promise<LoadResult> {
  return loadIncludedQuestionBank("ms700");
}

export async function loadIncludedQuestionBank(bank: "ms700" | "ab900"): Promise<LoadResult> {
  const path = bank === "ms700" ? "/data/ms700.es.json" : "/data/questions.json";
  const embedded = (globalThis as typeof globalThis & { __CERTLAB_BANKS__?: Record<string, unknown> }).__CERTLAB_BANKS__?.[bank];
  if (embedded) return normalizeQuestionBank(embedded, bank === "ms700" ? "MS-700 · Español · 399 preguntas" : "AB-900 · Banco original");
  try {
    const response = await fetch(path, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return normalizeQuestionBank(await response.json(), bank === "ms700" ? "MS-700 · Español · 399 preguntas" : "AB-900 · Banco original");
  } catch (error) {
    return {
      questions: [],
      warnings: [
        `No fue posible cargar ${path}. ${error instanceof Error ? error.message : "Error desconocido"}`,
      ],
      sourceName: "Banco incluido",
    };
  }
}

export async function parseQuestionBankFile(file: File): Promise<LoadResult> {
  try {
    const payload = JSON.parse(await file.text()) as unknown;
    return normalizeQuestionBank(payload, file.name);
  } catch (error) {
    return {
      questions: [],
      warnings: [
        `El archivo no contiene JSON válido. ${error instanceof Error ? error.message : "Revise el formato."}`,
      ],
      sourceName: file.name,
    };
  }
}
