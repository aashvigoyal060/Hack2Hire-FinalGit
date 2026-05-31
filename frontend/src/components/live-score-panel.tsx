import { Progress } from "@/components/ui/progress";
import type { Message } from "@shared/schema";
import { TrendingUp } from "lucide-react";

interface LiveScorePanelProps {
  messages: Message[];
  questionIndex: number;
  maxQuestions?: number;
}

export default function LiveScorePanel({
  messages,
  questionIndex,
  maxQuestions = 7,
}: LiveScorePanelProps) {
  const analyzed = messages.filter((m) => m.role === "user" && m.analysis);
  const avgScore =
    analyzed.length > 0
      ? analyzed.reduce((sum, m) => sum + (m.analysis?.totalScore ?? 0), 0) /
        analyzed.length
      : null;

  const progress = Math.min(100, (questionIndex / maxQuestions) * 100);

  return (
    <div className="rounded-xl border border-border/60 bg-card/80 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5" /> Live Progress
        </span>
        <span className="text-xs font-medium text-primary">
          Q{Math.max(questionIndex, 1)} / ~{maxQuestions}
        </span>
      </div>
      <Progress value={progress} className="h-2" />
      {avgScore !== null ? (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Avg answer score</span>
          <span className="font-bold text-primary">{avgScore.toFixed(1)}/10</span>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Answer questions to see live scoring.</p>
      )}
    </div>
  );
}
