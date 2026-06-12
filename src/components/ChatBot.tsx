import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState } from "react";
import { Bot, Send, X, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { ISSUES } from "./IssueChips";
import { supabase } from "@/integrations/supabase/client";

export function ChatBot({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      fetch: async (url, init) => {
        const { data } = await supabase.auth.getSession();
        const headers = new Headers(init?.headers);
        if (data.session?.access_token) {
          headers.set("Authorization", `Bearer ${data.session.access_token}`);
        }
        return fetch(url, { ...init, headers });
      },
    }),
  });
  const busy = status === "submitted" || status === "streaming";


  if (!open) return null;

  const send = (text: string) => {
    if (!text.trim() || busy) return;
    sendMessage({ text });
    setInput("");
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/20 grid place-items-center text-primary">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <div className="font-bold text-sm">OVHA AI Assistant</div>
            <div className="text-[10px] text-muted-foreground">Roadside guidance</div>
          </div>
        </div>
        <button onClick={onClose} className="h-9 w-9 grid place-items-center rounded-full hover:bg-muted">
          <X className="h-5 w-5" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="space-y-4">
            <div className="text-center text-muted-foreground text-sm py-6">
              <Sparkles className="h-6 w-6 mx-auto mb-2 text-primary" />
              Pick an issue or describe your situation.
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {ISSUES.map((i) => (
                <button
                  key={i}
                  onClick={() => send(`I have a ${i.toLowerCase()} issue. Walk me through what to do.`)}
                  className="btn-pill px-3 py-1.5 text-xs border border-border bg-card hover:border-primary"
                >
                  {i}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m) => {
          const text = m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
          const isUser = m.role === "user";
          return (
            <div key={m.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                  isUser
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-card text-foreground rounded-bl-sm"
                }`}
              >
                <div className="prose prose-sm prose-invert max-w-none">
                  <ReactMarkdown>{text}</ReactMarkdown>
                </div>
              </div>
            </div>
          );
        })}
        {busy && <div className="text-xs text-muted-foreground animate-pulse">Thinking…</div>}
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); send(input); }}
        className="p-3 border-t border-border bg-card flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe your issue…"
          className="flex-1 rounded-full bg-background border border-border px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="h-11 w-11 rounded-full bg-primary text-primary-foreground grid place-items-center disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
