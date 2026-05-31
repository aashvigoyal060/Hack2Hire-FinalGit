import { z } from 'zod';
import { insertInterviewSchema, interviews, messages } from './schema';

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
      method: 'GET' as const,
      path: '/api/interviews',
      responses: {
        200: z.array(z.custom<typeof interviews.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/interviews',
      input: insertInterviewSchema,
      responses: {
        201: z.custom<typeof interviews.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/interviews/:id',
      responses: {
        200: z.object({
          interview: z.custom<typeof interviews.$inferSelect>(),
          messages: z.array(z.custom<typeof messages.$inferSelect>()),
        }),
        404: errorSchemas.notFound,
      },
    },
    next: {
      method: 'POST' as const,
      path: '/api/interviews/:id/next',
      input: z.object({
        userResponse: z.string().optional(), // Optional for the first start
        timeTaken: z.number().optional(), // Time taken to answer in seconds
      }),
      responses: {
        200: z.object({
          message: z.custom<typeof messages.$inferSelect>(),
          analysis: z.custom<typeof messages.$inferSelect>().optional(),
          isComplete: z.boolean().optional(),
        }),
        404: errorSchemas.notFound,
      },
    },
    complete: {
      method: 'POST' as const,
      path: '/api/interviews/:id/complete',
      responses: {
        200: z.custom<typeof interviews.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
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
