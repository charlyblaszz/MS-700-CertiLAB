"use client";

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import {
  ArrowForward,
  CheckCircle,
  DownloadOutlined,
  ExpandMore,
  ReplayOutlined,
  TrendingUpOutlined,
  Cancel,
  InfoOutlined,
} from "@mui/icons-material";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useSimulatorStore } from "@/src/store/useSimulatorStore";
import { QuestionMaterial, Figures } from "@/src/components/QuestionMaterial";
import type { QuestionType } from "@/src/types";
import { exportResultAsPdf } from "@/src/utils/export";
import { formatDuration } from "@/src/utils/formatting";
import {
  correctAnswerLabel,
  getTypeLabel,
  userAnswerLabel,
} from "@/src/utils/scoring";

export function ResultsScreen() {
  const history = useSimulatorStore((state) => state.history);
  const resultId = useSimulatorStore((state) => state.currentResultId);
  const retryIncorrect = useSimulatorStore((state) => state.retryIncorrect);
  const setView = useSimulatorStore((state) => state.setView);
  const result = history.find((item) => item.id === resultId) ?? history[0];

  if (!result) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert
          severity="info"
          action={<Button onClick={() => setView("home")}>Ir al inicio</Button>}
        >
          Todavía no hay resultados para mostrar.
        </Alert>
      </Container>
    );
  }

  const chartData = result.typeBreakdown.map((item) => ({
    name: getTypeLabel(item.key as QuestionType),
    porcentaje: item.percentage,
  }));
  const practiceOnly = result.maxScore === 0;

  return (
    <Box component="main">
      <Box
        sx={{
          bgcolor: practiceOnly ? "#0B315C" : result.passed ? "#0B5733" : "#704214",
          color: "white",
          py: { xs: 4, md: 5 },
        }}
      >
        <Container maxWidth="lg">
          <Stack
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            spacing={3}
            alignItems={{ md: "center" }}
          >
            <Box>
              <Chip
                icon={result.passed ? <CheckCircle /> : <TrendingUpOutlined />}
                label={practiceOnly ? "Sesión de práctica guiada" : result.passed ? "Objetivo alcanzado" : "Continúa reforzando"}
                sx={{ mb: 2, bgcolor: "rgba(255,255,255,.15)", color: "white" }}
              />
              <Typography variant="h3">
                {practiceOnly ? "Revisa tus procedimientos y selecciones." : result.passed ? "¡Examen aprobado!" : "Tu siguiente mejora ya está clara."}
              </Typography>
              <Typography sx={{ mt: 1, opacity: 0.82 }}>
                Completado el {new Date(result.completedAt).toLocaleString("es-MX")}
                {result.pearsonMode ? " · Modo Pearson VUE" : ""}
              </Typography>
            </Box>
            <Box sx={{ textAlign: { xs: "left", md: "right" } }}>
              <Typography variant="h2" sx={{ fontVariantNumeric: "tabular-nums" }}>
                {practiceOnly ? `${result.completedPracticeCount ?? 0}/${result.practiceCount ?? 0}` : result.microsoftScore}
              </Typography>
              <Typography sx={{ opacity: 0.8 }}>{practiceOnly ? "prácticas comparadas con la solución" : `de 1000 · aprobación ${result.passingScore}`}</Typography>
            </Box>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        {(result.practiceCount ?? 0) > 0 && <Alert severity="info" sx={{ mb: 3 }}>Prácticas guiadas: {result.completedPracticeCount ?? 0} de {result.practiceCount} comparadas con la solución. Son ejercicios de autoevaluación y quedan fuera de la calificación automática.</Alert>}
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mb: 3 }}>
          <Button variant="contained" startIcon={<ReplayOutlined />} disabled={result.incorrectCount === 0} onClick={() => retryIncorrect(result.id)}>
            Reintentar incorrectas
          </Button>
          <Button variant="outlined" startIcon={<DownloadOutlined />} onClick={() => exportResultAsPdf(result)}>
            Exportar resultados en PDF
          </Button>
          <Button variant="text" endIcon={<ArrowForward />} onClick={() => setView("dashboard")}>
            Ver rendimiento personal
          </Button>
        </Stack>

        <Grid container spacing={2} sx={{ display: practiceOnly ? "none" : undefined }}>
          {[
            { label: "Calificación", value: `${result.percentage}%`, color: "primary.main" },
            { label: "Correctas", value: `${result.correctCount}/${result.maxScore}`, color: "success.main" },
            { label: "Incorrectas", value: result.incorrectCount, color: "error.main" },
            { label: "Tiempo total", value: formatDuration(result.durationSeconds), color: "secondary.main" },
          ].map((item) => (
            <Grid key={item.label} size={{ xs: 6, md: 3 }}>
              <Card sx={{ height: "100%" }}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">{item.label}</Typography>
                  <Typography variant="h4" sx={{ mt: 0.75, color: item.color, fontVariantNumeric: "tabular-nums" }}>
                    {item.value}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={3} sx={{ mt: 0.5, display: practiceOnly ? "none" : undefined }}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Card sx={{ height: "100%" }}>
              <CardContent>
                <Typography variant="h5">Desglose por tipo de pregunta</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Los grupos Sí/No y las relaciones incluyen puntaje parcial.
                </Typography>
                <Box sx={{ width: "100%", height: 310, mt: 2 }}>
                  <ResponsiveContainer>
                    <BarChart data={chartData} layout="vertical" margin={{ left: 24, right: 16 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" domain={[0, 100]} unit="%" />
                      <YAxis type="category" dataKey="name" width={135} tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(value) => [`${value}%`, "Acierto"]} />
                      <Bar dataKey="porcentaje" fill="#0F6CBD" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 5 }}>
            <Card sx={{ height: "100%" }}>
              <CardContent>
                <Typography variant="h5">Puntaje flexible</Typography>
                <Stack spacing={2.2} sx={{ mt: 2.5 }}>
                  <Box>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2">Puntaje bruto</Typography>
                      <Typography variant="body2" fontWeight={700}>{result.rawScore} / {result.maxScore}</Typography>
                    </Stack>
                    <LinearProgress variant="determinate" value={result.percentage} sx={{ mt: 1 }} />
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Puntaje normalizado</Typography>
                    <Typography variant="h4">{result.percentage}%</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Equivalente Microsoft</Typography>
                    <Typography variant="h4">{result.microsoftScore} / 1000</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Conversión lineal orientativa de 100 a 1000; no reproduce el algoritmo confidencial de Microsoft.
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h4">Revisión completa</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
            Compare su respuesta con la esperada y use la explicación como punto de partida de estudio.
          </Typography>
          {result.details.map((detail, index) => (
            <Accordion key={`${result.id}-${detail.questionId}`} disableGutters>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
                  {!detail.maxScore ? <InfoOutlined color="info" /> : detail.isCorrect ? <CheckCircle color="success" /> : <Cancel color="error" />}
                  <Box sx={{ minWidth: 0 }}>
                    <Typography fontWeight={700} noWrap>
                      {index + 1}. {detail.question.prompt}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {detail.question.category} · {detail.maxScore ? `${Math.round(detail.score * 100)}% del punto` : "Autoevaluación sin puntos"}
                    </Typography>
                  </Box>
                </Stack>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={1.5}>
                  <Typography sx={{ whiteSpace: "pre-wrap" }}>{detail.question.prompt}</Typography>
                  <QuestionMaterial question={detail.question} />
                  <Alert severity={!detail.maxScore ? "info" : detail.isCorrect ? "success" : "error"} icon={false}>
                    <Typography variant="body2" fontWeight={700}>Su respuesta</Typography>
                    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>{userAnswerLabel(detail.question, detail.userAnswer)}</Typography>
                  </Alert>
                  <Alert severity="info" icon={false}>
                    <Typography variant="body2" fontWeight={700}>Respuesta correcta</Typography>
                    <Typography variant="body2">{correctAnswerLabel(detail.question)}</Typography>
                  </Alert>
                  <Box>
                    <Typography fontWeight={700}>Explicación técnica</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                      {detail.question.explanation}
                    </Typography>
                  </Box>
                  <Figures figures={detail.question.solutionFigures} solution />
                </Stack>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
