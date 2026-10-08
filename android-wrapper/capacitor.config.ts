import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Android wrapper configuration for 4D Results.
 * This wrapper loads the deployed full-stack website so auth, database and admin
 * features continue to use the existing secure server infrastructure.
 */
const config: CapacitorConfig = {
  appId: "com.fourdresults.app",
  appName: "4D Results",
  webDir: "../dist/public",
  server: {
    url: "https://4dresults-dvhcpz7b.manus.space",
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1800,
      launchAutoHide: true,
      backgroundColor: "#070707",
      androidSplashResourceName: "splash",
      showSpinner: false,
    },
  },
};

export default config;
