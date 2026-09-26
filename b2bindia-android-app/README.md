# B2B India — Official Android App

Official native Android application for [b2bindia.site](https://www.b2bindia.site), operated by **Aaudumbar Agro Pvt. Ltd.**

---

## 📱 App Highlights
- **1:1 Complete Parity with Website**: Exact same catalog, 38 industry sectors, 10% advance escrow protection, and real-time APMC Mandi Bhav.
- **Native UPI & Razorpay Support**: Automatic deep-linking into Google Pay, PhonePe, Paytm, and BHIM for escrow checkout.
- **Direct WhatsApp & Phone Integration**: Instant 1-tap buyer-supplier chats (`whatsapp://`) and phone inquiries (`tel:`).
- **Document & Lab Photo Uploads**: Hardware camera and file picker for COA, Phytosanitary, and GST invoices via Android `FileProvider`.
- **Pull-To-Refresh & Offline Protection**: Branded offline recovery view and seamless pull-to-refresh.
- **Fast Startup & Native Splash**: Branded splash screen loading in <1.5 seconds.

---

## 🛠️ Project Structure
```
android/
├── build.gradle                   # Top-level Gradle build configuration
├── settings.gradle                # Project modules (:app)
├── gradle.properties              # JVM & AndroidX optimization
└── app/
    ├── build.gradle               # App SDK targets (compileSdk 34, minSdk 24)
    ├── proguard-rules.pro         # ProGuard / R8 optimization rules
    └── src/main/
        ├── AndroidManifest.xml    # Permissions, activities, deep link schemes
        ├── java/site/b2bindia/app/
        │   ├── SplashActivity.java    # Native branding startup
        │   ├── MainActivity.java      # Advanced WebView & intent routing
        │   └── WebAppInterface.java   # JavaScript bridge (window.AndroidBridge)
        └── res/
            ├── layout/            # activity_main.xml, activity_splash.xml
            ├── values/            # strings.xml, colors.xml, styles.xml
            ├── drawable/          # ic_splash_logo, progress_bar, ic_offline
            └── mipmap-*/          # App launcher icons across all screen densities
```

---

## 🚀 How to Build & Run

### Option 1: Open in Android Studio (Recommended)
1. Launch **Android Studio**.
2. Select **Open an Existing Project** and browse to this directory: `d:\b2b-bharat\android`.
3. Allow Gradle to sync.
4. Connect an Android phone via USB (with USB Debugging enabled) or start an Android Virtual Device (AVD).
5. Click the green **Run (▶)** button or press `Shift + F10`.

### Option 2: Build APK via Command Line
Run in the `android/` directory:
```bash
# Debug APK
./gradlew assembleDebug

# Output APK will be at:
# android/app/build/outputs/apk/debug/app-debug.apk
```

### Option 3: Generate Signed Production Bundle for Google Play Store
1. In Android Studio, go to **Build** → **Generate Signed Bundle / APK**.
2. Select **Android App Bundle (.aab)**.
3. Choose your release keystore and build `app-release.aab`.
4. Upload `app-release.aab` directly to the **Google Play Console** under Package Name: `site.b2bindia.app`.
