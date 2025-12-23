import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { usePermissionsStore } from '../store/permissionsStore';
import { allNavLinks } from '../components/layouts/MainLayout';
import { LogOut } from 'lucide-react';
import { ProfilePlaceholder } from '../components/ui/ProfilePlaceholder';
import { useBrandingStore } from '../store/brandingStore';
import { getThemeColors } from '../utils/themeUtils';

const MobileHome: React.FC = () => {
    const { user, logout } = useAuthStore();
    const { permissions } = usePermissionsStore();
    const { colorScheme } = useBrandingStore();
    const navigate = useNavigate();

    const globalThemeColors = getThemeColors(colorScheme);

    const themeColors = {
            bg: `bg-[${globalThemeColors.mobileBg}]`, // Used for container bg
            cardBg: `bg-[${globalThemeColors.sidebarBg}]`, // Header card matches sidebar/header logic
            iconBg: `bg-[${globalThemeColors.sidebarBg}]`, // Card background
            border: `border-[${globalThemeColors.sidebarBorder}]`,
            highlightBorder: `border-[${globalThemeColors.primary}]`,
            iconColor: `text-[${globalThemeColors.primary}]`,
            textColor: globalThemeColors.isDark ? 'text-white' : 'text-slate-800',
            subTextColor: globalThemeColors.isDark ? 'text-gray-400' : 'text-slate-500',
            headingColor: globalThemeColors.isDark ? 'text-white' : 'text-slate-900',
            cardHeadingColor: 'text-white', // Header card is usually dark/colored so text is white
            // Need to override logic because Tailwind arbitrary values like bg-[#123] work, 
            // but we need to inject the ACTUAL hex string into style prop or ensure Tailwind JIT sees it.
            // Using style={} is safer for dynamic colors.
        };

    if (!user) return null;

    // Filter links based on user permissions
    const availableLinks = allNavLinks
        .filter(link => permissions[user.role]?.includes(link.permission))
        .sort((a, b) => a.label.localeCompare(b.label));

    const handleLogout = async () => {
        await logout();
        navigate('/auth/login');
    };

    return (
        <div className="min-h-[calc(100vh-180px)] flex flex-col pb-4" style={{ backgroundColor: 'transparent' }}>
            {/* Header Section - No negative margin since main Header is hidden */}
            <div className="border p-6 rounded-3xl shadow-lg -mx-4 mb-6" style={{ backgroundColor: globalThemeColors.sidebarBg, borderColor: globalThemeColors.sidebarBorder }}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                        <div className="rounded-full border-2" style={{ borderColor: globalThemeColors.primary }}>
                             <ProfilePlaceholder photoUrl={user.photoUrl} seed={user.id} className="h-14 w-14 rounded-full" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Hi, {user.name.split(' ')[0]}</h1>
                            <p className="text-xs text-white/70 uppercase tracking-wider">{user.role.replace(/_/g, ' ')}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions Grid - Fill remaining space */}
            <div className="flex-1 flex flex-col">
                <h2 className="text-lg font-semibold mb-4 px-2" style={{ color: globalThemeColors.isDark ? 'white' : '#111827' }}>Apps & Features</h2>
                <div className="grid grid-cols-3 gap-3 px-2 flex-1 content-start">
                    {availableLinks.map((link) => (
                        <div
                            key={link.to}
                            onClick={() => navigate(link.to)}
                            className="flex flex-col items-center justify-center p-4 border rounded-2xl active:scale-95 transition-transform duration-150 shadow-md min-h-[110px]"
                            style={{ 
                                backgroundColor: globalThemeColors.sidebarBg, 
                                borderColor: globalThemeColors.sidebarBorder 
                            }}
                        >
                            <div className="p-3 rounded-full mb-2" style={{ backgroundColor: globalThemeColors.mobileBg === '#ffffff' ? globalThemeColors.activeItemBg + '20' : globalThemeColors.mobileBg, color: globalThemeColors.primary }}>
                                <link.icon className="w-7 h-7" />
                            </div>
                            <span className="text-xs text-center font-medium leading-tight" style={{ color: globalThemeColors.isDark || globalThemeColors.sidebarBg !== '#ffffff' ? 'white' : '#1e293b' }}>{link.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Logout Button */}
            <div className="px-2 mt-6">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center space-x-2 p-4 rounded-xl font-semibold active:scale-95 transition-all text-white shadow-lg"
                    style={{ backgroundColor: globalThemeColors.mobileBg === '#ffffff' ? '#1f2937' : globalThemeColors.primary }}
                >
                    <LogOut className="w-5 h-5" />
                    <span>Log Out</span>
                </button>
            </div>
        </div>
    );
};

export default MobileHome;
