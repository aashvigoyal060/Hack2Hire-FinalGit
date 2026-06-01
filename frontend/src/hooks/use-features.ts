import { useMutation } from "@tanstack/react-query";
import { api } from "@shared/routes";
import type { LeetcodeProblem, QuizQuestion, ResumeAnalysis } from "@shared/types";
import { apiUrl, parseApiError } from "@/lib/api";

export function useAnalyzeResume() {
  return useMutation({
    mutationFn: async (params: {
      file?: File;
      resumeText?: string;
      jobDescription?: string;
    }) => {
      const form = new FormData();
      if (params.file) form.append("resume", params.file);
      if (params.resumeText) form.append("resumeText", params.resumeText);
      if (params.jobDescription) form.append("jobDescription", params.jobDescription);

      const res = await fetch(apiUrl(api.resume.analyze.path), {
        method: api.resume.analyze.method,
        body: form,
      });
      if (!res.ok) throw new Error(await parseApiError(res));
      const json = await res.json();
      return api.resume.analyze.responses[200].parse(json) as {
        resumeText: string;
        analysis: ResumeAnalysis;
      };
    },
  });
}

export function useTechQuiz() {
  return useMutation({
    mutationFn: async (body: {
      skills: string[] | string;
      jobDescription?: string;
      count?: number;
    }) => {
      const res = await fetch(apiUrl(api.practice.quiz.path), {
        method: api.practice.quiz.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await parseApiError(res));
      const json = await res.json();
      return api.practice.quiz.responses[200].parse(json) as { questions: QuizQuestion[] };
    },
  });
}

export function useLeetcodePractice() {
  return useMutation({
    mutationFn: async (body: {
      skills: string[] | string;
      jobDescription?: string;
      count?: number;
      difficulty?: "Easy" | "Medium" | "Hard" | "Mixed";
    }) => {
      const res = await fetch(apiUrl(api.practice.leetcode.path), {
        method: api.practice.leetcode.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await parseApiError(res));
      const json = await res.json();
      return api.practice.leetcode.responses[200].parse(json) as { problems: LeetcodeProblem[] };
    },
  });
}
