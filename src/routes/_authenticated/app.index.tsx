import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { useState } from "react";
import { SOSButton } from "@/components/SOSButton";
import { IssueChips, ISSUES, type Issue } from "@/components/IssueChips";
import { ChatBot } from "@/components/ChatBot";
import { Bot, ShieldAlert, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getGeolocation } from "@/lib/geo";
import { toast } from "sonner";
import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { JobsPage } from "@/components/JobsView";

export const Route = createFileRoute("/_authenticated/app/")({
  head: () => ({ meta: [{ title: "OVHA — Dashboard" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { profile } = useAuth();
  if (!profile) return null;
  return profile.role === "driver" ? <DriverHome /> : <JobsPage />;
}

function DriverHome() {
  const { user, profile } = useAuth();
  const [issue, setIssue] = useState<Issue>();
  const [chatOpen, setChatOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [activeSos, setActiveSos] = useState<{ id: string; status: string; mechanic_id: string | null } | null>(null);

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    supabase
      .from("sos_requests")
      .select("id,status,mechanic_id")
      .eq("driver_id", user.id)
      .not("status", "in", "(completed,cancelled)")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => { if (mounted && data) setActiveSos(data); });
    const ch = supabase
      .channel(`sos-driver-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "sos_requests", filter: `driver_id=eq.${user.id}` },
        (p) => setActiveSos(p.new as any))
      .subscribe();
    return () => { mounted = false; supabase.removeChannel(ch); };
  }, [user]);

  async function triggerSOS() {
    if (!user) return;
    setSending(true);
    try {
      const pos = await getGeolocation();
      const { data, error } = await supabase
        .from("sos_requests")
        .insert({
          driver_id: user.id,
          issue_type: issue ?? "General Help",
          lat: pos.lat, lng: pos.lng,
        })
        .select("id,status,mechanic_id")
        .single();
      if (error) throw error;
      await supabase.from("profiles").update({ last_lat: pos.lat, last_lng: pos.lng }).eq("id", user.id);
      setActiveSos(data as any);
      toast.success("SOS broadcast! Help is on the way.");
    } catch (e) {
      toast.error((e as Error).message);
    } finally { setSending(false); }
  }

  async function cancelSOS() {
    if (!activeSos) return;
    await supabase.from("sos_requests").update({ status: "cancelled" }).eq("id", activeSos.id);
    setActiveSos(null);
    toast.info("SOS cancelled");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-5 pt-6 pb-2">
        <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Hello {profile?.full_name?.split(" ")[0] || "Driver"}</p>
        <h1 className="text-2xl font-black mt-1">Need roadside help?</h1>
      </header>

      {activeSos ? (
        <div className="mx-5 mt-4 card-soft p-5 text-center space-y-3 border-primary glow-blue">
          <Loader2 className="h-7 w-7 mx-auto animate-spin text-primary" />
          <div>
            <div className="font-bold">SOS active</div>
            <div className="text-xs text-muted-foreground">Status: {activeSos.status}{activeSos.mechanic_id ? " · mechanic assigned" : " · waiting for mechanic"}</div>
          </div>
          {activeSos.mechanic_id && (
            <Link to="/app/chat" className="block btn-pill bg-primary text-primary-foreground py-2.5 text-sm font-semibold">Open chat</Link>
          )}
          <button onClick={cancelSOS} className="text-xs text-muted-foreground underline">Cancel SOS</button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 gap-8">
          <SOSButton onTrigger={triggerSOS} loading={sending} />
          <p className="text-center text-sm text-muted-foreground -mt-2">Tap to alert nearby mechanics</p>

          <div className="w-full max-w-sm space-y-3">
            <p className="text-xs text-muted-foreground font-semibold uppercase text-center tracking-wider">What's the issue?</p>
            <IssueChips selected={issue} onSelect={setIssue} />
            {issue && (
              <div className="flex items-center justify-center gap-1 text-xs text-success">
                <CheckCircle2 className="h-3.5 w-3.5" /> {issue} selected
              </div>
            )}
          </div>
        </div>
      )}

      <div className="px-5 pb-6 grid grid-cols-2 gap-3">
        <button
          onClick={() => setChatOpen(true)}
          className="blue-pulse relative card-soft p-4 flex flex-col items-start gap-1 hover:border-primary transition"
        >
          <Bot className="h-6 w-6 text-primary" />
          <div className="text-sm font-bold">AI Assistant</div>
          <div className="text-xs text-muted-foreground">Self-repair guide</div>
        </button>
        <Link to="/emergency" className="card-soft p-4 flex flex-col items-start gap-1 hover:border-[var(--sos)] transition">
          <ShieldAlert className="h-6 w-6 text-[var(--sos)]" />
          <div className="text-sm font-bold">Emergency</div>
          <div className="text-xs text-muted-foreground">Works offline</div>
        </Link>
      </div>

      <ChatBot open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}
