/** Public Railway API — same as config/backend-url.txt */
const RAILWAY_API_BASE = "https://hack2hire-backend-production.up.railway.app";

/**
 * API base URL:
 * - Dev: Vite proxy (`/api` → localhost:5000) when VITE_API_URL unset
 * - Prod: `VITE_API_URL` from build, else Railway direct (avoids Vercel preview auth on `/api`)
 */
export function getApiBase(): string {
  const base = import.meta.env.VITE_API_URL?.trim() ?? "";
  if (base) return base.replace(/\/$/, "");
  if (import.meta.env.PROD) return RAILWAY_API_BASE;
  return "";
}

export function apiUrl(path: string): string {
  const base = getApiBase();
  return base ? `${base}${path}` : path;
}

export function isApiConfigured(): boolean {
  return import.meta.env.DEV || import.meta.env.PROD;
}

export async function parseApiError(res: Response): Promise<string> {
  if (res.status === 401) {
    return "API blocked (401). Use https://hack2-hire-woad.vercel.app or disable Vercel Deployment Protection on preview URLs.";
  }
  const text = await res.text();
  try {
    const json = JSON.parse(text) as { message?: string };
    if (json.message) return json.message;
  } catch {
    /* not json */
  }
  if (text.startsWith("<!DOCTYPE") || text.startsWith("<html")) {
    return "API returned HTML instead of JSON — check backend URL configuration.";
  }
  return text.slice(0, 200) || res.statusText || "Request failed";
}
