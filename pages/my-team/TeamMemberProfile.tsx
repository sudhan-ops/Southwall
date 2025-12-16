import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { User, LocationLog } from '../../types';
import { Loader2, ArrowLeft, Clock, MapPin, Navigation } from 'lucide-react';
import { format, differenceInMinutes } from 'date-fns';
import L from 'leaflet';
import DatePicker from '../../components/ui/DatePicker';
import { useThemeStore } from '../../store/themeStore';

// Helper to calculate distance
const getDistanceFromLatLonInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const deg2rad = (deg: number) => deg * (Math.PI / 180);

interface Stop {
    location: { lat: number, lng: number };
    startTime: string;
    endTime: string;
    durationMinutes: number;
    address?: string; // Placeholder for reverse geocoding
}

const TeamMemberProfile: React.FC = () => {
    const { userId } = useParams<{ userId: string }>();
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const [logs, setLogs] = useState<LocationLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const { theme } = useThemeStore();

    // Map Refs
    const mapRef = useRef<L.Map | null>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const polylineRef = useRef<L.Polyline | null>(null);
    const markersRef = useRef<L.LayerGroup>(L.layerGroup());
    const tileLayerRef = useRef<L.TileLayer | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!userId) return;
            setLoading(true);
            try {
                // Ideally get user from a cached list or specific API, here utilizing getAllUsers for simplicity
                // or assume we passed it in state. But fetching specific user is safer.
                // We'll fallback to filtering from getAllUsers if get specific user API missing, 
                // but we check if we can just get basic info.
                // Since api.getUsers() is available, let's use that + find.
                // Optimization: Add api.getUser(id).
                const allUsers = await api.getUsers();
                const foundUser = allUsers.find(u => u.id === userId);
                setUser(foundUser || null);

                const locationLogs = await api.getLocationHistory(userId, date);
                setLogs(locationLogs);
            } catch (error) {
                console.error("Failed to load profile", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [userId, date]);

    // Calculate Stops (Duration Logic)
    const stops = useMemo(() => {
        if (logs.length < 2) return [];
        const detectedStops: Stop[] = [];
        let currentStopStart = logs[0];
        let lastLog = logs[0];

        for (let i = 1; i < logs.length; i++) {
            const log = logs[i];
            const dist = getDistanceFromLatLonInKm(lastLog.latitude, lastLog.longitude, log.latitude, log.longitude);
            const timeDiff = differenceInMinutes(new Date(log.timestamp), new Date(lastLog.timestamp));

            // If moved significantly (> 100m)
            if (dist > 0.1) {
                // Close previous stop if duration > 5 mins
                const stopDuration = differenceInMinutes(new Date(lastLog.timestamp), new Date(currentStopStart.timestamp));
                if (stopDuration >= 5) {
                    detectedStops.push({
                        location: { lat: currentStopStart.latitude, lng: currentStopStart.longitude },
                        startTime: currentStopStart.timestamp,
                        endTime: lastLog.timestamp,
                        durationMinutes: stopDuration
                    });
                }
                currentStopStart = log; // Start new potential stop
            }
            lastLog = log;
        }
        
        // Check final segment
         const finalDuration = differenceInMinutes(new Date(lastLog.timestamp), new Date(currentStopStart.timestamp));
         if (finalDuration >= 5) {
             detectedStops.push({
                location: { lat: currentStopStart.latitude, lng: currentStopStart.longitude },
                startTime: currentStopStart.timestamp,
                endTime: lastLog.timestamp,
                durationMinutes: finalDuration
             });
         }

        return detectedStops;
    }, [logs]);

    // Initialize Map
    useEffect(() => {
        if (mapContainerRef.current && !mapRef.current) {
            mapRef.current = L.map(mapContainerRef.current, { zoomControl: false }).setView([12.9716, 77.5946], 12);
            markersRef.current.addTo(mapRef.current);
            L.control.zoom({ position: 'bottomright' }).addTo(mapRef.current);
        }
        setTimeout(() => mapRef.current?.invalidateSize(), 100);
    }, []);

    // Theme Update
    useEffect(() => {
        if (!mapRef.current) return;
        const isDark = theme === 'dark';
        const tileUrl = isDark 
            ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
            : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        const attribution = isDark
            ? '&copy; OpenStreetMap &copy; CARTO'
            : '&copy; OpenStreetMap contributors';

        if (tileLayerRef.current) {
            tileLayerRef.current.setUrl(tileUrl);
        } else {
            tileLayerRef.current = L.tileLayer(tileUrl, { attribution }).addTo(mapRef.current);
        }
    }, [theme]);

    // Draw Route
    useEffect(() => {
        if (!mapRef.current) return;
        markersRef.current.clearLayers();
        if (polylineRef.current) {
            mapRef.current.removeLayer(polylineRef.current);
            polylineRef.current = null;
        }

        if (logs.length === 0) return;

        const latLngs: L.LatLngTuple[] = logs.map(l => [l.latitude, l.longitude]);
        polylineRef.current = L.polyline(latLngs, { color: '#3b82f6', weight: 4 }).addTo(mapRef.current);

        // Add start/end markers
        const start = latLngs[0];
        const end = latLngs[latLngs.length - 1];
        
        L.marker(start, {
            icon: L.divIcon({ className: '', html: '<div style="width:12px;height:12px;border-radius:50%;background:#10b981;border:2px solid white;"></div>' })
        }).addTo(markersRef.current).bindPopup(`Start: ${format(new Date(logs[0].timestamp), 'hh:mm a')}`);

        L.marker(end, {
             icon: L.divIcon({ className: '', html: '<div style="width:12px;height:12px;border-radius:50%;background:#ef4444;border:2px solid white;"></div>' })
        }).addTo(markersRef.current).bindPopup(`End: ${format(new Date(logs[logs.length-1].timestamp), 'hh:mm a')}`);

        // Add Stop Markers
        stops.forEach((stop, idx) => {
             L.marker([stop.location.lat, stop.location.lng], {
                icon: L.divIcon({ className: '', html: '<div style="width:10px;height:10px;border-radius:50%;background:#f59e0b;border:2px solid white;"></div>' })
            }).addTo(markersRef.current).bindPopup(`
                <b>Stop #${idx + 1}</b><br/>
                ${format(new Date(stop.startTime), 'hh:mm a')} - ${format(new Date(stop.endTime), 'hh:mm a')}<br/>
                Duration: ${Math.floor(stop.durationMinutes / 60)}h ${stop.durationMinutes % 60}m
            `);
        });

        const bounds = L.latLngBounds(latLngs);
        mapRef.current.fitBounds(bounds.pad(0.2));

    }, [logs, stops]);

    const downloadCSV = () => {
        if (!logs.length) return;
        const headers = ['Timestamp', 'Latitude', 'Longitude', 'Accuracy (m)', 'Speed (m/s)', 'Activity'];
        const rows = logs.map(l => [
            l.timestamp,
            l.latitude,
            l.longitude,
            l.accuracy || '',
            l.speed || '',
            l.activityType || ''
        ]);
        
        const csvContent = "data:text/csv;charset=utf-8," 
            + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
            
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${user?.name}_location_history_${date}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin text-accent h-8 w-8" /></div>;
    if (!user) return <div className="p-6 text-center text-muted">User not found.</div>;

    const totalDistance = logs.length > 1 ? logs.reduce((acc, curr, idx) => {
        if (idx === 0) return 0;
        return acc + getDistanceFromLatLonInKm(logs[idx-1].latitude, logs[idx-1].longitude, curr.latitude, curr.longitude);
    }, 0) : 0;

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-4 flex-grow">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-page rounded-full text-muted hover:text-primary-text transition-colors">
                        <ArrowLeft className="h-6 w-6" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-primary-text">{user.name}</h1>
                        <p className="text-sm text-muted capitalize">Role: {user.role.replace('_', ' ')}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                     <button 
                        onClick={downloadCSV}
                        disabled={logs.length === 0}
                        className="px-4 py-2 bg-card border border-border rounded-lg text-sm font-medium hover:bg-accent hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Export CSV
                    </button>
                    <DatePicker label="" id="report-date" value={date} onChange={setDate} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Stats & Timeline */}
                <div className="space-y-6 lg:col-span-1">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-card p-4 rounded-xl border border-border">
                            <div className="flex items-center gap-2 text-muted mb-2">
                                <Navigation className="h-4 w-4" />
                                <span className="text-xs font-medium uppercase">Total Distance</span>
                            </div>
                            <p className="text-2xl font-bold text-primary-text">{totalDistance.toFixed(2)} km</p>
                        </div>
                        <div className="bg-card p-4 rounded-xl border border-border">
                            <div className="flex items-center gap-2 text-muted mb-2">
                                <Clock className="h-4 w-4" />
                                <span className="text-xs font-medium uppercase">Total Stops</span>
                            </div>
                            <p className="text-2xl font-bold text-primary-text">{stops.length}</p>
                        </div>
                    </div>

                    <div className="bg-card rounded-xl border border-border p-4 max-h-[600px] overflow-y-auto">
                        <h3 className="font-semibold text-primary-text mb-4">Daily Timeline</h3>
                        <div className="space-y-6 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                            {stops.length === 0 ? (
                                <p className="text-muted text-sm text-center py-4 pl-4">No significant stops detected.</p>
                            ) : stops.map((stop, i) => (
                                <div key={i} className="relative pl-8">
                                    <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-accent border-4 border-card z-10"></div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-mono text-muted">
                                            {format(new Date(stop.startTime), 'hh:mm a')} - {format(new Date(stop.endTime), 'hh:mm a')}
                                        </span>
                                        <span className="font-medium text-primary-text">Stop #{i + 1}</span>
                                        <span className="text-xs text-accent">
                                            Duration: {Math.floor(stop.durationMinutes / 60)}h {stop.durationMinutes % 60}m
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Map */}
                <div className="lg:col-span-2 h-[600px] bg-card rounded-xl border border-border overflow-hidden relative z-0">
                    <div ref={mapContainerRef} className="h-full w-full" />
                </div>
            </div>
        </div>
    );
};

export default TeamMemberProfile;
