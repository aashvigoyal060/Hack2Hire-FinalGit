import type { Express, Request, Response } from "express";
import multer from "multer";
import { createRequire } from "module";
import OpenAI from "openai";
import { z } from "zod";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse") as (buffer: Buffer) => Promise<{ text: string }>;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf" || file.originalname.toLowerCase().endsWith(".pdf")) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
});

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || "dev-placeholder",
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

function hasOpenAiKey(): boolean {
  return Boolean(process.env.AI_INTEGRATIONS_OPENAI_API_KEY?.trim());
}

async function getAiJson(system: string, user: string): Promise<string> {
  if (!hasOpenAiKey()) return "{}";
  try {
    const res = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
    });
    return res.choices[0].message.content || "{}";
  } catch (err) {
    console.error("OpenAI feature request failed:", err);
    return "{}";
  }
}

const practiceBodySchema = z.object({
  skills: z
    .union([z.array(z.string()), z.string()])
    .transform((val) => {
      const list = typeof val === "string" ? val.split(/[,;]+/) : val;
      const normalized = list.map((s) => s.trim()).filter(Boolean);
      if (normalized.length === 0) throw new Error("At least one skill is required");
      return normalized;
    }),
  jobDescription: z.string().optional(),
  count: z.number().int().min(1).max(10).optional().default(5),
  difficulty: z.enum(["Easy", "Medium", "Hard", "Mixed"]).optional().default("Mixed"),
});

function devResumeAnalysis(resumeSnippet: string, jobDescription?: string) {
  const skills = resumeSnippet
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .slice(0, 8);
  return {
    atsScore: 68,
    interviewReadinessScore: 62,
    isInterviewReady: false,
    verdict: "Needs Improvement",
    matchedKeywords: skills.slice(0, 5),
    missingKeywords: jobDescription ? ["kubernetes", "ci/cd", "system design"] : ["metrics", "leadership"],
    strengths: ["Clear structure", "Relevant technical skills listed"],
    improvements: [
      "Add quantified impact (metrics) for each role",
      "Align bullet keywords with the job description",
      "Use standard section headings (Experience, Skills, Education)",
    ],
    extractedSkills: skills,
    summary:
      "Resume is parseable but needs stronger ATS keyword alignment and measurable outcomes before high-stakes interviews.",
  };
}

function devQuiz(skills: string[]) {
  return {
    questions: skills.slice(0, 5).map((skill, i) => ({
      id: i + 1,
      topic: skill,
      question: `What is a core concept teams expect you to know about ${skill}?`,
      options: [
        `Fundamental principles of ${skill}`,
        "Unrelated database indexing only",
        "Only UI color theory",
        "Legal contract drafting",
      ],
      correctIndex: 0,
      explanation: `${skill} fundamentals are essential for this skillset.`,
    })),
  };
}

function devLeetcode(skills: string[], difficulty: string) {
  const pool = [
    { title: "Two Sum", slug: "two-sum", topics: ["Array", "Hash Table"] },
    { title: "Valid Parentheses", slug: "valid-parentheses", topics: ["Stack", "String"] },
    { title: "Merge Two Sorted Lists", slug: "merge-two-sorted-lists", topics: ["Linked List"] },
    { title: "Binary Search", slug: "binary-search", topics: ["Binary Search", "Array"] },
    { title: "Climbing Stairs", slug: "climbing-stairs", topics: ["Dynamic Programming"] },
  ];
  return {
    problems: pool.slice(0, 5).map((p, i) => ({
      id: i + 1,
      title: p.title,
      difficulty: difficulty === "Mixed" ? (i % 2 === 0 ? "Easy" : "Medium") : difficulty,
      topics: [...p.topics, skills[i % skills.length]].filter(Boolean),
      leetcodeSlug: p.slug,
      leetcodeUrl: `https://leetcode.com/problems/${p.slug}/`,
      description: `Practice ${p.title} — classic problem for ${skills.join(", ")} preparation.`,
      hint: "Start with brute force, then optimize time/space complexity.",
    })),
  };
}

export function registerFeatureRoutes(app: Express): void {
  app.post(
    "/api/resume/analyze",
    upload.single("resume"),
    async (req: Request, res: Response) => {
      try {
        const jobDescription = (req.body.jobDescription as string) || "";
        let resumeText = (req.body.resumeText as string) || "";

        if (req.file?.buffer) {
          const parsed = await pdfParse(req.file.buffer);
          resumeText = parsed.text?.trim() || "";
        }

        if (!resumeText || resumeText.length < 50) {
          return res.status(400).json({
            message: "Could not extract enough text. Upload a text-based PDF or paste resume text.",
          });
        }

        const truncated = resumeText.slice(0, 12000);
        const jdPart = jobDescription
          ? `\n\nJOB DESCRIPTION:\n${jobDescription.slice(0, 4000)}`
          : "";

        let result;
        if (!hasOpenAiKey()) {
          result = devResumeAnalysis(truncated, jobDescription);
        } else {
          const raw = await getAiJson(
            `You are an ATS and technical interview coach. Analyze the resume against the job description if provided.
Return JSON only:
{
  "atsScore": 0-100,
  "interviewReadinessScore": 0-100,
  "isInterviewReady": boolean,
  "verdict": "Ready" | "Almost Ready" | "Needs Improvement",
  "matchedKeywords": ["string"],
  "missingKeywords": ["string"],
  "strengths": ["string"],
  "improvements": ["string"],
  "extractedSkills": ["string"],
  "summary": "2-3 sentence overview"
}`,
            `RESUME:\n${truncated}${jdPart}`,
          );
          try {
            result = JSON.parse(raw);
          } catch {
            result = devResumeAnalysis(truncated, jobDescription);
          }
        }

        res.json({
          resumeText: truncated,
          analysis: result,
        });
      } catch (err) {
        console.error("Resume analyze failed:", err);
        res.status(500).json({
          message: err instanceof Error ? err.message : "Failed to analyze resume",
        });
      }
    },
  );

  app.post("/api/practice/quiz", async (req, res) => {
    try {
      const body = practiceBodySchema.parse(req.body);
      const skills = body.skills;
      const count = body.count ?? 5;

      let result;
      if (!hasOpenAiKey()) {
        result = devQuiz(skills);
      } else {
        const raw = await getAiJson(
          `Generate ${count} multiple-choice technical quiz questions for the given skills. Return JSON:
{
  "questions": [{
    "id": number,
    "topic": "string",
    "question": "string",
    "options": ["A","B","C","D"],
    "correctIndex": 0-3,
    "explanation": "string"
  }]
}`,
          `Skills: ${skills.join(", ")}\nJob context: ${body.jobDescription || "general software role"}`,
        );
        try {
          result = JSON.parse(raw);
        } catch {
          result = devQuiz(skills);
        }
      }

      res.json(result);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error(err);
      res.status(500).json({ message: "Failed to generate quiz" });
    }
  });

  app.post("/api/practice/leetcode", async (req, res) => {
    try {
      const body = practiceBodySchema.parse(req.body);
      const skills = body.skills;
      const count = body.count ?? 5;
      const difficulty = body.difficulty ?? "Mixed";

      let result;
      if (!hasOpenAiKey()) {
        result = devLeetcode(skills, difficulty);
      } else {
        const raw = await getAiJson(
          `Generate ${count} LeetCode-style coding practice problems aligned to skills. Use real-style titles when possible.
Return JSON:
{
  "problems": [{
    "id": number,
    "title": "string",
    "difficulty": "Easy"|"Medium"|"Hard",
    "topics": ["string"],
    "leetcodeSlug": "kebab-case-slug",
    "leetcodeUrl": "https://leetcode.com/problems/slug/",
    "description": "problem statement",
    "hint": "short hint without full solution"
  }]
}`,
          `Skills: ${skills.join(", ")}\nPreferred difficulty: ${difficulty}\nJob: ${body.jobDescription || "software engineer"}`,
        );
        try {
          result = JSON.parse(raw);
        } catch {
          result = devLeetcode(skills, difficulty);
        }
      }

      res.json(result);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error(err);
      res.status(500).json({ message: "Failed to generate problems" });
    }
  });
}
