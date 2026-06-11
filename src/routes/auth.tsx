import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { AlertTriangle, Wrench, Car, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — OVHA" }, { name: "description", content: "Sign in or create an OVHA account as a driver or mechanic." }] }),
  component: AuthPage,
});

type Mode = "signin" | "signup";
type Role = "driver" | "mechanic";

function AuthPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [role, setRole] = useState<Role>("driver");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (!loading && user) navigate({ to: "/app", replace: true }); }, [user, loading, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/app`,
            data: { full_name: fullName, role },
          },
        });
        if (error) throw error;
        toast.success("Account created. You're in!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back");
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally { setBusy(false); }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="px-6 pt-10 pb-6 text-center">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-[var(--sos)] glow-sos">
          <AlertTriangle className="h-8 w-8 text-white" />
        </div>
        <h1 className="mt-4 text-3xl font-black tracking-tight">OVHA</h1>
        <p className="text-xs uppercase tracking-[0.25em] text-primary font-semibold">On-Road Vehicle Help</p>
      </div>

      <div className="flex-1 px-5 pb-8 max-w-md w-full mx-auto">
        <div className="card-soft p-5 space-y-5">
          <div className="flex p-1 bg-background rounded-full border border-border">
            {(["signin", "signup"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 rounded-full py-2 text-sm font-semibold transition ${mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
              >
                {m === "signin" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          {mode === "signup" && (
            <>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { v: "driver", label: "Driver", Icon: Car },
                  { v: "mechanic", label: "Mechanic", Icon: Wrench },
                ] as { v: Role; label: string; Icon: typeof Car }[]).map(({ v, label, Icon }) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setRole(v)}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border p-4 transition ${
                      role === v ? "border-primary bg-primary/10 text-primary glow-blue" : "border-border text-foreground"
                    }`}
                  >
                    <Icon className="h-6 w-6" />
                    <span className="text-sm font-semibold">{label}</span>
                  </button>
                ))}
              </div>
              <input
                type="text"
                placeholder="Full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full rounded-xl bg-background border border-border px-4 py-3 text-sm focus:outline-none focus:border-primary"
              />
            </>
          )}

          <form onSubmit={submit} className="space-y-3">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl bg-background border border-border px-4 py-3 text-sm focus:outline-none focus:border-primary"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-xl bg-background border border-border px-4 py-3 text-sm focus:outline-none focus:border-primary"
            />
            <button
              type="submit"
              disabled={busy}
              className="btn-pill w-full bg-primary text-primary-foreground font-bold py-3 text-sm glow-blue disabled:opacity-60"
            >
              {busy ? "Please wait…" : mode === "signin" ? "Sign In" : "Create Account"}
            </button>
          </form>
        </div>

        <Link
          to="/emergency"
          className="mt-4 flex items-center justify-center gap-2 text-sm font-semibold text-[var(--sos)]"
        >
          <ShieldAlert className="h-4 w-4" />
          Emergency help (works offline)
        </Link>
      </div>
    </div>
  );
}
