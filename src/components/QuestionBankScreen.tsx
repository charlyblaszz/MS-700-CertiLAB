"use client";

import { ChangeEvent, useMemo, useRef, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Container,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Pagination,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  ExpandMore,
  Favorite,
  FavoriteBorder,
  FileUploadOutlined,
  RestartAltOutlined,
  Search,
  SchoolOutlined,
} from "@mui/icons-material";
import { CATEGORIES, QUESTION_TYPES, type Category, type QuestionType } from "@/src/types";
import {
  loadIncludedQuestionBank,
  parseQuestionBankFile,
} from "@/src/services/questionService";
import { useSimulatorStore } from "@/src/store/useSimulatorStore";
import { Figures, QuestionMaterial } from "@/src/components/QuestionMaterial";
import {
  correctAnswerLabel,
  getTypeLabel,
} from "@/src/utils/scoring";

const PAGE_SIZE = 25;

export function QuestionBankScreen() {
  const fileRef = useRef<HTMLInputElement>(null);
  const bank = useSimulatorStore((state) => state.bank);
  const includedBank = useSimulatorStore((state) => state.includedBank);
  const sourceName = useSimulatorStore((state) => state.bankSourceName);
  const warnings = useSimulatorStore((state) => state.bankWarnings);
  const customBank = useSimulatorStore((state) => state.customBank);
  const favorites = useSimulatorStore((state) => state.favorites);
  const importBank = useSimulatorStore((state) => state.importBank);
  const restoreDefaultBank = useSimulatorStore((state) => state.restoreDefaultBank);
  const toggleFavorite = useSimulatorStore((state) => state.toggleFavorite);
  const startExam = useSimulatorStore((state) => state.startExam);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category | "all">("all");
  const [type, setType] = useState<QuestionType | "all">("all");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState<{ severity: "success" | "error" | "info"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return bank.filter((question) => {
      if (category !== "all" && question.category !== category) return false;
      if (type !== "all" && question.type !== type) return false;
      if (favoritesOnly && !favorites.includes(question.id)) return false;
      if (!needle) return true;
      const haystack = [
        question.prompt,
        question.topic,
        question.category,
        getTypeLabel(question.type),
        correctAnswerLabel(question),
        question.explanation,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [bank, category, favorites, favoritesOnly, search, type]);

  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const resetPage = () => setPage(1);

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setBusy(true);
    const result = await parseQuestionBankFile(file);
    if (!result.questions.length) {
      setMessage({ severity: "error", text: result.warnings.join(" ") });
      setBusy(false);
      return;
    }
    try {
      importBank(result.questions, result.warnings, result.sourceName);
      setMessage({
        severity: "success",
        text: `Se importaron ${result.questions.length} preguntas. ${result.warnings.length ? `${result.warnings.length} elemento(s) requieren revisión.` : "El formato es válido."}`,
      });
      resetPage();
    } catch {
      setMessage({
        severity: "error",
        text: "El banco es demasiado grande para el almacenamiento local disponible. Divídalo en archivos más pequeños o libere datos del navegador.",
      });
    } finally {
      setBusy(false);
    }
  };

  const handleRestore = async () => {
    setBusy(true);
    const result = await loadIncludedQuestionBank(includedBank);
    if (!result.questions.length) {
      setMessage({ severity: "error", text: result.warnings.join(" ") });
      setBusy(false);
      return;
    }
    restoreDefaultBank(result.questions);
    setMessage({ severity: "info", text: `Se restauró el banco incluido de ${result.questions.length} preguntas.` });
    setBusy(false);
    resetPage();
  };

  return (
    <Container component="main" maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h3">Banco de preguntas</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            {bank.length.toLocaleString("es-MX")} preguntas · {sourceName}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="flex-start" flexWrap="wrap" useFlexGap>
          <input ref={fileRef} hidden type="file" accept="application/json,.json" onChange={handleImport} />
          <Button variant="outlined" startIcon={<FileUploadOutlined />} onClick={() => fileRef.current?.click()} disabled={busy}>
            Importar banco JSON
          </Button>
          {customBank && (
            <Button startIcon={<RestartAltOutlined />} onClick={handleRestore} disabled={busy}>
              Restaurar banco incluido
            </Button>
          )}
          <Button
            variant="contained"
            startIcon={<SchoolOutlined />}
            disabled={!filtered.length}
            onClick={() => startExam({ mode: "study", count: "all", questionIds: filtered.map((item) => item.id) })}
          >
            Practicar filtradas ({filtered.length})
          </Button>
        </Stack>
      </Stack>

      {message && <Alert severity={message.severity} onClose={() => setMessage(null)} sx={{ mb: 2 }}>{message.text}</Alert>}
      {warnings.length > 0 && (
        <Accordion sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography fontWeight={700}>{warnings.length} advertencia(s) de formato</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={0.75}>
              {warnings.slice(0, 50).map((warning, index) => (
                <Alert key={`${warning}-${index}`} severity="warning" icon={false}>{warning}</Alert>
              ))}
              {warnings.length > 50 && <Typography variant="body2">Se muestran las primeras 50 advertencias.</Typography>}
            </Stack>
          </AccordionDetails>
        </Accordion>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, lg: 5 }}>
              <TextField
                fullWidth
                value={search}
                onChange={(event) => { setSearch(event.target.value); resetPage(); }}
                placeholder="Buscar por palabra, respuesta, tipo o tema…"
                slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search /></InputAdornment> } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 2.5 }}>
              <FormControl fullWidth>
                <Select value={category} onChange={(event) => { setCategory(event.target.value as Category | "all"); resetPage(); }}>
                  <MenuItem value="all">Todas las categorías</MenuItem>
                  {CATEGORIES.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 2.5 }}>
              <FormControl fullWidth>
                <Select value={type} onChange={(event) => { setType(event.target.value as QuestionType | "all"); resetPage(); }}>
                  <MenuItem value="all">Todos los tipos</MenuItem>
                  {QUESTION_TYPES.map((item) => <MenuItem key={item} value={item}>{getTypeLabel(item)}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, lg: 2 }}>
              <FormControlLabel
                control={<Checkbox checked={favoritesOnly} onChange={(_, checked) => { setFavoritesOnly(checked); resetPage(); }} />}
                label="Solo favoritos"
              />
            </Grid>
          </Grid>
          <Stack direction="row" spacing={1} sx={{ mt: 2 }} flexWrap="wrap" useFlexGap>
            {CATEGORIES.map((item) => {
              const count = bank.filter((question) => question.category === item).length;
              if (!count) return null;
              return (
                <Chip
                  key={item}
                  clickable
                  color={category === item ? "primary" : "default"}
                  variant={category === item ? "filled" : "outlined"}
                  label={`${item} · ${count}`}
                  onClick={() => { setCategory(category === item ? "all" : item); resetPage(); }}
                />
              );
            })}
          </Stack>
        </CardContent>
      </Card>

      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
        <Typography color="text.secondary">{filtered.length.toLocaleString("es-MX")} coincidencias</Typography>
        {totalPages > 1 && <Pagination page={page} count={totalPages} onChange={(_, value) => setPage(value)} />}
      </Stack>

      {!visible.length ? (
        <Alert severity="info">No se encontraron preguntas con estos filtros.</Alert>
      ) : (
        visible.map((question, index) => (
          <Accordion key={question.id} disableGutters>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ width: "100%", minWidth: 0 }}>
                <Typography color="text.secondary" sx={{ minWidth: 34 }}>
                  {(page - 1) * PAGE_SIZE + index + 1}
                </Typography>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography fontWeight={700} sx={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {question.prompt}
                  </Typography>
                  <Stack direction="row" spacing={0.75} sx={{ mt: 0.75 }}>
                    <Chip size="small" label={question.category} />
                    <Chip size="small" variant="outlined" label={getTypeLabel(question.type)} />
                  </Stack>
                </Box>
                <Tooltip title={favorites.includes(question.id) ? "Quitar favorito" : "Agregar favorito"}>
                  <IconButton
                    color={favorites.includes(question.id) ? "error" : "default"}
                    onClick={(event) => { event.stopPropagation(); toggleFavorite(question.id); }}
                  >
                    {favorites.includes(question.id) ? <Favorite /> : <FavoriteBorder />}
                  </IconButton>
                </Tooltip>
              </Stack>
            </AccordionSummary>
            <AccordionDetails>
              <Typography sx={{ whiteSpace: "pre-wrap", mb: 2 }}>{question.prompt}</Typography>
              <QuestionMaterial question={question} />
              {(question.type === "multiple_choice" || question.type === "multiple_choice_multi_select") && question.options.map((option) => <Typography key={option.id} sx={{ my: 1 }}>{option.id}. {option.label}</Typography>)}
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 7 }}>
                  <Typography variant="body2" fontWeight={700}>Tema inferido</Typography>
                  <Typography variant="body2" color="text.secondary">{question.topic}</Typography>
                  <Typography variant="body2" fontWeight={700} sx={{ mt: 2 }}>Explicación</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{question.explanation}</Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 5 }}>
                  <Alert severity="success" icon={false}>
                    <Typography variant="body2" fontWeight={700}>Respuesta correcta</Typography>
                    <Typography variant="body2">{correctAnswerLabel(question)}</Typography>
                  </Alert>
                </Grid>
              </Grid>
              <Figures figures={question.solutionFigures} solution />
            </AccordionDetails>
          </Accordion>
        ))
      )}

      {totalPages > 1 && (
        <Pagination page={page} count={totalPages} onChange={(_, value) => { setPage(value); window.scrollTo({ top: 0, behavior: "smooth" }); }} sx={{ mt: 3, "& .MuiPagination-ul": { justifyContent: "center" } }} />
      )}
    </Container>
  );
}
