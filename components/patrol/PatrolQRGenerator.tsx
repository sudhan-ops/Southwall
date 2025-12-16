import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { api } from '../../services/api';
import { PatrolQRCode, Organization } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { Geolocation } from '@capacitor/geolocation';
import { Download, MapPin, Save, RefreshCw } from 'lucide-react';

export const PatrolQRGenerator: React.FC = () => {
    const { user } = useAuthStore();
    const [sites, setSites] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(false);
    const [generatedQRs, setGeneratedQRs] = useState<PatrolQRCode[]>([]);
    
    // Form State
    const [selectedSiteId, setSelectedSiteId] = useState('');
    const [name, setName] = useState('');
    const [isManualSite, setIsManualSite] = useState(false);
    const [questions, setQuestions] = useState<string[]>(['Is the area secure?']);
    const [radius, setRadius] = useState(30);
    const [currentLocation, setCurrentLocation] = useState<{ lat: number, lng: number } | null>(null);
    const [editingQrId, setEditingQrId] = useState<string | null>(null);

    useEffect(() => {
        loadSites();
    }, []);

    const loadSites = async () => {
        try {
            const [orgs, allQrs] = await Promise.all([
                api.getOrganizations(),
                api.getPatrolQrCodes()
            ]);

            // Extract unique siteIds from existing QRs to find manual entries
            const existingQrSiteIds = Array.from(new Set(allQrs.map(q => q.siteId)));
            const orgIds = new Set(orgs.map(o => o.id));
            
            const manualSites = existingQrSiteIds
                .filter(id => !orgIds.has(id) && id) // Filter out known orgs and empty strings
                .map(id => ({
                    id: id,
                    fullName: `${id} (Manual)`, // Distinguish manual sites
                    shortName: id,
                } as Organization));

            const combinedSites = [...orgs, ...manualSites];
            setSites(combinedSites);
            
            // Only set default if nothing selected yet
            if (combinedSites.length > 0 && !selectedSiteId && !isManualSite) {
                 setSelectedSiteId(combinedSites[0].id);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const loadRefreshedQRs = async () => {
        if(!selectedSiteId) return;
        try {
            const qrs = await api.getPatrolQrCodes(selectedSiteId);
            setGeneratedQRs(qrs);
        } catch(err){
            console.error(err);
        }
    };
    
    useEffect(() => {
        if(selectedSiteId) loadRefreshedQRs();
    }, [selectedSiteId]);

    const handleGetLocation = async () => {
        try {
            const coords = await Geolocation.getCurrentPosition();
            setCurrentLocation({
                lat: coords.coords.latitude,
                lng: coords.coords.longitude
            });
        } catch (err) {
            alert('Could not fetch location');
        }
    };

    const handleCreateQR = async () => {
        if (!selectedSiteId || !name || !currentLocation) {
            alert('Please fill all fields and get GPS location.');
            return;
        }

        try {
            setLoading(true);
            const payload = {
                siteId: selectedSiteId,
                name,
                latitude: currentLocation.lat,
                longitude: currentLocation.lng,
                radiusMeters: radius,
                questions,
                requirePhotoOnNo: true,
                status: 'active' as const
            };

            if (editingQrId) {
                await api.updatePatrolQrCode(editingQrId, payload);
                alert('QR Code Updated!');
            } else {
                await api.createPatrolQrCode(payload);
                alert('QR Code Created!');
            }
            
            // Refresh list
            loadRefreshedQRs();
            loadSites(); // Refresh sites list to include any new manual site
            resetForm();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };
    
    const handleDeleteQR = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this checkpoint?')) return;
        try {
            await api.deletePatrolQrCode(id);
            loadRefreshedQRs();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleEditQR = (qr: PatrolQRCode) => {
        setEditingQrId(qr.id);
        setName(qr.name);
        setRadius(qr.radiusMeters);
        setQuestions(qr.questions || ['Is the area secure?']);
        setCurrentLocation({ lat: qr.latitude, lng: qr.longitude });
        setSelectedSiteId(qr.siteId);
        setIsManualSite(false); // Since we now load manual sites into the dropdown, we can show it there
        // Assuming site list loaded or manual input works.
    };

    const resetForm = () => {
        setEditingQrId(null);
        setName('');
        setQuestions(['Is the area secure?']);
        setRadius(30);
        setCurrentLocation(null);
    };
    
    const downloadQR = (qr: PatrolQRCode) => {
        const svg = document.getElementById(`qr-${qr.id}`);
        if (!svg) return;
        
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx?.drawImage(img, 0, 0);
            const pngFile = canvas.toDataURL("image/png");
            
            const downloadLink = document.createElement("a");
            downloadLink.download = `${qr.name}-QR.png`;
            downloadLink.href = pngFile;
            downloadLink.click();
        };
        img.src = "data:image/svg+xml;base64," + btoa(svgData);
    };

    return (
        <div className="p-6 bg-white shadow rounded-lg">
            <h2 className="text-2xl font-bold mb-6">Patrol QR Management</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Creation Form */}
                <div className="space-y-4 border p-4 rounded-lg bg-gray-50">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-lg">{editingQrId ? 'Edit Checkpoint' : 'Create New Checkpoint'}</h3>
                        {editingQrId && (
                            <button onClick={resetForm} className="text-xs text-gray-500 hover:text-gray-700">Cancel Edit</button>
                        )}
                    </div>
                    
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-sm font-medium">Select Site</label>
                            <button 
                                onClick={() => {
                                    setIsManualSite(!isManualSite);
                                    setSelectedSiteId('');
                                }}
                                className="text-xs text-blue-600 hover:underline"
                            >
                                {isManualSite ? 'Select from List' : 'Enter Manually'}
                            </button>
                        </div>
                        
                        {isManualSite ? (
                            <input 
                                type="text"
                                className="w-full border p-2 rounded"
                                placeholder="Enter Site Name / ID"
                                value={selectedSiteId}
                                onChange={(e) => setSelectedSiteId(e.target.value)}
                            />
                        ) : (
                            <select 
                                className="w-full border p-2 rounded"
                                value={selectedSiteId}
                                onChange={(e) => setSelectedSiteId(e.target.value)}
                            >
                                <option value="">Select a Site...</option>
                                {sites.map(s => <option key={s.id} value={s.id}>{s.fullName}</option>)}
                            </select>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium">Checkpoint Name</label>
                        <input 
                            type="text" 
                            className="w-full border p-2 rounded"
                            placeholder="e.g. Main Gate, Rear Entrance"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium mb-2">Verification Checklist</label>
                        {questions.map((q, idx) => (
                           <div key={idx} className="flex gap-2 mb-2">
                               <input 
                                   type="text" 
                                   className="w-full border p-2 rounded"
                                   placeholder={`Question ${idx + 1}`}
                                   value={q}
                                   onChange={(e) => {
                                       const newQ = [...questions];
                                       newQ[idx] = e.target.value;
                                       setQuestions(newQ);
                                   }}
                               />
                               {questions.length > 1 && (
                                   <button 
                                      onClick={() => {
                                          const newQ = questions.filter((_, i) => i !== idx);
                                          setQuestions(newQ);
                                      }}
                                      className="text-red-500 hover:text-red-700 px-2 font-bold"
                                      title="Remove"
                                   >
                                       x
                                   </button>
                               )}
                           </div>
                        ))}
                        <button 
                             onClick={() => setQuestions([...questions, ''])}
                             className="text-sm text-blue-600 font-semibold hover:underline mt-1"
                        >
                            + Add Question
                        </button>
                    </div>

                    <div className="flex gap-4">
                        <div className="flex-1">
                             <label className="block text-sm font-medium">Radius (Meters)</label>
                             <input 
                                type="number" 
                                className="w-full border p-2 rounded"
                                value={radius}
                                onChange={(e) => setRadius(Number(e.target.value))}
                             />
                        </div>
                        <div className="flex-1 pt-6">
                            <button 
                                onClick={handleGetLocation}
                                className={`w-full py-2 rounded flex items-center justify-center gap-2 ${currentLocation ? 'bg-green-100 text-green-700 border-green-300' : 'bg-blue-100 text-blue-700'}`}
                            >
                                <MapPin size={16} />
                                {currentLocation ? 'Updated' : 'Get GPS'}
                            </button>
                        </div>
                    </div>
                    {currentLocation && <p className="text-xs text-gray-500">Lat: {currentLocation.lat}, Lng: {currentLocation.lng}</p>}

                    <button 
                        onClick={handleCreateQR}
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700 flex items-center justify-center gap-2"
                    >
                        {loading ? <RefreshCw className="animate-spin" /> : <Save />} {editingQrId ? 'Update Checkpoint' : 'Save & Generate QR'}
                    </button>
                </div>

                {/* List & Preview */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-lg flex justify-between">
                        Existing Checkpoints
                        <button onClick={loadRefreshedQRs}><RefreshCw size={16}/></button>
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto">
                        {generatedQRs.map(qr => (
                            <div key={qr.id} className="border p-4 rounded-lg flex flex-col items-center bg-white shadow-sm">
                                <h4 className="font-bold mb-2">{qr.name}</h4>
                                <div className="bg-white p-2">
                                     {/* QR Code Payload: Just ID for security/portability? Or JSON? Requirements implied fetching metadata from server, 
                                        scanner implementation uses ID to fetch. So we encode ID. */}
                                    <QRCode 
                                        id={`qr-${qr.id}`}
                                        value={JSON.stringify({ id: qr.id })} 
                                        size={120} 
                                    />
                                </div>
                                <button 
                                    onClick={() => downloadQR(qr)}
                                    className="mt-3 text-sm text-blue-600 flex items-center gap-1 hover:underline"
                                >
                                    <Download size={14}/> Download PNG
                                </button>
                                <div className="flex gap-2 w-full mt-3">
                                    <button 
                                        onClick={() => handleEditQR(qr)}
                                        className="flex-1 py-1 text-xs border rounded hover:bg-gray-50 text-blue-600"
                                    >
                                        Edit
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteQR(qr.id)}
                                        className="flex-1 py-1 text-xs border rounded hover:bg-gray-50 text-red-600"
                                    >
                                        Delete
                                    </button>
                                </div>
                                <div className="text-xs text-center mt-2 text-gray-400">
                                    Radius: {qr.radiusMeters}m
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
