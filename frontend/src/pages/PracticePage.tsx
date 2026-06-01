import { useState } from "react";
import { motion } from "framer-motion";
import { useLeetcodePractice, useTechQuiz } from "@/hooks/use-features";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Brain, Code2, Loader2, ExternalLink, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { QuizQuestion, LeetcodeProblem } from "@shared/types";
import { cn } from "@/lib/utils";

export default function PracticePage() {
  const [skills, setSkills] = useState("React, JavaScript, Node.js, SQL");
  const [jobDescription, setJobDescription] = useState("");
  const [difficulty, setDifficulty] = useState<"Easy" | "Medium" | "Hard" | "Mixed">("Mixed");
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [leetcodeProblems, setLeetcodeProblems] = useState<LeetcodeProblem[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});

  const quiz = useTechQuiz();
  const leetcode = useLeetcodePractice();
  const { toast } = useToast();

  const skillList = skills.split(/[,;]+/).map((s) => s.trim()).filter(Boolean);

  const generateQuiz = () => {
    quiz.mutate(
      { skills: skillList, jobDescription, count: 5 },
      {
        onSuccess: (data) => {
          setQuizQuestions(data.questions);
          setSelectedAnswers({});
          setRevealed({});
        },
        onError: (e) => toast({ variant: "destructive", title: "Quiz failed", description: e.message }),
      },
    );
  };

  const generateLeetcode = () => {
    leetcode.mutate(
      { skills: skillList, jobDescription, count: 5, difficulty },
      {
        onSuccess: (data) => setLeetcodeProblems(data.problems),
        onError: (e) =>
          toast({ variant: "destructive", title: "Failed to load problems", description: e.message }),
      },
    );
  };

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 mesh-gradient" />
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-4xl font-display font-bold mb-2">Skill Practice</h1>
          <p className="text-muted-foreground">
            Random tech quizzes and LeetCode-style problems based on your skillset.
          </p>
        </motion.div>

        <Card className="glass-card mb-8">
          <CardHeader>
            <CardTitle className="text-lg font-display">Your skillset</CardTitle>
            <CardDescription>Comma-separated skills from your resume or target role.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="Python, React, System Design..."
              className="bg-background/60"
            />
            <Textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Optional job description for tailored questions..."
              className="min-h-[80px] bg-background/60"
            />
          </CardContent>
        </Card>

        <Tabs defaultValue="quiz" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="quiz" className="gap-2">
              <Brain className="w-4 h-4" /> Tech Quiz
            </TabsTrigger>
            <TabsTrigger value="leetcode" className="gap-2">
              <Code2 className="w-4 h-4" /> LeetCode Practice
            </TabsTrigger>
          </TabsList>

          <TabsContent value="quiz" className="space-y-4">
            <Button onClick={generateQuiz} disabled={quiz.isPending || skillList.length === 0} className="gap-2">
              {quiz.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
              Generate random quiz
            </Button>
            {quizQuestions.map((q) => (
              <Card key={q.id} className="glass-card">
                <CardHeader className="pb-2">
                  <Badge variant="secondary" className="w-fit">{q.topic}</Badge>
                  <CardTitle className="text-base font-medium leading-snug">{q.question}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {q.options.map((opt, idx) => {
                    const selected = selectedAnswers[q.id] === idx;
                    const showResult = revealed[q.id];
                    const isCorrect = q.correctIndex === idx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setSelectedAnswers((prev) => ({ ...prev, [q.id]: idx }));
                          setRevealed((prev) => ({ ...prev, [q.id]: true }));
                        }}
                        className={cn(
                          "w-full text-left p-3 rounded-xl border text-sm transition-colors",
                          showResult && isCorrect && "border-green-500/50 bg-green-500/10",
                          showResult && selected && !isCorrect && "border-destructive/50 bg-destructive/10",
                          !showResult && selected && "border-primary bg-primary/10",
                          !showResult && !selected && "border-border hover:bg-muted/50",
                        )}
                      >
                        {opt}
                        {showResult && isCorrect && (
                          <CheckCircle2 className="w-4 h-4 inline ml-2 text-green-500" />
                        )}
                      </button>
                    );
                  })}
                  {revealed[q.id] && (
                    <p className="text-sm text-muted-foreground pt-2 border-t">{q.explanation}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="leetcode" className="space-y-4">
            <div className="flex flex-wrap gap-3 items-center">
              <Select value={difficulty} onValueChange={(v) => setDifficulty(v as typeof difficulty)}>
                <SelectTrigger className="w-[140px] bg-background/60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["Easy", "Medium", "Hard", "Mixed"] as const).map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={generateLeetcode}
                disabled={leetcode.isPending || skillList.length === 0}
                className="gap-2"
              >
                {leetcode.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Code2 className="w-4 h-4" />
                )}
                Generate problems
              </Button>
            </div>
            {leetcodeProblems.map((p) => (
              <Card key={p.id} className="glass-card">
                <CardHeader>
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-lg font-display">{p.title}</CardTitle>
                    <Badge variant="outline">{p.difficulty}</Badge>
                    {p.topics.map((t) => (
                      <Badge key={t} variant="secondary" className="text-xs">
                        {t}
                      </Badge>
                    ))}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm leading-relaxed">{p.description}</p>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Hint:</span> {p.hint}
                  </p>
                  {p.leetcodeUrl && (
                    <a
                      href={p.leetcodeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      Open on LeetCode <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}
