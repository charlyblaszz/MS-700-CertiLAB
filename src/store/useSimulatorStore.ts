"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type {
  AppView,
  ExamMode,
  ExamResult,
  ExamSession,
  Question,
  SimulatorSettings,
  UserAnswer,
} from "@/src/types";
import { createSeed, seededShuffle } from "@/src/utils/random";
import { buildExamResult, isAnswered } from "@/src/utils/scoring";

interface StartExamOptions {
  mode: ExamMode;
  count: number | "all";
  questionIds?: string[];
  practiceOnly?: boolean;
  practiceKind?: "simulation" | "visual";
}

interface SimulatorState {
  view: AppView;
  bank: Question[];
  customBank: Question[] | null;
  bankSourceName: string;
  bankWarnings: string[];
  bankLoading: boolean;
  includedBank: "ms700" | "ab900";
  selectIncludedBank: (bank: "ms700" | "ab900") => void;
  session: ExamSession | null;
  history: ExamResult[];
  currentResultId: string | null;
  favorites: string[];
  settings: SimulatorSettings;
  hydrateBank: (
    questions: Question[],
    warnings: string[],
    sourceName: string,
  ) => void;
  importBank: (
    questions: Question[],
    warnings: string[],
    sourceName: string,
  ) => void;
  restoreDefaultBank: (questions: Question[]) => void;
  setView: (view: AppView) => void;
  updateSettings: (settings: Partial<SimulatorSettings>) => void;
  startExam: (options: StartExamOptions) => void;
  setAnswer: (questionId: string, answer: UserAnswer) => void;
  clearAnswer: (questionId: string) => void;
  toggleReview: (questionId: string) => void;
  toggleReveal: (questionId: string) => void;
  toggleFavorite: (questionId: string) => void;
  goToQuestion: (index: number) => void;
  finishExam: () => ExamResult | null;
  openResult: (resultId: string) => void;
  retryIncorrect: (resultId: string) => void;
  clearHistory: () => void;
}

const defaultSettings: SimulatorSettings = {
  themeMode: "light",
  pearsonMode: false,
  defaultQuestionCount: 20,
  passingScore: 700,
  shuffleOptions: true,
};

const createSession = (
  questionIds: string[],
  mode: ExamMode,
  pearsonMode: boolean,
  seed: number,
): ExamSession => ({
  id: `exam-${Date.now()}`,
  seed,
  mode,
  pearsonMode,
  questionIds,
  answers: {},
  reviewIds: [],
  revealedIds: [],
  currentIndex: 0,
  startedAt: Date.now(),
  status: "active",
});

export const useSimulatorStore = create<SimulatorState>()(
  persist(
    (set, get) => ({
      view: "home",
      bank: [],
      customBank: null,
      bankSourceName: "Banco incluido",
      bankWarnings: [],
      bankLoading: true,
      includedBank: "ms700",
      selectIncludedBank: (includedBank) => set({ includedBank, customBank: null, bank: [], bankLoading: true, session: null, view: "home", bankWarnings: [] }),
      session: null,
      history: [],
      currentResultId: null,
      favorites: [],
      settings: defaultSettings,

      hydrateBank: (questions, warnings, sourceName) =>
        set((state) => ({
          bank: state.customBank ?? questions,
          bankWarnings: state.customBank ? state.bankWarnings : warnings,
          bankSourceName: state.customBank
            ? state.bankSourceName
            : sourceName,
          bankLoading: false,
        })),

      importBank: (questions, warnings, sourceName) =>
        set({
          bank: questions,
          customBank: questions,
          bankWarnings: warnings,
          bankSourceName: sourceName,
          bankLoading: false,
          view: "bank",
          session: null,
        }),

      restoreDefaultBank: (questions) =>
        set({
          bank: questions,
          customBank: null,
          bankWarnings: [],
          bankSourceName: get().includedBank === "ms700" ? "MS-700 · Español · 399 preguntas" : "AB-900 · Banco original",
          session: null,
          view: "bank",
        }),

      setView: (view) => set({ view }),

      updateSettings: (nextSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...nextSettings },
        })),

      startExam: ({ mode, count, questionIds, practiceOnly, practiceKind }) => {
        const { bank, settings } = get();
        if (!bank.length) return;
        const allowed = questionIds?.length
          ? new Set(questionIds)
          : null;
        const candidates = allowed
          ? bank.filter((question) => allowed.has(question.id))
          : bank;
        const pool = candidates.filter((question) => {
          if (practiceOnly) return question.type === "practical" && (!practiceKind || (practiceKind === "simulation" ? question.practiceKind === "simulation" : question.practiceKind !== "simulation"));
          return mode === "exam" ? question.type !== "practical" : true;
        });
        const seed = createSeed();
        const shuffled = seededShuffle(pool, seed);
        const requested = count === "all" ? shuffled.length : count;
        const selected = shuffled
          .slice(0, Math.min(requested, shuffled.length))
          .map((question) => question.id);
        if (!selected.length) return;
        set({
          session: createSession(
            selected,
            mode,
            settings.pearsonMode && !practiceOnly,
            seed,
          ),
          currentResultId: null,
          view: "exam",
        });
      },

      setAnswer: (questionId, answer) =>
        set((state) => {
          if (!state.session || state.session.status !== "active") return {};
          const answers = { ...state.session.answers, [questionId]: answer };
          const question = state.bank.find((item) => item.id === questionId);
          const shouldReveal =
            state.session.mode === "study" &&
            !state.session.pearsonMode &&
            question &&
            question.type !== "practical" &&
            isAnswered(question, answer);
          return {
            session: {
              ...state.session,
              answers,
              revealedIds:
                shouldReveal &&
                !state.session.revealedIds.includes(questionId)
                  ? [...state.session.revealedIds, questionId]
                  : state.session.revealedIds,
            },
          };
        }),

      clearAnswer: (questionId) =>
        set((state) => {
          if (!state.session) return {};
          const answers = { ...state.session.answers };
          delete answers[questionId];
          return {
            session: {
              ...state.session,
              answers,
              revealedIds: state.session.revealedIds.filter(
                (id) => id !== questionId,
              ),
            },
          };
        }),

      toggleReview: (questionId) =>
        set((state) => {
          if (!state.session) return {};
          const exists = state.session.reviewIds.includes(questionId);
          return {
            session: {
              ...state.session,
              reviewIds: exists
                ? state.session.reviewIds.filter((id) => id !== questionId)
                : [...state.session.reviewIds, questionId],
            },
          };
        }),

      toggleReveal: (questionId) =>
        set((state) => {
          if (!state.session || state.session.pearsonMode) return {};
          const exists = state.session.revealedIds.includes(questionId);
          return {
            session: {
              ...state.session,
              revealedIds: exists
                ? state.session.revealedIds.filter((id) => id !== questionId)
                : [...state.session.revealedIds, questionId],
            },
          };
        }),

      toggleFavorite: (questionId) =>
        set((state) => ({
          favorites: state.favorites.includes(questionId)
            ? state.favorites.filter((id) => id !== questionId)
            : [...state.favorites, questionId],
        })),

      goToQuestion: (index) =>
        set((state) => {
          if (!state.session) return {};
          const bounded = Math.max(
            0,
            Math.min(index, state.session.questionIds.length - 1),
          );
          return { session: { ...state.session, currentIndex: bounded } };
        }),

      finishExam: () => {
        const { session, bank, settings } = get();
        if (!session || session.status !== "active") return null;
        const result = buildExamResult(session, bank, settings.passingScore);
        set((state) => ({
          session: { ...session, status: "completed" },
          history: [result, ...state.history].slice(0, 25),
          currentResultId: result.id,
          view: "results",
        }));
        return result;
      },

      openResult: (resultId) =>
        set({ currentResultId: resultId, view: "results" }),

      retryIncorrect: (resultId) => {
        const result = get().history.find((item) => item.id === resultId);
        if (!result) return;
        const ids = result.details
          .filter((detail) => detail.maxScore > 0 && !detail.isCorrect)
          .map((detail) => detail.questionId);
        if (!ids.length) return;
        get().startExam({ mode: result.mode, count: "all", questionIds: ids });
      },

      clearHistory: () =>
        set({ history: [], currentResultId: null, view: "home" }),
    }),
    {
      name: "microsoft-cert-simulator-ms700-v1",
      version: 2,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        includedBank: state.includedBank,
        customBank: state.customBank,
        bankSourceName: state.bankSourceName,
        bankWarnings: state.bankWarnings,
        session: state.session,
        history: state.history.slice(0, 3),
        currentResultId: state.currentResultId,
        favorites: state.favorites,
        settings: state.settings,
        view: state.view,
      }),
    },
  ),
);
