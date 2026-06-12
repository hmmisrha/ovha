import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { haversineKm, etaMinutes, getGeolocation } from "@/lib/geo";
import { Power, MapPin, Clock, Check, X } from "lucide-react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";

interface Sos {
  id: string;
  driver_id: string;
  status: string;
  issue_type: string;
  lat: number;
  lng: number;
  created_at: string;
  mechanic_id: string | null;
}

export function JobsPage() {
  const { user, profile, refreshProfile } = useAuth();
  const [requests, setRequests] = useState<Sos[]>([]);
  const [me, setMe] = useState<{ lat: number; lng: number } | null>(null);
  const online = profile?.is_online ?? false;

  useEffect(() => {
    getGeolocation().then(setMe).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("sos_requests")
        .select("*")
        .or(`status.eq.pending,mechanic_id.eq.${user.id}`)
        .not("status", "in", "(completed,cancelled)")
        .order("created_at", { ascending: false });
      if (data) setRequests(data as Sos[]);
    };
    load();
    const ch = supabase
      .channel("sos-mechanic")
      .on("postgres_changes", { event: "*", schema: "public", table: "sos_requests" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  async function toggleOnline() {
    if (!user) return;
    await supabase.from("profiles").update({ is_online: !online }).eq("id", user.id);
    await refreshProfile();
    toast.success(online ? "You are offline" : "You are online — accepting jobs");
  }

  async function accept(id: string) {
    if (!user) return;
    const { error } = await supabase
      .from("sos_requests")
      .update({ mechanic_id: user.id, status: "accepted" })
      .eq("id", id)
      .eq("status", "pending");
    if (error) return toast.error(error.message);
    toast.success("Job accepted!");
  }

  async function advance(id: string, next: "in_progress" | "completed") {
    const { error } = await supabase
      .from("sos_requests")
      .update({ status: next })
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(next === "in_progress" ? "Marked in progress" : "Job completed!");
  }

  async function reject(id: string) {
    setRequests((r) => r.filter((x) => x.id !== id));
  }

  return (
    <div className="min-h-screen">
      <header className="px-5 pt-6 pb-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Mechanic</p>
          <h1 className="text-2xl font-black">Nearby Jobs</h1>
        </div>
        <button
          onClick={toggleOnline}
          className={`btn-pill px-4 py-2 text-sm font-bold flex items-center gap-2 transition ${
            online ? "bg-success text-success-foreground glow-blue" : "bg-card border border-border text-muted-foreground"
          }`}
        >
          <Power className="h-4 w-4" />
          {online ? "ONLINE" : "OFFLINE"}
        </button>
      </header>

      <div className="px-5 space-y-3">
        {!online && (
          <div className="card-soft p-4 text-sm text-muted-foreground text-center">
            Go online to receive nearby SOS requests.
          </div>
        )}
        {online && requests.length === 0 && (
          <div className="card-soft p-6 text-sm text-muted-foreground text-center">
            No active requests right now. We'll alert you when a driver needs help.
          </div>
        )}
        {requests.map((r) => {
          const dist = me ? haversineKm(me, { lat: r.lat, lng: r.lng }) : null;
          const mine = r.mechanic_id === user?.id;
          return (
            <div key={r.id} className="card-soft p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-bold flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${r.status === "pending" ? "bg-[var(--sos)] animate-pulse" : "bg-success"}`} />
                    {r.issue_type}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground flex items-center gap-3">
                    {dist !== null && (
                      <>
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{dist.toFixed(1)} km</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{etaMinutes(dist)} min</span>
                      </>
                    )}
                  </div>
                </div>
                <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full bg-background text-muted-foreground">
                  {r.status}
                </span>
              </div>
              {mine && <StatusTimeline status={r.status as SosStatus} />}
              {mine ? (
                <div className="space-y-2">
                  <Link to="/app/chat" className="block text-center btn-pill bg-card border border-primary text-primary py-2 text-sm font-semibold">
                    Open chat
                  </Link>
                  {r.status === "accepted" && (
                    <button
                      onClick={() => advance(r.id, "in_progress")}
                      className="w-full btn-pill bg-primary text-primary-foreground py-2 text-sm font-bold"
                    >
                      Mark arrived · Start work
                    </button>
                  )}
                  {r.status === "in_progress" && (
                    <button
                      onClick={() => advance(r.id, "completed")}
                      className="w-full btn-pill bg-success text-success-foreground py-2 text-sm font-bold"
                    >
                      <Check className="h-4 w-4 inline mr-1" /> Mark Completed
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => reject(r.id)}
                    className="btn-pill flex items-center justify-center gap-1 border border-border py-2 text-sm font-semibold"
                  >
                    <X className="h-4 w-4" /> Skip
                  </button>
                  <button
                    onClick={() => accept(r.id)}
                    className="btn-pill flex items-center justify-center gap-1 bg-success text-success-foreground py-2 text-sm font-bold"
                  >
                    <Check className="h-4 w-4" /> Accept
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
