import { isApiConfigured } from "@/lib/api";
import { AlertTriangle } from "lucide-react";

export default function ApiConfigBanner() {
  if (!import.meta.env.DEV || isApiConfigured()) {
    return null;
  }

  return (
    <div className="bg-destructive text-destructive-foreground px-4 py-3 text-center text-sm font-medium flex items-center justify-center gap-2">
      <AlertTriangle className="w-4 h-4 shrink-0" />
      <span>
        Local backend not running — start <code className="bg-black/20 px-1 rounded">npm run dev</code> in{" "}
        <code className="bg-black/20 px-1 rounded">backend/</code> or set{" "}
        <code className="bg-black/20 px-1 rounded">VITE_API_URL</code> in{" "}
        <code className="bg-black/20 px-1 rounded">frontend/.env</code>.
      </span>
    </div>
  );
}
