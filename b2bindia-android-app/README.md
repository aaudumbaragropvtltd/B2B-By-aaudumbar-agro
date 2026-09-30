# B2B India — Official Native Android App

Official native Android application for **[b2bindia.site](https://www.b2bindia.site)**, operated by **Aaudumbar Agro Pvt. Ltd.**

This project is completely isolated inside `b2bindia-android-app/` and does **not** alter or affect the web marketplace code.

---

## 📱 Custom Native Screens & Features

### 1. 🧭 Native Material Bottom Navigation Bar
- Pinned at the bottom with 5 native navigation tabs:
  - **Home**: Main wholesale homepage (`/`)
  - **Directory**: 38 Industry Sectors (`/directory`)
  - **Mandi Bhav**: Real-time APMC Mandi Rates (`/market-rates`)
  - **Orders**: Escrow-protected orders & buyer dashboard (`/dashboard/orders`)
  - **Support**: 24x7 Trade Help Desk (`/support`)
- **Two-Way URL Synchronization**: Tapping a bottom tab navigates immediately. When navigating inside the platform, the bottom navigation bar automatically updates its active tab state.

### 2. ⚡ Native Top App Bar (MaterialToolbar)
- Displays **B2B India** branding and verified wholesale network subtitle.
- **WhatsApp Direct Action**: One-tap launch into official WhatsApp trade chat (`whatsapp://send?phone=918408841998`).
- **Helpline Dialer**: One-tap phone dialer to B2B India's official trade desk (`tel:+918408841998`).

### 3. 🛡️ Native Offline Trade Dashboard
- When internet connectivity is lost, the app replaces the web view with a custom native card dashboard:
  - **Direct Wholesale Helpline**: Call or WhatsApp even when offline.
  - **100% Escrow Guarantee Details**: Verification notes on escrow protection and buyer quality checks.
  - **APMC Mandi Bhav Support**: Direct desk contact for spot mandi rates across 500+ Indian APMCs.
  - **1-Tap Reconnect Button**: Re-checks network connectivity and resumes live shopping seamlessly.

### 4. 💳 Indian Payment Gateway & Hardware Capabilities
- **UPI Deep Linking**: Seamless one-tap redirect to Google Pay, PhonePe, Paytm, and BHIM.
- **Hardware Camera & Document Upload**: Native file chooser for COA, Phytosanitary, and GST invoices via `FileProvider`.
- **Swipe-To-Refresh**: Native pull-to-refresh tied to top scroll position.
- **Download Manager**: Automated PDF invoice and test report downloads to device Downloads folder.

---

## 🛠️ Project Structure
```
b2bindia-android-app/
├── build.gradle                   # Top-level Gradle build configuration
├── settings.gradle                # Project modules (:app)
├── gradle.properties              # JVM & AndroidX optimization
├── local.properties               # Configured SDK path (C:\Users\rsevm\AppData\Local\Android\Sdk)
└── app/
    ├── build.gradle               # compileSdk 34, minSdk 24, targetSdk 34
    ├── proguard-rules.pro         # ProGuard / R8 optimization rules
    └── src/main/
        ├── AndroidManifest.xml    # Permissions, deep links (b2bindia:// and b2bindia.site)
        ├── java/site/b2bindia/app/
        │   ├── SplashActivity.java    # Native branding startup
        │   ├── MainActivity.java      # Native Toolbar, BottomNav, Offline Dashboard & Bridge
        │   └── WebAppInterface.java   # JavaScript bridge (window.AndroidBridge)
        └── res/
            ├── layout/
            │   ├── activity_main.xml       # Native Toolbar + WebView + Offline Dashboard + BottomNav
            │   └── activity_splash.xml     # Native Splash layout
            ├── menu/
            │   ├── bottom_nav_menu.xml     # 5-tab menu
            │   └── top_toolbar_menu.xml    # WhatsApp & Call action items
            ├── color/
            │   └── bottom_nav_colors.xml   # Active/inactive tint selector
            ├── values/
            │   ├── strings.xml             # All localized strings
            │   ├── colors.xml              # Brand palette (Primary #006AFF, Emerald #10B981)
            │   └── styles.xml              # DayNight themes
            ├── drawable/                   # Vector icons for tabs, WhatsApp, call, shield & offline
            └── mipmap-*/                   # Launcher icons for all device densities
```

---

## 🚀 How to Open & Build in Android Studio

1. **Open Android Studio**:
   - In Android Studio's welcome screen (or from **File** → **Open...**), navigate to:
     ```
     D:\b2b-bharat\b2bindia-android-app
     ```
   - Click **OK**.

2. **Sync Project with Gradle Files**:
   - Android Studio will automatically recognize the project and download the Gradle distribution and dependencies.
   - If prompted, click **Sync Now**.

3. **Run on Device or Emulator**:
   - Connect your Android device via USB (with Developer Options > USB Debugging enabled), or start an Android Emulator (AVD).
   - Click the green **Run (▶)** button in the top toolbar or press `Shift + F10`.

4. **Build Production APK / AAB**:
   - In Android Studio menu, click **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**.
   - For Google Play Store submission: **Build** → **Generate Signed Bundle / APK** → select **Android App Bundle (.aab)**.
