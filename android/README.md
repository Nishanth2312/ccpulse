# CCPulse – Android Hybrid Application

This directory contains the Android application configuration and native WebView bridge for CCPulse.

## Architecture
- **Package Name**: `com.ccpulse.app`
- **Application Type**: Android Hybrid WebView / Capacitor Application
- **Default Server Endpoint**:
  - Android Emulator: `http://10.0.2.2:4000` (maps to host localhost:4000)
  - Physical Device / Cloud: Update `DEFAULT_APP_URL` or `capacitor.config.json` server URL to the production server domain or local LAN IP.

## Features on Android
1. **Cloud Account Synchronization**: Authenticated accounts, portfolios, $5,000 welcome bonuses, and trade histories sync across web and Android devices in real-time.
2. **Touch-Optimized Mobile Drawer**: Responsive navigation with native touch gesture support.
3. **Hardware Back Button Handling**: Managed via `MainActivity.java onBackPressed()` to navigate browser history.
4. **Theme Adaptation**: Respects Android system dark mode and in-app theme toggle with zero FOUC.
5. **Multi-Currency Real-Time Conversion**: Formatted with native internationalization on Android.

