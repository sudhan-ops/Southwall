import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import type { OnboardingData } from '../../types';
import { Loader2, Plus, Search, ArrowLeft, UserPlus, CheckSquare, Square, X } from 'lucide-react';
import { ProfilePlaceholder } from '../../components/ui/ProfilePlaceholder';
import Toast from '../../components/ui/Toast';
import StatusChip from '../../components/ui/StatusChip';
import { useEnrollmentRulesStore } from '../../store/enrollmentRulesStore';
import { useBrandingStore } from '../../store/brandingStore';
import CardListSkeleton from '../../components/skeletons/CardListSkeleton';
import { getThemeColors } from '../../utils/themeUtils';

type StatusFilter = 'in-progress' | 'existing';

// Reusable component for the small checkboxes with labels
const CheckboxItem: React.FC<{ label: string, checked: boolean, themeColors: any }> = ({ label, checked, themeColors }) => (
    <div className="flex items-center gap-1.5">
        {checked ? <CheckSquare className="h-4 w-4" style={{ color: themeColors.primary }} /> : <Square className="h-4 w-4 text-gray-500" />}
        <span className={checked && themeColors.mobileBg !== '#ffffff' ? 'text-gray-200' : checked ? 'text-slate-700' : 'text-gray-500'}>{label}</span>
    </div>
);

// Component for the individual employee card
const SubmissionCard: React.FC<{ submission: OnboardingData }> = ({ submission }) => {
    const { esiCtcThreshold } = useEnrollmentRulesStore();
    const { colorScheme } = useBrandingStore();
    const themeColors = getThemeColors(colorScheme);

    const progress = useMemo(() => {
        const { personal, uan, esi, gmc } = submission;

        const isEligibleForEsi = personal.salary != null && personal.salary <= esiCtcThreshold;

        let esiGmcComplete = false;
        if (isEligibleForEsi) {
            // ESI is complete if they either don't have it, or have it and provided a number.
            esiGmcComplete = !esi.hasEsi || (esi.hasEsi && !!esi.esiNumber);
        } else {
            // GMC is applicable. It's complete if they've made a choice and fulfilled requirements.
            if (gmc.isOptedIn === true) {
                esiGmcComplete = true; // Opting in is sufficient.
            } else if (gmc.isOptedIn === false) {
                esiGmcComplete = !!gmc.gmcPolicyCopy && !!gmc.declarationAccepted;
            }
        }

        return {
            aadhaar: !!personal.idProofFront, // Proof of data entry
            uan: !uan.hasPreviousPf || (uan.hasPreviousPf && !!uan.uanNumber),
            pf: !uan.hasPreviousPf || (uan.hasPreviousPf && !!uan.uanNumber), // PF presence depends on UAN details being provided.
            esiGmc: esiGmcComplete,
        };
    }, [submission, esiCtcThreshold]);

    return (
        <Link 
            to={`/onboarding/add/personal?id=${submission.id}`} 
            className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 rounded-xl"
            style={{ ringColor: themeColors.primary, ringOffsetColor: themeColors.mobileBg }}
        >
            <div 
                className={`p-3 rounded-xl flex gap-4 items-start border transition-colors duration-200 border-transparent hover:border-accent`}
                style={{ 
                    backgroundColor: themeColors.mobileBg === '#ffffff' ? '#f8fafc' : themeColors.sidebarBg,
                    borderColor: themeColors.mobileBg === '#ffffff' ? '#e2e8f0' : 'transparent'
                }}
            >
                <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2" style={{ borderColor: themeColors.sidebarBorder }}>
                    <ProfilePlaceholder photoUrl={submission.personal.photo?.preview} seed={submission.id} />
                </div>
                <div className="flex-grow">
                    <div className="flex justify-between items-start gap-2">
                        <p className="font-semibold" style={{ color: themeColors.mobileBg === '#ffffff' ? '#0f172a' : themeColors.primary }}>{`${submission.personal.firstName} ${submission.personal.lastName}`}</p>
                        <div className="flex-shrink-0">
                            <StatusChip status={submission.status} />
                        </div>
                    </div>
                    <p className="text-sm text-gray-400">{submission.personal.mobile}</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-3 text-xs">
                        <CheckboxItem label="Aadhaar" checked={progress.aadhaar} themeColors={themeColors} />
                        <CheckboxItem label="UAN" checked={progress.uan} themeColors={themeColors} />
                        <CheckboxItem label="PF" checked={progress.pf} themeColors={themeColors} />
                        <CheckboxItem label="ESI / GMC" checked={progress.esiGmc} themeColors={themeColors} />
                    </div>
                </div>
            </div>
        </Link>
    );
};

// Main component for the My Submissions page
const MySubmissions: React.FC = () => {
    const { colorScheme } = useBrandingStore();
    const [submissions, setSubmissions] = useState<OnboardingData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('in-progress');
    const [searchTerm, setSearchTerm] = useState('');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const navigate = useNavigate();
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchSubmissions = async () => {
            setIsLoading(true);
            try {
                // Fetching all submissions and filtering on the client-side
                const data = await api.getVerificationSubmissions();
                setSubmissions(data);
            } catch (error) {
                setToast({ message: 'Failed to load submissions.', type: 'error' });
            } finally {
                setIsLoading(false);
            }
        };
        fetchSubmissions();
    }, []);

    const filteredSubmissions = useMemo(() => {
        const statusMap: Record<StatusFilter, Array<OnboardingData['status']>> = {
            'in-progress': ['pending', 'draft', 'rejected'],
            'existing': ['verified'],
        };

        return submissions
            .filter(s => statusMap[statusFilter].includes(s.status))
            .filter(s =>
                `${s.personal.firstName} ${s.personal.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.personal.mobile?.toLowerCase().includes(searchTerm.toLowerCase())
            );
    }, [submissions, statusFilter, searchTerm]);

    const themeColors = getThemeColors(colorScheme);

    const handleAddNew = () => {
        navigate('/onboarding/select-organization');
    };

    const handleSearchIconClick = () => {
        searchInputRef.current?.focus();
    };

    const filterTabs: { key: StatusFilter, label: string }[] = [
        { key: 'in-progress', label: 'IN PROGRESS' },
        { key: 'existing', label: 'EXISTING' },
    ];

    return (
        <div className={`h-full flex flex-col`} style={{ backgroundColor: themeColors.mobileBg, color: themeColors.isDark || themeColors.mobileBg !== '#ffffff' ? 'white' : '#0f172a' }}>
            {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}

            <header 
                className={`p-4 flex-shrink-0 flex items-center justify-between fo-mobile-header sticky top-0 z-10 backdrop-blur-sm border-b`}
                style={{ 
                    backgroundColor: themeColors.mobileBg === '#ffffff' ? 'rgba(255, 255, 255, 0.8)' : themeColors.mobileBg + 'cc',
                    borderColor: themeColors.mobileBg === '#ffffff' ? '#e2e8f0' : themeColors.sidebarBorder
                }}
            >
                <button 
                  onClick={() => navigate('/onboarding')} 
                  aria-label="Go back" 
                  className={`p-2 rounded-full hover:bg-black/10`}
                  style={{ color: themeColors.mobileBg === '#ffffff' ? '#64748b' : 'white' }}
                >
                    <ArrowLeft className="h-6 w-6" />
                </button>
                <h1 className="text-lg font-semibold">On Boarding</h1>
                <div className="flex items-center gap-1">
                    <button 
                      onClick={handleSearchIconClick} 
                      aria-label="Search employee" 
                      className={`p-2 rounded-full hover:bg-black/10`}
                      style={{ color: themeColors.mobileBg === '#ffffff' ? '#64748b' : 'white' }}
                    >
                        <Search className="h-6 w-6" />
                    </button>
                    <button 
                      onClick={handleAddNew} 
                      aria-label="Add new employee" 
                      className={`p-2 rounded-full hover:bg-black/10`}
                      style={{ color: themeColors.mobileBg === '#ffffff' ? '#64748b' : 'white' }}
                    >
                        <UserPlus className="h-6 w-6" />
                    </button>
                    <button 
                      onClick={() => navigate('/profile')} 
                      aria-label="Exit to profile" 
                      className={`p-2 rounded-full hover:bg-black/10`}
                      style={{ color: themeColors.mobileBg === '#ffffff' ? '#64748b' : 'white' }}
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>
            </header>

            <div className="px-4 pt-4 pb-3 flex-shrink-0">
                <div className="flex">
                    {filterTabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setStatusFilter(tab.key)}
                             className={`flex-1 py-2 text-sm font-semibold uppercase tracking-wider transition-colors duration-200 focus-visible:outline-none rounded-sm ${statusFilter === tab.key
                                 ? 'border-b-2'
                                 : `border-b-2 border-transparent text-gray-400 hover:text-gray-600`
                                 }`}
                             style={statusFilter === tab.key ? { borderBottomColor: themeColors.primary, color: themeColors.primary } : {}}
                         >
                             {tab.label}
                         </button>
                    ))}
                </div>
            </div>

            <main className="flex-1 overflow-y-auto px-4 space-y-2.5 pb-24">
                <div className="relative">
                    <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500`} />
                    <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search by name or number..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className={`form-input w-full !pl-10 !h-12 !rounded-md`}
                    />
                </div>

                {isLoading ? (
                    <div className="pt-4">
                        <CardListSkeleton count={3} />
                    </div>
                ) : filteredSubmissions.length > 0 ? (
                    <div className="space-y-2.5">
                        {filteredSubmissions.map(s => (
                            <SubmissionCard key={s.id} submission={s} />
                        ))}
                    </div>
                ) : (
                    <div className={`text-center pt-16 text-gray-500`}>
                        <p>No {statusFilter.replace('-', ' ')} submissions found.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default MySubmissions;