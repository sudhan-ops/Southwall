import React, { useEffect, useState } from 'react';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { Camera } from '@capacitor/camera';
import { PushNotifications } from '@capacitor/push-notifications';
import { Filesystem } from '@capacitor/filesystem';
import { App } from '@capacitor/app';

// Define the interface for our custom plugin
interface SecurityCheckPlugin {
    getSecurityStatus(): Promise<{
        developerMode: boolean;
        microphoneGranted: boolean;
        calendarGranted: boolean;
        contactsGranted: boolean;
        filesGranted: boolean;
        activityGranted: boolean;
    }>;
}

const SecurityCheck = registerPlugin<SecurityCheckPlugin>('SecurityCheck');

interface PermissionGuardProps {
    children: React.ReactNode;
}

interface PermissionState {
    location: boolean;
    camera: boolean;
    notification: boolean;
    microphone: boolean;
    storage: boolean;
    calendar: boolean;
    contacts: boolean;
    activity: boolean;
}

interface SecurityState {
    developerMode: boolean;
}

const PermissionGuard: React.FC<PermissionGuardProps> = ({ children }) => {
    const [permissions, setPermissions] = useState<PermissionState>({
        location: false,
        camera: false,
        notification: false,
        microphone: false,
        storage: false,
        calendar: false,
        contacts: false,
        activity: false,
    });
    const [security, setSecurity] = useState<SecurityState>({
        developerMode: false,
    });
    const [loading, setLoading] = useState(true);

    const isNative = Capacitor.isNativePlatform();

    const checkPermissionsAndSecurity = async () => {
        if (!isNative) {
            setLoading(false);
            return;
        }

        try {
            // 0. Security Checks + Native Permission Checks
            let devMode = false;
            let nativeMicGranted = false;
            let nativeCalendarGranted = false;
            let nativeContactsGranted = false;
            let nativeFilesGranted = false;
            let nativeActivityGranted = false;

            try {
                // Native plugin checks OS manifest permission directly
                const status = await SecurityCheck.getSecurityStatus();
                devMode = status.developerMode;
                nativeMicGranted = status.microphoneGranted === true;
                nativeCalendarGranted = status.calendarGranted === true;
                nativeContactsGranted = status.contactsGranted === true;
                nativeFilesGranted = status.filesGranted === true;
                nativeActivityGranted = status.activityGranted === true;
            } catch (e) {
                console.warn("Failed to check security status or plugin not available", e);
            }

            // 1. Location
            const locationStatus = await Geolocation.checkPermissions();
            const locationGranted = locationStatus.location === 'granted' || locationStatus.coarseLocation === 'granted';

            // 2. Camera
            const cameraStatus = await Camera.checkPermissions();
            const cameraGranted = cameraStatus.camera === 'granted' || cameraStatus.photos === 'granted';

            // 3. Notifications
            let notificationGranted = false;
            try {
                const notificationStatus = await PushNotifications.checkPermissions();
                notificationGranted = notificationStatus.receive === 'granted';
            } catch (e) {
                console.warn('Push details not available or failed', e);
            }

            // 4. Storage (Filesystem)
            const storageStatus = await Filesystem.checkPermissions();
            const storageGranted = storageStatus.publicStorage === 'granted';

            // 5. Microphone
            // Use the native check result.
            const microphoneGranted = nativeMicGranted;


            setPermissions({
                location: locationGranted,
                camera: cameraGranted,
                notification: notificationGranted,
                storage: storageGranted,
                microphone: microphoneGranted,
                calendar: nativeCalendarGranted,
                contacts: nativeContactsGranted,
                activity: nativeActivityGranted,
            });
            setSecurity({
                developerMode: devMode
            });

        } catch (error) {
            console.error('Error checking permissions:', error);
        } finally {
            setLoading(false);
        }
    };

    const requestAllPermissions = async () => {
        if (!isNative) return;

        if (!permissions.location) {
            try { await Geolocation.requestPermissions(); } catch (e) { }
        }
        if (!permissions.camera) {
            try { await Camera.requestPermissions(); } catch (e) { }
        }
        if (!permissions.notification) {
            try { await PushNotifications.requestPermissions(); } catch (e) { }
        }
        if (!permissions.storage) {
            try { await Filesystem.requestPermissions(); } catch (e) { }
        }

        // For microphone, we don't have a direct "request" method from our custom plugin (yet).
        // But we can try using the standard user media request which triggers the robust prompt.
        // Or we rely on the user having gone to settings if they are stuck.
        // Ideally, we'd add a `requestMicrophonePermission` to the native plugin too, but
        // `getUserMedia` usually successfully *triggers* the dialog, just fails to resolve successfully.
        // So keeping this might still be useful to TRIGGER the prompt.
        if (!permissions.microphone) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                stream.getTracks().forEach(track => track.stop());
            } catch (err) { }
        }

        await checkPermissionsAndSecurity();
    };


    useEffect(() => {
        // Initial check
        checkPermissionsAndSecurity();

        // Re-check on resume
        const resumeListener = App.addListener('appStateChange', ({ isActive }) => {
            if (isActive) {
                checkPermissionsAndSecurity();
            }
        });

        return () => {
            resumeListener.then(handle => handle.remove());
        }
    }, [isNative]);

    if (!isNative) {
        return <>{children}</>;
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-100">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    // Security Check: Developer Options
    if (security.developerMode) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-red-50 px-6 text-center">
                <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
                    <div className="mb-6">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                            <svg className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Security Alert</h2>
                    <p className="text-gray-600 mb-6">
                        Developer Options are enabled on this device.
                    </p>
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 text-left">
                        <p className="text-sm text-yellow-700">
                            To continue using this application, you must <strong>disable Developer Options</strong> in your device settings.
                        </p>
                        <p className="text-xs text-yellow-600 mt-2">
                            This is required to prevent location spoofing (Fake GPS) and ensure data integrity.
                        </p>
                    </div>

                    <button
                        onClick={() => checkPermissionsAndSecurity()}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200"
                    >
                        I have disabled them, Retry
                    </button>
                </div>
            </div>
        );
    }

    const allGranted =
        permissions.location &&
        permissions.camera &&
        permissions.notification &&
        permissions.storage &&
        permissions.microphone &&
        permissions.calendar &&
        permissions.contacts &&
        permissions.activity;

    if (allGranted) {
        return <>{children}</>;
    }

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-50 px-6 text-center">
            <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
                <div className="mb-6">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
                        <svg className="h-10 w-10 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-2">Permissions Required</h2>
                <p className="text-gray-600 mb-6">
                    To use this application, you must grant access to Location, Camera, Notifications, Microphone, and Storage.
                </p>

                <div className="w-full space-y-4 mb-6 text-left text-sm">
                    <PermissionItem label="Location" granted={permissions.location} />
                    <PermissionItem label="Camera" granted={permissions.camera} />
                    <PermissionItem label="Notifications" granted={permissions.notification} />
                    <PermissionItem label="Microphone" granted={permissions.microphone} />
                    <PermissionItem label="Storage" granted={permissions.storage} />
                </div>

                <button
                    onClick={requestAllPermissions}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200"
                >
                    Grant Permissions
                </button>
            </div>
        </div>
    );
};

const PermissionItem: React.FC<{ label: string; granted: boolean }> = ({ label, granted }) => (
    <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
        <span className="font-medium text-gray-700">{label}</span>
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${granted ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {granted ? 'ALLOWED' : 'MISSING'}
        </span>
    </div>
);

export default PermissionGuard;
