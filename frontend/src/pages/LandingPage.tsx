import { useLocation } from "wouter";
import { useCreateInterview } from "@/hooks/use-interviews";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertInterviewSchema, type InsertInterview, type InterviewType } from "@shared/schema";
import { motion } from "framer-motion";
import {
  Bot, Sparkles, ArrowRight, Loader2, Briefcase, FileText, User,
  Mic, Timer, BarChart3, Target, Brain, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import InterviewHistory from "@/components/interview-history";

const formSchema = insertInterviewSchema;

const features = [
  { icon: Mic, title: "Voice Answers", desc: "Speak your responses with built-in speech-to-text." },
  { icon: Timer, title: "Timed Questions", desc: "120-second countdown mimics real interview pressure." },
  { icon: BarChart3, title: "Live Scoring", desc: "Track answer quality as the interview progresses." },
  { icon: Target, title: "JD-Aligned", desc: "Questions tailored to your resume and target role." },
];

const modes: { value: InterviewType; label: string; desc: string }[] = [
  { value: "mixed", label: "Mixed", desc: "Balanced behavioral + technical" },
  { value: "behavioral", label: "Behavioral", desc: "STAR method, soft skills" },
  { value: "technical", label: "Technical", desc: "Algorithms, coding concepts" },
  { value: "system-design", label: "System Design", desc: "Architecture & scalability" },
];

export default function LandingPage() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const createInterview = useCreateInterview();

  const form = useForm<InsertInterview>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      candidateName: "",
      resumeText: "",
      jobDescription: "",
      interviewType: "mixed",
    },
  });

  const onSubmit = (data: InsertInterview) => {
    createInterview.mutate(data, {
      onSuccess: (interview) => {
        toast({ title: "Interview Created", description: "Preparing your AI interviewer..." });
        setLocation(`/interview/${interview.id}`);
      },
      onError: (error) => {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to start interview.",
        });
      },
    });
  };

  return (
    <div className="relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 -z-10 mesh-gradient" />
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl -z-10 animate-pulse" />
      <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-accent/15 rounded-full blur-3xl -z-10" />

      {/* Hero + Form */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-card text-sm font-semibold text-primary">
              <Sparkles className="w-4 h-4" />
              AI-Powered Interview Prep
            </div>

            <h1 className="text-5xl md:text-6xl font-display font-bold leading-[1.1]">
              Land Your{" "}
              <span className="gradient-text">Dream Tech Role</span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
              Practice with an adaptive AI interviewer that analyzes your resume, targets your job description, and delivers real-time feedback on every answer.
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              {features.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="glass-card rounded-2xl p-4 hover:border-primary/30 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-display font-semibold">{title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{desc}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-6 pt-2">
              <div className="text-center">
                <div className="text-3xl font-display font-bold text-primary">120s</div>
                <div className="text-xs text-muted-foreground">Per Question</div>
              </div>
              <div className="w-px h-10 bg-border" />
              <div className="text-center">
                <div className="text-3xl font-display font-bold text-primary">5+</div>
                <div className="text-xs text-muted-foreground">Skill Metrics</div>
              </div>
              <div className="w-px h-10 bg-border" />
              <div className="text-center">
                <div className="text-3xl font-display font-bold text-primary">PDF</div>
                <div className="text-xs text-muted-foreground">Report Export</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
          >
            <Card className="glass-card border-border/60 shadow-2xl shadow-primary/10 overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-primary via-accent to-primary" />
              <CardHeader>
                <CardTitle className="text-2xl font-display flex items-center gap-2">
                  <Brain className="w-6 h-6 text-primary" />
                  Start a Session
                </CardTitle>
                <CardDescription>Configure your personalized mock interview.</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    <FormField
                      control={form.control}
                      name="candidateName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <User className="w-4 h-4 text-primary" /> Candidate Name
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" className="bg-background/60" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="interviewType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-primary" /> Interview Mode
                          </FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-background/60">
                                <SelectValue placeholder="Select mode" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {modes.map((m) => (
                                <SelectItem key={m.value} value={m.value}>
                                  <span className="font-medium">{m.label}</span>
                                  <span className="text-muted-foreground ml-2 text-xs">— {m.desc}</span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="resumeText"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-primary" /> Resume Content
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Summary, experience, skills..."
                              className="bg-background/60 min-h-[90px] resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription className="text-xs">Paste text from your resume.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="jobDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-primary" /> Job Description
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Role requirements, responsibilities..."
                              className="bg-background/60 min-h-[90px] resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg shadow-primary/25"
                      disabled={createInterview.isPending}
                    >
                      {createInterview.isPending ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Initializing AI...
                        </>
                      ) : (
                        <>
                          Start Interview <ArrowRight className="w-5 h-5 ml-2" />
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* History */}
      <section id="history" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-display font-bold">Session History</h2>
            <p className="text-sm text-muted-foreground">Resume past interviews or view completed reports.</p>
          </div>
        </div>
        <InterviewHistory />
      </section>
    </div>
  );
}
