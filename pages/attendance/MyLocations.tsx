import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../services/api';
import type { Location } from '../../types';
import Button from '../../components/ui/Button';
import Toast from '../../components/ui/Toast';
import { Pin, MapPin, Trash2 } from 'lucide-react';
import { reverseGeocode, getPrecisePosition } from '../../utils/locationUtils';

/**
 * MyLocations component
 *
 * This page allows a logged in user to view and manage their personal geofenced
 * locations.  The user can see all locations currently assigned to them and
 * create a new location based on their current GPS position.  Locations
 * created via this page automatically use a default radius and are saved
 * with a friendly name/address using reverse geocoding when possible.  The
 * user cannot specify a custom radius or modify existing locations; this is
 * reserved for admins via the Location Management page.
 */
const MyLocations: React.FC = () => {
  const { user } = useAuthStore();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Load user locations on mount
  useEffect(() => {
    const loadUserLocations = async () => {
      if (!user) return;
      try {
        const userLocs = await api.getUserLocations(user.id);
        setLocations(userLocs);
      } catch (err) {
        console.error(err);
        setToast({ message: 'Failed to load locations.', type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    loadUserLocations();
  }, [user]);

  const handleAddCurrentLocation = async () => {
    if (!user) return;
    setAdding(true);
    try {
      // Acquire a high accuracy position
      const pos = await getPrecisePosition().catch(() => null);
      let latitude: number | undefined;
      let longitude: number | undefined;
      if (pos && pos.coords) {
        latitude = pos.coords.latitude;
        longitude = pos.coords.longitude;
      }
      // If fallback is needed, use a one‑shot geolocation
      if (latitude === undefined || longitude === undefined) {
        const fallback = await new Promise<GeolocationPosition | null>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (p) => resolve(p),
            () => resolve(null),
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
          );
        });
        if (fallback && fallback.coords) {
          latitude = fallback.coords.latitude;
          longitude = fallback.coords.longitude;
        }
      }
      if (latitude === undefined || longitude === undefined) {
        throw new Error('Unable to retrieve current location.');
      }
      // Attempt to derive a friendly name/address for the new location
      let friendlyName: string | null = null;
      try {
        friendlyName = await reverseGeocode(latitude, longitude);
      } catch (geocodeErr) {
        console.warn('Reverse geocode failed for new user location:', geocodeErr);
      }
      const defaultRadius = 100; // fixed radius for user-created locations
      // Create the new location in the database
      const newLoc = await api.createLocation({
        name: friendlyName,
        latitude,
        longitude,
        radius: defaultRadius,
        address: friendlyName,
        createdBy: user.id,
      });
      // Assign the location to the user
      await api.assignLocationToUser(user.id, newLoc.id);
      // Update local state
      setLocations((prev) => [...prev, newLoc]);
      setToast({ message: 'Location added successfully.', type: 'success' });
    } catch (err) {
      console.error(err);
      setToast({ message: 'Failed to add location.', type: 'error' });
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveLocation = async (locId: string) => {
    if (!user) return;
    try {
      await api.unassignLocationFromUser(user.id, locId);
      setLocations((prev) => prev.filter((l) => l.id !== locId));
      setToast({ message: 'Location removed.', type: 'success' });
    } catch (err) {
      console.error(err);
      setToast({ message: 'Failed to remove location.', type: 'error' });
    }
  };

  return (
    <div className="p-4 md:p-6 w-full">
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
      <div className="md:bg-card md:p-6 md:rounded-xl md:shadow-card">
        <h2 className="text-2xl font-bold mb-4 flex items-center">
          <MapPin className="h-6 w-6 mr-2" /> My Locations
        </h2>
        <p className="text-muted mb-6">
          These are the geofenced locations assigned to you. You may check in/out only when
          within one of these locations. Use the button below to add your current
          location if it isn’t listed.
        </p>
        <div className="mb-6">
          <Button onClick={handleAddCurrentLocation} isLoading={adding} disabled={adding || !user}>
            <Pin className="h-4 w-4 mr-2" /> Add Current Location
          </Button>
        </div>
      </div>

      <div className="mt-6">
        {loading ? (
          <p>Loading locations...</p>
        ) : locations.length === 0 ? (
          <p className="text-muted text-center md:text-left">You have no locations assigned. Use the button above to add one.</p>
        ) : (
          <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-1 md:gap-4">
            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {locations.map((loc) => (
                <div key={loc.id} className="bg-card rounded-lg shadow-card p-4 border border-border">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-primary-text">{loc.name || loc.address || 'Unnamed Location'}</h3>
                      <p className="text-sm text-muted">{loc.address}</p>
                    </div>
                    <button
                      type="button"
                      className="text-red-500 hover:text-red-700 p-1"
                      title="Remove Location"
                      onClick={() => handleRemoveLocation(loc.id)}
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted">Radius</p>
                      <p>{loc.radius}m</p>
                    </div>
                    <div>
                      <p className="text-muted">Coordinates</p>
                      <p>{loc.latitude?.toFixed(4)}, {loc.longitude?.toFixed(4)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto border border-border rounded-lg">
              <table className="min-w-full border-collapse text-sm">
                <thead className="bg-page text-primary-text">
                  <tr>
                    <th className="p-3 border-b border-border text-left">Name</th>
                    <th className="p-3 border-b border-border text-left">Radius (m)</th>
                    <th className="p-3 border-b border-border text-left">Coordinates</th>
                    <th className="p-3 border-b border-border text-left">Address</th>
                    <th className="p-3 border-b border-border text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {locations.map((loc) => (
                    <tr key={loc.id} className="border-b border-border">
                      <td className="p-3">{loc.name || '-'}</td>
                      <td className="p-3">{loc.radius}</td>
                      <td className="p-3">{loc.latitude?.toFixed(4)}, {loc.longitude?.toFixed(4)}</td>
                      <td className="p-3">{loc.address || '-'}</td>
                      <td className="p-3">
                        <button
                          type="button"
                          className="text-red-600 hover:text-red-800"
                          title="Remove Location"
                          onClick={() => handleRemoveLocation(loc.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyLocations;