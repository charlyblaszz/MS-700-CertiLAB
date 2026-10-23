import jsPDF from "jspdf";
import type { ExamResult } from "@/src/types";
import type { QuestionType } from "@/src/types";
import {
  correctAnswerLabel,
  getTypeLabel,
  userAnswerLabel,
} from "@/src/utils/scoring";
import { formatDuration } from "@/src/utils/formatting";

function downloadBlob(content: BlobPart, type: string, filename: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function exportHistoryAsJson(history: ExamResult[]) {
  downloadBlob(
    JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        application: "Microsoft Certification Simulator",
        attempts: history,
      },
      null,
      2,
    ),
    "application/json",
    `historial-simulador-${new Date().toISOString().slice(0, 10)}.json`,
  );
}

export function exportResultAsPdf(result: ExamResult) {
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 16;
  let y = 18;

  const addPageIfNeeded = (height = 12) => {
    if (y + height > pageHeight - 16) {
      pdf.addPage();
      y = 18;
    }
  };

  const write = (
    text: string,
    options: { size?: number; bold?: boolean; color?: [number, number, number] } = {},
  ) => {
    const size = options.size ?? 10;
    pdf.setFont("helvetica", options.bold ? "bold" : "normal");
    pdf.setFontSize(size);
    pdf.setTextColor(...(options.color ?? [32, 42, 59]));
    const lines = pdf.splitTextToSize(text, pageWidth - margin * 2) as string[];
    for (const line of lines) {
      addPageIfNeeded(size * 0.42 + 3);
      pdf.text(line, margin, y);
      y += size * 0.42;
    }
    y += 3;
  };

  pdf.setFillColor(15, 108, 189);
  pdf.rect(0, 0, pageWidth, 38, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.text("Microsoft Certification Simulator", margin, 17);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.text("Reporte de resultados", margin, 26);
  y = 48;

  write(
    result.maxScore ? `${result.percentage}% · ${result.microsoftScore}/1000 · ${result.passed ? "APROBADO" : "POR REFORZAR"}` : `PRACTICA GUIADA · ${result.completedPracticeCount ?? 0}/${result.practiceCount ?? 0} revisadas · Sin calificacion automatica`,
    { size: 17, bold: true, color: result.passed ? [16, 124, 65] : [180, 60, 40] },
  );
  write(
    `Puntaje bruto: ${result.rawScore}/${result.maxScore}  |  Correctas: ${result.correctCount}  |  Incorrectas: ${result.incorrectCount}  |  Sin responder: ${result.unansweredCount}`,
  );
  if (result.practiceCount) write(`Practicas guiadas: ${result.completedPracticeCount ?? 0}/${result.practiceCount} revisadas. No suman puntos al examen.`);
  write(
    `Fecha: ${new Date(result.completedAt).toLocaleString("es-MX")}  |  Duración: ${formatDuration(result.durationSeconds)}  |  Semilla: ${result.seed}`,
  );
  y += 3;
  write("Desglose por tipo", { size: 13, bold: true, color: [15, 108, 189] });
  result.typeBreakdown.forEach((item) =>
    write(`${getTypeLabel(item.key as QuestionType)}: ${item.percentage}%`),
  );

  y += 3;
  write("Revisión de respuestas", { size: 13, bold: true, color: [15, 108, 189] });
  result.details.forEach((detail, index) => {
    addPageIfNeeded(38);
    write(
      `${index + 1}. ${!detail.maxScore ? "Autoevaluacion sin puntos" : detail.isCorrect ? "Correcta" : "Incorrecta"} · ${detail.question.category}`,
      {
        bold: true,
        color: detail.isCorrect ? [16, 124, 65] : [180, 60, 40],
      },
    );
    write(detail.question.prompt, { bold: true });
    write(`Su respuesta: ${userAnswerLabel(detail.question, detail.userAnswer)}`);
    write(`Respuesta correcta: ${correctAnswerLabel(detail.question)}`);
    if (detail.question.type === "practical") {
      write(`Solucion de la guia: ${detail.question.explanation}`);
      if (detail.question.solutionFigures?.length) write('La solucion incluye figuras. Consultelas en el simulador o en las paginas indicadas del PDF original.');
    }
    if (detail.question.sourcePages?.length) write(`Paginas de la guia: ${detail.question.sourcePages.join(', ')}`);
    y += 2;
  });

  pdf.save(`resultado-simulador-${result.id}.pdf`);
}
