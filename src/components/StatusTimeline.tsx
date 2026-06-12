import { Check } from "lucide-react";

export type SosStatus = "pending" | "accepted" | "in_progress" | "completed" | "cancelled";

const STEPS: { key: SosStatus; label: string }[] = [
  { key: "pending", label: "Requested" },
  { key: "accepted", label: "Assigned" },
  { key: "in_progress", label: "In Progress" },
  { key: "completed", label: "Completed" },
];

const ORDER: Record<SosStatus, number> = {
  pending: 0,
  accepted: 1,
  in_progress: 2,
  completed: 3,
  cancelled: -1,
};

export function StatusTimeline({ status }: { status: SosStatus }) {
  const idx = ORDER[status] ?? 0;
  return (
    <div className="flex items-center justify-between w-full">
      {STEPS.map((s, i) => {
        const done = i <= idx;
        const active = i === idx;
        return (
          <div key={s.key} className="flex-1 flex items-center">
            <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
              <div
                className={`h-7 w-7 rounded-full grid place-items-center text-[10px] font-bold transition ${
                  done
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border text-muted-foreground"
                } ${active ? "glow-blue" : ""}`}
              >
                {done && i < idx ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span className={`text-[9px] uppercase tracking-wider font-semibold ${done ? "text-foreground" : "text-muted-foreground"}`}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 mb-4 ${i < idx ? "bg-primary" : "bg-border"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
