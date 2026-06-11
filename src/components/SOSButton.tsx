import { AlertTriangle } from "lucide-react";

export function SOSButton({ onTrigger, loading }: { onTrigger: () => void; loading?: boolean }) {
  return (
    <button
      onClick={onTrigger}
      disabled={loading}
      aria-label="Send SOS"
      className="sos-pulse glow-sos relative h-48 w-48 rounded-full bg-[var(--sos)] text-[var(--sos-foreground)] font-black text-3xl tracking-widest flex flex-col items-center justify-center active:scale-95 transition disabled:opacity-70"
    >
      <AlertTriangle className="h-10 w-10 mb-1" />
      <span>{loading ? "..." : "SOS"}</span>
    </button>
  );
}
