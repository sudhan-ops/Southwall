import { useEffect, useRef, useState } from "react";
import { api } from "../services/api";
import { useAuthStore } from "../store/authStore";

const TRACKING_INTERVAL = 5 * 60 * 1000; // 5 minutes
const MIN_DISTANCE_METERS = 50; // Only log if moved > 50m

export const useLocationTracker = () => {
    const { user } = useAuthStore();
    const [isTracking, setIsTracking] = useState(false);
    const lastPositionRef = useRef<{ lat: number; lng: number } | null>(null);

    useEffect(() => {
        if (!user) return;

        let intervalId: NodeJS.Timeout;
        let watchId: number;

        const logPosition = async (position: GeolocationPosition) => {
            const { latitude, longitude, accuracy, speed } = position.coords;

            // Check distance filter
            if (lastPositionRef.current) {
                const dist = calculateDistance(
                    lastPositionRef.current.lat,
                    lastPositionRef.current.lng,
                    latitude,
                    longitude,
                );
                if (dist < MIN_DISTANCE_METERS) return; // Haven't moved enough
            }

            try {
                // Determine activity type based on speed (rough estimation)
                let activity = "still";
                if ((speed || 0) > 1 && (speed || 0) < 5) activity = "walking";
                if ((speed || 0) >= 5) activity = "vehicle";

                await api.logLocation({
                    userId: user.id,
                    latitude,
                    longitude,
                    accuracy,
                    speed: speed || 0,
                    activityType: activity,
                    timestamp: new Date().toISOString(),
                });
                lastPositionRef.current = { lat: latitude, lng: longitude };
                console.log("Location logged:", latitude, longitude);
            } catch (error) {
                console.error("Failed to log location", error);
            }
        };

        const startTracking = () => {
            if (!("geolocation" in navigator)) {
                console.error("Geolocation not supported");
                return;
            }

            setIsTracking(true);

            // 1. Initial Position
            navigator.geolocation.getCurrentPosition(
                logPosition,
                console.error,
            );

            // 2. Watch Position (Active Movement)
            let lastWatchLog = 0;
            watchId = navigator.geolocation.watchPosition(
                (pos) => {
                    const now = Date.now();
                    if (now - lastWatchLog > 30000) { // Throttle: Max once every 30s
                        logPosition(pos);
                        lastWatchLog = now;
                    }
                },
                (err) => {
                    if (err.code === 3) { // Timeout
                        console.warn("Watch Position Timeout - retrying...");
                    } else {
                        console.error("Watch Position Error:", err);
                    }
                },
                { enableHighAccuracy: true, maximumAge: 30000, timeout: 60000 },
            );

            // 3. Periodic Ping (Heartbeat)
            intervalId = setInterval(() => {
                navigator.geolocation.getCurrentPosition(
                    logPosition,
                    console.error,
                    {
                        enableHighAccuracy: true,
                    },
                );
            }, TRACKING_INTERVAL);
        };

        startTracking();

        return () => {
            setIsTracking(false);
            if (watchId) navigator.geolocation.clearWatch(watchId);
            if (intervalId) clearInterval(intervalId);
        };
    }, [user]); // Only restart if user changes

    return { isTracking };
};

// Haversine formula for distance
function calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
) {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}
