"use client";

import { useEffect, useState } from "react";
import { Network } from "@capacitor/network";

/**
 * A non-blocking offline indicator. The service worker and IndexedDB cache
 * keep previously visited discovery data usable, so losing connectivity must
 * not cover the entire app with an error screen.
 */
export function OfflineOverlay() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    let mounted = true;

    Network.getStatus().then((status) => {
      if (mounted) setOffline(!status.connected);
    });

    const listener = Network.addListener("networkStatusChange", (status) => {
      setOffline(!status.connected);
    });

    return () => {
      mounted = false;
      listener.then((l) => l.remove());
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      className="fixed inset-x-3 z-[9999] mx-auto flex max-w-md items-center justify-center gap-2 rounded-full bg-neutral-900/95 px-4 py-2 text-center text-xs font-medium text-white shadow-lg backdrop-blur"
      style={{ top: "calc(3.75rem + var(--safe-top))" }}
      role="status"
    >
      <span aria-hidden>📡</span>
      Offline — showing saved stalls; some map tiles may be unavailable.
    </div>
  );
}
