"use client";

import { useMemo } from "react";
import {
  Alert,
  Box,
  Checkbox,
  Chip,
  FormControl,
  FormControlLabel,
  FormGroup,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  TextField,
} from "@mui/material";
import type { Question, UserAnswer } from "@/src/types";
import { hashString, seededShuffle } from "@/src/utils/random";
import { scoreQuestion } from "@/src/utils/scoring";
import { Figures, QuestionMaterial } from "@/src/components/QuestionMaterial";

interface QuestionRendererProps {
  question: Question;
  answer: UserAnswer;
  onAnswer: (answer: UserAnswer) => void;
  revealed: boolean;
  seed: number;
  shuffleOptions: boolean;
}

const answerRecord = (answer: UserAnswer) =>
  answer && !Array.isArray(answer) && typeof answer === "object"
    ? answer
    : {};

export function QuestionRenderer({
  question,
  answer,
  onAnswer,
  revealed,
  seed,
  shuffleOptions,
}: QuestionRendererProps) {
  const questionSeed = seed ^ hashString(question.id);
  const score = revealed ? scoreQuestion(question, answer) : null;

  const shuffledChoiceOptions = useMemo(() => {
    if (
      question.type !== "multiple_choice" &&
      question.type !== "multiple_choice_multi_select"
    )
      return [];
    return shuffleOptions
      ? seededShuffle(question.options, questionSeed)
      : question.options;
  }, [question, questionSeed, shuffleOptions]);

  const optionPaperSx = (optionId: string, selected: boolean) => {
    if (!revealed) {
      return {
        borderColor: selected ? "primary.main" : "divider",
        bgcolor: selected ? "action.selected" : "background.paper",
      };
    }
    const correct =
      question.type === "multiple_choice"
        ? question.correctAnswer === optionId
        : question.type === "multiple_choice_multi_select"
          ? question.correctAnswers.includes(optionId)
          : false;
    if (correct)
      return { borderColor: "success.main", bgcolor: "success.main", color: "white" };
    if (selected)
      return { borderColor: "error.main", bgcolor: "error.main", color: "white" };
    return { opacity: 0.72 };
  };

  let content;
  if (question.type === "multiple_choice") {
    content = (
      <RadioGroup
        value={typeof answer === "string" ? answer : ""}
        onChange={(_, value) => onAnswer(value)}
      >
        <Stack spacing={1.25}>
          {shuffledChoiceOptions.map((option) => {
            const selected = answer === option.id;
            return (
              <Paper key={option.id} variant="outlined" sx={{ px: 1.5, py: 0.5, ...optionPaperSx(option.id, selected) }}>
                <FormControlLabel
                  value={option.id}
                  control={<Radio sx={{ color: "inherit" }} />}
                  label={<Typography>{option.label}</Typography>}
                  sx={{ width: "100%", m: 0 }}
                />
              </Paper>
            );
          })}
        </Stack>
      </RadioGroup>
    );
  } else if (question.type === "multiple_choice_multi_select") {
    const selected = Array.isArray(answer) ? answer : [];
    content = (
      <>
        <Alert severity="info" icon={false} sx={{ mb: 2 }}>
          Seleccione todas las respuestas correctas. La coincidencia debe ser exacta.
        </Alert>
        <FormGroup>
          <Stack spacing={1.25}>
            {shuffledChoiceOptions.map((option) => {
              const checked = selected.includes(option.id);
              return (
                <Paper key={option.id} variant="outlined" sx={{ px: 1.5, py: 0.5, ...optionPaperSx(option.id, checked) }}>
                  <FormControlLabel
                    control={<Checkbox checked={checked} sx={{ color: "inherit" }} />}
                    onChange={() =>
                      onAnswer(
                        checked
                          ? selected.filter((id) => id !== option.id)
                          : [...selected, option.id],
                      )
                    }
                    label={<Typography>{option.label}</Typography>}
                    sx={{ width: "100%", m: 0 }}
                  />
                </Paper>
              );
            })}
          </Stack>
        </FormGroup>
      </>
    );
  } else if (question.type === "true_false_group") {
    const record = answerRecord(answer);
    content = (
      <TableContainer component={Paper} variant="outlined">
        <Table sx={{ minWidth: 520 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: "action.hover" }}>
              <TableCell sx={{ fontWeight: 700 }}>Afirmación</TableCell>
              <TableCell align="center" width={90} sx={{ fontWeight: 700 }}>Sí</TableCell>
              <TableCell align="center" width={90} sx={{ fontWeight: 700 }}>No</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {question.rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <Typography variant="body2">{row.statement}</Typography>
                  {revealed && (
                    <Chip
                      size="small"
                      sx={{ mt: 1 }}
                      color={record[row.id] === row.correctAnswer ? "success" : "error"}
                      label={`Respuesta: ${row.correctAnswer ? "Sí" : "No"}`}
                    />
                  )}
                </TableCell>
                {[true, false].map((value) => (
                  <TableCell key={String(value)} align="center">
                    <Radio
                      checked={record[row.id] === value}
                      onChange={() => onAnswer({ ...record, [row.id]: value })}
                      inputProps={{ "aria-label": `${row.statement}: ${value ? "Sí" : "No"}` }}
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  } else if (question.type === "dropdown_selection") {
    const options = shuffleOptions
      ? seededShuffle(question.options, questionSeed)
      : question.options;
    content = (
      <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, bgcolor: "action.hover" }}>
        <Typography variant="h6" sx={{ mb: 2, lineHeight: 1.55 }}>
          {question.sentence}
        </Typography>
        <FormControl fullWidth>
          <Select
            displayEmpty
            value={typeof answer === "string" ? answer : ""}
            onChange={(event) => onAnswer(event.target.value)}
          >
            <MenuItem value="" disabled>Seleccione una respuesta</MenuItem>
            {options.map((option) => (
              <MenuItem key={option} value={option}>{option}</MenuItem>
            ))}
          </Select>
        </FormControl>
        {revealed && (
          <Alert severity={answer === question.correctAnswer ? "success" : "error"} sx={{ mt: 2 }}>
            Respuesta correcta: {question.correctAnswer}
          </Alert>
        )}
      </Paper>
    );
  } else if (question.type === "practical") {
    const record = answerRecord(answer);
    content = <Stack spacing={2}>
      <Chip label={question.practiceKind === "simulation" ? "Laboratorio de procedimiento" : question.practiceKind === "hotspot" ? "HOTSPOT · práctica visual" : "Relación de elementos · práctica visual"} sx={{ alignSelf: "flex-start" }} />
      <Alert severity="info">
        {question.practiceKind === "simulation" ? "Ejercicio de procedimiento: describa los pasos que realizaría en Teams. Este espacio no se conecta a un entorno de Microsoft 365." : "Ejercicio visual: consulte la figura y escriba sus selecciones en orden."}
        {" "}Después, muestre la solución y compare su respuesta. Esta práctica se registra por separado y no suma puntos al examen.
      </Alert>
      <TextField multiline minRows={5} fullWidth label={question.practiceKind === "simulation" ? "Mi procedimiento y comandos" : "Mis selecciones o relaciones"} value={typeof record.notes === "string" ? record.notes : ""} onChange={(event) => onAnswer({ notes: event.target.value, reviewed: false })} helperText="Escriba su respuesta antes de consultar la solución." />
      {revealed && <FormControlLabel control={<Checkbox checked={record.reviewed === true} disabled={typeof record.notes !== "string" || !record.notes.trim()} onChange={(_, checked) => onAnswer({ ...record, reviewed: checked })} />} label="Comparé mi respuesta con la solución de la guía" />}
    </Stack>;
  } else {
    const record = answerRecord(answer);
    content = (
      <TableContainer component={Paper} variant="outlined">
        <Table sx={{ minWidth: 620 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: "action.hover" }}>
              <TableCell sx={{ fontWeight: 700 }}>Elemento / requisito</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Respuesta relacionada</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {question.rows.map((row, index) => {
              const options = shuffleOptions
                ? seededShuffle(row.options, questionSeed + index)
                : row.options;
              return (
                <TableRow key={row.id}>
                  <TableCell sx={{ width: "58%" }}>{row.prompt}</TableCell>
                  <TableCell>
                    <FormControl fullWidth size="small">
                      <Select
                        displayEmpty
                        value={typeof record[row.id] === "string" ? record[row.id] : ""}
                        onChange={(event) => onAnswer({ ...record, [row.id]: event.target.value })}
                      >
                        <MenuItem value="" disabled>Seleccione</MenuItem>
                        {options.map((option) => (
                          <MenuItem key={option} value={option}>{option}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    {revealed && (
                      <Typography
                        variant="caption"
                        color={record[row.id] === row.correctAnswer ? "success.main" : "error.main"}
                        sx={{ display: "block", mt: 0.75, fontWeight: 700 }}
                      >
                        Correcta: {row.correctAnswer}
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }

  return (
    <Box>
      <QuestionMaterial question={question} />
      {content}
      {revealed && score && (
        <Alert severity={question.type === "practical" ? "info" : score.isCorrect ? "success" : "warning"} sx={{ mt: 2.5 }}>
          <Typography fontWeight={750}>
            {question.type === "practical" ? "Solución de la guía · autoevaluación" : score.isCorrect
              ? "Respuesta correcta"
              : `Resultado parcial: ${Math.round(score.score * 100)}%`}
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
            {question.explanation}
          </Typography>
        </Alert>
      )}
      {revealed && <Figures figures={question.solutionFigures} solution />}
    </Box>
  );
}
