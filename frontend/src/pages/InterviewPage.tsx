import { useCallback, useEffect, useRef, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useInterview, useNextStep, useCompleteInterview } from "@/hooks/use-interviews";
import {
  Bot, Send, StopCircle, FileText, Briefcase, Loader2, User, Clock,
  AlertCircle, Mic, MicOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import ChatBubble from "@/components/chat-bubble";
import LiveScorePanel from "@/components/live-score-panel";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const MAX_TIME = 120;
const MAX_QUESTIONS = 7;

export default function InterviewPage() {
  const [match, params] = useRoute("/interview/:id");
  const [_, setLocation] = useLocation();
  const id = params?.id ? parseInt(params.id) : 0;

  const { data, isLoading, error } = useInterview(id);
  const nextStep = useNextStep();
  const completeInterview = useCompleteInterview();
  const { toast } = useToast();

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [timeLeft, setTimeLeft] = useState(MAX_TIME);
  const [questionStartTime, setQuestionStartTime] = useState<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const appendTranscript = useCallback((text: string) => {
    setInput((prev) => (prev ? `${prev} ${text}` : text));
  }, []);
  const { isListening, isSupported, toggle, stop } = useSpeechRecognition(appendTranscript);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [data?.messages, nextStep.isPending]);

  useEffect(() => {
    if (data && data.messages.length === 0 && !nextStep.isPending && !isLoading) {
      nextStep.mutate({ id });
    }
  }, [data, id, isLoading]);

  useEffect(() => {
    if (data?.interview.status === "completed" && !data.interview.feedback) {
      completeInterview.mutate(id, {
        onSuccess: () => setLocation(`/report/${id}`),
      });
    }
  }, [data?.interview.status, data?.interview.feedback, id]);

  useEffect(() => {
    if (nextStep.isPending || isLoading) {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      return;
    }

    const isUserTurn =
      data?.messages.length &&
      data.messages[data.messages.length - 1].role === "assistant" &&
      data.interview.status !== "completed";

    if (isUserTurn) {
      setTimeLeft(MAX_TIME);
      setQuestionStartTime(Date.now());

      timerIntervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            handleSubmit(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [data?.messages.length, nextStep.isPending, isLoading, data?.interview.status]);

  const finishAndReport = () => {
    completeInterview.mutate(id, {
      onSuccess: () => setLocation(`/report/${id}`),
      onError: () => toast({ variant: "destructive", title: "Failed to generate report" }),
    });
  };

  const handleSubmit = (isAutoSubmit = false) => {
    if ((!input.trim() && !isAutoSubmit) || nextStep.isPending) return;
    stop();

    let timeTaken = 0;
    if (questionStartTime) {
      timeTaken = Math.floor((Date.now() - questionStartTime) / 1000);
    }
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    const submittedResponse =
      isAutoSubmit && !input.trim() ? "[Time expired. No response provided.]" : input;

    nextStep.mutate(
      { id, userResponse: submittedResponse, timeTaken },
      {
        onSuccess: (result) => {
          setInput("");
          setQuestionStartTime(null);
          if (result.isComplete) {
            toast({ title: "Interview complete", description: "Generating your report..." });
            finishAndReport();
          }
        },
        onError: (err) =>
          toast({
            variant: "destructive",
            title: "Failed to send message",
            description: err instanceof Error ? err.message : undefined,
          }),
      },
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-0px)] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-muted-foreground font-medium animate-pulse">Loading interview context...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="h-[calc(100vh-0px)] flex flex-col items-center justify-center gap-4">
        <h2 className="text-2xl font-bold text-destructive">Error loading interview</h2>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  const { interview, messages } = data;
  const isCompleted = interview.status === "completed";
  const timerPercent = (timeLeft / MAX_TIME) * 100;
  const typeLabel = (interview.interviewType ?? "mixed").replace("-", " ");

  return (
    <div className="h-[calc(100vh-0px)] flex bg-background overflow-hidden">
      {/* Sidebar */}
      <div className="hidden lg:flex w-80 flex-col border-r border-border/60 bg-card/30 backdrop-blur-sm">
        <div className="p-6 border-b border-border/60">
          <h2 className="text-lg font-display font-bold flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            AI Interviewer
          </h2>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary" className="capitalize text-xs">{typeLabel}</Badge>
            <span className="text-xs text-muted-foreground">#{interview.id}</span>
          </div>
        </div>

        <ScrollArea className="flex-1 px-6 py-6">
          <div className="space-y-6">
            <LiveScorePanel
              messages={messages}
              questionIndex={interview.currentQuestionIndex}
              maxQuestions={MAX_QUESTIONS}
            />

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
                <User className="w-3 h-3" /> Candidate
              </h3>
              <div className="bg-muted/40 p-3 rounded-xl text-sm font-medium">{interview.candidateName}</div>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
                <Briefcase className="w-3 h-3" /> Target Role
              </h3>
              <div className="bg-muted/40 p-3 rounded-xl text-xs leading-relaxed max-h-36 overflow-y-auto scrollbar-thin">
                {interview.jobDescription}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
                <FileText className="w-3 h-3" /> Resume
              </h3>
              <div className="bg-muted/40 p-3 rounded-xl text-xs leading-relaxed max-h-36 overflow-y-auto scrollbar-thin text-muted-foreground">
                {interview.resumeText}
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-border/60">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full gap-2" disabled={completeInterview.isPending}>
                <StopCircle className="w-4 h-4" />
                End & Get Report
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>End interview session?</AlertDialogTitle>
                <AlertDialogDescription>
                  Your answers so far will be analyzed and you'll receive a full readiness report.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Continue Interview</AlertDialogCancel>
                <AlertDialogAction onClick={finishAndReport}>Generate Report</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Main chat */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="lg:hidden p-4 border-b flex items-center justify-between bg-card/80 backdrop-blur sticky top-0 z-10">
          <div className="flex items-center gap-2 font-display font-bold">
            <Bot className="w-5 h-5 text-primary" /> Interview
          </div>
          {!isCompleted && interview.status === "in_progress" && (
            <div className={cn("text-sm font-mono font-medium", timeLeft <= 30 && "text-destructive animate-pulse")}>
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
            </div>
          )}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon"><FileText className="w-5 h-5" /></Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader><SheetTitle>Interview Context</SheetTitle></SheetHeader>
              <div className="mt-6 space-y-4">
                <LiveScorePanel messages={messages} questionIndex={interview.currentQuestionIndex} />
                <p className="text-sm text-muted-foreground">{interview.jobDescription}</p>
                <Button variant="destructive" className="w-full" onClick={finishAndReport}>End Interview</Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin p-4 md:p-8" ref={scrollRef}>
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((msg) => (
              <ChatBubble key={msg.id} message={msg} />
            ))}
            {nextStep.isPending && (
              <ChatBubble
                message={{
                  id: -1, role: "assistant", content: "", type: "answer",
                  interviewId: id, createdAt: new Date(), analysis: null,
                }}
                isTyping
              />
            )}
          </div>
        </div>

        <div className="p-4 md:p-6 border-t border-border/60 bg-card/30 backdrop-blur-sm">
          <div className="max-w-3xl mx-auto space-y-3">
            {!isCompleted && interview.status === "in_progress" && !nextStep.isPending && (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className={cn("flex items-center gap-1.5 font-medium", timeLeft <= 30 ? "text-destructive" : "text-muted-foreground")}>
                    {timeLeft <= 30 ? <AlertCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                    {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")} remaining
                  </span>
                  <span className="text-xs text-muted-foreground">Question {Math.max(interview.currentQuestionIndex, 1)}</span>
                </div>
                <Progress
                  value={timerPercent}
                  className={cn("h-1.5", timeLeft <= 30 && "[&>div]:bg-destructive")}
                />
              </div>
            )}

            {isCompleted ? (
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-3">Interview complete. View your full report.</p>
                <Button onClick={() => setLocation(`/report/${id}`)}>View Report</Button>
              </div>
            ) : (
              <div className="flex gap-3 items-end">
                <div className="flex-1 relative bg-muted/30 rounded-2xl border border-input focus-within:ring-2 focus-within:ring-ring transition-all">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type or dictate your answer..."
                    className="min-h-[60px] max-h-[200px] bg-transparent border-0 focus-visible:ring-0 resize-none py-4 px-4 pr-12"
                    disabled={nextStep.isPending}
                  />
                  {isSupported && (
                    <Button
                      type="button"
                      variant={isListening ? "default" : "ghost"}
                      size="icon"
                      className={cn("absolute right-2 bottom-2 h-9 w-9 rounded-xl", isListening && "animate-pulse")}
                      onClick={toggle}
                    >
                      {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </Button>
                  )}
                </div>
                <Button
                  size="icon"
                  className="h-14 w-14 rounded-2xl shrink-0 shadow-lg shadow-primary/20"
                  onClick={() => handleSubmit(false)}
                  disabled={(!input.trim() && timeLeft > 0) || nextStep.isPending}
                >
                  <Send className="w-6 h-6" />
                </Button>
              </div>
            )}
            {!isCompleted && (
              <p className="text-center text-xs text-muted-foreground">
                Enter to send · Shift+Enter for newline{isSupported ? " · Mic for voice input" : ""}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
