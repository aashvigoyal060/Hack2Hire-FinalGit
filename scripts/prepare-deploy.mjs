import { existsSync, readFileSync, writeFileSync } from "node:fs";

function readBackendUrl() {
  const configPath = "config/backend-url.txt";
  if (!existsSync(configPath)) return "";
  return (
    readFileSync(configPath, "utf8")
      .split("\n")
      .map((l) => l.trim())
      .find((l) => l && !l.startsWith("#")) ?? ""
  );
}

const url = readBackendUrl().replace(/\/$/, "");
const isValid = url.startsWith("https://");

if (isValid) {
  writeFileSync("frontend/.env.production", `VITE_API_URL=${url}\n`);
  console.log("[deploy] VITE_API_URL from config/backend-url.txt");
} else {
  console.log(
    "[deploy] config/backend-url.txt empty — frontend uses /api proxy (add Railway URL to that file)",
  );
}
