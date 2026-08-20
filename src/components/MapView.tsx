"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect, useRef } from "react";
import Link from "next/link";
import type { Vendor } from "@/lib/types";
import { CertificationBadge } from "./CertificationBadge";

const CATEGORY_STYLE: Record<Vendor["category"], { color: string; emoji: string }> = {
  chaat: { color: "#f97316", emoji: "🌶️" },
  juice: { color: "#ec4899", emoji: "🥤" },
  snacks: { color: "#3b82f6", emoji: "🍟" },
  sweets: { color: "#a855f7", emoji: "🍬" },
  beverages: { color: "#14b8a6", emoji: "☕" },
  other: { color: "#6b7280", emoji: "🍴" },
};

const RING_COLOR: Record<Vendor["certification_status"], string> = {
  clean_street_food_hub: "#059669",
  fssai_hygiene_rated: "#059669",
  uncertified: "#d97706",
  unknown: "#a3a3a3",
};

function markerIcon(vendor: Vendor) {
  const { color, emoji } = CATEGORY_STYLE[vendor.category];
  const ring = RING_COLOR[vendor.certification_status];
  return L.divIcon({
    className: "",
    html: `<div style="position: relative; width: 34px; height: 34px;">
      <div style="
        width: 34px; height: 34px; border-radius: 50% 50% 50% 0;
        background: ${color}; border: 2.5px solid ${ring};
        transform: rotate(-45deg);
        box-shadow: 0 2px 5px rgba(0,0,0,0.35);
      "></div>
      <div style="
        position: absolute; top: 4px; left: 0; width: 34px; height: 30px;
        display: flex; align-items: center; justify-content: center;
        font-size: 15px;
      ">${emoji}</div>
      ${
        vendor.is_sponsored
          ? `<div style="
              position: absolute; top: -4px; right: -4px; width: 15px; height: 15px;
              border-radius: 50%; background: #fbbf24; border: 1.5px solid white;
              display: flex; align-items: center; justify-content: center;
              font-size: 9px; box-shadow: 0 1px 2px rgba(0,0,0,0.3);
            ">★</div>`
          : ""
      }
    </div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 32],
    popupAnchor: [0, -30],
  });
}

const USER_ICON = L.divIcon({
  className: "",
  html: `<div style="position: relative; width: 20px; height: 20px;">
    <div style="
      position: absolute; inset: 0; border-radius: 50%;
      background: rgba(37, 99, 235, 0.25); animation: khausafe-pulse 1.8s ease-out infinite;
    "></div>
    <div style="
      position: absolute; top: 5px; left: 5px; width: 10px; height: 10px;
      border-radius: 50%; background: #2563eb; border: 2px solid white;
      box-shadow: 0 1px 3px rgba(0,0,0,0.4);
    "></div>
  </div>
  <style>
    @keyframes khausafe-pulse {
      0% { transform: scale(0.6); opacity: 1; }
      100% { transform: scale(2.2); opacity: 0; }
    }
  </style>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

function FitBounds({
  vendors,
  userLocation,
}: {
  vendors: Vendor[];
  userLocation: { lat: number; lng: number } | null;
}) {
  const map = useMap();
  const hasFitOnce = useRef(false);

  useEffect(() => {
    if (vendors.length === 0) return;
    const points: [number, number][] = vendors.map((v) => [v.lat, v.lng]);
    if (userLocation) points.push([userLocation.lat, userLocation.lng]);
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 17 });
    hasFitOnce.current = true;
  }, [vendors, userLocation, map]);

  return null;
}

export function MapView({
  vendors,
  userLocation,
}: {
  vendors: Vendor[];
  userLocation?: { lat: number; lng: number } | null;
}) {
  const center: [number, number] =
    vendors.length > 0 ? [vendors[0].lat, vendors[0].lng] : [18.9547, 72.8109];

  return (
    <MapContainer
      center={center}
      zoom={16}
      scrollWheelZoom
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds vendors={vendors} userLocation={userLocation ?? null} />

      {userLocation && (
        <Marker position={[userLocation.lat, userLocation.lng]} icon={USER_ICON}>
          <Popup>You are here</Popup>
        </Marker>
      )}

      {vendors.map((vendor) => (
        <Marker key={vendor.id} position={[vendor.lat, vendor.lng]} icon={markerIcon(vendor)}>
          <Popup>
            <div className="min-w-[180px] space-y-1.5">
              {vendor.is_sponsored && (
                <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-600">
                  ★ Sponsored
                </p>
              )}
              <p className="font-semibold text-neutral-900">{vendor.name}</p>
              <p className="text-xs text-neutral-500">{vendor.area}</p>
              <CertificationBadge status={vendor.certification_status} />
              <Link
                href={`/vendors/${vendor.id}`}
                className="block pt-1 text-sm font-medium text-orange-700 hover:underline"
              >
                View details →
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
