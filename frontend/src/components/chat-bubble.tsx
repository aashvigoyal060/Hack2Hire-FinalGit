import { cn } from "@/lib/utils";
import { Message } from "@shared/schema";
import { motion } from "framer-motion";
import { Bot, User, AlertCircle, CheckCircle } from "lucide-react";
import AnalysisCard from "./analysis-card";

interface ChatBubbleProps {
  message: Message;
  isTyping?: boolean;
}

export default function ChatBubble({ message, isTyping }: ChatBubbleProps) {
  const isAi = message.role === "assistant" || message.role === "system";

  if (isTyping) {
    return (
      <div className="flex gap-4 max-w-3xl w-full">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Bot className="w-6 h-6 text-primary" />
        </div>
        <div className="bg-muted/50 rounded-2xl rounded-tl-none px-6 py-4">
          <div className="flex space-x-1 h-6 items-center">
            <span className="typing-dot" />
            <span className="typing-dot" />
            <span className="typing-dot" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex gap-4 w-full",
        isAi ? "max-w-4xl" : "max-w-3xl ml-auto flex-row-reverse"
      )}
    >
      {/* Avatar */}
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
        isAi 
          ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground" 
          : "bg-gradient-to-br from-slate-700 to-slate-900 text-white"
      )}>
        {isAi ? <Bot className="w-6 h-6" /> : <User className="w-6 h-6" />}
      </div>

      <div className="flex flex-col gap-2 w-full min-w-0">
        {/* Name Label */}
        <span className={cn(
          "text-xs font-semibold text-muted-foreground",
          !isAi && "text-right"
        )}>
          {isAi ? "AI Interviewer" : "You"}
        </span>

        {/* Message Content */}
        <div className={cn(
          "rounded-2xl px-6 py-4 shadow-sm text-base leading-relaxed whitespace-pre-wrap break-words",
          isAi 
            ? "bg-card border border-border/50 text-card-foreground rounded-tl-none" 
            : "bg-primary text-primary-foreground rounded-tr-none"
        )}>
          {message.content}
        </div>

        {/* Analysis Card (Only for AI messages that have analysis) */}
        {message.analysis && (
          <AnalysisCard analysis={message.analysis} />
        )}
      </div>
    </motion.div>
  );
}
