import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({ component: Index });

function Index() {
  const { loading, user } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <div className="text-center">
          <div className="h-16 w-16 mx-auto rounded-full bg-primary/20 grid place-items-center text-primary text-2xl font-black animate-pulse">O</div>
          <p className="mt-4 text-sm text-muted-foreground">OVHA loading…</p>
        </div>
      </div>
    );
  }
  return <Navigate to={user ? "/app" : "/auth"} replace />;
}
