import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { haversineKm, etaMinutes, useGeolocation } from "@/lib/geo";
import type { MapMarker } from "@/components/MapView";

const MapView = lazy(() => import("@/components/MapView").then((m) => ({ default: m.MapView })));

export const Route = createFileRoute("/_authenticated/app/map")({
  head: () => ({ meta: [{ title: "Map — OVHA" }] }),
  component: MapPage,
});

function MapPage() {
  const { user, profile } = useAuth();
  const [center, setCenter] = useState<[number, number] | null>(null);
  const [markers, setMarkers] = useState<MapMarker[]>([]);

  useEffect(() => {
    useGeolocation().then((p) => setCenter([p.lat, p.lng])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user || !profile) return;
    let mounted = true;
    async function load() {
      if (profile!.role === "driver") {
        // Nearby online mechanics
        const { data } = await supabase
          .from("profiles")
          .select("id,full_name,specialization,last_lat,last_lng,is_online")
          .eq("role", "mechanic")
          .eq("is_online", true);
        if (!mounted || !data) return;
        const here = center ? { lat: center[0], lng: center[1] } : null;
        setMarkers(
          data
            .filter((m) => m.last_lat != null && m.last_lng != null)
            .map((m) => {
              const dist = here ? haversineKm(here, { lat: m.last_lat!, lng: m.last_lng! }) : null;
              return {
                id: m.id,
                lat: m.last_lat!, lng: m.last_lng!,
                label: m.full_name || "Mechanic",
                sub: dist !== null ? `${dist.toFixed(1)} km · ETA ${etaMinutes(dist)} min` : m.specialization || undefined,
              } as MapMarker;
            }),
        );
      } else {
        const { data } = await supabase
          .from("sos_requests")
          .select("id,issue_type,lat,lng,status")
          .eq("status", "pending");
        if (!mounted || !data) return;
        setMarkers(data.map((r) => ({ id: r.id, lat: r.lat, lng: r.lng, label: r.issue_type, sub: "Pending SOS" })));
      }
    }
    load();
    const ch = supabase
      .channel("map-updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "sos_requests" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, load)
      .subscribe();
    return () => { mounted = false; supabase.removeChannel(ch); };
  }, [user, profile, center]);

  return (
    <div className="h-[calc(100vh-4rem)] relative">
      <Suspense fallback={<div className="h-full grid place-items-center text-muted-foreground">Loading map…</div>}>
        <MapView center={center} markers={markers} height="100%" />
      </Suspense>
      <div className="absolute top-3 left-3 right-3 z-[1000] card-soft px-4 py-2.5 text-xs flex justify-between items-center">
        <span className="font-semibold">{profile?.role === "driver" ? "Nearby mechanics" : "Pending SOS requests"}</span>
        <span className="text-muted-foreground">{markers.length} visible</span>
      </div>
    </div>
  );
}
