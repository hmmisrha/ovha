import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Send } from "lucide-react";

interface Msg {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export function ChatThread({ sosId, currentUserId }: { sosId: string; currentUserId: string }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    supabase
      .from("messages")
      .select("id,sender_id,content,created_at")
      .eq("sos_id", sosId)
      .order("created_at", { ascending: true })
      .then(({ data }) => { if (active && data) setMessages(data as Msg[]); });

    const channel = supabase
      .channel(`messages-${sosId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `sos_id=eq.${sosId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Msg]);
        },
      )
      .subscribe();

    return () => { active = false; supabase.removeChannel(channel); };
  }, [sosId]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function send() {
    if (!input.trim() || sending) return;
    setSending(true);
    const text = input.trim();
    setInput("");
    await supabase.from("messages").insert({ sos_id: sosId, sender_id: currentUserId, content: text });
    setSending(false);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground text-sm py-12">No messages yet. Say hi 👋</div>
        )}
        {messages.map((m) => {
          const mine = m.sender_id === currentUserId;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                  mine
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-card text-foreground rounded-bl-sm border border-border"
                }`}
              >
                {m.content}
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <form
        onSubmit={(e) => { e.preventDefault(); send(); }}
        className="p-3 border-t border-border bg-card flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Message…"
          className="flex-1 rounded-full bg-background border border-border px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="h-11 w-11 rounded-full bg-primary text-primary-foreground grid place-items-center disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
