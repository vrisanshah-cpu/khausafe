"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";

/**
 * Runs once, only inside the native app shell (no-ops on the plain web
 * deployment). Keeps the status bar in sync with the brand color — the
 * capacitor.config.ts values set the *launch* appearance, this covers
 * re-assertion after things like keyboard show/hide or webview reloads.
 */
export function NativeBootstrap() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    StatusBar.setStyle({ style: Style.Light }).catch(() => {});
    StatusBar.setBackgroundColor({ color: "#ea580c" }).catch(() => {});
  }, []);

  return null;
}
