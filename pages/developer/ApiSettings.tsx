import React, { useState } from 'react';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { Server, Download, ShieldCheck, Settings, Mail, Image, Phone, Building, Palette } from 'lucide-react';
import { api } from '../../services/api';
import Toast from '../../components/ui/Toast';
import { useSettingsStore } from '../../store/settingsStore';
import { useBrandingStore, ColorScheme } from '../../store/brandingStore';
import Checkbox from '../../components/ui/Checkbox';
import PageInterfaceSettingsModal from '../../components/developer/PageInterfaceSettingsModal';

const SettingsCard: React.FC<{ title: string; icon: React.ElementType, children: React.ReactNode, className?: string }> = ({ title, icon: Icon, children, className }) => (
    <div className={`border-0 shadow-none md:bg-card md:p-6 md:rounded-xl md:shadow-card ${className || ''}`}>
        <div className="flex items-center mb-6">
            <div className="p-3 rounded-full bg-accent-light mr-4">
                <Icon className="h-6 w-6 text-accent-dark" />
            </div>
            <div>
                <h3 className="text-lg font-bold text-primary-text">{title}</h3>
            </div>
        </div>
        <div className="space-y-4">
            {children}
        </div>
    </div>
);


export const ApiSettings: React.FC = () => {
    const store = useSettingsStore();
    const { colorScheme, setColorScheme } = useBrandingStore();

    const [isExporting, setIsExporting] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [isInterfaceModalOpen, setIsInterfaceModalOpen] = useState(false);
    const [updateGlobal, setUpdateGlobal] = useState(false);

    const handleExport = async () => {
        setIsExporting(true);
        setToast(null);
        try {
            const data = await api.exportAllData();
            const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
            const link = document.createElement("a");
            link.href = jsonString;
            link.download = `paradigm_backup_${new Date().toISOString()}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setToast({ message: 'Data exported successfully!', type: 'success' });
        } catch (error) {
            setToast({ message: 'Failed to export data.', type: 'error' });
        } finally {
            setIsExporting(false);
        }
    };

    const colorSchemeLabels: Record<ColorScheme, string> = {
        green: 'Paradigm Green',
        purple: 'Royal Purple',
        red: 'Crimson Red',
        amber: 'Amber Gold',
        'professional-blue': 'Professional Blue',
        'dark-saas': 'Dark SaaS',
        'teal-mint': 'Teal & Mint',
        'indigo-violet': 'Indigo & Violet',
        'green-finance': 'Green Finance',
        'orange-energy': 'Orange Energy',
        'red-alert': 'Red Alert',
        'neutral-gray': 'Neutral Gray',
        'cyan-tech': 'Cyan Tech',
        'black-gold': 'Premium Black & Gold',
    };

    const colorSchemeDescriptions: Record<ColorScheme, string> = {
        green: 'Nature theme',
        purple: 'Premium theme',
        red: 'Bold theme',
        amber: 'Warm theme',
        'professional-blue': 'Enterprise / Admin',
        'dark-saas': 'Modern / Developer',
        'teal-mint': 'Health / Facility',
        'indigo-violet': 'HR / Productivity',
        'green-finance': 'Billing / Payroll',
        'orange-energy': 'Operations / Field',
        'red-alert': 'Security / Critical',
        'neutral-gray': 'Minimal / Data',
        'cyan-tech': 'Smart Systems',
        'black-gold': 'Management / Exec',
    };

    const handleColorSchemeChange = async (scheme: ColorScheme, forceGlobal?: boolean) => {
        setColorScheme(scheme);
        
        // Use the explicit forceGlobal param if provided, otherwise fall back to state
        const shouldUpdateGlobal = forceGlobal !== undefined ? forceGlobal : updateGlobal;
        
        if (shouldUpdateGlobal) {
            try {
                const { settings } = await api.getInitialAppData();
                const currentApiSettings = settings.apiSettings || {};
                
                await api.updateSettings({
                    apiSettings: {
                        ...currentApiSettings,
                        colorScheme: scheme
                    }
                });
                setToast({ message: `Global theme updated to ${colorSchemeLabels[scheme]}!`, type: 'success' });
            } catch (error) {
                console.error('Failed to save theme globally:', error);
                setToast({ message: 'Failed to save theme setting globally.', type: 'error' });
            }
        } else {
             setToast({ message: `Color scheme changed to ${colorSchemeLabels[scheme]}!`, type: 'success' });
        }
    };

    return (
        <div className="space-y-8 p-4 md:p-0">
            {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
            <PageInterfaceSettingsModal isOpen={isInterfaceModalOpen} onClose={() => setIsInterfaceModalOpen(false)} />

            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <h2 className="text-2xl font-bold text-primary-text">System Settings</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* --- COLUMN 1: INTERFACE & INTEGRATIONS --- */}
                <div className="space-y-8">
                    {/* Color Scheme Selection */}
                    <SettingsCard title="Color Scheme" icon={Palette}>
                        <p className="text-sm text-muted -mt-2">Choose the application's primary color scheme.</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                            {[
                                { id: 'green', label: 'Paradigm Green', desc: 'Nature theme', color: '#006B3F', border: 'border-green-500', bg: 'bg-green-50', ring: 'ring-green-200', icon: 'P' },
                                { id: 'professional-blue', label: 'Professional Blue', desc: 'Enterprise / Admin', color: '#2563EB', border: 'border-blue-600', bg: 'bg-blue-50', ring: 'ring-blue-200', icon: 'B' },
                                { id: 'purple', label: 'Royal Purple', desc: 'Premium theme', color: '#5B21B6', border: 'border-purple-500', bg: 'bg-purple-50', ring: 'ring-purple-200', icon: 'R' },
                                { id: 'red', label: 'Crimson Red', desc: 'Bold theme', color: '#991B1B', border: 'border-red-500', bg: 'bg-red-50', ring: 'ring-red-200', icon: 'C' },
                                { id: 'amber', label: 'Amber Gold', desc: 'Warm theme', color: '#B45309', border: 'border-orange-500', bg: 'bg-orange-50', ring: 'ring-orange-200', icon: 'A' },
                                { id: 'dark-saas', label: 'Dark SaaS', desc: 'Modern / Developer', color: '#0F172A', border: 'border-slate-800', bg: 'bg-slate-900', ring: 'ring-slate-700', icon: 'D' },
                                { id: 'teal-mint', label: 'Teal & Mint', desc: 'Health / Facility', color: '#0D9488', border: 'border-teal-500', bg: 'bg-teal-50', ring: 'ring-teal-200', icon: 'T' },
                                { id: 'indigo-violet', label: 'Indigo & Violet', desc: 'HR / Productivity', color: '#4F46E5', border: 'border-indigo-500', bg: 'bg-indigo-50', ring: 'ring-indigo-200', icon: 'I' },
                                { id: 'green-finance', label: 'Green Finance', desc: 'Billing / Payroll', color: '#15803D', border: 'border-emerald-600', bg: 'bg-emerald-50', ring: 'ring-emerald-200', icon: 'G' },
                                { id: 'orange-energy', label: 'Orange Energy', desc: 'Operations / Field', color: '#EA580C', border: 'border-orange-600', bg: 'bg-orange-50', ring: 'ring-orange-200', icon: 'O' },
                                { id: 'red-alert', label: 'Red Alert', desc: 'Security / Critical', color: '#DC2626', border: 'border-red-600', bg: 'bg-red-50', ring: 'ring-red-200', icon: 'R' },
                                { id: 'neutral-gray', label: 'Neutral Gray', desc: 'Minimal / Data', color: '#374151', border: 'border-gray-500', bg: 'bg-gray-50', ring: 'ring-gray-200', icon: 'N' },
                                { id: 'cyan-tech', label: 'Cyan Tech', desc: 'Smart Systems', color: '#0891B2', border: 'border-cyan-500', bg: 'bg-cyan-50', ring: 'ring-cyan-200', icon: 'C' },
                                { id: 'black-gold', label: 'Premium Black & Gold', desc: 'Management / Exec', color: '#111827', border: 'border-yellow-600', bg: 'bg-gray-900', ring: 'ring-yellow-500', icon: 'G' },
                            ].map((theme) => (
                                <button
                                    key={theme.id}
                                    type="button"
                                    onClick={() => handleColorSchemeChange(theme.id as ColorScheme)}
                                    className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                                        colorScheme === theme.id 
                                            ? `${theme.border} ${theme.bg} ring-2 ${theme.ring}` 
                                            : 'border-border hover:border-gray-300'
                                    }`}
                                >
                                    <div 
                                        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                                        style={{ backgroundColor: theme.color }}
                                    >
                                        <span className={`font-bold text-sm ${['dark-saas', 'black-gold'].includes(theme.id) ? 'text-white' : 'text-white'}`}>{theme.icon}</span>
                                    </div>
                                    <div className="text-left">
                                        <p className={`font-semibold ${['dark-saas', 'black-gold'].includes(theme.id) && colorScheme === theme.id ? 'text-primary-text' : 'text-primary-text'}`}>{theme.label}</p>
                                        <p className="text-xs text-muted">{theme.desc}</p>
                                    </div>
                                </button>
                            ))}
                            
                             <div className="col-span-1 sm:col-span-2 mt-4 pt-4 border-t border-border">
                                <Checkbox 
                                    id="global-theme-default" 
                                    label="Set as Global Default" 
                                    description="If checked, the selected color scheme will be applied to all users who haven't set a preference."
                                    checked={updateGlobal}
                                    onChange={(e) => {
                                        const isChecked = e.target.checked;
                                        setUpdateGlobal(isChecked);
                                        // If checking the box, immediately update the current scheme globally
                                        if (isChecked) {
                                            handleColorSchemeChange(colorScheme, true);
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    </SettingsCard>

                    <SettingsCard title="Page Interface" icon={Image}>
                        <p className="text-sm text-muted -mt-2">Customize the application's branding, login screen, and user interaction settings.</p>
                        <div className="pt-4">
                            <Button type="button" onClick={() => setIsInterfaceModalOpen(true)}>Open Interface Settings</Button>
                        </div>
                    </SettingsCard>

                    <SettingsCard title="Verification APIs" icon={ShieldCheck}>
                        <p className="text-sm text-muted -mt-2">Configure third-party services for employee verification.</p>
                        <div className="space-y-6 pt-4">
                            {/* Gemini API */}
                            <div className="p-4 border border-border rounded-lg api-setting-item-bg">
                                <Checkbox
                                    id="gemini-enabled"
                                    label="Enable Gemini API OCR Verification"
                                    description="Use Google's Gemini API for document data extraction. This is a powerful fallback or primary OCR. API key must be configured on the backend."
                                    checked={store.geminiApi.enabled}
                                    onChange={e => store.updateGeminiApiSettings({ enabled: e.target.checked })}
                                />
                            </div>
                            {/* Perfios API */}
                            <div className="p-4 border border-border rounded-lg api-setting-item-bg">
                                <Checkbox
                                    id="perfios-enabled"
                                    label="Enable Perfios API Verification"
                                    description="Use Perfios for Bank, Aadhaar, and UAN verification."
                                    checked={store.perfiosApi.enabled}
                                    onChange={e => store.updatePerfiosApiSettings({ enabled: e.target.checked })}
                                />
                                <div className={`mt-4 space-y-4 transition-opacity ${store.perfiosApi.enabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                                    <Input label="Perfios Client ID" value={store.perfiosApi.clientId} onChange={e => store.updatePerfiosApiSettings({ clientId: e.target.value })} />
                                    <Input label="Perfios Client Secret" type="password" value={store.perfiosApi.clientSecret} onChange={e => store.updatePerfiosApiSettings({ clientSecret: e.target.value })} />
                                </div>
                            </div>
                        </div>
                    </SettingsCard>

                    <SettingsCard title="Authentication Settings" icon={Phone}>
                        <p className="text-sm text-muted -mt-2">Manage how users sign in to the application.</p>
                        <div className="space-y-6 pt-4">
                            <Checkbox
                                id="otp-enabled"
                                label="Enable OTP Phone Sign-In"
                                description="Allow users to sign in using a one-time password sent via SMS."
                                checked={store.otp.enabled}
                                onChange={e => store.updateOtpSettings({ enabled: e.target.checked })}
                            />
                        </div>
                    </SettingsCard>
                </div>

                {/* --- COLUMN 2: SYSTEM & DATA --- */}
                <div className="space-y-8">
                    <SettingsCard title="Client & Site Management" icon={Building}>
                        <p className="text-sm text-muted -mt-2">Control workflows for site creation and management.</p>
                        <div className="space-y-6 pt-4">
                            <Checkbox
                                id="enable-provisional-sites"
                                label="Enable Provisional Site Creation"
                                description="Allows HR/Admins to create a site with just a name, providing a 90-day grace period to complete the full configuration for easier onboarding."
                                checked={store.siteManagement.enableProvisionalSites}
                                onChange={e => store.updateSiteManagementSettings({ enableProvisionalSites: e.target.checked })}
                            />
                        </div>
                    </SettingsCard>
                    <SettingsCard title="System & Data" icon={Settings}>
                        <p className="text-sm text-muted -mt-2">Manage core system settings and data operations.</p>
                        <div className="space-y-6 pt-4">
                            <Checkbox id="pincode-verification" label="Enable Pincode API Verification" description="Auto-fill City/State from pincode during onboarding." checked={store.address.enablePincodeVerification} onChange={e => store.updateAddressSettings({ enablePincodeVerification: e.target.checked })} />

                            <div className="pt-4 border-t">
                                <h4 className="font-semibold text-primary-text mb-2">Backup & Export</h4>
                                <p className="text-sm text-muted mb-4">Download all data from the active data source (Mock Data).</p>
                                <Button type="button" variant="outline" onClick={handleExport} isLoading={isExporting}>
                                    <Download className="mr-2 h-4 w-4" /> Export All Data
                                </Button>
                            </div>
                        </div>
                    </SettingsCard>

                    <SettingsCard title="Notification Settings" icon={Mail}>
                        <p className="text-sm text-muted -mt-2">Configure how the system sends notifications.</p>
                        <div className="space-y-6 pt-4">
                            <Checkbox
                                id="email-notif-enabled"
                                label="Enable Email Notifications"
                                description="Send emails for important events like task assignments. SMTP must be configured on the backend."
                                checked={store.notifications.email.enabled}
                                onChange={e => store.updateNotificationSettings({ email: { enabled: e.target.checked } })}
                            />
                        </div>
                    </SettingsCard>
                </div>
            </div>
        </div>
    );
};