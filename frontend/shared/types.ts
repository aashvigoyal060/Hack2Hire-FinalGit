import { z } from "zod";

export const interviewTypeSchema = z.enum([
  "behavioral",
  "technical",
  "system-design",
  "mixed",
]);

export type InterviewType = z.infer<typeof interviewTypeSchema>;
export type InterviewStatus = "pending" | "in_progress" | "completed";

export const insertInterviewSchema = z.object({
  candidateName: z.string().min(1, "Name is required"),
  resumeText: z.string().min(1, "Resume is required"),
  jobDescription: z.string().min(1, "Job description is required"),
  interviewType: interviewTypeSchema.default("mixed"),
});

export const scoresSchema = z.object({
  accuracy: z.number(),
  clarity: z.number(),
  depth: z.number(),
  relevance: z.number(),
  timeEfficiency: z.number(),
  total: z.number(),
});

export const feedbackSchema = z.object({
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  suggestions: z.array(z.string()),
  readinessScore: z.number(),
  verdict: z.string(),
});

export const messageAnalysisSchema = z.object({
  structure: z.string(),
  missingComponents: z.array(z.string()),
  structureScore: z.number(),
  improvementSuggestion: z.string(),
  accuracy: z.number(),
  clarity: z.number(),
  depth: z.number(),
  relevance: z.number(),
  timeEfficiency: z.number(),
  totalScore: z.number(),
  personalityType: z.string().optional(),
  interviewerTone: z.string().optional(),
  pacingAdjustment: z.string().optional(),
});

export const interviewSchema = z.object({
  id: z.number(),
  candidateName: z.string(),
  resumeText: z.string(),
  jobDescription: z.string(),
  interviewType: interviewTypeSchema,
  status: z.enum(["pending", "in_progress", "completed"]),
  currentQuestionIndex: z.number(),
  scores: scoresSchema.nullable(),
  feedback: feedbackSchema.nullable(),
  createdAt: z.coerce.date(),
});

export const messageSchema = z.object({
  id: z.number(),
  interviewId: z.number(),
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
  type: z.enum(["question", "answer", "system_prompt"]),
  timeTaken: z.number().nullable(),
  analysis: messageAnalysisSchema.nullable(),
  createdAt: z.coerce.date(),
});

export const insertMessageSchema = z.object({
  interviewId: z.number(),
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
  type: z.enum(["question", "answer", "system_prompt"]).optional(),
  timeTaken: z.number().nullable().optional(),
  analysis: messageAnalysisSchema.nullable().optional(),
});

export type Interview = z.infer<typeof interviewSchema>;
export type InsertInterview = z.infer<typeof insertInterviewSchema>;
export type Message = z.infer<typeof messageSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type CreateInterviewRequest = InsertInterview;
export type InterviewResponse = Interview;
export type MessageResponse = Message;

export type NextStepRequest = {
  userResponse: string;
};

export type NextStepResponse = {
  message: Message;
  analysis?: Message["analysis"];
};
