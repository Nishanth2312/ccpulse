# iOS Build & App Store Deployment Guide

This directory contains iOS integration specifications for **CCPulse** using Capacitor / WebKit native containers.

## App Store Submission Checklist
1. **Bundle Identifier**: `com.ccpulse.app`
2. **Category**: `Education` / `Finance` (Educational Simulation)
3. **App Store Review Guideline 3.1.5 Compliance**:
   - The app does not facilitate real financial transactions or custodial cryptocurrency transfers.
   - All trades and currency balances are purely educational simulations.
4. **Human Interface Guidelines (HIG)**:
   - Safe Area Insets configured in CSS (`env(safe-area-inset-top)` & `env(safe-area-inset-bottom)`).
   - Bottom Tab Bar conforms to iOS TabBar layout standards.

