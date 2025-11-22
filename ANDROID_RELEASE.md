# Android Release Guide for Paradigm IFS

This guide explains how to build and release the Paradigm IFS application for Android using Capacitor.

## 1. Prerequisites

- **Android Studio**: You must have Android Studio installed to build the final APK/AAB.
- **Java JDK**: Usually included with Android Studio.

## 2. Project Structure

- **Web App**: The source code is in `src/`.
- **Android Project**: The native Android code is in `android/`. **Do not edit files in `android/` manually** unless you know what you are doing. Most changes should happen in the web app.

## 3. Development Workflow

When you make changes to the React app (e.g., editing `App.tsx`), follow these steps to update the Android app:

1.  **Build the Web App**:
    ```bash
    npm run build
    ```
    This compiles your React code into the `dist/` folder.

2.  **Sync with Android**:
    ```bash
    npx cap sync
    ```
    This copies the `dist/` folder and any plugin changes to the `android/` native project.

## 4. App Icons and Splash Screen

To generate app icons and splash screens automatically:

1.  Create an `assets` folder in the root directory (if it doesn't exist).
2.  Place your icon as `assets/icon.png` (must be at least 1024x1024px).
3.  Place your splash screen as `assets/splash.png` (must be at least 2732x2732px).
4.  Install the assets tool (if not already installed):
    ```bash
    npm install @capacitor/assets --save-dev
    ```
5.  Generate the resources:
    ```bash
    npx capacitor-assets generate --android
    ```

## 5. Building for Google Play Store

1.  **Open Android Studio**:
    ```bash
    npx cap open android
    ```
    This will launch Android Studio with your project loaded.

2.  **Check Configuration**:
    - Wait for Gradle sync to finish (bottom status bar).
    - Ensure the package name is correct (`com.paradigm.ifs`) in `android/app/build.gradle`.

3.  **Generate Signed Bundle (AAB)**:
    - Go to **Build > Generate Signed Bundle / APK**.
    - Select **Android App Bundle** (best for Play Store) or **APK** (for direct installation).
    - Click **Next**.
    - **Key Store**: You will need to create a new Key Store if you don't have one.
        - Click **Create new...**
        - Save the `.jks` file in a secure location (NOT inside the project folder if you commit to git).
        - Set passwords and fill in the certificate details.
    - Select the key you just created.
    - Click **Next**.
    - Select **release** build variant.
    - Click **Create**.

4.  **Locate the File**:
    - Android Studio will notify you when the build is complete.
    - Click "locate" to find the `.aab` file (usually in `android/app/release/`).

## 6. Publishing to Google Play

1.  Go to the [Google Play Console](https://play.google.com/console).
2.  Create a new app.
3.  Upload the `.aab` file you generated.
4.  Fill in the store listing details (Description, Screenshots, etc.).
    - *Note: You can use the screenshots from your `manifest.json` or take new ones from the emulator.*
5.  Submit for review!

## 7. Troubleshooting

- **White Screen on Launch**: Ensure `npm run build` was run before `npx cap sync`.
- **Network Errors**: Ensure your API URL in `services/api.ts` or `.env` points to the production backend, not `localhost`. Android devices cannot access `localhost` directly (use your machine's IP or a deployed server).

## 8. PWA (Optional)

Your app is also configured as a PWA. You can deploy the `dist/` folder to any static host (Vercel, Netlify, etc.), and users can install it directly from the browser.
