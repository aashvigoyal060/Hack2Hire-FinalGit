import { jsPDF } from "jspdf";
import type { Interview, Message } from "@shared/schema";

type ReportScores = {
  accuracy: number;
  clarity: number;
  depth: number;
  relevance: number;
  timeEfficiency: number;
  total: number;
};

type ReportFeedback = {
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  readinessScore: number;
  verdict: string;
};

export function exportReportPdf(
  interview: Interview,
  messages: Message[],
  scores: ReportScores,
  feedback: ReportFeedback,
): void {
  const doc = new jsPDF();
  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const maxWidth = pageWidth - margin * 2;
  let y = margin;

  const ensureSpace = (height: number) => {
    if (y + height > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const addHeading = (text: string) => {
    ensureSpace(14);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(text, margin, y);
    y += 10;
  };

  const addParagraph = (text: string, indent = 0) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    const lines = doc.splitTextToSize(text, maxWidth - indent) as string[];
    for (const line of lines) {
      ensureSpace(7);
      doc.text(line, margin + indent, y);
      y += 6;
    }
    y += 2;
  };

  const addBulletList = (items: string[]) => {
    if (items.length === 0) {
      addParagraph("None recorded.");
      return;
    }
    for (const item of items) {
      addParagraph(`• ${item}`, 4);
    }
    y += 2;
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Interview Report", margin, y);
  y += 12;

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`Candidate: ${interview.candidateName}`, margin, y);
  y += 8;
  doc.text(`Date: ${new Date(interview.createdAt).toLocaleString()}`, margin, y);
  y += 12;

  addHeading("Overall Readiness");
  addParagraph(`Score: ${feedback.readinessScore}/100`);
  addParagraph(`Verdict: ${feedback.verdict}`);

  addHeading("Skill Breakdown");
  addParagraph(`Accuracy: ${scores.accuracy.toFixed(1)}/10`);
  addParagraph(`Clarity: ${scores.clarity.toFixed(1)}/10`);
  addParagraph(`Depth: ${scores.depth.toFixed(1)}/10`);
  addParagraph(`Relevance: ${scores.relevance.toFixed(1)}/10`);
  addParagraph(`Time Efficiency: ${scores.timeEfficiency.toFixed(1)}/10`);

  addHeading("Strengths");
  addBulletList(feedback.strengths);

  addHeading("Weaknesses");
  addBulletList(feedback.weaknesses);

  addHeading("Suggestions");
  addBulletList(feedback.suggestions);

  addHeading("Transcript");
  for (const msg of messages) {
    const role = msg.role === "assistant" ? "AI Interviewer" : "Candidate";
    ensureSpace(20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(`${role} — ${new Date(msg.createdAt).toLocaleTimeString()}`, margin, y);
    y += 7;

    addParagraph(msg.content);

    if (msg.analysis) {
      addParagraph(
        `Analysis (Score ${msg.analysis.structureScore}/10): ${msg.analysis.improvementSuggestion}`,
        4,
      );
    }

    y += 4;
  }

  const filename = `interview-report-${interview.candidateName.replace(/\s+/g, "-").toLowerCase()}.pdf`;
  doc.save(filename);
}
