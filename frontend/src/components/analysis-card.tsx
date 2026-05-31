import { motion } from "framer-motion";
import { Message } from "@shared/schema";
import { CheckCircle2, XCircle, Lightbulb, Activity } from "lucide-react";

interface AnalysisCardProps {
  analysis: NonNullable<Message["analysis"]>;
}

export default function AnalysisCard({ analysis }: AnalysisCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
    if (score >= 5) return "text-amber-500 bg-amber-500/10 border-amber-500/20";
    return "text-rose-500 bg-rose-500/10 border-rose-500/20";
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      className="mt-1 overflow-hidden"
    >
      <div className="bg-muted/30 border border-border/50 rounded-xl p-4 text-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            <span className="font-semibold text-foreground">Response Analysis</span>
          </div>
          <span className={`px-2 py-0.5 rounded-md text-xs font-bold border ${getScoreColor(analysis.structureScore)}`}>
            Score: {analysis.structureScore}/10
          </span>
        </div>

        {/* Structure Detected */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-muted-foreground text-xs uppercase tracking-wider font-bold">Structure</span>
            <p className="font-medium text-foreground">{analysis.structure}</p>
          </div>
          {analysis.personalityType && (
            <div>
              <span className="text-muted-foreground text-xs uppercase tracking-wider font-bold">Tone</span>
              <p className="font-medium text-foreground">{analysis.personalityType}</p>
            </div>
          )}
        </div>

        {/* Feedback */}
        {analysis.missingComponents && analysis.missingComponents.length > 0 && (
            <div className="space-y-1">
                <span className="text-rose-500 text-xs font-semibold flex items-center gap-1">
                    <XCircle className="w-3 h-3" /> Missing Components
                </span>
                <p className="text-muted-foreground pl-4">
                    {analysis.missingComponents.join(", ")}
                </p>
            </div>
        )}

        <div className="bg-primary/5 rounded-lg p-3 border border-primary/10">
            <span className="text-primary text-xs font-semibold flex items-center gap-1 mb-1">
                <Lightbulb className="w-3 h-3" /> Suggestion
            </span>
            <p className="text-foreground/80 leading-snug">
                {analysis.improvementSuggestion}
            </p>
        </div>
      </div>
    </motion.div>
  );
}
