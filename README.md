# CCPulse – Cryptocurrency Educational & Simulation Platform (v2.0)

A comprehensive, production-grade cryptocurrency simulation and learning ecosystem featuring a dynamic cryptocurrency registry, dedicated admin control panel, auditable virtual wallet with mandatory $5,000 USD welcome bonus, multi-currency real-time conversion (USD, INR, EUR, GBP, AED, JPY), dark/light theme management, and Android hybrid compatibility.

---

## 🌟 Key Functional Modules

### 1. Dedicated Admin Control Panel
- **Overview Dashboard**: Real-time KPI cards for registered users, anonymous guests, active users, total portfolios, transactions executed, total virtual money distributed, supported cryptocurrencies, top-viewed coins, most simulated coins, and learning academy graduation metrics.
- **Dynamic Cryptocurrency Registry**: Add, edit, or toggle cryptocurrency visibility without touching code. Initially configured with Bitcoin (BTC), Ethereum (ETH), Monero (XMR), Beldex (BDX), and Solana (SOL). Newly added coins immediately appear across all market lists, simulator order forms, charts, and simulation engines.
- **Deactivation & Deletion Protection**: Safely prevents accidental deletion of coins that have existing user positions or trade history; archives and deactivates instead to preserve ledger integrity.
- **User Management**: Search, filter, view portfolios, creation dates, last logins; activate, deactivate, or suspend accounts; secure administrator-assisted password resets.
- **Virtual Balance Management**: Grant or deduct virtual credits with mandatory audit reasons; view complete welcome bonus distribution history and audit trail.
- **Audit Logs**: Immutable records of all administrator actions with diffs of old and new values.

### 2. Anonymous Guest & Authenticated User System
- **Guest Exploration**: "Continue as Guest" allows full exploration of market charts, cryptocurrency profiles, learning academy courses, and simulation lab testing with a temporary $5,000 simulator session.
- **Authenticated Accounts**: Private virtual wallet, $5,000 welcome bonus, transaction history, learning badges, watchlist, and custom display preferences.

### 3. Mandatory $5,000 USD Welcome Bonus
- Every newly registered authenticated user automatically receives exactly **$5,000.00 USD** in virtual trading credits.
- Credited atomically via database transactions with duplicate prevention constraints.
- Recorded in the virtual ledger as `"CCPulse Welcome Bonus"`.
- Celebratory welcome notification modal displayed upon registration.
- Subsequent logins retain existing balances without duplicate credit distributions.

### 4. Theme Management (Modern Web Guidance Compliant)
- **Dark Mode**: Deep navy background (`#070A12`), black trading panels (`#0E1626`), cyan (`#00F0FF`) and blue (`#3B82F6`) accents, purple gradients (`#8B5CF6`), and glassmorphism.
- **Light Mode**: Clean white background (`#F8FAFC`), light grey panels, high-contrast text (`#0F172A`), and clear chart visualization.
- **System Default**: Automatic adaptation to device preferences.
- Zero page flashing (FOUC) via inline head script and `<meta name="color-scheme">` mapping.

### 5. Real-Time Multi-Currency Conversion
- **Base Accounting Currency**: USD (guarantees strict financial consistency).
- **Supported Display Currencies**: USD ($), INR (₹), EUR (€), GBP (£), AED (د.إ), JPY (¥).
- **Dynamic Conversion**: Automatically converts wallet balance, holdings, crypto prices, P&L, order calculations, and charts. For example, $5,000 USD displays as approx. ₹4,26,250 INR when INR is selected.
- **Live Forex Integration**: Real-time rate fetching with fallback caching, stale-data indicators, and manual refresh controls.

### 6. Mobile & Android Hybrid Compatibility
- Mobile hamburger navigation drawer with touch gestures.
- Complete Android configuration (`capacitor.config.json`, `AndroidManifest.xml`, `MainActivity.java`).

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### Installation & Startup
```bash
# Navigate to project directory
cd /home/ino-lap-244/.gemini/antigravity/scratch/ccpulse

# Start the application server
npm start
```
The server will start on port 4000:
- **Web Application**: [http://localhost:4000](http://localhost:4000)
- **Health Check**: [http://localhost:4000/api/health](http://localhost:4000/api/health)

---

## 🔑 Default Credentials

| Role | Username | Email | Password |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | `admin@ccpulse.com` | `Admin@CCPulse2026!` |
| **Standard Trader** | `cryptotrader` | `trader@ccpulse.com` | `Trader@123456` |

---

## 🧪 Automated Test Suite (20 Acceptance Scenarios)

Run the comprehensive 20-scenario acceptance test suite:
```bash
npm test
```

All 20 test scenarios pass:
1. New user registration
2. Automatic $5,000 welcome bonus
3. Prevent duplicate welcome bonuses
4. Existing user login without bonus duplication
5. Guest user access
6. Guest-to-authenticated account conversion
7. User wallet persistence
8. User data isolation
9. Admin-only access validation
10. Add new cryptocurrency through admin registry
11. Deactivate cryptocurrency & deletion safety guard
12. Theme switching between dark, light, and system default
13. Persist theme preferences
14. Real-time currency conversion from USD to INR
15. Currency cross-conversion calculation
16. Verify conversion calculations across all supported currencies
17. Handle exchange-rate API failure gracefully
18. Handle market-data API failure gracefully
19. Test mobile responsiveness
20. Test Android application compatibility

