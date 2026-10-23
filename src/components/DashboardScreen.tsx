"use client";

import { useMemo, useState } from "react";
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
  Grid,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import {
  DeleteOutline,
  DownloadOutlined,
  EmojiEventsOutlined,
  InsightsOutlined,
  SchoolOutlined,
  TrendingUpOutlined,
} from "@mui/icons-material";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { BreakdownItem } from "@/src/types";
import { useSimulatorStore } from "@/src/store/useSimulatorStore";
import { exportHistoryAsJson } from "@/src/utils/export";
import { formatDuration } from "@/src/utils/formatting";

export function DashboardScreen() {
  const history = useSimulatorStore((state) => state.history);
  const openResult = useSimulatorStore((state) => state.openResult);
  const clearHistory = useSimulatorStore((state) => state.clearHistory);
  const setView = useSimulatorStore((state) => state.setView);
  const [clearOpen, setClearOpen] = useState(false);

  const stats = useMemo(() => {
    const scoredHistory = history.filter((item) => item.maxScore > 0);
    const average = scoredHistory.length
      ? Math.round(scoredHistory.reduce((sum, item) => sum + item.microsoftScore, 0) / scoredHistory.length)
      : 0;
    const best = scoredHistory.length ? Math.max(...scoredHistory.map((item) => item.microsoftScore)) : 0;
    const categories = new Map<string, { score: number; maxScore: number }>();
    const missed = new Map<string, { count: number; prompt: string; category: string }>();

    history.forEach((result) => {
      result.categoryBreakdown.forEach((item) => {
        const current = categories.get(item.key) ?? { score: 0, maxScore: 0 };
        current.score += item.score;
        current.maxScore += item.maxScore;
        categories.set(item.key, current);
      });
      result.details.forEach((detail) => {
        if (detail.isCorrect || detail.maxScore === 0) return;
        const current = missed.get(detail.questionId) ?? {
          count: 0,
          prompt: detail.question.prompt,
          category: detail.category,
        };
        current.count += 1;
        missed.set(detail.questionId, current);
      });
    });

    const categoryData: BreakdownItem[] = Array.from(categories.entries())
      .map(([key, value]) => ({
        key,
        score: value.score,
        maxScore: value.maxScore,
        percentage: value.maxScore ? Math.round((value.score / value.maxScore) * 100) : 0,
      }))
      .sort((a, b) => b.percentage - a.percentage);
    const missedData = Array.from(missed.values()).sort((a, b) => b.count - a.count);
    return {
      average,
      best,
      categoryData,
      missedData,
      strongest: categoryData[0],
      weakest: categoryData.at(-1),
    };
  }, [history]);

  if (!history.length) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Card>
          <CardContent sx={{ p: 5, textAlign: "center" }}>
            <InsightsOutlined color="primary" sx={{ fontSize: 58 }} />
            <Typography variant="h4" sx={{ mt: 2 }}>Su dashboard se construye con cada intento</Typography>
            <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
              Complete un examen o una sesión de estudio para descubrir temas fuertes, áreas débiles y recomendaciones.
            </Typography>
            <Button variant="contained" onClick={() => setView("home")}>Iniciar mi primer intento</Button>
          </CardContent>
        </Card>
      </Container>
    );
  }

  const trend = [...history]
    .filter((item) => item.maxScore > 0)
    .slice(0, 10)
    .reverse()
    .map((item, index) => ({ intento: `#${index + 1}`, score: item.microsoftScore, porcentaje: item.percentage }));
  const categoryChart = stats.categoryData.map((item) => ({ name: item.key, porcentaje: item.percentage }));
  const recommendations = [
    stats.weakest ? `Priorice ${stats.weakest.key}: su promedio actual es ${stats.weakest.percentage}%.` : null,
    stats.missedData.length ? `Reintente las ${stats.missedData.length} preguntas que aún aparecen como pendientes de dominar.` : null,
    stats.average < 700 ? "Realice sesiones cortas de 10–20 preguntas en modo estudio antes del siguiente simulacro Pearson." : "Mantenga el nivel con un simulacro completo y revise únicamente los errores recurrentes.",
  ].filter(Boolean) as string[];

  return (
    <Container component="main" maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h3">Rendimiento personal</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Tendencias, dominios de conocimiento y próximos pasos basados en sus intentos locales.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="flex-start">
          <Button variant="outlined" startIcon={<DownloadOutlined />} onClick={() => exportHistoryAsJson(history)}>
            Exportar historial JSON
          </Button>
          <Button color="error" startIcon={<DeleteOutline />} onClick={() => setClearOpen(true)}>
            Borrar historial
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={2}>
        {[
          { icon: <TrendingUpOutlined color="primary" />, label: "Promedio histórico", value: `${stats.average}/1000` },
          { icon: <EmojiEventsOutlined color="warning" />, label: "Mejor resultado", value: `${stats.best}/1000` },
          { icon: <SchoolOutlined color="secondary" />, label: "Temas fuertes", value: stats.strongest?.key ?? "—" },
          { icon: <InsightsOutlined color="error" />, label: "Pendientes de dominar", value: stats.missedData.length },
        ].map((item) => (
          <Grid key={item.label} size={{ xs: 12, sm: 6, lg: 3 }}>
            <Card sx={{ height: "100%" }}>
              <CardContent>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  {item.icon}
                  <Box>
                    <Typography variant="body2" color="text.secondary">{item.label}</Typography>
                    <Typography variant="h6">{item.value}</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} sx={{ mt: 0.5 }}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Card>
            <CardContent>
              <Typography variant="h5">Tendencia de avance</Typography>
              <Typography variant="body2" color="text.secondary">Últimos 10 exámenes · escala 100–1000</Typography>
              <Box sx={{ height: 310, mt: 2 }}>
                <ResponsiveContainer>
                  <LineChart data={trend} margin={{ left: 0, right: 20, top: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="intento" />
                    <YAxis domain={[100, 1000]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="score" stroke="#0F6CBD" strokeWidth={3} dot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, lg: 5 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h5">Recomendaciones de estudio</Typography>
              <Stack spacing={1.5} sx={{ mt: 2 }}>
                {recommendations.map((recommendation, index) => (
                  <Alert key={recommendation} severity={index === 0 ? "warning" : "info"} icon={false}>
                    <Typography variant="body2">{recommendation}</Typography>
                  </Alert>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mt: 0.5 }}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Card>
            <CardContent>
              <Typography variant="h5">Porcentaje por categoría</Typography>
              <Box sx={{ height: Math.max(300, categoryChart.length * 48), mt: 2 }}>
                <ResponsiveContainer>
                  <BarChart data={categoryChart} layout="vertical" margin={{ left: 30, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} unit="%" />
                    <YAxis type="category" dataKey="name" width={125} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value) => [`${value}%`, "Acierto"]} />
                    <Bar dataKey="porcentaje" fill="#5C2D91" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, lg: 5 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h5">Preguntas más falladas</Typography>
              <Stack spacing={1.5} sx={{ mt: 2 }}>
                {stats.missedData.slice(0, 5).map((item, index) => (
                  <Box key={`${item.prompt}-${index}`}>
                    <Stack direction="row" justifyContent="space-between" spacing={2}>
                      <Typography variant="body2" fontWeight={650} sx={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {item.prompt}
                      </Typography>
                      <Chip size="small" color="error" label={`${item.count} fallo${item.count === 1 ? "" : "s"}`} />
                    </Stack>
                    <Typography variant="caption" color="text.secondary">{item.category}</Typography>
                    <LinearProgress color="error" variant="determinate" value={Math.min(100, item.count * 20)} sx={{ mt: 0.75 }} />
                  </Box>
                ))}
                {!stats.missedData.length && <Alert severity="success">No hay preguntas pendientes.</Alert>}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h5" sx={{ mb: 2 }}>Últimos 10 exámenes</Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Modo</TableCell>
                  <TableCell align="right">Resultado</TableCell>
                  <TableCell align="right">Tiempo</TableCell>
                  <TableCell align="right">Estado</TableCell>
                  <TableCell align="right">Acción</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {history.slice(0, 10).map((result) => (
                  <TableRow key={result.id} hover>
                    <TableCell>{new Date(result.completedAt).toLocaleString("es-MX")}</TableCell>
                    <TableCell>{result.pearsonMode ? "Pearson" : result.mode === "study" ? "Estudio" : "Examen"}</TableCell>
                    <TableCell align="right">{result.maxScore ? `${result.microsoftScore}/1000` : `${result.completedPracticeCount ?? 0}/${result.practiceCount ?? 0} revisadas`}</TableCell>
                    <TableCell align="right">{formatDuration(result.durationSeconds)}</TableCell>
                    <TableCell align="right"><Chip size="small" color={!result.maxScore ? "info" : result.passed ? "success" : "warning"} label={!result.maxScore ? "Autoevaluación" : result.passed ? "Aprobado" : "Por reforzar"} /></TableCell>
                    <TableCell align="right"><Button size="small" onClick={() => openResult(result.id)}>Revisar</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog open={clearOpen} onClose={() => setClearOpen(false)}>
        <DialogTitle>Borrar historial local</DialogTitle>
        <DialogContent>
          <Typography>Esta acción eliminará los intentos y estadísticas guardados en este navegador.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClearOpen(false)}>Cancelar</Button>
          <Button color="error" variant="contained" onClick={() => { clearHistory(); setClearOpen(false); }}>Borrar historial</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
