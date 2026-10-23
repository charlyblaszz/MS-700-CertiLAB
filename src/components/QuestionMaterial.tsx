import { useState } from "react";
import { Accordion, AccordionDetails, AccordionSummary, Box, Typography, Stack, Dialog, DialogTitle, DialogContent, Button } from "@mui/material";
import { ExpandMore } from "@mui/icons-material";
import type { Question, QuestionFigure } from "@/src/types";

export function Figures({ figures, solution = false }: { figures?: QuestionFigure[]; solution?: boolean }) {
  const [expanded, setExpanded] = useState<number | null>(null);
  if (!figures?.length) return null;
  return <Stack spacing={2} sx={{ my: 2 }}>
    {figures.map((figure, index) => <Box component="figure" key={figure.src} sx={{ m: 0 }}>
      <Box component="button" type="button" onClick={() => setExpanded(index)} aria-label={`Ampliar ${solution ? "solución" : "figura"} ${index + 1}`} sx={{ display: "block", p: 0, maxWidth: "100%", border: 0, bgcolor: "transparent", cursor: "zoom-in" }}>
        <Box component="img" src={figureSource(figure.src)} loading="lazy" alt={`${solution ? "Respuesta gráfica" : "Figura del ejercicio"} ${index + 1}, página ${figure.page} del PDF original`} sx={{ display: "block", maxWidth: "100%", maxHeight: 800, height: "auto", border: 1, borderColor: "divider", bgcolor: "white" }} />
      </Box>
      <Typography component="figcaption" variant="caption" color="text.secondary">Figura original · página {figure.page} · pulse para ampliar</Typography>
      {figure.caption && <Accordion disableGutters elevation={0} sx={{ border: 1, borderColor: "divider", mt: 1 }}>
        <AccordionSummary expandIcon={<ExpandMore />}><Typography variant="body2">Texto de la figura en español</Typography></AccordionSummary>
        <AccordionDetails>
          <Typography variant="caption" color="text.secondary">Lectura y traducción automáticas; coteje los valores y las marcas con la figura.</Typography>
          <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", mt: 1 }}>{figure.caption}</Typography>
        </AccordionDetails>
      </Accordion>}
    </Box>)}
    <Dialog open={expanded !== null} onClose={() => setExpanded(null)} maxWidth="lg" fullWidth>
      <DialogTitle><Stack direction="row" justifyContent="space-between" alignItems="center"><Typography component="span" fontWeight={700}>Figura original · página {expanded !== null ? figures[expanded]?.page : ""}</Typography><Button onClick={() => setExpanded(null)}>Cerrar</Button></Stack></DialogTitle>
      <DialogContent>{expanded !== null && figures[expanded] && <Box component="img" src={figureSource(figures[expanded].src)} alt="Figura ampliada del PDF" sx={{ display: "block", width: "100%", height: "auto", bgcolor: "white" }} />}</DialogContent>
    </Dialog>
  </Stack>;
}

function figureSource(src: string): string {
  return (globalThis as typeof globalThis & { __CERTLAB_FIGURES__?: Record<string, string> }).__CERTLAB_FIGURES__?.[src] ?? src;
}

export function QuestionMaterial({ question }: { question: Question }) {
  return <>
    {question.sourcePages?.length ? <Typography variant="caption" color="text.secondary">MS-700 · pregunta {question.sourceId} · páginas {question.sourcePages.join(", ")}</Typography> : null}
    {question.translationNote && <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>{question.translationNote}</Typography>}
    {question.context && <Accordion sx={{ my: 2 }} disableGutters>
      <AccordionSummary expandIcon={<ExpandMore />}><Typography fontWeight={700}>Caso práctico: información del escenario</Typography></AccordionSummary>
      <AccordionDetails><Typography sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{question.context}</Typography></AccordionDetails>
    </Accordion>}
    {question.originalText && <Accordion disableGutters elevation={0} sx={{ my: 1 }}>
      <AccordionSummary expandIcon={<ExpandMore />}><Typography variant="body2">Consultar enunciado original en inglés</Typography></AccordionSummary>
      <AccordionDetails><Typography variant="body2" sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{question.originalText}</Typography></AccordionDetails>
    </Accordion>}
    <Figures figures={question.figures} />
  </>;
}
