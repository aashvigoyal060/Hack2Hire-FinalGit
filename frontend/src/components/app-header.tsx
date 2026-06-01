import { Link, useLocation } from "wouter";
import { Bot, History, Sparkles, GraduationCap } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

export function AppHeader() {
  const [location] = useLocation();
  const isInterview = location.startsWith("/interview/");

  if (isInterview) return null;

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
            <Bot className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <span className="font-display font-bold text-lg leading-none">Hack2Hire</span>
            <span className="hidden sm:flex items-center gap-1 text-[10px] text-muted-foreground uppercase tracking-widest">
              <Sparkles className="w-3 h-3" /> AI Interview Coach
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-1">
          <Link
            href="/"
            className={cn(
              "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              location === "/"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted",
            )}
          >
            New Session
          </Link>
          <Link
            href="/practice"
            className={cn(
              "px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5",
              location === "/practice"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted",
            )}
          >
            <GraduationCap className="w-4 h-4" />
            Practice
          </Link>
          <Link
            href="/#history"
            className="px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-1.5"
          >
            <History className="w-4 h-4" />
            History
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
