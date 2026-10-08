"use client";

import "leaflet/dist/leaflet.css";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { DiscoveryVendor } from "@/lib/types";

function FitBounds({ vendors, userLocation }: {
  vendors: DiscoveryVendor[];
  userLocation: { lat: number; lng: number } | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (vendors.length === 0) return;
    const points: [number, number][] = vendors.map((vendor) => [vendor.lat, vendor.lng]);
    if (userLocation) points.push([userLocation.lat, userLocation.lng]);
    map.fitBounds(L.latLngBounds(points), { padding: [32, 32], maxZoom: 14, animate: false });
  }, [vendors, userLocation, map]);

  return null;
}

export function MapView({ vendors, fitVendors, userLocation }: {
  vendors: DiscoveryVendor[];
  fitVendors: DiscoveryVendor[];
  userLocation?: { lat: number; lng: number } | null;
}) {
  const router = useRouter();
  const center: [number, number] = vendors.length
    ? [vendors[0].lat, vendors[0].lng]
    : [18.9547, 72.8109];

  return (
    <MapContainer center={center} zoom={12} zoomControl={false} scrollWheelZoom={false} preferCanvas zoomAnimation={false} fadeAnimation={false} style={{ height: "100%", width: "100%" }}>
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>' url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
      <FitBounds vendors={fitVendors} userLocation={userLocation ?? null} />
      {userLocation && <CircleMarker center={[userLocation.lat, userLocation.lng]} radius={8} pathOptions={{ color: "#fff", weight: 3, fillColor: "#2563eb", fillOpacity: 1 }}><Popup>You are here</Popup></CircleMarker>}
      {vendors.map((vendor) => (
        <CircleMarker
          key={vendor.id}
          center={[vendor.lat, vendor.lng]}
          radius={10}
          pathOptions={{ color: "#fff", weight: 3, fillColor: "#ea580c", fillOpacity: 1 }}
          eventHandlers={{ click: () => router.push(`/vendors/${vendor.id}`) }}
        />
      ))}
    </MapContainer>
  );
}
