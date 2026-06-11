import { createFileRoute, Outlet, Navigate } from "@tanstack/react-router";
import { BottomNav } from "@/components/BottomNav";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/app")({
  component: AppLayout,
});

function AppLayout() {
  const { profile, loading } = useAuth();
  if (loading || !profile) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <div className="text-sm text-muted-foreground animate-pulse">Loading profile…</div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-background pb-16">
      <Outlet />
      <BottomNav role={profile.role} />
    </div>
  );
}
