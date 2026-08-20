"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect } from "react";
import Link from "next/link";
import type { Vendor } from "@/lib/types";
import { CertificationBadge } from "./CertificationBadge";

const MARKER_COLOR: Record<Vendor["certification_status"], string> = {
  clean_street_food_hub: "#059669",
  fssai_hygiene_rated: "#059669",
  uncertified: "#d97706",
  unknown: "#737373",
};

function markerIcon(status: Vendor["certification_status"]) {
  const color = MARKER_COLOR[status];
  return L.divIcon({
    className: "",
    html: `<div style="
      width: 20px; height: 20px; border-radius: 50%;
      background: ${color}; border: 2px solid white;
      box-shadow: 0 1px 4px rgba(0,0,0,0.4);
    "></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10],
  });
}

function FitBounds({ vendors }: { vendors: Vendor[] }) {
  const map = useMap();
  useEffect(() => {
    if (vendors.length === 0) return;
    const bounds = L.latLngBounds(vendors.map((v) => [v.lat, v.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 17 });
  }, [vendors, map]);
  return null;
}

export function MapView({ vendors }: { vendors: Vendor[] }) {
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
      <FitBounds vendors={vendors} />
      {vendors.map((vendor) => (
        <Marker
          key={vendor.id}
          position={[vendor.lat, vendor.lng]}
          icon={markerIcon(vendor.certification_status)}
        >
          <Popup>
            <div className="min-w-[180px] space-y-1.5">
              <p className="font-semibold text-neutral-900">{vendor.name}</p>
              <p className="text-xs text-neutral-500">{vendor.area}</p>
              <CertificationBadge status={vendor.certification_status} />
              <Link
                href={`/vendors/${vendor.id}`}
                className="block pt-1 text-sm font-medium text-emerald-700 hover:underline"
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
