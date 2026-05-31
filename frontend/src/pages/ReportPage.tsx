import { useRoute } from "wouter";
import { useState } from "react";
import { useInterview } from "@/hooks/use-interviews";
import { Loader2, CheckCircle2, XCircle, Lightbulb, TrendingUp, Download, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ScoreChart from "@/components/score-chart";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { exportReportPdf } from "@/lib/export-report-pdf";
import { useToast } from "@/hooks/use-toast";

export default function ReportPage() {
  const [match, params] = useRoute("/report/:id");
  const id = params?.id ? parseInt(params.id) : 0;
  const { data, isLoading, error } = useInterview(id);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  if (isLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (error || !data) return <div>Error loading report</div>;

  const { interview, messages } = data;
  const scores = interview.scores || { accuracy: 0, clarity: 0, depth: 0, relevance: 0, timeEfficiency: 0, total: 0 };
  const feedback = interview.feedback || { strengths: [], weaknesses: [], suggestions: [], readinessScore: 0, verdict: "Pending" };

  const handleExportPdf = () => {
    try {
      setIsExporting(true);
      exportReportPdf(interview, messages, scores, feedback);
      toast({
        title: "PDF exported",
        description: "Your interview report has been downloaded.",
      });
    } catch (err) {
      console.error("PDF export failed:", err);
      toast({
        variant: "destructive",
        title: "Export failed",
        description: "Could not generate the PDF. Please try again.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const getVerdictColor = (v: string) => {
    if (v?.toLowerCase().includes("strong") || v?.toLowerCase().includes("hire")) return "text-emerald-500 bg-emerald-500/10";
    if (v?.toLowerCase().includes("average")) return "text-amber-500 bg-amber-500/10";
    return "text-rose-500 bg-rose-500/10";
  };

  return (
    <div className="min-h-screen bg-muted/20 pb-20">
      <div className="relative overflow-hidden border-b border-border/60 bg-gradient-to-r from-primary/5 via-background to-accent/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <Link href="/" className="p-2 hover:bg-muted rounded-full transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-display font-bold">Interview Report</h1>
                    <p className="text-sm text-muted-foreground">
                      {interview.candidateName} · {new Date(interview.createdAt).toLocaleDateString()}
                    </p>
                </div>
            </div>
            <Button
              variant="outline"
              className="gap-2 glass-card"
              onClick={handleExportPdf}
              disabled={isExporting}
            >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Export PDF
            </Button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="grid md:grid-cols-3 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                <Card className="h-full glass-card overflow-hidden">
                    <div className="h-1 bg-gradient-to-r from-primary to-accent" />
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Overall Readiness</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <span className="text-6xl font-display font-bold gradient-text">{feedback.readinessScore}</span>
                            <span className="text-xl text-muted-foreground">/100</span>
                        </div>
                        <div className={`mt-4 inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${getVerdictColor(feedback.verdict)}`}>
                            {feedback.verdict}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="md:col-span-2">
                <Card className="h-full glass-card">
                    <CardHeader>
                        <CardTitle className="font-display">Skill Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ScoreChart scores={scores} />
                    </CardContent>
                </Card>
            </motion.div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
            <Card className="glass-card border-emerald-500/30">
                <CardHeader>
                    <CardTitle className="text-emerald-600 dark:text-emerald-400 flex items-center gap-2 font-display">
                        <CheckCircle2 className="w-5 h-5" /> Strengths
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-3">
                        {feedback.strengths.map((s, i) => (
                            <li key={i} className="flex gap-2 text-sm text-foreground/80">
                                <span className="block w-1.5 h-1.5 mt-1.5 rounded-full bg-emerald-500 shrink-0" />
                                {s}
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>

            <Card className="glass-card border-rose-500/30">
                <CardHeader>
                    <CardTitle className="text-rose-600 dark:text-rose-400 flex items-center gap-2 font-display">
                        <XCircle className="w-5 h-5" /> Weaknesses
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-3">
                        {feedback.weaknesses.map((w, i) => (
                            <li key={i} className="flex gap-2 text-sm text-foreground/80">
                                <span className="block w-1.5 h-1.5 mt-1.5 rounded-full bg-rose-500 shrink-0" />
                                {w}
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>

            <Card className="glass-card border-primary/30">
                <CardHeader>
                    <CardTitle className="text-primary flex items-center gap-2 font-display">
                        <Lightbulb className="w-5 h-5" /> Suggestions
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-3">
                        {feedback.suggestions.map((s, i) => (
                            <li key={i} className="flex gap-2 text-sm text-foreground/80">
                                <span className="block w-1.5 h-1.5 mt-1.5 rounded-full bg-primary shrink-0" />
                                {s}
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
        </div>

        {/* Transcript Review */}
        <Card className="glass-card">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display">
                    <TrendingUp className="w-5 h-5 text-muted-foreground" /> Transcript Analysis
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
                {messages.map((msg, idx) => (
                    <div key={msg.id} className="relative pl-6 border-l-2 border-muted hover:border-primary/50 transition-colors pb-6 last:pb-0">
                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-background border-2 border-muted-foreground/50" />
                        
                        <div className="flex items-center gap-2 mb-2">
                            <Badge variant={msg.role === 'assistant' ? 'default' : 'secondary'}>
                                {msg.role === 'assistant' ? 'AI Interviewer' : 'Candidate'}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                                {new Date(msg.createdAt).toLocaleTimeString()}
                            </span>
                        </div>

                        <div className="prose prose-sm dark:prose-invert max-w-none text-foreground/90 bg-muted/30 p-4 rounded-lg">
                            {msg.content}
                        </div>

                        {/* Show analysis for user messages if it exists attached to the NEXT message (usually) OR if we store it on the message itself. 
                            The schema stores analysis on the message itself. 
                            In this app flow, the analysis describes the PREVIOUS message.
                            So if this message has analysis, it's analyzing the previous message?
                            Actually, schema says `messages.analysis` describes the quality of THAT message (if user) or the feedback (if assistant).
                            Wait, usually the analysis is OF the user's answer.
                            Let's assume the backend puts the analysis on the ASSISTANT message that FOLLOWS the user message, describing the user message.
                            OR the backend puts it on the USER message itself.
                            Let's check schema: `messages` table has `analysis`.
                            Let's assume simplicity: if `msg.analysis` exists, render it.
                        */}
                        {msg.analysis && (
                            <div className="mt-3 bg-card border border-border rounded-lg p-4 shadow-sm">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-semibold text-primary">AI Analysis</span>
                                    <Badge variant="outline">Score: {msg.analysis.structureScore}/10</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">
                                    <span className="font-semibold text-foreground">Structure:</span> {msg.analysis.structure}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    <span className="font-semibold text-foreground">Suggestion:</span> {msg.analysis.improvementSuggestion}
                                </p>
                            </div>
                        )}
                    </div>
                ))}
            </CardContent>
        </Card>

      </main>
    </div>
  );
}
