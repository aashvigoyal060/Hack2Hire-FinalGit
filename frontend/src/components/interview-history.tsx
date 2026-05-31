import { Link } from "wouter";
import { useInterviewList } from "@/hooks/use-interviews";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowRight, Calendar, User } from "lucide-react";
import { motion } from "framer-motion";

const statusStyles: Record<string, string> = {
  completed: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  in_progress: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  pending: "bg-muted text-muted-foreground",
};

export default function InterviewHistory() {
  const { data, isLoading } = useInterviewList();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data?.length) {
    return (
      <Card className="border-dashed border-border/80 bg-card/50">
        <CardContent className="py-12 text-center text-muted-foreground">
          No past sessions yet. Start your first interview above.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {data.map((item, i) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.05 }}
        >
          <Link href={item.status === "completed" ? `/report/${item.id}` : `/interview/${item.id}`}>
            <Card className="group h-full border-border/60 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all cursor-pointer">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base font-display flex items-center gap-2">
                    <User className="w-4 h-4 text-primary shrink-0" />
                    {item.candidateName}
                  </CardTitle>
                  <Badge variant="secondary" className={statusStyles[item.status] ?? statusStyles.pending}>
                    {item.status.replace("_", " ")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">{item.jobDescription}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                  {item.feedback?.readinessScore != null && (
                    <span className="font-semibold text-primary">{item.feedback.readinessScore}/100</span>
                  )}
                </div>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-primary group-hover:gap-2 transition-all">
                  {item.status === "completed" ? "View report" : "Continue"}
                  <ArrowRight className="w-4 h-4" />
                </span>
              </CardContent>
            </Card>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
