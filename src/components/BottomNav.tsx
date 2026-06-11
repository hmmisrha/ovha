import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Map, MessageCircle, User, Wrench } from "lucide-react";
import type { UserRole } from "@/lib/auth";

interface Tab {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function BottomNav({ role }: { role: UserRole }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const tabs: Tab[] =
    role === "driver"
      ? [
          { to: "/app", label: "Home", icon: Home },
          { to: "/app/map", label: "Map", icon: Map },
          { to: "/app/chat", label: "Chat", icon: MessageCircle },
          { to: "/app/profile", label: "Profile", icon: User },
        ]
      : [
          { to: "/app", label: "Jobs", icon: Wrench },
          { to: "/app/map", label: "Map", icon: Map },
          { to: "/app/chat", label: "Chat", icon: MessageCircle },
          { to: "/app/profile", label: "Profile", icon: User },
        ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 pb-[env(safe-area-inset-bottom)]">
      <ul className="grid grid-cols-4 max-w-md mx-auto">
        {tabs.map((t) => {
          const active = t.to === "/app" ? pathname === "/app" : pathname.startsWith(t.to);
          const Icon = t.icon;
          return (
            <li key={t.to}>
              <Link
                to={t.to}
                className={`flex flex-col items-center justify-center gap-1 py-2.5 text-xs transition-colors ${
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? "drop-shadow-[0_0_8px_currentColor]" : ""}`} />
                <span className="font-medium">{t.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
