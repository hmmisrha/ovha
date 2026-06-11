import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, Star, Car, Wrench, IndianRupee } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app/profile")({
  head: () => ({ meta: [{ title: "Profile — OVHA" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [vehicleInfo, setVehicleInfo] = useState(profile?.vehicle_info || "");
  const [specialization, setSpecialization] = useState(profile?.specialization || "");
  const [history, setHistory] = useState<{ id: string; issue_type: string; status: string; created_at: string }[]>([]);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    const col = profile?.role === "driver" ? "driver_id" : "mechanic_id";
    supabase.from("sos_requests").select("id,issue_type,status,created_at").eq(col, user.id).order("created_at", { ascending: false }).limit(10)
      .then(({ data }) => { if (data) setHistory(data as any); });
    supabase.from("ratings").select("stars").eq("ratee_id", user.id)
      .then(({ data }) => {
        if (data && data.length) setAvgRating(data.reduce((s, r) => s + r.stars, 0) / data.length);
      });
  }, [user, profile?.role]);

  async function save() {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: fullName, phone, vehicle_info: vehicleInfo, specialization,
    }).eq("id", user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    await refreshProfile();
    toast.success("Profile saved");
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const isDriver = profile?.role === "driver";

  return (
    <div className="min-h-screen pb-8">
      <header className="px-5 pt-6 pb-4 flex items-center justify-between">
        <h1 className="text-2xl font-black">Profile</h1>
        <button onClick={signOut} className="h-9 w-9 grid place-items-center rounded-full bg-card border border-border">
          <LogOut className="h-4 w-4" />
        </button>
      </header>

      <div className="px-5 space-y-4">
        <div className="card-soft p-5 flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-primary/20 grid place-items-center text-primary">
            {isDriver ? <Car className="h-7 w-7" /> : <Wrench className="h-7 w-7" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold truncate">{profile?.full_name || "Unnamed"}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">{profile?.role}</div>
            <div className="mt-1 flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-yellow-400"><Star className="h-3.5 w-3.5 fill-current" />{avgRating ? avgRating.toFixed(1) : "—"}</span>
              {!isDriver && (
                <span className="flex items-center gap-1 text-success"><IndianRupee className="h-3.5 w-3.5" />{Number(profile?.total_earnings || 0).toFixed(0)}</span>
              )}
            </div>
          </div>
        </div>

        <div className="card-soft p-4 space-y-3">
          <div className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Account</div>
          <Field label="Full name" value={fullName} onChange={setFullName} />
          <Field label="Phone" value={phone} onChange={setPhone} />
          {isDriver ? (
            <Field label="Vehicle (make / model / plate)" value={vehicleInfo} onChange={setVehicleInfo} />
          ) : (
            <Field label="Specialization (e.g. Tyres, Engine)" value={specialization} onChange={setSpecialization} />
          )}
          <button onClick={save} disabled={saving} className="btn-pill w-full bg-primary text-primary-foreground py-2.5 font-semibold text-sm disabled:opacity-60">
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>

        <div className="card-soft p-4">
          <div className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-2">Service history</div>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground py-3 text-center">No past requests yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {history.map((h) => (
                <li key={h.id} className="py-2.5 flex items-center justify-between text-sm">
                  <div>
                    <div className="font-semibold">{h.issue_type}</div>
                    <div className="text-[11px] text-muted-foreground">{new Date(h.created_at).toLocaleString()}</div>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-background text-muted-foreground font-bold">{h.status}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl bg-background border border-border px-3 py-2.5 text-sm focus:outline-none focus:border-primary"
      />
    </label>
  );
}
