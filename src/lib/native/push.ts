import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";

/**
 * Setup only — no push provider (FCM/APNs backend, token storage, send
 * pipeline) is wired up yet. This is intentionally NOT called anywhere in
 * the app yet: requesting push permission on first launch with nothing to
 * send is bad UX and will read as dead functionality in App Store review.
 *
 * Call this once you have a real reason to ask (e.g. after the user opts
 * in to "notify me about new stalls near me" in a settings screen), and
 * wire the `registration`/`pushNotificationReceived` listeners to your
 * backend of choice.
 */
export async function registerPushNotifications() {
  if (!Capacitor.isNativePlatform()) return;

  const permission = await PushNotifications.requestPermissions();
  if (permission.receive !== "granted") return;

  await PushNotifications.register();

  PushNotifications.addListener("registration", (token) => {
    // TODO: send token.value to your push backend once one exists.
    console.log("Push registration token:", token.value);
  });

  PushNotifications.addListener("registrationError", (error) => {
    console.error("Push registration error:", error);
  });
}
