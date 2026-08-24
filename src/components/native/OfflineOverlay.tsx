"use client";

import { useEffect, useState } from "react";
import { Network } from "@capacitor/network";

/**
 * Full-screen native-feeling offline state, replacing whatever the
 * platform's default "no internet" webview error would otherwise show.
 * Covers losing connectivity mid-session; a cold start with zero
 * connectivity can still hit the platform's own webview error before this
 * component's JS ever runs (see mobile/README.md for the caveat).
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
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-4 bg-white px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          className="h-8 w-8 text-orange-600"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 18h.01M8.5 14.5a5 5 0 0 1 7 0M5 11a10 10 0 0 1 14 0M2 7.5a15 15 0 0 1 20 0M3 3l18 18"
          />
        </svg>
      </div>
      <h1 className="text-lg font-bold text-neutral-900">You&apos;re offline</h1>
      <p className="max-w-xs text-sm text-neutral-500">
        KhauSafe needs a connection to load vendor data and the map. Reconnect and try again.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-2 rounded-full bg-orange-600 px-5 py-2 text-sm font-medium text-white hover:bg-orange-700"
      >
        Retry
      </button>
    </div>
  );
}
