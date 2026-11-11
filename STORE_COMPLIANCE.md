# CCPulse - Google Play Store & Apple iOS App Store Compliance & Submission Guide

This document certifies the compliance of **CCPulse** with both the **Google Play Developer Policy** and the **Apple App Store Review Guidelines**.

---

## 1. Apple App Store Compliance (Guideline 3.1.5 - Cryptocurrencies & Financial Services)

### Guideline 3.1.5 (a) Wallets & Virtual Assets
* **Assessment**: CCPulse does **not** provide custodial crypto wallets, does not store user private keys, and does not interact with live blockchain nodes to sign real transactions.
* **Compliance Statement**: All wallet balances (including the default $10,000 USD virtual credit + 1.0 BTC welcome bonus) are purely educational integers stored in local/simulated sandbox databases. No actual cryptocurrency or fiat money can be deposited or withdrawn.

### Guideline 3.1.5 (b) Cryptocurrency Exchange & Trading
* **Assessment**: CCPulse does **not** execute real cryptocurrency exchange transactions.
* **Compliance Statement**: All order books, trade executions, and market order matches occur in an isolated paper-trading sandbox. The app is classified under **Education / Finance Tools (Educational Simulation)**.

### Guideline 4.0 Design & Usability
* **Modern Cross-Platform Typography**: Native system font stack (`-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`) with `font-variant-numeric: tabular-nums` for real-time tickers.
* **Safe Area Insets**: Implemented via `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)` to accommodate iPhone Dynamic Island, camera notches, and home indicator bars.
* **Touch Targets**: All navigation elements, buttons, and form controls exceed Apple's mandatory **44 × 44 pt** minimum interactive target size (styled with 48px min-heights and touch-friendly padding).
* **Responsiveness**: Smooth transitions without horizontal overflow or viewport scale locks (`user-scalable=yes`).
* **Encryption Declaration**: `ITSAppUsesNonExemptEncryption` is set to `<false/>` in `Info.plist`.

---

## 2. Google Play Developer Policy Compliance (Financial Services & Crypto)

### Financial Services Policy (Cryptocurrency Exchanges & Software)
* **Declaration in Google Play Console**:
  * *Does your app facilitate real cryptocurrency trading or exchange services?* **NO**.
  * *Does your app custody user funds or cryptocurrency?* **NO**.
  * *App Category*: **Education** (Subcategory: Financial Literacy / Trading Simulation).
* **Prominent Disclosures**:
  * Prominent disclaimers are placed in the app header, mobile drawer, footer, and simulation view:
    > *"100% Zero Financial Risk & Educational Simulation Platform. No real currency or cryptocurrency is traded, deposited, or withdrawn."*

### Android Material 3 & Device Architecture
* **Touch Targets**: Minimum **48 × 48 dp** for all clickable UI elements.
* **Navigation**: Dedicated Android-standard bottom navigation bar (`mobile-bottom-nav`) and accessible side navigation drawer.
* **Permissions**: Minimal required permissions in `AndroidManifest.xml` (`android.permission.INTERNET` and `ACCESS_NETWORK_STATE`). No sensitive permissions (contacts, storage, camera, SMS) are requested.
* **Offline Resilience**: PWA Service Worker caching app shell and fallback mechanisms for continuous simulation even during connectivity dropouts.

---

## 3. UI/UX Architecture Standards

| Standard | Implementation in CCPulse | Compliance Status |
| :--- | :--- | :--- |
| **Typography** | Native cross-platform system font stack with tabular numerals for real-time price alignment | Verified |
| **Color Contrast** | WCAG 2.1 AA compliant (Minimum 4.5:1 text-to-background contrast on institutional `#0C0E14` and `#141722`) | Verified |
| **Currency Formats** | Standardized US Dollar (`$X,XXX.XX`) with live multi-currency reference (INR, EUR, GBP, AED, JPY) using institutional compact notation (e.g., `₹209.74 Trillion`) | Verified |
| **Interactive Navigation** | Desktop dropdowns (`Cryptocurrencies ▾`, `Exchanges ▾`, `Learn ▾`) + Mobile Bottom Navigation Tab Bar | Verified |
| **Asset Integrity** | Vector SVGs & official high-res assets with zero hotlink 403 errors | Verified |
| **PWA & Offline** | Standalone W3C manifest (`manifest.json`), icons (`192x192`, `512x512`), and service worker (`sw.js`) | Verified |
