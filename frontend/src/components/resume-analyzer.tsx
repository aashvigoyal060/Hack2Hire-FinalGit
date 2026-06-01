import { useRef, useState } from "react";
import { useAnalyzeResume } from "@/hooks/use-features";
import type { ResumeAnalysis } from "@shared/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FileUp, Loader2, CheckCircle2, XCircle, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Props = {
  jobDescription?: string;
  onResumeText?: (text: string, skills: string[]) => void;
};

export default function ResumeAnalyzer({ jobDescription = "", onResumeText }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [jd, setJd] = useState(jobDescription);
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const analyze = useAnalyzeResume();
  const { toast } = useToast();

  const runAnalyze = (file?: File) => {
    analyze.mutate(
      { file, jobDescription: jd },
      {
        onSuccess: (data) => {
          setAnalysis(data.analysis);
          onResumeText?.(data.resumeText, data.analysis.extractedSkills);
          toast({ title: "Resume analyzed", description: `ATS score: ${data.analysis.atsScore}/100` });
        },
        onError: (e) =>
          toast({ variant: "destructive", title: "Analysis failed", description: e.message }),
      },
    );
  };

  return (
    <Card className="glass-card border-border/60">
      <CardHeader>
        <CardTitle className="font-display flex items-center gap-2 text-xl">
          <FileUp className="w-5 h-5 text-primary" />
          Resume PDF & ATS Check
        </CardTitle>
        <CardDescription>
          Upload your resume PDF for ATS score, keyword gaps, and interview readiness.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) runAnalyze(file);
          }}
        />
        <Textarea
          placeholder="Optional: paste target job description for better ATS match..."
          className="min-h-[72px] bg-background/60 text-sm"
          value={jd}
          onChange={(e) => setJd(e.target.value)}
        />
        <Button
          type="button"
          variant="secondary"
          className="w-full gap-2"
          disabled={analyze.isPending}
          onClick={() => fileRef.current?.click()}
        >
          {analyze.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <FileUp className="w-4 h-4" />
          )}
          Upload PDF & Analyze
        </Button>

        {analysis && (
          <div className="space-y-4 pt-2 border-t border-border/60">
            <div className="grid sm:grid-cols-2 gap-4">
              <ScoreBlock label="ATS Score" value={analysis.atsScore} />
              <ScoreBlock label="Interview Readiness" value={analysis.interviewReadinessScore} />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={analysis.isInterviewReady ? "default" : "secondary"}>
                {analysis.isInterviewReady ? (
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                ) : (
                  <XCircle className="w-3 h-3 mr-1" />
                )}
                {analysis.verdict}
              </Badge>
              <Badge variant="outline">
                {analysis.isInterviewReady ? "Interview ready" : "Not ready yet"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{analysis.summary}</p>
            <KeywordSection title="Matched keywords" items={analysis.matchedKeywords} variant="good" />
            <KeywordSection title="Missing keywords" items={analysis.missingKeywords} variant="warn" />
            <ListSection title="Strengths" items={analysis.strengths} />
            <ListSection title="Improvements" items={analysis.improvements} />
            {analysis.extractedSkills.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                {analysis.extractedSkills.map((s) => (
                  <Badge key={s} variant="secondary" className="text-xs">
                    {s}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ScoreBlock({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-bold text-primary">{value}/100</span>
      </div>
      <Progress value={value} className="h-2" />
    </div>
  );
}

function KeywordSection({
  title,
  items,
  variant,
}: {
  title: string;
  items: string[];
  variant: "good" | "warn";
}) {
  if (!items.length) return null;
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">{title}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((k) => (
          <Badge
            key={k}
            variant="outline"
            className={variant === "good" ? "border-green-500/40 text-green-600 dark:text-green-400" : "border-amber-500/40 text-amber-600 dark:text-amber-400"}
          >
            {k}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function ListSection({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">{title}</p>
      <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
