import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

function readBackendUrl() {
  const fromEnv = process.env.RAILWAY_BACKEND_URL?.trim();
  if (fromEnv?.startsWith("http")) return fromEnv.replace(/\/$/, "");

  try {
    const configPath = join(process.cwd(), "config", "backend-url.txt");
    if (!existsSync(configPath)) return "";
    const line = readFileSync(configPath, "utf8")
      .split("\n")
      .map((l) => l.trim())
      .find((l) => l && !l.startsWith("#"));
    if (line?.startsWith("http")) return line.replace(/\/$/, "");
  } catch {
    /* ignore */
  }
  return "";
}

export default async function handler(req, res) {
  const base = readBackendUrl();
  if (!base) {
    return res.status(503).json({
      message:
        "Backend URL missing. Add your Railway URL to config/backend-url.txt in GitHub, commit, and redeploy.",
    });
  }

  const pathParam = req.query.path;
  const segments = Array.isArray(pathParam) ? pathParam : pathParam ? [pathParam] : [];
  const subPath = segments.join("/");
  const target = `${base}/api/${subPath}`;
  const search = req.url?.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
  const url = target + search;

  try {
    const headers = {};
    if (req.headers["content-type"]) headers["content-type"] = req.headers["content-type"];

    const init = { method: req.method, headers };

    if (req.method !== "GET" && req.method !== "HEAD" && req.body !== undefined) {
      init.body = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    }

    const response = await fetch(url, init);
    const text = await response.text();

    res.status(response.status);
    const ct = response.headers.get("content-type");
    if (ct) res.setHeader("content-type", ct);
    res.send(text);
  } catch (err) {
    console.error("API proxy error:", err);
    res.status(502).json({ message: "Failed to reach Railway backend" });
  }
}
