# Android alpha

The Android companion is built with Capacitor 8 and supports Android 7 (API 24)
or later. It packages a generated, read-only snapshot of the public data used by
the desktop application, so searches, planners, crafting, classes, skills and the
NPC-only Money Helper work without a running PC or a permanent connection.

## Build

Tagged releases use the `Release` GitHub Actions workflow and publish a signed
APK directly on the matching GitHub release page. The `Android Alpha` workflow
continues to provide short-lived debug builds for testing. Both workflows install
the Android SDK, refresh the public mobile dataset, build the web application and
sync it into the native project. Tagged releases use the stored release signing key.

For a local build, install Android Studio with Android SDK 36 and Java 21, then run:

```powershell
npm ci
npm run mobile:apk
```

The APK is written to `android/app/build/outputs/apk/debug/app-debug.apk`.

## Data and privacy

The alpha requests only Android's Internet permission. It has no game-client
access, no account login, no telemetry and no player-market data. Its bundled
snapshot is generated from the same attributed public sources and project-owned
overrides documented for the desktop app.
