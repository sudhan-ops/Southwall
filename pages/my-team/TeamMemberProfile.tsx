import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { User, LocationLog } from '../../types';
import { Loader2, ArrowLeft, Clock, MapPin, Navigation } from 'lucide-react';
import { format, differenceInMinutes } from 'date-fns';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css'; // Ensure CSS is loaded
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

            if (dist > 0.1) {
                const stopDuration = differenceInMinutes(new Date(lastLog.timestamp), new Date(currentStopStart.timestamp));
                if (stopDuration >= 5) {
                    detectedStops.push({
                        location: { lat: currentStopStart.latitude, lng: currentStopStart.longitude },
                        startTime: currentStopStart.timestamp,
                        endTime: lastLog.timestamp,
                        durationMinutes: stopDuration
                    });
                }
                currentStopStart = log; 
            }
            lastLog = log;
        }
        
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
        // Ensure container exists
        if (!mapContainerRef.current) return;

        // Cleanup existing map if present (Strict Mode safety)
        if (mapRef.current) {
            mapRef.current.remove();
            mapRef.current = null;
        }

        const map = L.map(mapContainerRef.current, { zoomControl: false }).setView([12.9716, 77.5946], 12);
        mapRef.current = map;
        
        markersRef.current = L.layerGroup().addTo(map);
        L.control.zoom({ position: 'bottomright' }).addTo(map);

        // Force resize to prevent grey/white tiles
        setTimeout(() => {
            map.invalidateSize();
        }, 200);

        return () => {
            map.remove();
            mapRef.current = null;
        };
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

    // Draw Route with Attendance Bounds
    useEffect(() => {
        if (!mapRef.current) return;
        
        const drawMap = async () => {
             markersRef.current.clearLayers();
            if (polylineRef.current) {
                mapRef.current?.removeLayer(polylineRef.current);
                polylineRef.current = null;
            }

            if (!userId) return;

            // Fetch Attendance for bounds (Shift Start/End)
            let filteredLogs = logs;
            let startLocation = null;
            let endLocation = null;

            try {
                 const attendance = await api.getAttendanceEvents(userId, date, date); // date, date acts as start/end for the day
                 // Find first check-in and last check-out
                 const checkIns = attendance.filter(a => a.type === 'check-in').sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
                 const checkOuts = attendance.filter(a => a.type === 'check-out').sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()); // Desc

                 if (checkIns.length > 0) {
                     const firstCheckIn = checkIns[0];
                     const lastCheckOut = checkOuts.length > 0 ? checkOuts[0] : null;

                     // Set strict Start Point from Check-In if available
                     if (firstCheckIn.latitude && firstCheckIn.longitude) {
                         startLocation = { lat: firstCheckIn.latitude, lng: firstCheckIn.longitude, time: firstCheckIn.timestamp };
                     }

                     // Filter logs to be AFTER check-in
                     filteredLogs = filteredLogs.filter(l => new Date(l.timestamp) >= new Date(firstCheckIn.timestamp));

                     if (lastCheckOut) {
                         // Filter logs to be BEFORE check-out
                         filteredLogs = filteredLogs.filter(l => new Date(l.timestamp) <= new Date(lastCheckOut.timestamp));
                         
                         // Set strict End Point from Check-Out if available
                         if (lastCheckOut.latitude && lastCheckOut.longitude) {
                             endLocation = { lat: lastCheckOut.latitude, lng: lastCheckOut.longitude, time: lastCheckOut.timestamp };
                         }
                     }
                 }
            } catch (e) {
                console.error("Failed to fetch attendance for map bounds", e);
            }

            // Fallback if no logs or attendance
            if (filteredLogs.length === 0 && !startLocation) return;

            // Prepare Points
            const points: L.LatLngTuple[] = [];
            if (startLocation) points.push([startLocation.lat, startLocation.lng]);
            points.push(...filteredLogs.map(l => [l.latitude, l.longitude] as L.LatLngTuple));
            if (endLocation) points.push([endLocation.lat, endLocation.lng]);

            // Draw Polyline
            if (points.length > 0) {
                 polylineRef.current = L.polyline(points, { color: '#f97316', weight: 5 }).addTo(mapRef.current!); // Orange route
            }

            // Markers
            // 1. Start (House/Login)
            if (startLocation || points.length > 0) {
                const startPt = startLocation ? [startLocation.lat, startLocation.lng] : points[0];
                const startIcon = L.divIcon({
                    className: 'custom-map-icon',
                    html: `<div style="background-color: #10b981; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                           </div>`,
                    iconSize: [32, 32],
                    iconAnchor: [16, 32],
                    popupAnchor: [0, -32]
                });
                L.marker(startPt as L.LatLngTuple, { icon: startIcon }).addTo(markersRef.current)
                 .bindPopup(`<b>Duty Start</b><br/>${startLocation ? format(new Date(startLocation.time), 'hh:mm a') : 'Unknown'}`);
            }

            // 2. End (Flag/Logout)
            if (endLocation || points.length > 0) {
                 const endPt = endLocation ? [endLocation.lat, endLocation.lng] : points[points.length-1];
                 // Only show separate end marker if it's different from start or we have movement
                 if (points.length > 1) {
                    const endIcon = L.divIcon({
                        className: 'custom-map-icon',
                        html: `<div style="background-color: #ef4444; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
                               </div>`,
                        iconSize: [32, 32],
                        iconAnchor: [16, 32],
                         popupAnchor: [0, -32]
                    });
                    L.marker(endPt as L.LatLngTuple, { icon: endIcon }).addTo(markersRef.current)
                     .bindPopup(`<b>Duty End</b><br/>${endLocation ? format(new Date(endLocation.time), 'hh:mm a') : 'Current'}`);
                 }
            }

            // 3. Stops (Numbered)
            stops.forEach((stop, idx) => {
                 const stopIcon = L.divIcon({
                    className: 'custom-map-icon',
                    html: `<div style="background-color: #3b82f6; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
                            ${idx + 1}
                           </div>`,
                    iconSize: [28, 28],
                    iconAnchor: [14, 14]
                });
                
                L.marker([stop.location.lat, stop.location.lng], { icon: stopIcon }).addTo(markersRef.current)
                .bindPopup(`
                    <b>Stop #${idx + 1}</b><br/>
                    ${format(new Date(stop.startTime), 'hh:mm a')} - ${format(new Date(stop.endTime), 'hh:mm a')}<br/>
                    Duration: ${Math.floor(stop.durationMinutes / 60)}h ${stop.durationMinutes % 60}m
                `);
            });

            if (points.length > 0) {
                const bounds = L.latLngBounds(points);
                mapRef.current!.fitBounds(bounds.pad(0.2));
            }
        };

        drawMap();

    }, [logs, stops, userId, date]); // Re-run when logs or date changes

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
