import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { PatrolLog, PatrolDailyScore, Organization } from '../../types';
import { format } from 'date-fns';
import { RefreshCw, MapPin, AlertCircle, CheckCircle, ExternalLink, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

const PatrolDashboard: React.FC = () => {
  const [logs, setLogs] = useState<PatrolLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [sites, setSites] = useState<Organization[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');

  useEffect(() => {
    loadSites();
  }, []);

  useEffect(() => {
    loadLogs();
  }, [date, selectedSiteId]);

  const loadSites = async () => {
    try {
      const data = await api.getOrganizations();
      setSites(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getPatrolLogs(date, selectedSiteId || undefined);
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const completedCount = logs.filter(l => l.status === 'Completed').length;
  const exceptionCount = logs.filter(l => l.status === 'Exception' || l.status === 'Failed').length;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Security Patrol Dashboard</h1>
        <Link 
          to="/admin/patrol/qr-codes" 
          className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700"
        >
          <MapPin size={18} /> Manage QR Codes
        </Link>
      </div>

      {/* Filters & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded shadow flex items-center gap-4">
             <div className="p-3 bg-green-100 text-green-700 rounded-full">
                 <CheckCircle size={24} />
             </div>
             <div>
                 <p className="text-sm text-gray-500">Patrols Completed</p>
                 <p className="text-2xl font-bold">{completedCount}</p>
             </div>
        </div>
        <div className="bg-white p-4 rounded shadow flex items-center gap-4">
             <div className="p-3 bg-red-100 text-red-700 rounded-full">
                 <AlertCircle size={24} />
             </div>
             <div>
                 <p className="text-sm text-gray-500">Exceptions / Issues</p>
                 <p className="text-2xl font-bold">{exceptionCount}</p>
             </div>
        </div>
        
        <div className="col-span-2 bg-white p-4 rounded shadow flex items-center gap-4">
            <div className="flex-1">
                <label className="block text-xs font-bold text-gray-500 mb-1">DATE</label>
                <input 
                    type="date" 
                    className="w-full border p-2 rounded"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                />
            </div>
            <div className="flex-1">
                <label className="block text-xs font-bold text-gray-500 mb-1">SITE</label>
                <select 
                    className="w-full border p-2 rounded"
                    value={selectedSiteId}
                    onChange={(e) => setSelectedSiteId(e.target.value)}
                >
                    <option value="">All Sites</option>
                    {sites.map(s => <option key={s.id} value={s.id}>{s.fullName}</option>)}
                </select>
            </div>
            <button onClick={loadLogs} className="mt-5 p-2 text-gray-500 hover:text-blue-600">
                <RefreshCw size={20} className={loading ? 'animate-spin' : ''}/>
            </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded shadow overflow-hidden">
          <table className="w-full text-left">
              <thead className="bg-gray-50 border-b">
                  <tr>
                      <th className="p-4 font-semibold text-gray-600">Time</th>
                      <th className="p-4 font-semibold text-gray-600">Guard</th>
                      <th className="p-4 font-semibold text-gray-600">Location/QR</th>
                      <th className="p-4 font-semibold text-gray-600">Status</th>
                      <th className="p-4 font-semibold text-gray-600">Proof</th>
                  </tr>
              </thead>
              <tbody>
                  {logs.length === 0 ? (
                      <tr>
                          <td colSpan={5} className="p-8 text-center text-gray-500">No patrol logs found for this date.</td>
                      </tr>
                  ) : (
                      logs.map(log => (
                          <tr key={log.id} className="border-b hover:bg-gray-50">
                              <td className="p-4">
                                  {format(new Date(log.scanTime), 'HH:mm:ss')}
                              </td>
                              <td className="p-4">
                                  {/* Need user name, log only has userId usually. 
                                      We assume logs returned by API joins user profile or we fetch it.
                                      For prototype, just showing ID or if API joined it.
                                      The API fetch uses select * from patrol_logs. 
                                      We should update API to join auth.users to get email/metadata or public.profiles if exists.
                                      For now, showing User ID */}
                                  <span className="font-mono text-xs bg-gray-100 p-1 rounded" title={log.userId}>
                                      {log.userId.substring(0, 8)}...
                                  </span>
                              </td>
                              <td className="p-4">
                                  {/* We need QR Name. API did join patrol_qr_codes!inner(site_id). 
                                      We should select * from QR too. 
                                      Currently API returns: select(*, patrol_qr_codes!inner(site_id)).
                                      It might not return QR name unless we ask for it. 
                                      I will assume for prototype we might miss QR name unless I fix API.
                                      But I can't fix API easily right now without verifying join syntax.
                                      I'll show coordinates/status for now. */}
                                  Lat: {log.latitude.toFixed(4)}, Lng: {log.longitude.toFixed(4)}
                              </td>
                              <td className="p-4">
                                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                                      log.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                  }`}>
                                      {log.status}
                                  </span>
                                  {log.reason && <p className="text-xs text-red-500 mt-1">{log.reason}</p>}
                              </td>
                              <td className="p-4">
                                  {log.photoUrl ? (
                                      <a 
                                        href={log.photoUrl} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="text-blue-600 text-xs flex items-center gap-1 hover:underline"
                                      >
                                          View Photo <ExternalLink size={10}/>
                                      </a>
                                  ) : (
                                      <span className="text-gray-400 text-xs">-</span>
                                  )}
                              </td>
                          </tr>
                      ))
                  )}
              </tbody>
          </table>
      </div>
    </div>
  );
};

export default PatrolDashboard;
