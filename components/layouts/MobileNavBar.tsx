import React, { useState, useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Menu, X, ClipboardCheck, LifeBuoy } from 'lucide-react';
import type { User as AppUser, Permission } from '../../types';
import { usePermission } from '../../utils/permissions';
import { useAuthStore } from '../../store/authStore';
import CameraCaptureModal from '../CameraCaptureModal';
import PermissionDeniedModal from '../modals/PermissionDeniedModal';
import Toast from '../ui/Toast';

interface MobileNavBarProps {
    user: AppUser;
    permissions: Permission[];
    setIsMobileMenuOpen: (isOpen: boolean) => void;
    isMobileMenuOpen: boolean;
}

const AnimatedMenuIcon: React.FC<{ isOpen: boolean; className?: string }> = ({ isOpen, className }) => {
    return (
        <div className={`relative ${className} w-6 h-6 flex items-center justify-center`}>
            <Menu className={`absolute transition-all duration-300 ease-in-out ${isOpen ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'}`} size={24} />
            <X className={`absolute transition-all duration-300 ease-in-out ${isOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'}`} size={24} />
        </div>
    )
};

const MobileNavBar: React.FC<MobileNavBarProps> = ({ user, permissions, setIsMobileMenuOpen, isMobileMenuOpen }) => {
    const location = useLocation();
    const { isCheckedIn, toggleCheckInStatus } = useAuthStore();

    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
    const [permissionNeeded, setPermissionNeeded] = useState<'Camera' | 'Location'>('Camera');
    const [currentAction, setCurrentAction] = useState<'check-in' | 'check-out' | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const locationPermission = usePermission('geolocation');
    const cameraPermission = usePermission('camera');

    // Keep these handlers in case they are needed later, though buttons are currently removed from nav
    const handleCheckIn = async () => {
        if (locationPermission.status === 'denied' || cameraPermission.status === 'denied') {
            setPermissionNeeded(locationPermission.status === 'denied' ? 'Location' : 'Camera');
            setIsPermissionModalOpen(true);
            return;
        }

        let locGranted = locationPermission.status === 'granted';
        if (locationPermission.status === 'prompt') {
            locGranted = await locationPermission.request();
        }

        if (!locGranted) {
            setToast({ message: 'Location permission is required to check in.', type: 'error' });
            return;
        }

        setCurrentAction('check-in');
        setIsCameraOpen(true);
    };

    const handleCheckOut = async () => {
        if (locationPermission.status === 'denied' || cameraPermission.status === 'denied') {
            setPermissionNeeded(locationPermission.status === 'denied' ? 'Location' : 'Camera');
            setIsPermissionModalOpen(true);
            return;
        }

        let locGranted = locationPermission.status === 'granted';
        if (locationPermission.status === 'prompt') {
            locGranted = await locationPermission.request();
        }

        if (!locGranted) {
            setToast({ message: 'Location permission is required to check out.', type: 'error' });
            return;
        }

        setCurrentAction('check-out');
        setIsCameraOpen(true);
    };

    const handleCapture = async (base64Image: string, mimeType: string) => {
        setIsCameraOpen(false);
        try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0,
                });
            });

            const { latitude, longitude } = position.coords;
            const photo = `data:${mimeType};base64,${base64Image}`;

            if (currentAction === 'check-in') {
                const { success, message } = await toggleCheckInStatus();
                setToast({ message, type: success ? 'success' : 'error' });
            } else if (currentAction === 'check-out') {
                const { success, message } = await toggleCheckInStatus();
                setToast({ message, type: success ? 'success' : 'error' });
            }
        } catch (err: any) {
            setToast({ message: err.message || `Failed to ${currentAction}.`, type: 'error' });
        } finally {
            setCurrentAction(null);
        }
    };

    type NavItem = {
        key: string;
        to?: string;
        onClick?: () => void;
        label: string;
        icon: React.ElementType | React.FC<any>;
        end?: boolean;
    };

    const navItems = useMemo((): NavItem[] => {
        const items: NavItem[] = [];

        const tasksLink = permissions.includes('manage_tasks') ? '/tasks' : '/onboarding/tasks';
        items.push({ key: 'tasks', to: tasksLink, label: 'Tasks', icon: ClipboardCheck, end: false });

        if (permissions.includes('access_support_desk')) {
            items.push({ key: 'support', to: '/support', label: 'Support', icon: LifeBuoy, end: false });
        }

        items.push({ key: 'home', to: '/profile', label: 'Home', icon: Home, end: true });

        items.push({
            key: 'menu',
            onClick: () => setIsMobileMenuOpen(!isMobileMenuOpen),
            label: 'Menu',
            icon: (props: any) => <AnimatedMenuIcon isOpen={isMobileMenuOpen} {...props} />
        });

        return items;
    }, [permissions, isMobileMenuOpen, setIsMobileMenuOpen, isCheckedIn]);

    const activeItemPath = useMemo(() => {
        const path = location.pathname;
        const linkItems = navItems.filter(item => item.to);
        const sortedNavItems = [...linkItems].sort((a, b) => b.to!.length - a.to!.length);
        return sortedNavItems.find(item => {
            if (item.end) {
                return path === item.to;
            }
            return path.startsWith(item.to!);
        })?.to;
    }, [location.pathname, navItems]);

    return (
        <>
            {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
            <CameraCaptureModal
                isOpen={isCameraOpen}
                onClose={() => setIsCameraOpen(false)}
                onCapture={handleCapture}
                captureGuidance="profile"
            />
            <PermissionDeniedModal
                isOpen={isPermissionModalOpen}
                onClose={() => setIsPermissionModalOpen(false)}
                permissionName={permissionNeeded}
            />
            <nav
                className={`fixed bottom-6 left-6 right-6 z-50 md:hidden bg-[#0d2c18]/95 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl shadow-black/40 transition-transform duration-300 ${isMobileMenuOpen ? 'translate-y-[150%]' : 'translate-y-0'}`}
                style={{
                    height: '64px',
                }}
            >
                <div className="h-full flex justify-around items-center px-2">
                    {navItems.map((item) => {
                        const isTasksActive = item.key === 'tasks' && location.pathname.startsWith('/tasks');
                        const isActive = (!!item.to && activeItemPath === item.to) || isTasksActive;
                        // Menu should not show active background state
                        const showActive = isActive;

                        // Common container classes for alignment
                        const containerClasses = "flex flex-col items-center justify-center w-16 h-full active:scale-95 transition-transform duration-200";

                        // Icon container classes for the shape and color
                        const iconContainerClasses = `flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 ${showActive
                            ? "bg-gradient-to-tr from-green-600 to-green-400 text-white shadow-lg shadow-green-900/30 scale-105"
                            : "text-white/60 hover:text-white"
                            }`;

                        // Render button for actions (like Menu)
                        if (item.onClick) {
                            return (
                                <button
                                    key={item.key}
                                    onClick={item.onClick}
                                    className={containerClasses}
                                    aria-label={item.label}
                                >
                                    <div className={iconContainerClasses}>
                                        <item.icon
                                            className="transition-colors duration-200"
                                            size={24}
                                        />
                                    </div>
                                </button>
                            );
                        }

                        // Render NavLink for navigation items
                        return (
                            <NavLink
                                key={item.key}
                                to={item.to!}
                                end={item.end}
                                className={containerClasses}
                            >
                                <div className={iconContainerClasses}>
                                    <item.icon
                                        size={24}
                                        className="transition-colors duration-200"
                                    />
                                </div>
                            </NavLink>
                        );
                    })}
                </div>
            </nav>
        </>
    );
};

export default MobileNavBar;