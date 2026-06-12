import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { ChatThread } from "@/components/ChatThread";
import { MessageCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/chat")({
  head: () => ({ meta: [{ title: "Chat — OVHA" }] }),
  component: ChatPage,
});

function ChatPage() {
  const { user, profile } = useAuth();
  const [sosId, setSosId] = useState<string | null>(null);
  const [partnerName, setPartnerName] = useState<string>("");

  useEffect(() => {
    if (!user || !profile) return;
    let mounted = true;
    const column = profile.role === "driver" ? "driver_id" : "mechanic_id";
    supabase
      .from("sos_requests")
      .select("id, driver_id, mechanic_id")
      .eq(column, user.id)
      .in("status", ["accepted", "in_progress"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(async ({ data }) => {
        if (!mounted || !data) return;
        setSosId(data.id);
        const otherId = profile.role === "driver" ? data.mechanic_id : data.driver_id;
        if (otherId) {
          const { data: p } = await supabase.from("profiles_public").select("full_name").eq("id", otherId).maybeSingle();
          setPartnerName(p?.full_name || (profile.role === "driver" ? "Mechanic" : "Driver"));
        }
      });
  }, [user, profile]);

  if (!sosId) {
    return (
      <div className="min-h-[calc(100vh-4rem)] grid place-items-center px-6 text-center">
        <div>
          <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="font-semibold">No active conversation</p>
          <p className="text-sm text-muted-foreground mt-1">
            {profile?.role === "driver"
              ? "When a mechanic accepts your SOS, your chat appears here."
              : "Accept a job to start chatting with the driver."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <header className="px-4 py-3 border-b border-border bg-card">
        <div className="text-xs text-muted-foreground">Chatting with</div>
        <div className="font-bold">{partnerName}</div>
      </header>
      <div className="flex-1 min-h-0">
        <ChatThread sosId={sosId} currentUserId={user!.id} />
      </div>
    </div>
  );
}
