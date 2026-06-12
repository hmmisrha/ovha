import { useState } from "react";
import { Star, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function RatingDialog({
  sosId,
  rateeId,
  raterId,
  onClose,
}: {
  sosId: string;
  rateeId: string;
  raterId: string;
  onClose: () => void;
}) {
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    const { error } = await supabase.from("ratings").insert({
      sos_id: sosId,
      rater_id: raterId,
      ratee_id: rateeId,
      stars,
      comment: comment || null,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Thanks for the rating!");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur grid place-items-center p-6">
      <div className="card-soft w-full max-w-sm p-5 space-y-4 relative">
        <button onClick={onClose} className="absolute top-3 right-3 text-muted-foreground"><X className="h-4 w-4" /></button>
        <div>
          <h2 className="font-black text-lg">Rate your experience</h2>
          <p className="text-xs text-muted-foreground mt-1">How was your service?</p>
        </div>
        <div className="flex justify-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => setStars(n)} className="p-1">
              <Star className={`h-8 w-8 ${n <= stars ? "fill-primary text-primary" : "text-muted-foreground"}`} />
            </button>
          ))}
        </div>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Optional comment…"
          rows={3}
          className="w-full rounded-xl bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none"
        />
        <button
          onClick={submit}
          disabled={saving}
          className="w-full btn-pill bg-primary text-primary-foreground py-2.5 text-sm font-bold disabled:opacity-50"
        >
          {saving ? "Submitting…" : "Submit rating"}
        </button>
      </div>
    </div>
  );
}
