import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icons in bundlers
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  label: string;
  sub?: string;
  color?: "blue" | "red" | "green";
}

function Recenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => { map.setView(center); }, [center, map]);
  return null;
}

export function MapView({
  center,
  markers,
  height = "100%",
}: {
  center: [number, number] | null;
  markers: MapMarker[];
  height?: string;
}) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const c = useMemo<[number, number]>(() => center ?? [20.5937, 78.9629], [center]);

  if (!ready) {
    return <div className="grid place-items-center text-muted-foreground" style={{ height }}>Loading map…</div>;
  }
  return (
    <div style={{ height, width: "100%" }}>
      <MapContainer center={c} zoom={center ? 14 : 5} style={{ height: "100%", width: "100%" }} zoomControl={false}>
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Recenter center={c} />
        {center && (
          <CircleMarker center={c} radius={9} pathOptions={{ color: "#4FC3F7", fillColor: "#4FC3F7", fillOpacity: 0.7 }}>
            <Popup>You are here</Popup>
          </CircleMarker>
        )}
        {markers.map((m) => (
          <Marker key={m.id} position={[m.lat, m.lng]}>
            <Popup>
              <div className="text-sm">
                <div className="font-semibold">{m.label}</div>
                {m.sub && <div className="text-xs opacity-80">{m.sub}</div>}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
