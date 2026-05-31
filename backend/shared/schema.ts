import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

export const interviews = pgTable("interviews", {
  id: serial("id").primaryKey(),
  candidateName: text("candidate_name").notNull(),
  resumeText: text("resume_text").notNull(),
  jobDescription: text("job_description").notNull(),
  interviewType: text("interview_type", {
    enum: ["behavioral", "technical", "system-design", "mixed"],
  }).default("mixed").notNull(),
  status: text("status", { enum: ["pending", "in_progress", "completed"] }).default("pending").notNull(),
  currentQuestionIndex: integer("current_question_index").default(0).notNull(),
  scores: jsonb("scores").$type<{
    accuracy: number;
    clarity: number;
    depth: number;
    relevance: number;
    timeEfficiency: number;
    total: number;
  }>(),
  feedback: jsonb("feedback").$type<{
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
    readinessScore: number;
    verdict: string;
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  interviewId: integer("interview_id").notNull().references(() => interviews.id),
  role: text("role", { enum: ["user", "assistant", "system"] }).notNull(),
  content: text("content").notNull(),
  type: text("type", { enum: ["question", "answer", "system_prompt"] }).default("answer").notNull(),
  timeTaken: integer("time_taken"),
  analysis: jsonb("analysis").$type<{
    structure: string;
    missingComponents: string[];
    structureScore: number;
    improvementSuggestion: string;
    accuracy: number;
    clarity: number;
    depth: number;
    relevance: number;
    timeEfficiency: number;
    totalScore: number;
    personalityType?: string;
    interviewerTone?: string;
    pacingAdjustment?: string;
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// === SCHEMAS ===

export const insertInterviewSchema = createInsertSchema(interviews).omit({
  id: true,
  createdAt: true,
  status: true,
  currentQuestionIndex: true,
  scores: true,
  feedback: true,
}).extend({
  interviewType: z.enum(["behavioral", "technical", "system-design", "mixed"]).default("mixed"),
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

// === TYPES ===

export type Interview = typeof interviews.$inferSelect;
export type InsertInterview = z.infer<typeof insertInterviewSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type InterviewStatus = "pending" | "in_progress" | "completed";
export type InterviewType = "behavioral" | "technical" | "system-design" | "mixed";

// Request/Response types
export type CreateInterviewRequest = InsertInterview;
export type InterviewResponse = Interview;
export type MessageResponse = Message;

export type NextStepRequest = {
  userResponse: string;
};

export type NextStepResponse = {
  message: Message; // The AI's response (new question or feedback)
  analysis?: Message["analysis"]; // Analysis of the user's previous answer
};
