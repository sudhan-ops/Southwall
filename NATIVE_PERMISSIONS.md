# Native App Permission Configuration

For the Camera and Geolocation features to function correctly in the native Android and iOS apps, you must configure the respective project files to declare the required permissions. This allows the app to request these permissions from the user.

## Android Configuration

In your Android project, you need to add the following permission declarations to the `AndroidManifest.xml` file, which is typically located at `android/app/src/main/AndroidManifest.xml`.

Make sure these lines are present inside the `<manifest>` tag, but outside the `<application>` tag.

```xml
<!-- Permissions for Camera -->
<uses-permission android:name="android.permission.CAMERA" />
<uses-feature android:name="android.hardware.camera" android:required="true" />

<!-- Permissions for Geolocation -->
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-feature android:name="android.hardware.location.gps" />
```

**Explanation:**
-   `android.permission.CAMERA`: Required to access the device's camera.
-   `android.hardware.camera`: Declares that the app uses a camera, making it available only to devices that have one.
-   `android.permission.ACCESS_COARSE_LOCATION`: Allows the app to determine location using Wi-Fi or mobile cell data.
-   `android.permission.ACCESS_FINE_LOCATION`: Allows the app to determine a precise location from GPS.

## iOS Configuration

For iOS, you need to add keys with usage descriptions to your `Info.plist` file, located at `ios/App/App/Info.plist`. These descriptions are shown to the user when the permission prompt appears.

Add the following keys and strings to the main dictionary of your `Info.plist`:

```xml
<key>NSCameraUsageDescription</key>
<string>This app needs access to your camera to verify your identity during check-in and check-out.</string>

<key>NSLocationWhenInUseUsageDescription</key>
<string>This app needs access to your location to verify your position for attendance check-ins and check-outs.</string>

<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>This app needs access to your location to verify your position for attendance check-ins and check-outs.</string>

<key>NSLocationUsageDescription</key>
<string>This app needs access to your location to verify your position for attendance check-ins and check-outs.</string>
```

**Explanation:**
-   `NSCameraUsageDescription`: Explains why the app needs camera access.
-   `NSLocationWhenInUseUsageDescription`: Explains why the app needs location access while it is being used.
-   `NSLocationAlwaysAndWhenInUseUsageDescription` and `NSLocationUsageDescription`: Provide additional descriptions for different location permission scenarios. It's good practice to include them for broad compatibility.

## Important Note for Capacitor/Cordova Users

If you are using a framework like Capacitor or Cordova, these tools often have their own plugins for handling permissions (e.g., `@capacitor/geolocation`, `@capacitor/camera`). When you install these plugins, they may automatically add some of these required configurations.

However, it is **highly recommended** to manually verify that these entries are present and that the usage descriptions are clear and user-friendly.

In the React code (`components/PermissionsPrimer.tsx` and `utils/permissions.ts`), there are commented-out sections marked with `--- NATIVE MOBILE IMPLEMENTATION ---`. You should replace the browser-based permission logic with the corresponding functions from your native plugin library to ensure the most reliable performance on mobile devices.