"use client";

import { useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Share } from "@capacitor/share";

export function ShareButton({ title, path }: { title: string; path: string }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = `${window.location.origin}${path}`;

    if (Capacitor.isNativePlatform()) {
      try {
        await Share.share({ title, url, dialogTitle: `Share ${title}` });
      } catch {
        // user dismissed the native share sheet — nothing to do
      }
      return;
    }

    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // dismissed
      }
      return;
    }

    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      onClick={handleShare}
      className="inline-flex items-center gap-1.5 rounded-full border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        className="h-3.5 w-3.5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8.7 10.7 15.3 7M8.7 13.3l6.6 3.7M6.5 14.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Zm11-8a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Zm0 12a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z"
        />
      </svg>
      {copied ? "Link copied" : "Share"}
    </button>
  );
}
