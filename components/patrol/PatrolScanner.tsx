import React, { useState, useEffect } from 'react';
import QrScanner from 'react-qr-scanner';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../services/api';
import { Geolocation } from '@capacitor/geolocation';
import CameraCaptureModal from '../CameraCaptureModal';
import { ArrowLeft, RefreshCw, AlertTriangle, CheckCircle, Smartphone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
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
};

export const PatrolScanner: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(true);
  const [result, setResult] = useState<any | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [answer, setAnswer] = useState<'YES' | 'NO' | null>(null);
  const [reason, setReason] = useState('');
  const [qrData, setQrData] = useState<any | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ question: string; answer: 'YES' | 'NO'; photo?: string; reason?: string }[]>([]);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const coordinates = await Geolocation.getCurrentPosition();
      setLocation({
        lat: coordinates.coords.latitude,
        lng: coordinates.coords.longitude
      });
    } catch (err) {
      console.error('Error getting location', err);
      setError('Could not fetch location. Please enable GPS.');
    }
  };

  const handleError = (err: any) => {
    console.error(err);
    setError('Camera error. Please ensure permission is granted.');
  };

  const handleScan = async (data: any) => {
    if (data && scanning) {
        setScanning(false);
        try {
            // Parse QR Payload. Expected: JSON string with { id, siteId, lat, long, radius, validFrom, validTo, question }
            // The user input says "QR Payload must include: QR_ID (UUID), Site_ID, Lat, Long, Radius, Validity, Question_ID"
            // We'll assume the QR contains the full object or we fetch it.
            // For security, it's better if QR only has ID and we fetch details. 
            // BUT requirements say "QR metadata from server" (Flow Step 3). So QR has ID.
            
            // Let's assume QR text is just the UUID or a JSON with UUID.
            let uuid = '';
            try {
                const parsed = JSON.parse(data.text);
                uuid = parsed.id;
            } catch {
                uuid = data.text;
            }

            setLoading(true);
            // Verify QR with server (we assume we can fetch it to verify)
            // Implementation detail: we need an API to get single QR by ID.
            // Since we added `getPatrolQrCodes`, we can filter. ideally we need `getPatrolQrCode(id)`.
            // For now, we'll assume we can get it via `getCheckpoints` or similar if site is known, 
            // OR we just fetch all for the site if we knew it? 
            // Actually, we should probably add `getPatrolQrCodeById` to API. using `getPatrolQrCodes` is okay if not too many.
            
            // Let's use the list for now if we don't have direct by ID.
            // Wait, we don't know the site ID from just the scan if we only have UUID.
            // Unless we fetch ALL QRs or add a specific endpoint. 
            // I'll add `getCheckpointById` to the component logic using a direct query if possible, or assume the QR has enough info.
            // Re-reading requirements: "Fetch QR metadata from server" -> implies we assume we can fetch by ID.
            // I will use `api.getPatrolQrCodes()` to find it. This is inefficient but works for prototype.
            // Better: QR contains info to avoid lookup? No, "QR codes must be tamper-proof (use signed payload or server validation)".
            // Server validation is best.
            
            // Hack for prototype: Query table directly via supabase client if exposed, or assume API has it.
            // I'll add a quick fetch in this component for now.
             
            const allQrs = await api.getPatrolQrCodes(); 
            const matchedQr = allQrs.find(q => q.id === uuid);

            if (!matchedQr) {
                throw new Error('Invalid or inactive QR code.');
            }
            
            setQrData(matchedQr);
            // Reset state
            setCurrentQuestionIndex(0);
            setAnswers([]);

            if (!location) {
                await getCurrentLocation();
            }
            
            if (location) {
                 const dist = calculateDistance(location.lat, location.lng, matchedQr.latitude, matchedQr.longitude);
                 if (dist > (matchedQr.radiusMeters || 50)) {
                     throw new Error(`Location mismatch. You are ${Math.round(dist)}m away. Allowed: ${matchedQr.radiusMeters}m.`);
                 }
            } else {
                 // Retry location or fail?
                 throw new Error('GPS Location required.');
            }

            setResult(matchedQr);
        } catch (err: any) {
            setError(err.message || 'Verification failed');
            setScanning(true); // Allow retry
        } finally {
            setLoading(false);
        }
    }
  };

  const handleSubmit = async (isYes: boolean) => {
      const currentQ = qrData?.questions?.[currentQuestionIndex] || qrData?.question;
      
      if (isYes) {
          // Add YES answer
          const newAnswers = [...answers, { question: currentQ, answer: 'YES' as const }];
          setAnswers(newAnswers);
          proceedToNext(newAnswers);
      } else {
          // Needs photo and reason
          setShowPhotoModal(true);
      }
  };

  const handlePhotoCapture = async (base64Image: string, mimeType: string) => {
      if (!reason.trim()) {
          alert('Please provide a reason.');
          return;
      }
      
      const currentQ = qrData?.questions?.[currentQuestionIndex] || qrData?.question;
      const fullDataUrl = `data:${mimeType};base64,${base64Image}`;
      
      const newAnswer = { 
          question: currentQ, 
          answer: 'NO' as const, 
          photo: fullDataUrl, 
          reason: reason 
      };
      
      const newAnswers = [...answers, newAnswer];
      setAnswers(newAnswers);
      setShowPhotoModal(false);
      setReason(''); // Reset for next time if needed, though we usually only do one photo per NO?
      // Actually proceed
      proceedToNext(newAnswers);
  };

  const proceedToNext = async (currentAnswers: typeof answers) => {
      // Check if more questions
      const allQuestions = qrData?.questions || [qrData?.question];
      if (currentQuestionIndex < allQuestions.length - 1) {
          setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
          // All done, submit
          await submitLog(currentAnswers);
      }
  };

  const submitLog = async (finalAnswers: typeof answers) => {
      if (!qrData || !user || !location) return;
      
      // Determine overall status
      const hasException = finalAnswers.some(a => a.answer === 'NO');
      const status = hasException ? 'Exception' : 'Completed';
      const score = hasException ? 5 : 10; // Simplified scoring

      try {
          setLoading(true);
          await api.submitPatrolLog({
              qrId: qrData.id,
              userId: user.id,
              scanTime: new Date().toISOString(),
              latitude: location.lat,
              longitude: location.lng,
              isWithinRadius: true,
              answers: finalAnswers,
              status: status,
              scoreAwarded: score
          });
          alert('Patrol submitted successfully!');
          navigate('/mobile-home');
      } catch (err: any) {
          setError(err.message);
      } finally {
          setLoading(false);
      }
  };

  if (!scanning && result && !showPhotoModal) {
      const allQuestions = result.questions || [result.question];
      const currentQ = allQuestions[currentQuestionIndex];
      const isLast = currentQuestionIndex === allQuestions.length - 1;

      return (
          <div className="fixed inset-0 bg-white z-50 flex flex-col p-6">
              <h2 className="text-xl font-bold mb-4">Checkpoint Verification ({currentQuestionIndex + 1}/{allQuestions.length})</h2>
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                  <p className="font-semibold">{result.name}</p>
                  <p className="text-sm text-gray-600 mt-1">{currentQ}</p>
              </div>
              
              <div className="flex gap-4 mt-auto mb-10">
                  <button 
                    onClick={() => handleSubmit(false)}
                    className="flex-1 py-4 bg-red-100 text-red-700 rounded-xl font-bold border border-red-200"
                  >
                      NO / ISSUE
                  </button>
                  <button 
                    onClick={() => handleSubmit(true)}
                    className="flex-1 py-4 bg-green-600 text-white rounded-xl font-bold shadow-lg"
                  >
                      {isLast ? 'YES / FINISH' : 'YES / NEXT'}
                  </button>
              </div>
          </div>
      );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="flex items-center justify-between p-4 text-white">
        <button onClick={() => navigate(-1)}><ArrowLeft /></button>
        <span className="font-bold">Scan Patrol QR</span>
        <div className="w-6"></div>
      </div>
      
      <div className="flex-1 relative flex items-center justify-center bg-black">
          {error ? (
              <div className="bg-white p-6 rounded-lg text-center mx-4">
                  <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-2" />
                  <p className="text-red-700 font-medium mb-4">{error}</p>
                  <button onClick={() => { setError(null); setScanning(true); }} className="px-4 py-2 bg-gray-200 rounded-full">Try Again</button>
              </div>
          ) : (
             <QrScanner
                delay={300}
                onError={handleError}
                onScan={handleScan}
                style={{ width: '100%', height: '100%' }}
                constraints={{
                    video: { facingMode: 'environment' }
                }}
             />
          )}
          
          {loading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="text-white font-bold">Verifying...</div>
              </div>
          )}
      </div>
      
      <div className="p-4 bg-gray-900 text-white text-center">
          <p className="text-sm opacity-80">Align QR code within the frame</p>
          {location && <p className="text-xs text-green-400 mt-1 flex items-center justify-center gap-1"><Smartphone size={12}/> GPS Active</p>}
      </div>

      {showPhotoModal && (
          <CameraCaptureModal
              isOpen={showPhotoModal}
              onClose={() => setShowPhotoModal(false)}
              onCapture={handlePhotoCapture}
          />
      )}
      
      {/* Reason Input Modal Overlay - Simplified for this file */}
      {showPhotoModal && (
         <div className="absolute bottom-20 left-4 right-4 bg-white p-4 rounded-lg shadow-xl" style={{ zIndex: 60 }}>
             <p className="mb-2 font-bold text-gray-800">Reason for issue:</p>
             <textarea 
                className="w-full border rounded p-2" 
                placeholder="Describe the issue..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
             />
             <p className="text-xs text-gray-500 mt-2">Take photo to submit.</p>
         </div>
      )}
    </div>
  );
};
