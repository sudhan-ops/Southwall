import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { User, LocationLog } from '../../types';
import { Loader2, MapPin, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const MyTeamList: React.FC = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [team, setTeam] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [lastLocations, setLastLocations] = useState<Record<string, LocationLog>>({});
    
    // Map refs
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const markersRef = useRef<L.LayerGroup | null>(null);

    useEffect(() => {
        const fetchTeam = async () => {
            if (!user) return;
            setLoading(true);
            try {
                let users: User[] = [];
                if (['admin', 'operations_manager', 'hr'].includes(user.role)) {
                    users = await api.getUsers();
                } else {
                    users = await api.getTeamMembers(user.id);
                }
                setTeam(users);

                // Fetch latest locations for these users
                const userIds = users.map(u => u.id);
                if (userIds.length > 0) {
                    const locs = await api.getLatestLocations(userIds);
                    setLastLocations(locs);
                }
            } catch (error) {
                console.error("Failed to load team", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTeam();
    }, [user]);

    // Initialize Map
    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return;

        // Default to Bangalore
        const map = L.map(mapContainerRef.current).setView([12.9716, 77.5946], 11);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 20
        }).addTo(map);

        markersRef.current = L.layerGroup().addTo(map);
        mapRef.current = map;

        // Cleanup
        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
                markersRef.current = null;
            }
        };
    }, []);

    const filteredTeam = team.filter(member => 
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        member.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Update markers when filtered team or locations change
    useEffect(() => {
        if (!mapRef.current || !markersRef.current) return;

        markersRef.current.clearLayers();
        const bounds = L.latLngBounds([]);
        let hasMarkers = false;

        filteredTeam.forEach(member => {
            const loc = lastLocations[member.id];
            if (loc && loc.latitude && loc.longitude) {
                hasMarkers = true;
                const latLng = L.latLng(loc.latitude, loc.longitude);
                bounds.extend(latLng);

                // Create Avatar Icon
                // We use a divIcon with the user's image or initial
                const html = `
                    <div style="
                        width: 40px; 
                        height: 40px; 
                        border-radius: 50%; 
                        border: 3px solid #fff; 
                        box-shadow: 0 4px 6px rgba(0,0,0,0.3);
                        overflow: hidden; 
                        background: ${member.photoUrl ? 'white' : '#10b981'}; /* emerald-500 */
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    ">
                        ${member.photoUrl 
                            ? `<img src="${member.photoUrl}" style="width: 100%; height: 100%; object-fit: cover;" />`
                            : `<span style="color: white; font-weight: bold; font-size: 14px;">${member.name.charAt(0)}</span>`
                        }
                    </div>
                    <div style="
                        position: absolute;
                        bottom: -5px;
                        left: 50%;
                        transform: translateX(-50%);
                        width: 0; 
                        height: 0; 
                        border-left: 6px solid transparent;
                        border-right: 6px solid transparent;
                        border-top: 6px solid white;
                    "></div>
                `;

                const icon = L.divIcon({
                    html: html,
                    className: 'custom-avatar-marker',
                    iconSize: [40, 48],
                    iconAnchor: [20, 48],
                    popupAnchor: [0, -48]
                });

                L.marker(latLng, { icon })
                    .bindPopup(`
                        <div class="text-center">
                            <strong>${member.name}</strong><br/>
                            <span class="text-xs text-gray-500">${formatDistanceToNow(new Date(loc.timestamp), { addSuffix: true })}</span>
                        </div>
                    `)
                    .addTo(markersRef.current!);
            }
        });

        if (hasMarkers && mapRef.current) {
            // Fit bounds with generic padding
            mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
        }
    }, [filteredTeam, lastLocations]);

    // Handle resize
    useEffect(() => {
        setTimeout(() => {
            mapRef.current?.invalidateSize();
        }, 200);
    });

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-primary-text">My Team</h1>
                    <p className="text-muted text-sm mt-1">
                        {user?.role === 'admin' ? 'All System Users' : 'Team Members Reporting to You'}
                    </p>
                </div>
                 <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted h-4 w-4" />
                    <input 
                        type="text" 
                        placeholder="Search team..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-primary-text focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                    />
                </div>
            </div>

            {/* Map Section */}
            <div className="h-64 sm:h-96 w-full rounded-2xl overflow-hidden shadow-lg border border-border z-0">
               <div ref={mapContainerRef} className="h-full w-full z-0" />
            </div>

            {/* List Section */}
            {loading ? (
                 <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-accent" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTeam.map(member => (
                        <div 
                            key={member.id} 
                            onClick={() => navigate(`/my-team/${member.id}`)}
                            className="bg-card border border-border rounded-xl p-4 hover:shadow-card-hover transition-all cursor-pointer group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-full overflow-hidden bg-gray-200 border-2 border-transparent group-hover:border-accent transition-colors">
                                    {member.photoUrl ? (
                                        <img src={member.photoUrl} alt={member.name} className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center bg-accent/10 text-accent font-bold text-lg">
                                            {member.name.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-primary-text group-hover:text-accent transition-colors">
                                        {member.name}
                                    </h3>
                                    <p className="text-xs text-muted capitalize bg-page px-2 py-0.5 rounded-full w-fit mt-1">
                                        {member.role.replace('_', ' ')}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="mt-4 pt-4 border-t border-border flex justify-between items-center text-sm">
                                <span className="text-muted flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {lastLocations[member.id] ? (
                                        <span className="text-xs truncate max-w-[150px]">
                                            Last active {formatDistanceToNow(new Date(lastLocations[member.id].timestamp), { addSuffix: true })}
                                        </span>
                                    ) : (
                                        "No location history"
                                    )}
                                </span>
                                <span className="text-accent font-medium text-xs">
                                    View Details &rarr;
                                </span>
                            </div>
                        </div>
                    ))}
                    
                    {filteredTeam.length === 0 && (
                        <div className="col-span-full text-center py-10 text-muted">
                            No team members found.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MyTeamList;
