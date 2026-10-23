"use client";

import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  FormControl,
  FormControlLabel,
  Grid,
  MenuItem,
  Select,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import {
  ArrowForward,
  AutoStoriesOutlined,
  BoltOutlined,
  HistoryOutlined,
  ShieldOutlined,
} from "@mui/icons-material";
import { useSimulatorStore } from "@/src/store/useSimulatorStore";

export function HomeScreen() {
  const bank = useSimulatorStore((state) => state.bank);
  const includedBank = useSimulatorStore((state) => state.includedBank);
  const selectIncludedBank = useSimulatorStore((state) => state.selectIncludedBank);
  const sourceName = useSimulatorStore((state) => state.bankSourceName);
  const session = useSimulatorStore((state) => state.session);
  const history = useSimulatorStore((state) => state.history);
  const settings = useSimulatorStore((state) => state.settings);
  const updateSettings = useSimulatorStore((state) => state.updateSettings);
  const startExam = useSimulatorStore((state) => state.startExam);
  const setView = useSimulatorStore((state) => state.setView);
  const goToQuestion = useSimulatorStore((state) => state.goToQuestion);
  const [count, setCount] = useState<number | "all">(
    settings.defaultQuestionCount,
  );

  const activeSession = session?.status === "active";
  const examCount = bank.filter((q) => q.type !== "practical").length;
  const practiceCount = bank.length - examCount;
  const scoredHistory = history.filter((item) => item.maxScore > 0);
  const best = scoredHistory.length
    ? Math.max(...scoredHistory.map((item) => item.microsoftScore))
    : 0;

  const continueAttempt = () => {
    if (!activeSession) return;
    goToQuestion(session.currentIndex);
    setView("exam");
  };

  return (
    <Box component="main">
      <Box
        sx={{
          background:
            "linear-gradient(120deg, #0B315C 0%, #0F6CBD 58%, #287ED0 100%)",
          color: "white",
          py: { xs: 5, md: 8 },
          position: "relative",
          overflow: "hidden",
          "&::after": {
            content: '""',
            position: "absolute",
            width: 420,
            height: 420,
            borderRadius: "50%",
            right: -120,
            top: -210,
            border: "70px solid rgba(255,255,255,.07)",
          },
        }}
      >
        <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
          <Grid container spacing={5} alignItems="center">
            <Grid size={{ xs: 12, md: 7 }}>
              <Chip
                label="Microsoft 365 · práctica local"
                sx={{
                  mb: 2.5,
                  bgcolor: "rgba(255,255,255,.14)",
                  color: "white",
                  border: "1px solid rgba(255,255,255,.2)",
                }}
              />
              <Typography variant="h2" sx={{ fontSize: { xs: 38, md: 58 } }}>
                {includedBank === "ms700" ? "Domina Microsoft Teams, pregunta a pregunta." : "Prepárate con una experiencia de examen realista."}
              </Typography>
              <Typography
                variant="h6"
                sx={{ mt: 2, maxWidth: 720, opacity: 0.86, fontWeight: 400 }}
              >
                Practica, revisa explicaciones y convierte cada intento en una
                ruta de estudio clara. Todo permanece en este dispositivo.
              </Typography>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                sx={{ mt: 3.5 }}
              >
                <Button
                  variant="contained"
                  color="inherit"
                  endIcon={<ArrowForward />}
                  disabled={!bank.length}
                  onClick={() => startExam({ mode: "exam", count })}
                  sx={{ color: "#0B4F8A", bgcolor: "white" }}
                >
                  Iniciar examen aleatorio
                </Button>
                <Button
                  variant="outlined"
                  color="inherit"
                  startIcon={<AutoStoriesOutlined />}
                  disabled={!bank.length}
                  onClick={() => startExam({ mode: "study", count })}
                  sx={{ borderColor: "rgba(255,255,255,.6)" }}
                >
                  Modo estudio
                </Button>
                <Button
                  variant="text"
                  color="inherit"
                  startIcon={<HistoryOutlined />}
                  disabled={!activeSession}
                  onClick={continueAttempt}
                >
                  Continuar intento
                </Button>
                {practiceCount > 0 && <Button variant="outlined" color="inherit" onClick={() => startExam({ mode: "study", count, practiceOnly: true })}>Prácticas guiadas ({practiceCount})</Button>}
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, md: 5 }}>
              <Card sx={{ bgcolor: "rgba(255,255,255,.98)" }}>
                <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
                  <Typography color="text.primary" variant="h5">
                    Configura tu siguiente intento
                  </Typography>
                  <Typography color="text.secondary" variant="body2" sx={{ mt: 0.5 }}>
                    Banco activo: {sourceName}
                  </Typography>
                  <FormControl fullWidth sx={{ mt: 2 }}>
                    <Typography component="label" htmlFor="included-bank" variant="body2" color="text.primary" fontWeight={700} sx={{ mb: 1 }}>Certificación</Typography>
                    <Select inputProps={{ id: "included-bank", "aria-label": "Certificación" }} value={includedBank} disabled={Boolean(activeSession)} onChange={(event) => selectIncludedBank(event.target.value as "ms700" | "ab900")}>
                      <MenuItem value="ms700">MS-700 · Microsoft Teams · Español</MenuItem>
                      <MenuItem value="ab900">AB-900 · Banco original</MenuItem>
                    </Select>
                    {activeSession && <Typography variant="caption" color="text.secondary">Finalice el intento activo para cambiar de certificación.</Typography>}
                  </FormControl>
                  {practiceCount > 0 && <Alert severity="info" sx={{ mt: 2 }}>{examCount} preguntas con calificación automática y {practiceCount} prácticas con autoevaluación. El examen aleatorio usa solo las preguntas calificables. El modo estudio incluye ambos tipos.</Alert>}
                  <Box sx={{ mt: 3 }}>
                    <Typography color="text.primary" variant="body2" fontWeight={700}>
                      Cantidad de preguntas
                    </Typography>
                    <FormControl fullWidth sx={{ mt: 1 }}>
                      <Select
                        value={count}
                        onChange={(event) =>
                          setCount(
                            event.target.value === "all"
                              ? "all"
                              : Number(event.target.value),
                          )
                        }
                      >
                        {[10, 20, 30, 40, 50].map((value) => (
                          <MenuItem key={value} value={value} disabled={value > bank.length}>
                            {value} preguntas
                          </MenuItem>
                        ))}
                        <MenuItem value="all">Todas las disponibles</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                  <FormControlLabel
                    sx={{ mt: 2, color: "text.primary", alignItems: "flex-start" }}
                    control={
                      <Switch
                        checked={settings.pearsonMode}
                        onChange={(_, checked) =>
                          updateSettings({ pearsonMode: checked })
                        }
                      />
                    }
                    label={
                      <Box sx={{ pt: 0.65 }}>
                        <Typography variant="body2" fontWeight={700}>
                          Modo Pearson VUE
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Oculta respuestas y explicaciones hasta el final.
                        </Typography>
                      </Box>
                    }
                  />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        {includedBank === "ms700" && <Alert severity="info" sx={{ mb: 3 }}>Guía MS-700 versión 35.2. Traducción automática al español con original en inglés disponible. Las figuras conservan el diseño original y ofrecen una transcripción traducida. Las claves corresponden a la guía aportada.</Alert>}
        {practiceCount > 0 && <Grid container spacing={2} sx={{ mb: 3 }}>
          {([
            { kind: "simulation" as const, title: "Laboratorios de Teams", text: "Describa los pasos y comandos. Consulte la solución y registre su revisión.", total: bank.filter(q => q.type === "practical" && q.practiceKind === "simulation").length },
            { kind: "visual" as const, title: "Ejercicios visuales", text: "Resuelva los HOTSPOT y las relaciones con las figuras originales y su texto en español.", total: bank.filter(q => q.type === "practical" && q.practiceKind !== "simulation").length },
          ]).map(item => <Grid key={item.kind} size={{ xs: 12, md: 6 }}><Card sx={{ height: "100%" }}><CardContent>
            <Chip size="small" label="Autoevaluación · sin puntos" sx={{ mb: 1.5 }} />
            <Typography variant="h5">{item.title}</Typography>
            <Typography color="text.secondary" sx={{ mt: 1, mb: 2 }}>{item.text}</Typography>
            <Button variant="outlined" disabled={!item.total} onClick={() => startExam({ mode: "study", count: "all", practiceOnly: true, practiceKind: item.kind })}>Practicar {item.total} ejercicios</Button>
          </CardContent></Card></Grid>)}
        </Grid>}
        {!bank.length && (
          <Alert severity="error" sx={{ mb: 3 }}>
            El banco no contiene preguntas válidas. Importe un archivo desde
            Banco de preguntas.
          </Alert>
        )}
        <Grid container spacing={2}>
          {[
            {
              icon: <BoltOutlined color="primary" />,
              value: bank.length,
              label: "preguntas disponibles",
            },
            {
              icon: <ShieldOutlined color="success" />,
              value: history.length,
              label: "intentos guardados",
            },
            {
              icon: <HistoryOutlined color="secondary" />,
              value: best ? `${best}/1000` : "—",
              label: "mejor resultado",
            },
          ].map((item) => (
            <Grid key={item.label} size={{ xs: 12, sm: 4 }}>
              <Card>
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box
                      sx={{
                        width: 46,
                        height: 46,
                        borderRadius: 2,
                        display: "grid",
                        placeItems: "center",
                        bgcolor: "action.hover",
                      }}
                    >
                      {item.icon}
                    </Box>
                    <Box>
                      <Typography variant="h5">{item.value}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.label}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
