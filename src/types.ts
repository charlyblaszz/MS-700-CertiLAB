export const QUESTION_TYPES = [
  "multiple_choice",
  "multiple_choice_multi_select",
  "true_false_group",
  "dropdown_selection",
  "mapping",
  "practical",
] as const;

export type QuestionType = (typeof QUESTION_TYPES)[number];

export const CATEGORIES = [
  "Microsoft 365",
  "Microsoft Copilot",
  "Microsoft Entra",
  "Microsoft Purview",
  "Defender",
  "SharePoint",
  "Teams",
  "Exchange",
  "General",
] as const;

export type Category = (typeof CATEGORIES)[number];

export interface QuestionOption {
  id: string;
  label: string;
}

export interface QuestionFigure {
  src: string;
  page: number;
  caption: string;
  originalCaption?: string;
}

interface BaseQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  topic: string;
  category: Category;
  explanation: string;
  sourceId?: string | number;
  context?: string;
  figures?: QuestionFigure[];
  solutionFigures?: QuestionFigure[];
  sourcePages?: number[];
  originalText?: string;
  translationNote?: string;
}

export interface PracticalQuestion extends BaseQuestion {
  type: "practical";
  practiceKind: "simulation" | "hotspot" | "drag_drop";
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: "multiple_choice";
  options: QuestionOption[];
  correctAnswer: string;
}

export interface MultiSelectQuestion extends BaseQuestion {
  type: "multiple_choice_multi_select";
  options: QuestionOption[];
  correctAnswers: string[];
}

export interface TrueFalseRow {
  id: string;
  statement: string;
  correctAnswer: boolean;
}

export interface TrueFalseQuestion extends BaseQuestion {
  type: "true_false_group";
  rows: TrueFalseRow[];
}

export interface DropdownQuestion extends BaseQuestion {
  type: "dropdown_selection";
  sentence: string;
  options: string[];
  correctAnswer: string;
}

export interface MappingRow {
  id: string;
  prompt: string;
  options: string[];
  correctAnswer: string;
}

export interface MappingQuestion extends BaseQuestion {
  type: "mapping";
  rows: MappingRow[];
}

export type Question =
  | MultipleChoiceQuestion
  | MultiSelectQuestion
  | TrueFalseQuestion
  | DropdownQuestion
  | MappingQuestion
  | PracticalQuestion;

export type UserAnswer =
  | string
  | string[]
  | Record<string, boolean | string>
  | null;

export type ExamMode = "exam" | "study";

export interface ExamSession {
  id: string;
  seed: number;
  mode: ExamMode;
  pearsonMode: boolean;
  questionIds: string[];
  answers: Record<string, UserAnswer>;
  reviewIds: string[];
  revealedIds: string[];
  currentIndex: number;
  startedAt: number;
  status: "active" | "completed";
}

export interface QuestionScore {
  questionId: string;
  type: QuestionType;
  category: Category;
  score: number;
  maxScore: number;
  isCorrect: boolean;
  userAnswer: UserAnswer;
  question: Question;
}

export interface BreakdownItem {
  key: string;
  score: number;
  maxScore: number;
  percentage: number;
}

export interface ExamResult {
  id: string;
  sessionId: string;
  seed: number;
  mode: ExamMode;
  pearsonMode: boolean;
  completedAt: number;
  durationSeconds: number;
  rawScore: number;
  maxScore: number;
  percentage: number;
  microsoftScore: number;
  passed: boolean;
  passingScore: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  typeBreakdown: BreakdownItem[];
  categoryBreakdown: BreakdownItem[];
  details: QuestionScore[];
  practiceCount?: number;
  completedPracticeCount?: number;
}

export interface SimulatorSettings {
  themeMode: "light" | "dark";
  pearsonMode: boolean;
  defaultQuestionCount: number | "all";
  passingScore: number;
  shuffleOptions: boolean;
}

export type AppView = "home" | "exam" | "results" | "dashboard" | "bank";

export interface QuestionBankPayload {
  metadata?: Record<string, unknown>;
  questions: Question[];
}

export interface LoadResult {
  questions: Question[];
  warnings: string[];
  sourceName: string;
}
