import { z } from "zod";
import {
  insertInterviewSchema,
  interviewSchema,
  messageAnalysisSchema,
  messageSchema,
} from "./types";

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  interviews: {
    list: {
      method: "GET" as const,
      path: "/api/interviews",
      responses: {
        200: z.array(interviewSchema),
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/interviews",
      input: insertInterviewSchema,
      responses: {
        201: interviewSchema,
        400: errorSchemas.validation,
      },
    },
    get: {
      method: "GET" as const,
      path: "/api/interviews/:id",
      responses: {
        200: z.object({
          interview: interviewSchema,
          messages: z.array(messageSchema),
        }),
        404: errorSchemas.notFound,
      },
    },
    next: {
      method: "POST" as const,
      path: "/api/interviews/:id/next",
      input: z.object({
        userResponse: z.string().optional(),
        timeTaken: z.number().optional(),
      }),
      responses: {
        200: z.object({
          message: messageSchema,
          analysis: messageAnalysisSchema.optional(),
          isComplete: z.boolean().optional(),
        }),
        404: errorSchemas.notFound,
      },
    },
    complete: {
      method: "POST" as const,
      path: "/api/interviews/:id/complete",
      responses: {
        200: interviewSchema,
        404: errorSchemas.notFound,
      },
    },
  },
};

export function buildUrl(
  path: string,
  params?: Record<string, string | number>,
): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
