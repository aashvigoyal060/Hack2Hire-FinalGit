import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertInterview } from "@shared/schema";
import { apiUrl, parseApiError } from "@/lib/api";

const AI_REQUEST_TIMEOUT_MS = 120_000;

async function apiFetch(url: string, init?: RequestInit) {
  const isAiStep = url.includes("/next") || url.includes("/complete");
  const controller = isAiStep ? new AbortController() : null;
  const timeoutId = controller
    ? setTimeout(() => controller.abort(), AI_REQUEST_TIMEOUT_MS)
    : undefined;

  try {
    return await fetch(url, {
      ...init,
      signal: controller?.signal,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Network error";
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("Request timed out — the AI is taking too long. Please try again.");
    }
    if (msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
      const onPreview =
        typeof window !== "undefined" &&
        window.location.hostname.includes("vercel.app") &&
        !window.location.hostname.includes("hack2-hire-woad");
      throw new Error(
        onPreview
          ? "Cannot reach API on this preview URL. Open https://hack2-hire-woad.vercel.app or disable Vercel Deployment Protection for previews."
          : "Cannot reach the backend. Check Railway is online and CORS_ORIGIN includes your site URL.",
      );
    }
    throw err;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export function useInterviewList() {
  return useQuery({
    queryKey: [api.interviews.list.path],
    queryFn: async () => {
      const res = await apiFetch(apiUrl(api.interviews.list.path));
      if (!res.ok) throw new Error(await parseApiError(res));
      return api.interviews.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateInterview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertInterview) => {
      const url = apiUrl(api.interviews.create.path);
      const res = await apiFetch(url, {
        method: api.interviews.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await parseApiError(res));
      return api.interviews.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.interviews.list.path] });
    },
  });
}

export function useInterview(id: number | string) {
  return useQuery({
    queryKey: [api.interviews.get.path, id],
    queryFn: async () => {
      const url = apiUrl(buildUrl(api.interviews.get.path, { id }));
      const res = await apiFetch(url);
      if (!res.ok) throw new Error(await parseApiError(res));
      return api.interviews.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
    refetchInterval: 5000,
  });
}

export function useNextStep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      userResponse,
      timeTaken,
    }: {
      id: number;
      userResponse?: string;
      timeTaken?: number;
    }) => {
      const url = apiUrl(buildUrl(api.interviews.next.path, { id }));
      const res = await apiFetch(url, {
        method: api.interviews.next.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userResponse, timeTaken }),
      });
      if (!res.ok) throw new Error(await parseApiError(res));
      const json = await res.json();
      const parsed = api.interviews.next.responses[200].safeParse(json);
      if (!parsed.success) {
        console.error("Next step response validation:", parsed.error.flatten());
        // Backend succeeded; refetch will sync UI
        return {
          message: json.message,
          analysis: json.analysis,
          isComplete: Boolean(json.isComplete),
        };
      }
      return parsed.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [api.interviews.get.path, String(variables.id)],
      });
      queryClient.invalidateQueries({
        queryKey: [api.interviews.get.path, Number(variables.id)],
      });
      queryClient.invalidateQueries({ queryKey: [api.interviews.list.path] });
    },
  });
}

export function useCompleteInterview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = apiUrl(buildUrl(api.interviews.complete.path, { id }));
      const res = await apiFetch(url, {
        method: api.interviews.complete.method,
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(await parseApiError(res));
      return api.interviews.complete.responses[200].parse(await res.json());
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: [api.interviews.get.path, String(id)] });
      queryClient.invalidateQueries({ queryKey: [api.interviews.get.path, Number(id)] });
      queryClient.invalidateQueries({ queryKey: [api.interviews.list.path] });
    },
  });
}
