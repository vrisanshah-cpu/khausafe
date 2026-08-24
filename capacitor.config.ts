import type { CapacitorConfig } from '@capacitor/cli';

// Loads the live deployed site instead of a bundled local copy. Point this at
// your Vercel production domain — if you attach a custom domain later, update
// this and re-run `npx cap sync`.
const PRODUCTION_URL = 'https://khausafe.vercel.app';

const config: CapacitorConfig = {
  appId: 'com.khausafe.app',
  appName: 'KhauSafe',
  webDir: 'www',
  server: {
    url: PRODUCTION_URL,
    cleartext: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 800,
      launchAutoHide: true,
      backgroundColor: '#ea580c',
      showSpinner: true,
      spinnerColor: '#ffffff',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#ea580c',
      overlaysWebView: false,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
  ios: {
    contentInset: 'automatic',
  },
};

export default config;
