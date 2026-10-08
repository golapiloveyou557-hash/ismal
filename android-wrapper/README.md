# Android APK wrapper — 4D Results

## Provisional app identity

| Setting                        | Current value                            | Change before store submission?                                           |
| ------------------------------ | ---------------------------------------- | ------------------------------------------------------------------------- |
| Brand name                     | `4D Results`                             | Yes, if the final business brand changes                                  |
| Android package/application ID | `com.fourdresults.app`                   | Yes, before first Play Store release; changing it later creates a new app |
| Website URL                    | `https://4dresults-dvhcpz7b.manus.space` | Keep the production domain stable                                         |
| Icon source                    | `android-wrapper/icon.svg`               | Export to Android launcher sizes using Android Studio Image Asset Studio  |
| Theme                          | Black, gold and red                      | Keep consistent with the website                                          |

## Why the package name matters

The Android package name is the permanent application identity. `com.fourdresults.app` is a provisional choice based on the current brand. If the final brand name is different, change `appId` in `capacitor.config.ts` before creating the Android project. Do not change it after publishing an APK to the Play Store unless a new application identity is intended.

## Build prerequisites

The current sandbox has Node.js but does not have Android SDK, Gradle or `adb`, so a signed APK cannot be compiled or installed from this session. Build on a machine with Android Studio installed, Android SDK Platform 35, Android Build Tools, JDK 17, Node.js 22 and npm/pnpm.

## Capacitor build steps

From the project root:

```bash
pnpm install
pnpm build
pnpm add @capacitor/core @capacitor/cli @capacitor/android
pnpm exec cap init "4D Results" "com.fourdresults.app" --web-dir dist/public
# Replace the generated capacitor.config with android-wrapper/capacitor.config.ts
pnpm exec cap add android
pnpm exec cap copy android
pnpm exec cap sync android
pnpm exec cap open android
```

Inside Android Studio, use **Build > Generate Signed Bundle / APK > APK**, create a private keystore, and store the keystore/password outside the repository. For a local debug APK:

```bash
cd android
./gradlew assembleDebug
```

Install a debug build on a connected device with:

```bash
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

For production, use a release keystore, test sign-in, member routes, social links, deposit review and notification flows on a real Android device, then upload the signed AAB/APK through the intended distribution channel. Never send Gmail passwords, keystore files or signing passwords in chat.

## Contact-link verification completed

The final public destinations returned HTTP 200 in this environment:

- Facebook: `https://www.facebook.com/malaysiasingapore4d6d/`
- WhatsApp: `https://wa.me/8801324360629` → redirected to the WhatsApp send endpoint
- Telegram: `https://t.me/+8801706559143`

The current Instagram contact is `@4d6dmktshe`.
