"use client";

import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  IconButton,
  LinearProgress,
  Pagination,
  Paper,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  ArrowBack,
  ArrowForward,
  DeleteOutline,
  DoneAllOutlined,
  Favorite,
  FavoriteBorder,
  Flag,
  FlagOutlined,
  GridViewOutlined,
  VisibilityOffOutlined,
  VisibilityOutlined,
} from "@mui/icons-material";
import { QuestionRenderer } from "@/src/components/QuestionRenderer";
import { useExamTimer } from "@/src/hooks/useExamTimer";
import { useKeyboardShortcuts } from "@/src/hooks/useKeyboardShortcuts";
import { useSimulatorStore } from "@/src/store/useSimulatorStore";
import { formatDuration } from "@/src/utils/formatting";
import { getTypeLabel, isAnswered } from "@/src/utils/scoring";

const NAV_PAGE_SIZE = 100;

export function ExamScreen() {
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down("lg"));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);
  const [navPage, setNavPage] = useState(1);
  const session = useSimulatorStore((state) => state.session);
  const bank = useSimulatorStore((state) => state.bank);
  const settings = useSimulatorStore((state) => state.settings);
  const favorites = useSimulatorStore((state) => state.favorites);
  const setAnswer = useSimulatorStore((state) => state.setAnswer);
  const clearAnswer = useSimulatorStore((state) => state.clearAnswer);
  const toggleReview = useSimulatorStore((state) => state.toggleReview);
  const toggleReveal = useSimulatorStore((state) => state.toggleReveal);
  const toggleFavorite = useSimulatorStore((state) => state.toggleFavorite);
  const goToQuestion = useSimulatorStore((state) => state.goToQuestion);
  const finishExam = useSimulatorStore((state) => state.finishExam);
  const setView = useSimulatorStore((state) => state.setView);

  const questions = useMemo(() => {
    if (!session) return [];
    const byId = new Map(bank.map((question) => [question.id, question]));
    return session.questionIds
      .map((id) => byId.get(id))
      .filter((question): question is NonNullable<typeof question> => Boolean(question));
  }, [bank, session]);

  const currentIndex = session?.currentIndex ?? 0;
  const currentQuestion = questions[currentIndex];
  const elapsed = useExamTimer(session?.startedAt, session?.status === "active");
  const total = questions.length;
  const currentAnswer = currentQuestion
    ? session?.answers[currentQuestion.id] ?? null
    : null;
  const answeredCount = session
    ? questions.filter((question) =>
        isAnswered(question, session.answers[question.id] ?? null),
      ).length
    : 0;
  const unansweredCount = total - answeredCount;
  const positionProgress = total ? Math.round(((currentIndex + 1) / total) * 100) : 0;
  const isReviewed = currentQuestion
    ? session?.reviewIds.includes(currentQuestion.id) ?? false
    : false;
  const revealed = currentQuestion
    ? session?.revealedIds.includes(currentQuestion.id) ?? false
    : false;

  const navigateTo = useCallback(
    (index: number) => {
      setNavPage(Math.floor(index / NAV_PAGE_SIZE) + 1);
      goToQuestion(index);
    },
    [goToQuestion],
  );

  const previous = useCallback(
    () => navigateTo(Math.max(0, currentIndex - 1)),
    [currentIndex, navigateTo],
  );
  const next = useCallback(
    () => navigateTo(Math.min(total - 1, currentIndex + 1)),
    [currentIndex, navigateTo, total],
  );
  const reviewCurrent = useCallback(() => {
    if (currentQuestion) toggleReview(currentQuestion.id);
  }, [currentQuestion, toggleReview]);
  const revealCurrent = useCallback(() => {
    if (currentQuestion && !session?.pearsonMode)
      toggleReveal(currentQuestion.id);
  }, [currentQuestion, session?.pearsonMode, toggleReveal]);

  useKeyboardShortcuts({
    enabled: Boolean(session && currentQuestion),
    previous,
    next,
    toggleReview: reviewCurrent,
    toggleReveal: revealCurrent,
  });

  if (!session || !currentQuestion) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert
          severity="warning"
          action={<Button onClick={() => setView("home")}>Volver al inicio</Button>}
        >
          No hay un intento activo o algunas preguntas ya no están disponibles
          en el banco actual.
        </Alert>
      </Container>
    );
  }

  const navStart = (navPage - 1) * NAV_PAGE_SIZE;
  const navQuestions = questions.slice(navStart, navStart + NAV_PAGE_SIZE);

  const navigation = (
    <Box sx={{ width: 286, p: 2.25 }}>
      <Typography fontWeight={750}>Navegación rápida</Typography>
      <Typography variant="caption" color="text.secondary">
        {answeredCount} respondidas · {session.reviewIds.length} para revisar
      </Typography>
      <Stack direction="row" spacing={1.5} sx={{ mt: 2, mb: 2 }} flexWrap="wrap" useFlexGap>
        {[
          ["#107C41", "Respondida"],
          ["#C27A00", "Revisión"],
          [theme.palette.action.disabledBackground, "Pendiente"],
        ].map(([color, label]) => (
          <Stack key={String(label)} direction="row" spacing={0.6} alignItems="center">
            <Box sx={{ width: 9, height: 9, borderRadius: "50%", bgcolor: color }} />
            <Typography variant="caption">{label}</Typography>
          </Stack>
        ))}
      </Stack>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: 0.75,
        }}
      >
        {navQuestions.map((question, localIndex) => {
          const index = navStart + localIndex;
          const answered = isAnswered(
            question,
            session.answers[question.id] ?? null,
          );
          const review = session.reviewIds.includes(question.id);
          return (
            <Button
              key={question.id}
              size="small"
              onClick={() => {
                navigateTo(index);
                setDrawerOpen(false);
              }}
              aria-label={`Ir a la pregunta ${index + 1}`}
              sx={{
                minWidth: 0,
                height: 38,
                p: 0,
                color: review || answered ? "white" : "text.primary",
                bgcolor: review
                  ? "warning.main"
                  : answered
                    ? "success.main"
                    : "action.disabledBackground",
                border: index === currentIndex ? "3px solid" : "1px solid",
                borderColor: index === currentIndex ? "primary.light" : "transparent",
                "&:hover": {
                  bgcolor: review
                    ? "warning.dark"
                    : answered
                      ? "success.dark"
                      : "action.selected",
                },
              }}
            >
              {index + 1}
            </Button>
          );
        })}
      </Box>
      {total > NAV_PAGE_SIZE && (
        <Pagination
          size="small"
          count={Math.ceil(total / NAV_PAGE_SIZE)}
          page={navPage}
          onChange={(_, page) => setNavPage(page)}
          sx={{ mt: 2, "& .MuiPagination-ul": { justifyContent: "center" } }}
        />
      )}
      <Divider sx={{ my: 2 }} />
      <Button
        fullWidth
        color="error"
        variant="outlined"
        startIcon={<DoneAllOutlined />}
        onClick={() => setFinishOpen(true)}
      >
        Finalizar examen
      </Button>
    </Box>
  );

  return (
    <Box component="main">
      <Paper square elevation={0} sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Container maxWidth="xl" sx={{ py: 1.5 }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={{ xs: 1.5, md: 3 }}
            alignItems={{ md: "center" }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 260 }}>
              {mobile && (
                <IconButton onClick={() => setDrawerOpen(true)} aria-label="Abrir navegación rápida">
                  <GridViewOutlined />
                </IconButton>
              )}
              <Box>
                <Typography variant="caption" color="text.secondary">Tiempo transcurrido</Typography>
                <Typography variant="h6" sx={{ fontVariantNumeric: "tabular-nums" }}>
                  {formatDuration(elapsed)}
                </Typography>
              </Box>
              {session.pearsonMode && <Chip icon={<VisibilityOffOutlined />} label="Modo Pearson" size="small" />}
            </Stack>
            <Box sx={{ flex: 1 }}>
              <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}>
                <Typography variant="body2" fontWeight={700}>
                  Pregunta {currentIndex + 1} de {total}
                </Typography>
                <Typography variant="body2" color="text.secondary">{positionProgress}%</Typography>
              </Stack>
              <LinearProgress variant="determinate" value={positionProgress} />
            </Box>
            <Stack direction="row" spacing={1}>
              <Chip
                color={isAnswered(currentQuestion, currentAnswer) ? "success" : "default"}
                label={isAnswered(currentQuestion, currentAnswer) ? "Respondida" : "Sin responder"}
              />
              <Chip color="warning" variant="outlined" label={`${session.reviewIds.length} en revisión`} />
            </Stack>
          </Stack>
        </Container>
      </Paper>

      <Container maxWidth="xl" sx={{ py: { xs: 2, md: 3 } }}>
        <Box sx={{ display: "flex", gap: 3, alignItems: "flex-start" }}>
          {!mobile && <Paper variant="outlined" sx={{ position: "sticky", top: 92, flex: "0 0 auto" }}>{navigation}</Paper>}
          <Card sx={{ flex: 1, minWidth: 0 }}>
            <CardContent sx={{ p: { xs: 2.25, md: 4 }, "&:last-child": { pb: { xs: 2.25, md: 4 } } }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
                <Box>
                  <Stack direction="row" spacing={1} sx={{ mb: 1.5 }} flexWrap="wrap" useFlexGap>
                    <Chip size="small" color="primary" variant="outlined" label={getTypeLabel(currentQuestion.type)} />
                    <Chip size="small" label={currentQuestion.category} />
                    {session.mode === "study" && <Chip size="small" color="secondary" label="Modo estudio" />}
                  </Stack>
                  <Typography variant="h5" component="h1" sx={{ lineHeight: 1.42, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                    {currentQuestion.prompt}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {currentQuestion.topic}
                  </Typography>
                </Box>
                <Tooltip title={favorites.includes(currentQuestion.id) ? "Quitar de favoritos" : "Agregar a favoritos"}>
                  <IconButton onClick={() => toggleFavorite(currentQuestion.id)} color={favorites.includes(currentQuestion.id) ? "error" : "default"}>
                    {favorites.includes(currentQuestion.id) ? <Favorite /> : <FavoriteBorder />}
                  </IconButton>
                </Tooltip>
              </Stack>

              <Divider sx={{ my: 3 }} />
              <QuestionRenderer
                question={currentQuestion}
                answer={currentAnswer}
                onAnswer={(answer) => setAnswer(currentQuestion.id, answer)}
                revealed={revealed && !session.pearsonMode}
                seed={session.seed}
                shuffleOptions={settings.shuffleOptions}
              />

              <Divider sx={{ my: 3 }} />
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                justifyContent="space-between"
              >
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Button
                    variant={isReviewed ? "contained" : "outlined"}
                    color="warning"
                    startIcon={isReviewed ? <Flag /> : <FlagOutlined />}
                    onClick={reviewCurrent}
                  >
                    {isReviewed ? "Marcada para revisión" : "Marcar para revisión"}
                  </Button>
                  <Button
                    variant="text"
                    color="inherit"
                    startIcon={<DeleteOutline />}
                    onClick={() => clearAnswer(currentQuestion.id)}
                    disabled={currentAnswer === null}
                  >
                    Limpiar respuesta
                  </Button>
                  {!session.pearsonMode && (
                    <Button
                      variant="text"
                      startIcon={revealed ? <VisibilityOffOutlined /> : <VisibilityOutlined />}
                      onClick={revealCurrent}
                    >
                      {revealed ? "Ocultar respuesta" : "Mostrar respuesta"}
                    </Button>
                  )}
                </Stack>
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  <Button variant="outlined" startIcon={<ArrowBack />} onClick={previous} disabled={currentIndex === 0}>
                    Anterior
                  </Button>
                  {currentIndex < total - 1 ? (
                    <Button variant="contained" endIcon={<ArrowForward />} onClick={next}>
                      Siguiente
                    </Button>
                  ) : (
                    <Button variant="contained" color="success" endIcon={<DoneAllOutlined />} onClick={() => setFinishOpen(true)}>
                      Revisar y finalizar
                    </Button>
                  )}
                </Stack>
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2 }}>
                Atajos: ← anterior · → o Enter siguiente · F revisión · R respuesta
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Container>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>{navigation}</Drawer>

      <Dialog open={finishOpen} onClose={() => setFinishOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>¿Finalizar este intento?</DialogTitle>
        <DialogContent>
          <Typography>
            Podrá revisar todas las respuestas después de enviar el examen.
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            <Chip color="success" label={`${answeredCount} respondidas`} />
            <Chip color={unansweredCount ? "warning" : "default"} label={`${unansweredCount} sin responder`} />
            <Chip color="warning" variant="outlined" label={`${session.reviewIds.length} marcadas`} />
          </Stack>
          {unansweredCount > 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Las preguntas calificables sin respuesta recibirán cero puntos. Las prácticas guiadas quedan fuera de la calificación.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFinishOpen(false)}>Seguir revisando</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              finishExam();
              setFinishOpen(false);
            }}
          >
            Finalizar y calificar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
