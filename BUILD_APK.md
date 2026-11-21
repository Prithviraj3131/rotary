# How to Build and Download the FloodGuard AI Android APK

FloodGuard AI is packaged as a native Android project using **Capacitor 8**. The native project structure has been generated, configured with necessary location and network permissions, and synced with production web assets in the `android/` directory.

---

## Method 1: Build Using Android Studio (Recommended Local GUI)

If you have [Android Studio](https://developer.android.com/studio) installed:

1. **Open the Android project**:
   ```bash
   npx cap open android
   # or
   npm run cap:open
   ```
   *(Alternatively, launch Android Studio, click **Open**, and select the `d:\hackathon\rotary\android` folder).*

2. **Wait for Gradle Sync**:
   Android Studio will index dependencies and sync Gradle automatically using its internal OpenJDK.

3. **Build the APK**:
   - In the top menu, go to **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**.
   - When finished, a notification popup will say *"Build APK(s): APK(s) generated successfully"*. Click **locate**.

4. **APK Location**:
   Your APK will be ready at:
   ```text
   android/app/build/outputs/apk/debug/app-debug.apk
   ```
   You can copy this `.apk` directly to your phone via USB or install it on an Android Emulator.

---

## Method 2: Build in the Cloud via GitHub Actions (Zero Local Tooling)

If you don't want to install Android Studio or the ~2GB Android SDK locally:

1. **Push this repository to GitHub**:
   ```bash
   git add .
   git commit -m "feat(android): add capacitor native project and build workflow"
   git push origin main
   ```

2. **Automatic Cloud Build**:
   - Go to your repository on GitHub.
   - Click the **Actions** tab.
   - The **Build Android APK** workflow will run automatically.
   - Once completed (~2-3 minutes), click on the workflow run.
   - Under **Artifacts** at the bottom, click **`FloodGuard-AI-debug-apk`** to download your APK as a zip file.

---

## Method 3: Command Line Build (Requires JDK 17 & Android SDK)

If you have OpenJDK 17 and Android SDK command-line tools installed:

1. Ensure `JAVA_HOME` and `ANDROID_HOME` are set in your environment.
2. Run:
   ```bash
   npm run cap:sync
   cd android
   ./gradlew.bat assembleDebug
   ```
3. Locate the generated APK at:
   ```text
   android/app/build/outputs/apk/debug/app-debug.apk
   ```

---

## Android Permissions Configured
The app is configured in [AndroidManifest.xml](file:///d:/hackathon/rotary/android/app/src/main/AndroidManifest.xml) with:
- `android.permission.INTERNET` (API requests & map tiles)
- `android.permission.ACCESS_FINE_LOCATION` (GPS live navigation)
- `android.permission.ACCESS_COARSE_LOCATION` (Network location fallback)
- `android.hardware.location.gps` (Hardware GPS feature requirement)
- `android.permission.ACCESS_NETWORK_STATE` (Offline mesh detection)
- `android.permission.VIBRATE` (Turn-by-turn navigation alerts)
