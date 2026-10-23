"use client";

import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  CircularProgress,
  CssBaseline,
  ThemeProvider,
} from "@mui/material";
import { AppHeader } from "@/src/components/AppHeader";
import { HomeScreen } from "@/src/components/HomeScreen";
import { loadIncludedQuestionBank } from "@/src/services/questionService";
import { useSimulatorStore } from "@/src/store/useSimulatorStore";
import { createSimulatorTheme } from "@/src/theme";

const ExamScreen = lazy(() =>
  import("@/src/components/ExamScreen").then((module) => ({
    default: module.ExamScreen,
  })),
);
const ResultsScreen = lazy(() =>
  import("@/src/components/ResultsScreen").then((module) => ({
    default: module.ResultsScreen,
  })),
);
const DashboardScreen = lazy(() =>
  import("@/src/components/DashboardScreen").then((module) => ({
    default: module.DashboardScreen,
  })),
);
const QuestionBankScreen = lazy(() =>
  import("@/src/components/QuestionBankScreen").then((module) => ({
    default: module.QuestionBankScreen,
  })),
);

export default function App() {
  const view = useSimulatorStore((state) => state.view);
  const bankLoading = useSimulatorStore((state) => state.bankLoading);
  const bank = useSimulatorStore((state) => state.bank);
  const warnings = useSimulatorStore((state) => state.bankWarnings);
  const themeMode = useSimulatorStore((state) => state.settings.themeMode);
  const hydrateBank = useSimulatorStore((state) => state.hydrateBank);
  const includedBank = useSimulatorStore((state) => state.includedBank);
  const [fatalError, setFatalError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    loadIncludedQuestionBank(includedBank)
      .then((result) => {
        if (active)
          hydrateBank(result.questions, result.warnings, result.sourceName);
      })
      .catch((error: unknown) => {
        if (active)
          setFatalError(
            error instanceof Error
              ? error.message
              : "No fue posible iniciar el simulador.",
          );
      });
    return () => {
      active = false;
    };
  }, [hydrateBank, includedBank]);

  const theme = useMemo(() => createSimulatorTheme(themeMode), [themeMode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
        <AppHeader />
        {fatalError ? (
          <Alert severity="error" sx={{ m: 3 }}>
            {fatalError}
          </Alert>
        ) : bankLoading && !bank.length ? (
          <Box
            sx={{ minHeight: "65vh", display: "grid", placeItems: "center" }}
          >
            <Box sx={{ textAlign: "center" }}>
              <CircularProgress />
              <Box sx={{ mt: 2, color: "text.secondary" }}>
                Preparando el banco de preguntas…
              </Box>
            </Box>
          </Box>
        ) : (
          <>
            {warnings.length > 0 && view === "home" && (
              <Alert severity="warning" sx={{ mx: { xs: 2, md: 4 }, mt: 2 }}>
                El banco se cargó con {warnings.length} advertencia(s). Puede
                revisarlas desde Banco de preguntas.
              </Alert>
            )}
            {view === "home" && <HomeScreen />}
            {view !== "home" && (
              <Suspense
                fallback={
                  <Box sx={{ minHeight: "55vh", display: "grid", placeItems: "center" }}>
                    <CircularProgress />
                  </Box>
                }
              >
                {view === "exam" && <ExamScreen />}
                {view === "results" && <ResultsScreen />}
                {view === "dashboard" && <DashboardScreen />}
                {view === "bank" && <QuestionBankScreen />}
              </Suspense>
            )}
          </>
        )}
      </Box>
    </ThemeProvider>
  );
}
