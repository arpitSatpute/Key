# Key – Virtual Hardware Keys (Android)

A production-ready Android mobile application built with **React Native 0.88** and native **Android Kotlin integration** (`compileSdk 37`, `minSdk 24`, `targetSdk 36`).

Virtual Hardware Keys provides system-wide floating controls that remain accessible above all applications (browsers, games, media players, messaging apps, and home screen) to replace or supplement physical hardware buttons.

---

## 🚀 Key Features

### 1. Independent Sidebar-Type Edge Keys (Ultra-Sleek Monochrome Design)
- **Independent Layout & Snapping**: Every key (`Power`, `Volume Up`, `Volume Down`, `Custom Alert`) is an independent sidebar-type edge tab that can be dragged and docked anywhere along the left or right display bezel. Empty space between keys passes touches directly to underlying applications.
- **50% Width Reduction (24dp Protrusion)**: Protrudes only 24dp from the bezel into the display (and 17px in the interactive simulator), hugging the screen edge so it never obstructs games, video playback, or reading.
- **Transparent Crystal Glass & Monochrome Default**: Rendered in ultra-transparent glass (`#1A000000` / ~90% transparent) with crisp `#FFFFFF` monochrome borders, icons, and grip accents inspired by Nothing OS and Leica industrial design.
- **Hold-to-Repeat Volume & Long Press Engine**: Integrated gesture detection supporting single tap, double tap, tap-and-hold (400ms timeout for Android system power dialog), and continuous 120ms repeating volume adjustments.

### 2. Edge Arc / Semi-Circle Jog Wheel (Attached Volume Dialer)
- **Bezel-Docked Architecture**: Tapping either volume button summons a semi-circle jog wheel docked flush against the phone bezel directly where that volume key is located.
- **Dual Rotary & Swiping Gestures**: Trace your thumb in a curved arc or swipe vertically along the edge to adjust audio volume.
- **Precision Graduated Ticks**: 11 radial tick marks (0% to 100%) that illuminate in crisp white as the volume increases.
- **Tactile Haptic Feedback**: Delivers subtle haptic ticks on every discrete step change.
- **Live Visuals**: High-contrast white speaker icon, active audio stream badge (`MEDIA`, `RING`, `CALL`, `ALARM`), and real-time percentage readout (`75%`).
- **Auto-Dismiss**: Fades away automatically after 3.5 seconds of inactivity or upon tapping outside the semi-circle.

### 3. Virtual Power Key
- **Screen Lock**: Locks the screen and turns the display off directly on tap via `GLOBAL_ACTION_LOCK_SCREEN` (Android 9+) or `DevicePolicyManager.lockNow()`.
- **System Power Menu**: Opens the native Android Power dialog (`GLOBAL_ACTION_POWER_DIALOG`) via the privacy-respecting `KeyAccessibilityService`.
- **Gesture Mappings**: Single tap, double tap, and long press can be configured independently.

### 4. Custom Alert Key
- **Silent Mode Cycle**: Toggles between Normal, Vibrate, and Silent ringer states.
- **Do Not Disturb (DND)**: Toggles system DND priority filters via `NotificationManager`.
- **Emergency Shortcut**: Launches the phone dialer pre-populated with an emergency contact number via `Intent.ACTION_DIAL`.
- **Custom Apps & Sounds**: Triggers configurable alert tones or launches specified apps.

### 5. Full SafeAreaView Integration
- Configured with `edges={['top', 'bottom', 'left', 'right']}` across all screens, protecting headers from camera punch-holes, status bar notches, and dynamic islands, and preventing navigation overlaps with Android's gesture bar.

---

## 🛠️ Architecture

```
Key/
├── android/
│   └── app/src/main/
│       ├── java/com/key/
│       │   ├── modules/              # React Native Native Modules (Kotlin)
│       │   │   ├── PowerKeyModule.kt
│       │   │   ├── VolumeKeyModule.kt
│       │   │   ├── AlertKeyModule.kt
│       │   │   ├── FloatingKeyModule.kt
│       │   │   └── PermissionModule.kt
│       │   ├── overlay/              # WindowManager Overlay & Custom Views
│       │   │   ├── FloatingKeyManager.kt
│       │   │   ├── IndependentKeyView.kt  # 24dp transparent edge tab with gesture engine
│       │   │   └── VolumeDialView.kt     # Bezel-docked semi-circle jog wheel
│       │   ├── services/             # Android Foreground Service
│       │   │   └── FloatingKeyService.kt
│       │   ├── hardware/             # Hardware System Dispatcher
│       │   │   └── KeyActionDispatcher.kt
│       │   ├── accessibility/        # Global Actions Accessibility Service
│       │   │   └── KeyAccessibilityService.kt
│       │   ├── receivers/            # Device Admin & Boot Broadcast Receivers
│       │   │   ├── AdminReceiver.kt
│       │   │   └── BootReceiver.kt
│       │   └── preferences/          # SharedPreferences persistence
│       │       └── KeyPreferences.kt
│       └── res/
│           ├── mipmap-*/             # Multi-density app launcher icons
│           └── AndroidManifest.xml
│
├── src/
│   ├── assets/
│   │   └── logo.png                  # Master monochrome app logo
│   ├── components/
│   │   ├── FloatingKeyPreview.tsx    # Interactive phone simulator with edge jog wheel
│   │   ├── KeyCard.tsx               # Dashboard key toggle cards
│   │   ├── PermissionItem.tsx        # Guided permission onboarding rows
│   │   ├── Header.tsx                # Custom navigation header with app logo
│   │   ├── StatusBadge.tsx           # Active / Inactive status indicator
│   │   └── SettingRow.tsx            # Clean monochrome settings row
│   ├── screens/
│   │   ├── DashboardScreen.tsx       # Master switch, layout preview & live test bar
│   │   ├── CustomizeKeysScreen.tsx   # Per-key edge and vertical position arrangement
│   │   ├── KeySettingsScreen.tsx     # Deep per-key gesture and action configuration
│   │   ├── PermissionsScreen.tsx     # Guided permission verification and test actions
│   │   ├── AppearanceScreen.tsx      # Theme, button size, shape, opacity & haptics
│   │   └── GeneralSettingsScreen.tsx # Boot auto-start, battery optimization & about
│   ├── store/
│   │   └── useKeyStore.ts            # Zustand store synced with native SharedPreferences
│   ├── theme/
│   │   └── colors.ts                 # Obsidian monochrome black-and-white theme
│   └── navigation/
│       └── RootNavigator.tsx         # React Navigation stack
```

---

## 🔒 Android Permissions Guide

| Permission | Purpose | Type |
| :--- | :--- | :--- |
| **Display Over Other Apps** (`SYSTEM_ALERT_WINDOW`) | Allows floating keys and the volume jog wheel to draw over all apps | **Mandatory** |
| **Foreground Service** (`FOREGROUND_SERVICE_SPECIAL_USE`) | Keeps overlay controls alive persistently in the background | **Mandatory** |
| **Accessibility Service** (`BIND_ACCESSIBILITY_SERVICE`) | Executes global screen lock and Android Power Dialog without root | **Recommended** |
| **Notification Policy** (`ACCESS_NOTIFICATION_POLICY`) | Allows toggling Do Not Disturb and silent audio ringer modes | **Recommended** |
| **Ignore Battery Optimizations** (`REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`) | Prevents aggressive OEM background task killers from terminating service | **Recommended** |
| **Start on Boot** (`RECEIVE_BOOT_COMPLETED`) | Automatically restores virtual keys after phone reboot | **Optional** |
| **Device Administrator** (`BIND_DEVICE_ADMIN`) | Legacy fallback for instant screen lock (`lockNow()`) | **Optional** |

---

## 💻 Terminal Commands: Build & Deploy

### 1. Build Release APK
```bash
cd android && ./gradlew assembleRelease
```
The output APK is generated at:
```
android/app/build/outputs/apk/release/app-release.apk
```

### 2. Connect Device & Install / Update via ADB
Connect your Android phone with **USB Debugging** enabled:
```bash
# Verify connection
adb devices

# Install or update preserving app data
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

### 3. Quick-Grant Permissions via ADB
```bash
# Overlay permission
adb shell appops set com.key SYSTEM_ALERT_WINDOW allow

# Accessibility service
adb shell settings put secure enabled_accessibility_services com.key/com.key.accessibility.KeyAccessibilityService
adb shell settings put secure accessibility_enabled 1

# Notification policy
adb shell cmd notification allow_listener com.key
```
