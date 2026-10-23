import type {
  BreakdownItem,
  Category,
  ExamResult,
  ExamSession,
  Question,
  QuestionScore,
  QuestionType,
  UserAnswer,
} from "@/src/types";

const round = (value: number, decimals = 2) =>
  Number(value.toFixed(decimals));

export function isAnswered(question: Question, answer: UserAnswer): boolean {
  if (answer === null || answer === undefined) return false;

  switch (question.type) {
    case "practical":
      return typeof answer === "object" && !Array.isArray(answer) && typeof answer.notes === "string" && answer.notes.trim().length > 0 && answer.reviewed === true;
    case "multiple_choice":
    case "dropdown_selection":
      return typeof answer === "string" && answer.length > 0;
    case "multiple_choice_multi_select":
      return Array.isArray(answer) && answer.length > 0;
    case "true_false_group":
    case "mapping": {
      if (Array.isArray(answer) || typeof answer !== "object") return false;
      return question.rows.every((row) =>
        Object.prototype.hasOwnProperty.call(answer, row.id),
      );
    }
    default:
      return false;
  }
}

export function scoreQuestion(
  question: Question,
  answer: UserAnswer,
): QuestionScore {
  let score = 0;

  switch (question.type) {
    case "multiple_choice":
    case "dropdown_selection":
      score = answer === question.correctAnswer ? 1 : 0;
      break;
    case "multiple_choice_multi_select": {
      const selected = Array.isArray(answer) ? [...answer].sort() : [];
      const expected = [...question.correctAnswers].sort();
      score =
        selected.length === expected.length &&
        selected.every((value, index) => value === expected[index])
          ? 1
          : 0;
      break;
    }
    case "true_false_group": {
      const record =
        answer && !Array.isArray(answer) && typeof answer === "object"
          ? answer
          : {};
      const matches = question.rows.filter(
        (row) => record[row.id] === row.correctAnswer,
      ).length;
      score = question.rows.length ? matches / question.rows.length : 0;
      break;
    }
    case "mapping": {
      const record =
        answer && !Array.isArray(answer) && typeof answer === "object"
          ? answer
          : {};
      const matches = question.rows.filter(
        (row) => record[row.id] === row.correctAnswer,
      ).length;
      score = question.rows.length ? matches / question.rows.length : 0;
      break;
    }
  }

  const normalized = round(score, 4);
  return {
    questionId: question.id,
    type: question.type,
    category: question.category,
    score: normalized,
    maxScore: question.type === "practical" ? 0 : 1,
    isCorrect: question.type !== "practical" && normalized === 1,
    userAnswer: answer ?? null,
    question,
  };
}

function createBreakdown(
  details: QuestionScore[],
  field: "type" | "category",
): BreakdownItem[] {
  const grouped = new Map<string, { score: number; maxScore: number }>();
  details.forEach((detail) => {
    if (!detail.maxScore) return;
    const key = detail[field];
    const current = grouped.get(key) ?? { score: 0, maxScore: 0 };
    current.score += detail.score;
    current.maxScore += detail.maxScore;
    grouped.set(key, current);
  });

  return Array.from(grouped.entries()).map(([key, value]) => ({
    key,
    score: round(value.score),
    maxScore: value.maxScore,
    percentage: value.maxScore
      ? Math.round((value.score / value.maxScore) * 100)
      : 0,
  }));
}

export function buildExamResult(
  session: ExamSession,
  questions: Question[],
  passingScore: number,
): ExamResult {
  const byId = new Map(questions.map((question) => [question.id, question]));
  const details = session.questionIds
    .map((id) => byId.get(id))
    .filter((question): question is Question => Boolean(question))
    .map((question) =>
      scoreQuestion(question, session.answers[question.id] ?? null),
    );
  const rawScore = details.reduce((sum, detail) => sum + detail.score, 0);
  const maxScore = details.reduce((sum, detail) => sum + detail.maxScore, 0);
  const percentage = maxScore ? Math.round((rawScore / maxScore) * 100) : 0;
  const microsoftScore = Math.round(100 + percentage * 9);
  const unansweredCount = details.filter(
    (detail) => !isAnswered(detail.question, detail.userAnswer),
  ).length;

  return {
    id: `result-${Date.now()}`,
    sessionId: session.id,
    seed: session.seed,
    mode: session.mode,
    pearsonMode: session.pearsonMode,
    completedAt: Date.now(),
    durationSeconds: Math.max(
      0,
      Math.floor((Date.now() - session.startedAt) / 1000),
    ),
    rawScore: round(rawScore),
    maxScore,
    percentage,
    microsoftScore,
    passed: maxScore > 0 && microsoftScore >= passingScore,
    passingScore,
    correctCount: details.filter((detail) => detail.maxScore > 0 && detail.isCorrect).length,
    incorrectCount: details.filter((detail) => detail.maxScore > 0 && !detail.isCorrect).length,
    practiceCount: details.filter((detail) => !detail.maxScore).length,
    completedPracticeCount: details.filter((detail) => !detail.maxScore && isAnswered(detail.question, detail.userAnswer)).length,
    unansweredCount,
    typeBreakdown: createBreakdown(details, "type"),
    categoryBreakdown: createBreakdown(details, "category"),
    details,
  };
}

export function correctAnswerLabel(question: Question): string {
  switch (question.type) {
    case "practical":
      return "Consulte la solución de la guía y las figuras de respuesta. Autoevaluación sin puntuación automática.";
    case "multiple_choice":
      return (
        question.options.find((option) => option.id === question.correctAnswer)
          ?.label ?? question.correctAnswer
      );
    case "multiple_choice_multi_select":
      return question.correctAnswers
        .map(
          (id) =>
            question.options.find((option) => option.id === id)?.label ?? id,
        )
        .join("; ");
    case "dropdown_selection":
      return question.correctAnswer;
    case "true_false_group":
      return question.rows
        .map((row) => `${row.statement}: ${row.correctAnswer ? "Sí" : "No"}`)
        .join(" | ");
    case "mapping":
      return question.rows
        .map((row) => `${row.prompt}: ${row.correctAnswer}`)
        .join(" | ");
  }
}

export function userAnswerLabel(
  question: Question,
  answer: UserAnswer,
): string {
  if (answer === null || answer === undefined) return "Sin respuesta";
  if (question.type === "practical") {
    if (typeof answer !== "object" || Array.isArray(answer)) return "Sin respuesta";
    return `${String(answer.notes ?? "")} · ${answer.reviewed ? "Revisada" : "Pendiente de revisar"}`;
  }
  if (question.type === "multiple_choice") {
    return (
      question.options.find((option) => option.id === answer)?.label ??
      String(answer)
    );
  }
  if (question.type === "multiple_choice_multi_select") {
    if (!Array.isArray(answer) || !answer.length) return "Sin respuesta";
    return answer
      .map(
        (id) => question.options.find((option) => option.id === id)?.label ?? id,
      )
      .join("; ");
  }
  if (question.type === "dropdown_selection") return String(answer);
  if (Array.isArray(answer) || typeof answer !== "object") {
    return "Sin respuesta";
  }
  if (question.type === "true_false_group") {
    return question.rows
      .map((row) =>
        Object.prototype.hasOwnProperty.call(answer, row.id)
          ? `${row.statement}: ${answer[row.id] ? "Sí" : "No"}`
          : `${row.statement}: Sin respuesta`,
      )
      .join(" | ");
  }
  return question.rows
    .map((row) => `${row.prompt}: ${answer[row.id] ?? "Sin respuesta"}`)
    .join(" | ");
}

export function getTypeLabel(type: QuestionType): string {
  const labels: Record<QuestionType, string> = {
    multiple_choice: "Opción única",
    multiple_choice_multi_select: "Selección múltiple",
    true_false_group: "Grupo Sí / No",
    dropdown_selection: "Selección desplegable",
    mapping: "Relación de elementos",
    practical: "Práctica guiada",
  };
  return labels[type];
}

export function emptyCategoryBreakdown(): Record<Category, number> {
  return {
    "Microsoft 365": 0,
    "Microsoft Copilot": 0,
    "Microsoft Entra": 0,
    "Microsoft Purview": 0,
    Defender: 0,
    SharePoint: 0,
    Teams: 0,
    Exchange: 0,
    General: 0,
  };
}
