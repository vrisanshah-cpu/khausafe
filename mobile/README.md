# KhauSafe native apps — manual setup

Everything code-side is done (see the summary in the PR/commit this shipped with). This
document covers what's left, and it all requires accounts/credentials only you have —
none of it can be scripted from here.

## 0. What's already true about this setup

- The apps load `https://khausafe.vercel.app` live (`capacitor.config.ts` → `server.url`).
  There's no offline/bundled copy of the site — a device with zero connectivity will hit
  the platform's own network-error page on cold start, before any of our JS (including the
  offline overlay) can run. The in-app `OfflineOverlay` component only covers losing
  connectivity *after* the app has already loaded — that's the common case, but not the
  cold-start-with-no-signal case. If that matters to you later, the fix is a bundled local
  shell page + native WebView delegate override; flag it if you want it built.
- Bundle ID is `com.khausafe.app` on both platforms. **This cannot be changed after your
  first App Store / Play Store submission** without publishing as a new app — double check
  you're happy with it before you submit anywhere.
- App icon/splash are placeholders (orange `#ea580c`, "KS" wordmark) generated from
  `resources/icon_source.svg` and `resources/splash_source.svg`. To swap in a real logo:
  replace `resources/icon.png` (1024×1024) and `resources/splash.png` (2732×2732) — or edit
  the SVGs and re-render — then run:
  ```bash
  npx capacitor-assets generate
  npx cap sync
  ```
- Push notifications: the plugin is installed and permission-request code exists at
  `src/lib/native/push.ts`, but nothing calls it yet, and there's no FCM/APNs backend wired
  up. See section 4.

## 1. Apple Developer account + Xcode signing (iOS)

You need a Mac for all of this — Xcode doesn't run on Windows, which is also why I
couldn't test `npx cap run ios` myself (see section 6).

1. Enroll at [developer.apple.com/programs](https://developer.apple.com/programs/) —
   $99/year, individual or organization account.
2. On a Mac, install Xcode from the App Store.
3. Copy this whole project to the Mac (or clone the GitHub repo), then run
   `npm install` and `npx cap sync ios`.
4. Open `ios/App/App.xcworkspace` in Xcode (**not** the `.xcodeproj` — Capacitor uses
   CocoaPods/SPM, the workspace is the one that resolves correctly).
5. Select the `App` target → **Signing & Capabilities** tab:
   - Check **Automatically manage signing**.
   - Pick your Team (your Apple Developer account).
   - Xcode will register the `com.khausafe.app` App ID for you the first time it signs.
6. Set a version/build number under the **General** tab (start at `1.0` / `1`).
7. To test on your own iPhone: plug it in, select it as the run destination, hit ▶ — you'll
   be prompted to trust the developer certificate on the phone
   (Settings → General → VPN & Device Management).
8. For push notifications later: **Signing & Capabilities → + Capability → Push
   Notifications**, plus an APNs key from
   [developer.apple.com/account/resources/authkeys](https://developer.apple.com/account/resources/authkeys/list)
   (needed by whatever push backend you wire up).

## 2. Android keystore + signing

1. Install [Android Studio](https://developer.android.com/studio) — this also gives you the
   Android SDK, which is currently missing on this machine (see section 6).
2. Generate a signing key (do this once, keep the file and passwords somewhere safe —
   losing it means you can never update the app under the same listing again):
   ```bash
   keytool -genkey -v -keystore khausafe-release.keystore -alias khausafe -keyalg RSA -keysize 2048 -validity 10000
   ```
3. Create `android/keystore.properties` (not committed — add it to `.gitignore`):
   ```properties
   storeFile=../khausafe-release.keystore
   storePassword=YOUR_STORE_PASSWORD
   keyAlias=khausafe
   keyPassword=YOUR_KEY_PASSWORD
   ```
4. Wire that into `android/app/build.gradle` under a `signingConfigs.release` block pointing
   at those properties, and set `buildTypes.release.signingConfig` to it. (Android Studio's
   **Build → Generate Signed Bundle/APK** wizard will do this file-editing for you if you'd
   rather not hand-edit Gradle.)
5. For push later: create a [Firebase project](https://console.firebase.google.com/), add an
   Android app with package name `com.khausafe.app`, download `google-services.json`, and
   place it at `android/app/google-services.json`.

## 3. Store listings

**App Store Connect** ([appstoreconnect.apple.com](https://appstoreconnect.apple.com/)):
- Create the app record under your Apple Developer account, bundle ID `com.khausafe.app`.
- You'll need: screenshots (per device size), a privacy policy URL (required — the app
  collects location and lets users create accounts/submit content), an App Privacy
  "nutrition label" (declare: location, user-generated content, account email), and an age
  rating questionnaire.
- Given Guideline 4.2 (no bare wrappers): the app now has real native functionality beyond
  the website — native share sheet, native splash/status bar, a native offline state, and
  device geolocation — so it shouldn't read as a bare wrapper. If it still gets flagged,
  the usual next step reviewers accept is adding one or two more native-only touches (haptics
  on key actions, a native bottom tab bar) — say the word if that happens and I'll add them.

**Google Play Console** ([play.google.com/console](https://play.google.com/console/)):
- $25 one-time registration fee.
- Create the app, package name `com.khausafe.app`.
- Complete the **Data safety** form (location, account email, user-submitted reviews/photos
  if any) and the content rating questionnaire.
- Upload the signed `.aab` (Android App Bundle) — Android Studio's build wizard produces
  this directly.

## 4. Push notifications (when you're ready)

Right now `@capacitor/push-notifications` is installed and configured, but nothing requests
permission or registers a device — intentionally, since there's no backend to send anything
yet. When you have one:

1. iOS: APNs key from section 1, step 8.
2. Android: `google-services.json` from section 2, step 5.
3. Call `registerPushNotifications()` from `src/lib/native/push.ts` from wherever makes sense
   UX-wise (e.g. a "notify me about nearby stalls" opt-in, not on cold start).
4. Send the registration token it logs to whatever push backend you choose (Firebase Cloud
   Messaging, OneSignal, etc.) — that backend is out of scope here.

## 5. Keeping the native shell in sync with the deployed site

If you ever move off `khausafe.vercel.app` (custom domain, different host), update
`PRODUCTION_URL` in `capacitor.config.ts`, then run `npx cap sync` and re-submit updated
builds — the URL is baked into the native app at build time, it doesn't update itself.

## 6. Why I couldn't test `cap run ios` / `cap run android` here

This machine is Windows with no Xcode, no Android SDK, and no emulators — confirmed by
actually running both commands:

- `npx cap run ios` → fails immediately; iOS tooling (`xcrun`/`simctl`) doesn't exist on
  Windows at all. This is a hard platform limitation, not a config issue — iOS builds
  require a Mac with Xcode, full stop.
- `npx cap run android` → fails with `ERR_SDK_NOT_FOUND: No valid Android SDK root found.`
  Installing Android Studio (section 2) will fix this — it sets `ANDROID_HOME` and installs
  platform tools/emulator images. Once that's done, `npx cap run android` should work
  directly, or you can open the `android/` folder in Android Studio and run from there.

Everything I *can* verify from here — the code builds, lints, syncs into both native
projects without error, and the plugins are wired into real app behavior (not just
installed) — has been checked. The actual on-device/simulator run is on you once you're on
a Mac (for iOS) and have Android Studio installed (for Android).
