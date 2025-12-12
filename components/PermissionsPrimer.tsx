import React, { useState, useEffect } from 'react';
import { useMediaQuery } from '../hooks/useMediaQuery';
import Logo from './ui/Logo';
import Button from './ui/Button';
import { useBrandingStore } from '../store/brandingStore';

interface PermissionsPrimerProps {
  onComplete: () => void;
}

type PermissionStatus = 'prompt' | 'granted' | 'denied';

const PermissionsPrimer: React.FC<PermissionsPrimerProps> = ({ onComplete }) => {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const { colorScheme } = useBrandingStore();
  const [locationStatus, setLocationStatus] = useState<PermissionStatus>('prompt');
  const [cameraStatus, setCameraStatus] = useState<PermissionStatus>('prompt');
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allPermissionsGranted = locationStatus === 'granted' && cameraStatus === 'granted';

  // SouthWall Blue Color Constants
  const isBlue = colorScheme === 'blue';
  const bgColor = isBlue ? 'bg-[#1a3a6e]' : 'bg-white';
  const textColor = isBlue ? 'text-white' : 'text-gray-600';
  const headingColor = isBlue ? 'text-white' : 'text-gray-900';
  const cardBg = isBlue ? 'bg-white/10 border-white/20' : 'bg-gray-100 border-gray-300';
  const cardTitle = isBlue ? 'text-white' : 'text-gray-900';
  const cardText = isBlue ? 'text-gray-300' : 'text-gray-600';

  useEffect(() => {
    // If not on mobile, or if all permissions are already granted, complete immediately.
    if (!isMobile || allPermissionsGranted) {
      onComplete();
    }
  }, [isMobile, allPermissionsGranted, onComplete]);

  const requestPermissions = async () => {
    setIsRequesting(true);
    setError(null);

    // --- NATIVE MOBILE IMPLEMENTATION ---
    // If using Capacitor/Cordova, the permission checks and requests
    // should be done here using the native plugins. For example:
    //
    // For Capacitor:
    // import { Camera, CameraResultType } from '@capacitor/camera';
    // import { Geolocation } from '@capacitor/geolocation';
    //
    // const checkPermissions = async () => {
    //   const camPerms = await Camera.checkPermissions();
    //   const locPerms = await Geolocation.checkPermissions();
    //   setCameraStatus(camPerms.camera);
    //   setLocationStatus(locPerms.location);
    // };
    //
    // const requestNativePermissions = async () => {
    //   const camResult = await Camera.requestPermissions();
    //   setCameraStatus(camResult.camera);
    //
    //   const locResult = await Geolocation.requestPermissions();
    //   setLocationStatus(locResult.location);
    //
    //   if(camResult.camera === 'granted' && locResult.location === 'granted') {
    //      onComplete();
    //   } else {
    //      setError('Please grant all permissions to continue.');
    //   }
    // }
    //
    // We will use standard browser APIs as a fallback for web/PWA context.

    try {
      // 1. Request Camera Permission
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setCameraStatus('granted');
        // Stop the track immediately after permission is granted
        stream.getTracks().forEach(track => track.stop());
      } catch (err) {
        setCameraStatus('denied');
        throw new Error('Camera permission was denied.');
      }

      // 2. Request Location Permission
      try {
        await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            () => {
              setLocationStatus('granted');
              resolve(true);
            },
            () => {
              setLocationStatus('denied');
              reject(new Error('Location permission was denied.'));
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
          );
        });
      } catch (err) {
        throw new Error('Location permission was denied.');
      }
      
      // If both permissions are granted, complete
      onComplete();

    } catch (err: any) {
      setError(err.message || 'Permissions are required to use this app.');
    } finally {
      setIsRequesting(false);
    }
  };

  if (!isMobile) {
    return null; // Don't render anything on desktop
  }

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 text-center ${bgColor}`}>
      <div className="splash-logo">
        <Logo className="h-16 mb-8" />
      </div>
      <div className="max-w-md">
        <h1 className={`text-2xl font-bold mb-4 ${headingColor}`}>Permissions Required</h1>
        <p className={`mb-8 ${textColor}`}>
          To ensure the best experience and enable features like location-based check-ins and photo uploads,
          we need access to your device's Camera and Location.
        </p>

        <div className="space-y-4 mb-8">
          <div className={`p-4 rounded-lg border ${locationStatus === 'granted' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-100' : cardBg}`}>
            <p className={`font-semibold ${cardTitle}`}>Location Access</p>
            <p className={`text-sm ${cardText}`}>{locationStatus === 'granted' ? 'Permission Granted' : 'Needed for check-in/out'}</p>
          </div>
          <div className={`p-4 rounded-lg border ${cameraStatus === 'granted' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-100' : cardBg}`}>
            <p className={`font-semibold ${cardTitle}`}>Camera Access</p>
            <p className={`text-sm ${cardText}`}>{cameraStatus === 'granted' ? 'Permission Granted' : 'Needed for identity verification'}</p>
          </div>
        </div>

        <Button onClick={requestPermissions} disabled={isRequesting} className={isBlue ? 'w-full bg-white text-[#1a3a6e] hover:bg-gray-100' : 'w-full'}>
          {isRequesting ? 'Requesting...' : 'Grant Permissions'}
        </Button>

        {error && <p className="text-red-500 mt-4">{error}</p>}
        
        <p className={`text-xs mt-8 ${isBlue ? 'text-white/50' : 'text-gray-500'}`}>
          You can manage these permissions in your device settings at any time.
        </p>
      </div>
    </div>
  );
};

export default PermissionsPrimer;
