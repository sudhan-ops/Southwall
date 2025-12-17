import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { User, LocationLog, AttendanceEvent } from '../../types';
import { Loader2, ArrowLeft, Clock, MapPin, Navigation, MoveRight, Calendar } from 'lucide-react';
import { format, differenceInMinutes, parseISO, isValid } from 'date-fns';
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

interface TimelineItem {
    type: 'work' | 'travel';
    startTime: string;
    endTime: string;
    durationMinutes: number;
    distanceKm?: number;
    startLocation?: { lat: number; lng: number };
    endLocation?: { lat: number; lng: number };
    address?: string;
    locationId?: string | null;
}

const TeamMemberProfile: React.FC = () => {
    const { userId } = useParams<{ userId: string }>();
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const [logs, setLogs] = useState<LocationLog[]>([]);
    const [events, setEvents] = useState<AttendanceEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const { theme } = useThemeStore();

    useEffect(() => {
        const fetchData = async () => {
            if (!userId) return;
            setLoading(true);
            try {
                const allUsers = await api.getUsers();
                const foundUser = allUsers.find(u => u.id === userId);
                setUser(foundUser || null);

                // Fetch logs
                const locationLogs = await api.getLocationHistory(userId, date);
                setLogs(locationLogs);

                // Fetch attendance events (Stops)
                const startOfDay = `${date}T00:00:00`;
                const endOfDay = `${date}T23:59:59`;
                const attendanceEvents = await api.getAttendanceEvents(userId, startOfDay, endOfDay);
                setEvents(attendanceEvents);

            } catch (error) {
                console.error("Failed to load profile", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [userId, date]);

    // Calculate Path Distance specifically from Logs
    const calculatePathDistance = (start: string, end: string) => {
        if (!logs.length) return 0; // Fallback? 
        const startDate = new Date(start).getTime();
        const endDate = new Date(end).getTime();

        const relevantLogs = logs.filter(l => {
            const t = new Date(l.timestamp).getTime();
            return t >= startDate && t <= endDate;
        });

        if (relevantLogs.length < 2) return 0;

        let totalDist = 0;
        for (let i = 1; i < relevantLogs.length; i++) {
            totalDist += getDistanceFromLatLonInKm(
                relevantLogs[i - 1].latitude,
                relevantLogs[i - 1].longitude,
                relevantLogs[i].latitude,
                relevantLogs[i].longitude
            );
        }
        return totalDist;
    };

    // Core Logic: Segment the day into Work (at location) and Travel (between locations)
    const timelineData = useMemo(() => {
        const items: TimelineItem[] = [];
        // Sort events by time
        const sortedEvents = [...events].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        // We process pairs of In -> Out
        let lastCheckOutTime: string | null = null;
        let lastCheckOutLocation: { lat: number, lng: number } | null = null;
        
        let ptr = 0;

        while (ptr < sortedEvents.length) {
            const e = sortedEvents[ptr];
            
            if (e.type === 'check-in') {
                // 1. Calculate Travel from PREVIOUS checkout to THIS checkin
                if (lastCheckOutTime && lastCheckOutLocation) {
                    // Check if time difference is rational (e.g. positive)
                    if (new Date(e.timestamp) > new Date(lastCheckOutTime)) {
                        const travelDist = calculatePathDistance(lastCheckOutTime, e.timestamp);
                        const travelDur = differenceInMinutes(parseISO(e.timestamp), parseISO(lastCheckOutTime));
                        
                        // Only add travel if it's significant (e.g. >1 min or >100m) 
                        // But user wants to see calculation, so we include it.
                        items.push({
                            type: 'travel',
                            startTime: lastCheckOutTime,
                            endTime: e.timestamp,
                            durationMinutes: travelDur,
                            distanceKm: travelDist,
                            startLocation: lastCheckOutLocation,
                            endLocation: { lat: e.latitude || 0, lng: e.longitude || 0 }
                        });
                    }
                }

                // 2. Find matching checkout for THIS checkin
                // Look ahead for the next event.
                const nextE = sortedEvents[ptr + 1];
                
                if (nextE && nextE.type === 'check-out') {
                    // Standard Session: Check In -> Check Out
                    const duration = differenceInMinutes(parseISO(nextE.timestamp), parseISO(e.timestamp));
                    items.push({
                        type: 'work',
                        startTime: e.timestamp,
                        endTime: nextE.timestamp,
                        durationMinutes: duration,
                        locationId: e.locationId,
                        startLocation: { lat: e.latitude || 0, lng: e.longitude || 0 }
                    });

                    // Set checkout state for NEXT loop
                    lastCheckOutTime = nextE.timestamp;
                    lastCheckOutLocation = { lat: nextE.latitude || 0, lng: nextE.longitude || 0 };
                    
                    ptr += 2; // Consume both events
                } else {
                    // Incomplete Session: Check In -> (Next is In OR End of List)
                    items.push({
                        type: 'work',
                        startTime: e.timestamp,
                        endTime: "In Progress",
                        durationMinutes: 0, // Cannot calculate finished duration
                        locationId: e.locationId,
                        startLocation: { lat: e.latitude || 0, lng: e.longitude || 0 }
                    });
                    
                    // Cannot calculate travel from this point onwards as we don't have an end time
                    lastCheckOutTime = null; 
                    lastCheckOutLocation = null;
                    ptr += 1; // Consume only Check In
                }

            } else {
                // Encountered a Check-Out without a preceding Check-In (Dangling)
                // Just ignore it or advance
                ptr += 1;
            }
        }

        return items;
    }, [events, logs]);

    const stats = useMemo(() => {
        const totalDist = timelineData
            .filter(i => i.type === 'travel')
            .reduce((acc, curr) => acc + (curr.distanceKm || 0), 0);
        
        const totalTravelMins = timelineData
            .filter(i => i.type === 'travel')
            .reduce((acc, curr) => acc + curr.durationMinutes, 0);

        const totalWorkMins = timelineData
            .filter(i => i.type === 'work' && i.endTime !== "In Progress")
            .reduce((acc, curr) => acc + curr.durationMinutes, 0);

        return { totalDist, totalTravelMins, totalWorkMins };
    }, [timelineData]);

     const downloadCSV = () => {
        if (!timelineData.length) return;
        const headers = ['Type', 'Start Time', 'End Time', 'Duration (m)', 'Distance (km)', 'Location'];
        const rows = timelineData.map(item => [
            item.type.toUpperCase(),
            format(parseISO(item.startTime), 'yyyy-MM-dd HH:mm:ss'),
            item.endTime === "In Progress" ? "In Progress" : format(parseISO(item.endTime), 'yyyy-MM-dd HH:mm:ss'),
            item.durationMinutes,
            item.distanceKm ? item.distanceKm.toFixed(2) : '0',
            item.locationId || 'N/A'
        ]);
        
        const csvContent = "data:text/csv;charset=utf-8," 
            + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
            
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${user?.name}_activity_report_${date}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin text-accent h-8 w-8" /></div>;
    if (!user) return <div className="p-6 text-center text-muted">User not found.</div>;

    return (
        <div className="p-4 md:p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-page rounded-full text-muted hover:text-primary-text transition-colors">
                        <ArrowLeft className="h-6 w-6" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-primary-text">{user.name}</h1>
                        <div className="flex items-center gap-2 text-sm text-muted">
                            <span className="capitalize px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">
                                {user.role.replace('_', ' ')}
                            </span>
                             <span>•</span>
                             <span>{user.email}</span>
                        </div>
                    </div>
                </div>
                 <div className="flex items-center gap-3">
                     <button 
                        onClick={downloadCSV}
                        disabled={timelineData.length === 0}
                        className="px-4 py-2 bg-card border border-border rounded-lg text-sm font-medium hover:bg-accent hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Export Report
                    </button>
                    <DatePicker label="" id="report-date" value={date} onChange={setDate} align="right" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Stats & Summary */}
                <div className="space-y-6 lg:col-span-1">
                    {/* Key Metrics Cards */}
                    <div className="grid grid-cols-1 gap-4">
                        <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500 dark:text-blue-400">
                                    <Navigation className="h-5 w-5" />
                                </div>
                                <span className="text-sm font-medium text-muted">Total Distance</span>
                            </div>
                            <p className="text-3xl font-bold text-primary-text">
                                {stats.totalDist.toFixed(2)} <span className="text-lg text-muted font-normal">km</span>
                            </p>
                            <p className="text-xs text-muted mt-1">Traveled across {timelineData.filter(x => x.type === 'travel').length} trips</p>
                        </div>

                         <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 dark:text-emerald-400">
                                    <Clock className="h-5 w-5" />
                                </div>
                                <span className="text-sm font-medium text-muted">Work Duration</span>
                            </div>
                            <p className="text-3xl font-bold text-primary-text">
                                {Math.floor(stats.totalWorkMins / 60)}h {stats.totalWorkMins % 60}m
                            </p>
                             <p className="text-xs text-muted mt-1">Total time at site locations</p>
                        </div>

                         <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 dark:text-amber-400">
                                    <MoveRight className="h-5 w-5" />
                                </div>
                                <span className="text-sm font-medium text-muted">Travel Time</span>
                            </div>
                            <p className="text-3xl font-bold text-primary-text">
                                {Math.floor(stats.totalTravelMins / 60)}h {stats.totalTravelMins % 60}m
                            </p>
                             <p className="text-xs text-muted mt-1">Total time spent commuting</p>
                        </div>
                    </div>
                </div>

                {/* Right Column: Detailed Timeline */}
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="font-semibold text-lg text-primary-text flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-accent" />
                        Activity Timeline
                    </h3>
                    
                    <div className="bg-card rounded-xl border border-border p-6 min-h-[400px]">
                        {timelineData.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-[300px] text-muted">
                                <Clock className="h-12 w-12 mb-4 opacity-20" />
                                <p>No activity recorded for this date.</p>
                            </div>
                        ) : (
                            <div className="relative space-y-0 before:absolute before:inset-y-0 before:left-6 before:w-0.5 before:bg-border/50">
                                {timelineData.map((item, idx) => (
                                    <div key={idx} className="relative pl-14 pb-8 last:pb-0 group">
                                        {/* Icon Node */}
                                        <div className={`absolute left-3 -translate-x-1/2 top-0 w-6 h-6 rounded-full border-4 border-card z-10 flex items-center justify-center
                                            ${item.type === 'work' ? 'bg-emerald-500' : 'bg-amber-500 ring-4 ring-amber-500/10'}
                                        `}>
                                        </div>

                                        {/* Content Card */}
                                        <div className={`p-4 rounded-xl border ${item.type === 'work' ? 'bg-page border-border' : 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-800/30'} transition-all hover:shadow-md`}>
                                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                                                <div>
                                                    <span className={`text-xs font-bold uppercase tracking-wider mb-1 block ${item.type === 'work' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                        {item.type === 'work' ? 'At Location' : 'Travel'}
                                                    </span>
                                                    <h4 className="font-semibold text-primary-text">
                                                        {item.type === 'work' ? (
                                                            item.locationId ? `Site: ${item.locationId}` : 'Unknown Location (Site)' 
                                                        ) : (
                                                            `Travel to next stop`
                                                        )}
                                                    </h4>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm font-mono font-medium text-primary-text">
                                                        {format(parseISO(item.startTime), 'hh:mm a')} 
                                                        <span className="text-muted mx-1">-</span>
                                                        {item.endTime === "In Progress" ? "Now" : format(parseISO(item.endTime), 'hh:mm a')}
                                                    </div>
                                                    <div className="text-xs text-muted">
                                                        {Math.floor(item.durationMinutes / 60)}h {item.durationMinutes % 60}m
                                                    </div>
                                                </div>
                                            </div>

                                            {item.type === 'travel' && (
                                                <div className="flex items-center gap-4 text-xs text-muted mt-3 pt-3 border-t border-border/50">
                                                    <div className="flex items-center gap-1">
                                                        <Navigation className="h-3 w-3" />
                                                        <span>{item.distanceKm?.toFixed(2)} km</span>
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {item.type === 'work' && (
                                                 <div className="flex items-center gap-2 text-xs text-muted mt-2">
                                                    <MapPin className="h-3 w-3" />
                                                    <span>Lat: {item.startLocation?.lat.toFixed(4)}, Lng: {item.startLocation?.lng.toFixed(4)}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeamMemberProfile;
