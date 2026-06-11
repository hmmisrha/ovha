import { createFileRoute, Link } from "@tanstack/react-router";
import { Phone, ShieldAlert, ArrowLeft, ChevronDown } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/emergency")({
  head: () => ({ meta: [{ title: "Emergency — OVHA" }, { name: "description", content: "Offline emergency help: tap-to-call 112, 100, 102 and step-by-step roadside guides." }] }),
  component: Emergency,
});

const STEPS: { title: string; steps: string[] }[] = [
  {
    title: "Flat Tyre",
    steps: [
      "Turn on hazard lights and pull over to a safe flat area.",
      "Apply parking brake; place wheel chocks or a heavy stone behind a wheel.",
      "Loosen lug nuts (1/2 turn) before lifting the car.",
      "Position jack at vehicle's jack point; raise until tyre is off the ground.",
      "Remove lug nuts, swap tyre, hand-tighten nuts in a star pattern.",
      "Lower car, fully tighten nuts. Drive carefully to a mechanic.",
    ],
  },
  {
    title: "Engine Overheat",
    steps: [
      "Pull over immediately. Turn off the AC and turn on the heater to max — it pulls heat from the engine.",
      "Switch off the engine and wait at least 15–30 minutes before opening the hood.",
      "NEVER open a hot radiator cap — risk of severe burns.",
      "Once cool, check coolant level; top up with water if needed for a short drive.",
      "Drive slowly to the nearest service station; do not push the engine.",
    ],
  },
  {
    title: "Dead Battery",
    steps: [
      "Park the rescue vehicle close, both engines off.",
      "Connect RED clamp to + terminal of dead battery, then + of good battery.",
      "Connect BLACK clamp to – of good battery, then to bare metal on dead car (not the – terminal).",
      "Start the rescue car, wait 2 minutes, then start the dead car.",
      "Remove cables in REVERSE order. Drive at least 20 minutes to recharge.",
    ],
  },
];

const NUMBERS = [
  { label: "Emergency (All India)", number: "112", color: "var(--sos)" },
  { label: "Police", number: "100", color: "var(--primary)" },
  { label: "Ambulance", number: "102", color: "var(--success)" },
];

function Emergency() {
  const [open, setOpen] = useState<string | null>("Flat Tyre");
  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <Link to="/auth" className="h-9 w-9 grid place-items-center rounded-full hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-[var(--sos)]" />
          <h1 className="text-lg font-bold">Emergency Help</h1>
        </div>
      </header>

      <section className="p-4 space-y-2">
        <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Tap to call</p>
        <div className="grid grid-cols-1 gap-2">
          {NUMBERS.map((n) => (
            <a
              key={n.number}
              href={`tel:${n.number}`}
              className="flex items-center justify-between rounded-xl p-4 font-bold text-white"
              style={{ background: n.color }}
            >
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5" />
                <span>{n.label}</span>
              </div>
              <span className="text-2xl">{n.number}</span>
            </a>
          ))}
        </div>
      </section>

      <section className="px-4 space-y-2">
        <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Quick guides</p>
        {STEPS.map((s) => (
          <div key={s.title} className="card-soft overflow-hidden">
            <button
              onClick={() => setOpen(open === s.title ? null : s.title)}
              className="w-full flex items-center justify-between px-4 py-3 font-semibold"
            >
              <span>{s.title}</span>
              <ChevronDown className={`h-5 w-5 transition ${open === s.title ? "rotate-180" : ""}`} />
            </button>
            {open === s.title && (
              <ol className="px-4 pb-4 space-y-2 text-sm text-foreground/90 list-decimal list-inside">
                {s.steps.map((step, i) => <li key={i}>{step}</li>)}
              </ol>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}
