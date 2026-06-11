export const ISSUES = [
  "Flat Tyre",
  "Engine Overheat",
  "Dead Battery",
  "Brake Failure",
  "No Fuel",
] as const;

export type Issue = (typeof ISSUES)[number];

export function IssueChips({
  selected,
  onSelect,
}: {
  selected?: string;
  onSelect: (issue: Issue) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {ISSUES.map((i) => (
        <button
          key={i}
          onClick={() => onSelect(i)}
          className={`btn-pill px-4 py-2 text-sm font-semibold border transition ${
            selected === i
              ? "bg-primary text-primary-foreground border-primary glow-blue"
              : "bg-card text-foreground border-border hover:border-primary"
          }`}
        >
          {i}
        </button>
      ))}
    </div>
  );
}
