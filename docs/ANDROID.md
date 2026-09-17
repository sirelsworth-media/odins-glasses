# Android alpha

The Android companion is built with Capacitor 8 and supports Android 7 (API 24)
or later. It packages a generated, read-only snapshot of the public data used by
the desktop application, so searches, planners, crafting, classes, skills and the
NPC-only Money Helper work without a running PC or a permanent connection.

## Build

The supported build is the `Android Alpha` GitHub Actions workflow. It installs
the Android SDK, refreshes the public mobile dataset, builds the web application,
syncs it into the native project and creates a debug-signed APK for testing.

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
