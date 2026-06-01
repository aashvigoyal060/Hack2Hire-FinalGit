import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.js";
import { registerFeatureRoutes } from "./featureRoutes.js";
import { api } from "../shared/routes.js";
import { z } from "zod";
import OpenAI from "openai";
import { insertInterviewSchema } from "../shared/schema.js";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || "dev-placeholder",
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

type ChatMessage = OpenAI.Chat.Completions.ChatCompletionMessageParam;

function hasOpenAiKey(): boolean {
  return Boolean(process.env.AI_INTEGRATIONS_OPENAI_API_KEY?.trim());
}

function getDevJsonResponse(messages: ChatMessage[]): string {
  const userMessages = messages.filter((m) => m.role === "user");
  const isFinalReport = userMessages.some(
    (m) =>
      typeof m.content === "string" &&
      m.content.includes("generate the final report"),
  );

  if (isFinalReport) {
    return JSON.stringify({
      readinessScore: 72,
      verdict: "Average",
      strengths: ["Clear communication", "Shows enthusiasm for the role"],
      weaknesses: ["Needs more technical depth", "Add concrete project examples"],
      suggestions: [
        "Practice explaining projects using the STAR method",
        "Review core data structures and algorithms",
      ],
      skillBreakdown: { "Problem Solving": 7, Communication: 8 },
    });
  }

  if (userMessages.length === 0) {
    return JSON.stringify({
      next_message:
        "Welcome! To begin, please introduce yourself and describe one project or skill from your resume that best fits this role.",
      analysis: null,
      is_complete: false,
    });
  }

  return JSON.stringify({
    next_message:
      "Thanks for that answer. Can you explain how you would approach debugging a production issue under time pressure?",
    analysis: {
      structure: "None",
      missingComponents: ["Result"],
      structureScore: 6,
      improvementSuggestion: "Include a measurable outcome when describing your experience.",
      accuracy: 2,
      clarity: 1,
      depth: 1,
      relevance: 1,
      timeEfficiency: 0.5,
      totalScore: 6,
      personalityType: "Confident and clear",
      interviewerTone: "Encouraging",
      pacingAdjustment: "Maintain",
    },
    is_complete: false,
  });
}

async function getAiJsonResponse(messages: ChatMessage[]): Promise<string> {
  if (!hasOpenAiKey()) {
    return getDevJsonResponse(messages);
  }

  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages,
      response_format: { type: "json_object" },
    });

    return response.choices[0].message.content || "{}";
  } catch (err) {
    console.error("OpenAI request failed, using fallback responses:", err);
    return getDevJsonResponse(messages);
  }
}

const SYSTEM_PROMPT_BASE = `
You are an AI Interviewer designed to simulate a real-world technical job interview.

GOAL:
Evaluate a candidate’s interview readiness for a specific tech role using their Resume and Job Description (JD).

YOUR RESPONSIBILITIES:
1. RESUME & JD ANALYSIS: Map resume skills to JD requirements.
2. QUESTION GENERATION: Ask technical, conceptual, behavioral, and scenario-based questions. Start EASY.
3. ADAPTIVE DIFFICULTY: Explicitly INCREASE difficulty if the candidate's previous response was strong (totalScore >= 7). Decrease or maintain difficulty if the response was weak (totalScore < 5).
4. RESPONSE EVALUATION: Score each answer objectively (Accuracy, Clarity, Depth, Relevance).
5. TIME CONSTRAINT EVALUATION: The user has 120 seconds to answer. If the 'Time taken' exceeds 120s or if the time is disproportionately high for a simple question, heavily penalize the 'timeEfficiency' score.
6. EARLY TERMINATION: If the candidate consistently performs poorly (e.g., average totalScore over the last 3 questions is < 4), set 'is_complete' to true and terminate early. Also terminate if enough questions (e.g. 5-7) have been asked.

OUTPUT FORMAT:
You must ALWAYS respond in JSON format.
{
  "next_message": "The text of your next question or comment to the candidate.",
  "analysis": {
    "structure": "STAR" | "PREP" | "None",
    "missingComponents": ["Result", "Action", etc],
    "structureScore": 0-10,
    "improvementSuggestion": "One line suggestion",
    "accuracy": 0-3,
    "clarity": 0-2,
    "depth": 0-2,
    "relevance": 0-2,
    "timeEfficiency": 0-1,
    "totalScore": 0-10,
    "personalityType": "Nervous but capable" | "Confident and clear" | "Overconfident" | "Silent thinker" | "Inconsistent",
    "interviewerTone": "Recommended tone (e.g., Encouraging, Direct)",
    "pacingAdjustment": "Increase / Maintain / Decrease"
  },
  "is_complete": boolean
}

If this is the FIRST message (start of interview), "analysis" should be null.
If the interview is complete, "next_message" should be a closing statement, and "is_complete" should be true.
`;

const FINAL_REPORT_PROMPT = `
The interview is complete. Generate a final detailed report in JSON format:
{
  "readinessScore": 0-100,
  "verdict": "Strong" | "Average" | "Needs Improvement",
  "strengths": ["string", "string"],
  "weaknesses": ["string", "string"],
  "suggestions": ["string", "string"],
  "skillBreakdown": { "skillName": score_0_10 }
}
`;

const INTERVIEW_TYPE_PROMPTS: Record<string, string> = {
  behavioral: "Focus on behavioral and situational questions (STAR method, teamwork, conflict, leadership). Limit deep coding questions.",
  technical: "Focus on technical depth: algorithms, data structures, language concepts, and hands-on problem solving.",
  "system-design": "Focus on system design, scalability, trade-offs, architecture patterns, and distributed systems thinking.",
  mixed: "Use a balanced mix of behavioral, technical, and scenario-based questions appropriate for the role level.",
};

function buildInterviewContext(interview: {
  resumeText: string;
  jobDescription: string;
  candidateName: string;
  interviewType?: string | null;
}) {
  const typeKey = interview.interviewType ?? "mixed";
  const typePrompt = INTERVIEW_TYPE_PROMPTS[typeKey] ?? INTERVIEW_TYPE_PROMPTS.mixed;
  return `${SYSTEM_PROMPT_BASE}\n\nINTERVIEW MODE: ${typeKey.toUpperCase()}\n${typePrompt}\n\nCandidate Resume: ${interview.resumeText}\nJob Description: ${interview.jobDescription}\nCandidate Name: ${interview.candidateName}`;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  registerFeatureRoutes(app);

  app.get(api.interviews.list.path, async (_req, res) => {
    try {
      const items = await storage.listInterviews();
      res.json(items);
    } catch (err) {
      console.error("List interviews failed:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create Interview
  app.post(api.interviews.create.path, async (req, res) => {
    try {
      const input = insertInterviewSchema.parse(req.body);
      const interview = await storage.createInterview(input);
      res.status(201).json(interview);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      console.error("Create interview failed:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get Interview & Messages
  app.get(api.interviews.get.path, async (req, res) => {
    const id = Number(req.params.id);
    const interview = await storage.getInterview(id);
    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }
    const messages = await storage.getMessages(id);
    res.json({ interview, messages });
  });

  // Next Step (Answer & Get Question)
  app.post(api.interviews.next.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { userResponse, timeTaken } = req.body;
      
      const interview = await storage.getInterview(id);
      if (!interview) {
        return res.status(404).json({ message: "Interview not found" });
      }

      // If user provided a response, save it
      if (userResponse) {
        await storage.createMessage({
          interviewId: id,
          role: "user",
          content: userResponse,
          type: "answer",
          timeTaken: timeTaken || null,
        });
      }

      // Fetch history for context
      const history = await storage.getMessages(id);
      
      // Construct prompt
      const messages = [
        {
          role: "system" as const,
          content: buildInterviewContext(interview),
        },
        ...history.map(m => {
          let content = m.content;
          if (m.role === "user" && m.timeTaken) {
             content = `[Time taken: ${m.timeTaken} seconds] ${content}`;
          }
          return {
            role: (m.role === "assistant" ? "assistant" : "user") as "assistant" | "user",
            content,
          };
        })
      ];

      // Call OpenAI
      const aiContent = await getAiJsonResponse(messages);
      let parsed;
      try {
        parsed = JSON.parse(aiContent);
      } catch (e) {
        console.error("Failed to parse AI response", aiContent);
        parsed = { next_message: "I apologize, I encountered an error. Please continue.", analysis: null, is_complete: false };
      }

      // If analysis exists, it belongs to the *previous* user message. 
      // We should update the last user message with this analysis.
      if (parsed.analysis && userResponse) {
        // Let's refetch the latest user message to update it
        const userMsgs = await storage.getMessages(id);
        const lastUserMsg = userMsgs.filter(m => m.role === "user").pop();
        if (lastUserMsg) {
             await storage.updateMessage(lastUserMsg.id, {
                 analysis: parsed.analysis
             });
        }
      }

      // Save AI Response
      const aiMessage = await storage.createMessage({
        interviewId: id,
        role: "assistant",
        content: parsed.next_message,
        type: "question",
      });

      if (parsed.is_complete) {
        await storage.updateInterview(id, { status: "completed" });
      } else {
        await storage.updateInterview(id, { 
            status: "in_progress",
            currentQuestionIndex: (interview.currentQuestionIndex || 0) + 1 
        });
      }

      res.json({
        message: aiMessage,
        analysis: parsed.analysis,
        isComplete: Boolean(parsed.is_complete),
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Complete Interview & Generate Report
  app.post(api.interviews.complete.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const interview = await storage.getInterview(id);
      if (!interview) {
        return res.status(404).json({ message: "Interview not found" });
      }

      const history = await storage.getMessages(id);
      
      const messages = [
        {
          role: "system" as const,
          content: `${buildInterviewContext(interview)}\n${FINAL_REPORT_PROMPT}`,
        },
        ...history.map(m => ({
          role: (m.role === "assistant" ? "assistant" : "user") as "assistant" | "user",
          content: m.content,
        })),
        {
          role: "user" as const,
          content: "The interview is over. Please generate the final report JSON."
        }
      ];

      const aiContent = await getAiJsonResponse(messages);
      let report;
      try {
        report = JSON.parse(aiContent);
      } catch (e) {
        report = { readinessScore: 0, verdict: "Error", strengths: [], weaknesses: [], suggestions: [] };
      }

      // Calculate objective scores from conversation history
      const userMessagesWithAnalysis = history.filter(m => m.role === "user" && m.analysis);
      const numAnalyzed = userMessagesWithAnalysis.length || 1; // prevent division by zero
      
      const sum = userMessagesWithAnalysis.reduce(
          (acc, m) => {
              const a = m.analysis as any;
              return {
                  accuracy: acc.accuracy + (a.accuracy || 0),
                  clarity: acc.clarity + (a.clarity || 0),
                  depth: acc.depth + (a.depth || 0),
                  relevance: acc.relevance + (a.relevance || 0),
                  timeEfficiency: acc.timeEfficiency + (a.timeEfficiency || 0),
              };
          },
          { accuracy: 0, clarity: 0, depth: 0, relevance: 0, timeEfficiency: 0 }
      );

      const objectiveScores = {
          total: report.readinessScore,
          accuracy: sum.accuracy / numAnalyzed,
          clarity: sum.clarity / numAnalyzed,
          depth: sum.depth / numAnalyzed,
          relevance: sum.relevance / numAnalyzed,
          timeEfficiency: sum.timeEfficiency / numAnalyzed,
      };

      const updated = await storage.updateInterview(id, {
        status: "completed",
        feedback: report,
        scores: objectiveScores
      });

      res.json(updated);

    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  return httpServer;
}
