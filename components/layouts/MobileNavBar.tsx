import React, { useState, useEffect, useRef, useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, User, ListTodo, Menu, X, ClipboardCheck, LifeBuoy, LogIn, LogOut } from 'lucide-react';
import type { User as AppUser, Permission } from '../../types';
import { usePermission } from '../../utils/permissions';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../services/api';
import CameraCaptureModal from '../CameraCaptureModal';
import PermissionDeniedModal from '../modals/PermissionDeniedModal';
import Toast from '../ui/Toast';

const ICON_SIZE = 24;
const ACTIVE_ICON_SIZE = 24;
const INDICATOR_SIZE = 56;

const generatePath = (width: number, indicatorLeft: number, indicatorWidth: number): string => {
    const notchRadius = INDICATOR_SIZE / 2;
    const barHeight = 64; // h-16
    const cornerRadius = 16;
    const notchCenter = indicatorLeft + indicatorWidth / 2;

    const notchStart = notchCenter - notchRadius - 8;
    const notchEnd = notchCenter + notchRadius + 8;
    const controlPointOffset = notchRadius * 0.8;

    const path = [
        `M 0 ${cornerRadius}`,
        `A ${cornerRadius} ${cornerRadius} 0 0 1 ${cornerRadius} 0`,
        `L ${notchStart - cornerRadius} 0`,
        `C ${notchStart - controlPointOffset} 0, ${notchCenter - notchRadius} ${barHeight * 0.6}, ${notchCenter} ${barHeight * 0.6}`,
        `C ${notchCenter + notchRadius} ${barHeight * 0.6}, ${notchEnd + controlPointOffset} 0, ${notchEnd + cornerRadius} 0`,
        `L ${width - cornerRadius} 0`,
        `A ${cornerRadius} ${cornerRadius} 0 0 1 ${width} ${cornerRadius}`,
        `L ${width} ${barHeight}`,
        `L 0 ${barHeight}`,
        `Z`
    ].join(' ');

    return path;
};

interface MobileNavBarProps {
    user: AppUser;
    permissions: Permission[];
    setIsMobileMenuOpen: (isOpen: boolean) => void;
    isMobileMenuOpen: boolean;
}

const AnimatedMenuIcon: React.FC<{ isOpen: boolean; style?: React.CSSProperties; className?: string }> = ({ isOpen, style, className }) => {
    return (
        <div style={style} className={`relative ${className}`}>
            <Menu className={`absolute transition-all duration-300 ease-in-out ${isOpen ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'}`} />
            <X className={`absolute transition-all duration-300 ease-in-out ${isOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'}`} />
        </div>
    )
};

const MobileNavBar: React.FC<MobileNavBarProps> = ({ user, permissions, setIsMobileMenuOpen, isMobileMenuOpen }) => {
    const location = useLocation();
    const navRef = useRef<HTMLElement>(null);
    const itemRefs = useRef<Map<string, HTMLAnchorElement>>(new Map());
    const [pathD, setPathD] = useState('');
    const [indicatorStyle, setIndicatorStyle] = useState({});
    const { isCheckedIn, toggleCheckInStatus } = useAuthStore();

    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
    const [permissionNeeded, setPermissionNeeded] = useState<'Camera' | 'Location'>('Camera');
    const [currentAction, setCurrentAction] = useState<'check-in' | 'check-out' | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const locationPermission = usePermission('geolocation');
    const cameraPermission = usePermission('camera');

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
        icon: React.ElementType;
        end?: boolean;
    };

    const navItems = useMemo((): NavItem[] => {
        const items: NavItem[] = [];

        const tasksLink = permissions.includes('manage_tasks') ? '/tasks' : '/onboarding/tasks';
        items.push({ key: 'tasks', to: tasksLink, label: 'Tasks', icon: ClipboardCheck, end: false });

        if (permissions.includes('access_support_desk')) {
            items.push({ key: 'support', to: '/support', label: 'Support', icon: LifeBuoy, end: false });
        }

        // Dynamic Check-in/out button removed as per user request
        // if (isCheckedIn) {
        //     items.push({ key: 'checkout', onClick: handleCheckOut, label: 'Check Out', icon: LogOut });
        // } else {
        //     items.push({ key: 'checkin', onClick: handleCheckIn, label: 'Check In', icon: LogIn });
        // }

        items.push({ key: 'home', to: '/profile', label: 'Home', icon: Home, end: true });

        items.push({
            key: 'menu',
            onClick: () => setIsMobileMenuOpen(!isMobileMenuOpen),
            label: 'Menu',
            icon: (props) => <AnimatedMenuIcon isOpen={isMobileMenuOpen} {...props} />
        });

        return items;
    }, [permissions, isMobileMenuOpen, setIsMobileMenuOpen, isCheckedIn]);

    const activeItemPath = useMemo(() => {
        const path = location.pathname;
        const linkItems = navItems.filter(item => item.to);
        // Sort by path length descending to match the most specific path first
        const sortedNavItems = [...linkItems].sort((a, b) => b.to!.length - a.to!.length);
        // Find the first item whose 'to' path is a prefix of the current location pathname
        return sortedNavItems.find(item => {
            if (item.end) {
                return path === item.to;
            }
            return path.startsWith(item.to!);
        })?.to;
    }, [location.pathname, navItems]);

    useEffect(() => {
        const updateActiveState = () => {
            if (!navRef.current) return;

            const activeNode = activeItemPath ? itemRefs.current.get(activeItemPath) : null;
            const navRect = navRef.current.getBoundingClientRect();

            if (!activeNode) {
                setIndicatorStyle({ opacity: 0, transform: 'translateX(0px) translateY(-50%)' });
                setPathD(generatePath(navRect.width, -100, 0)); // Hide notch by moving it off-screen
                return;
            };

            const { offsetLeft, clientWidth } = activeNode;

            setIndicatorStyle({
                opacity: 1,
                width: `${INDICATOR_SIZE}px`,
                height: `${INDICATOR_SIZE}px`,
                transform: `translateX(${offsetLeft + clientWidth / 2 - INDICATOR_SIZE / 2}px) translateY(-50%)`,
            });

            setPathD(generatePath(navRect.width, offsetLeft, clientWidth));
        };

        // Delay to allow refs to populate and layout to settle
        const timer = setTimeout(updateActiveState, 50);
        window.addEventListener('resize', updateActiveState);

        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', updateActiveState);
        };
    }, [activeItemPath]);

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
                ref={navRef}
                className="fixed bottom-0 left-0 right-0 z-30 md:hidden"
                style={{ height: `calc(4rem + env(safe-area-inset-bottom))` }}
            >
                <div className="relative w-full h-full">
                    <svg
                        className="absolute top-0 left-0 w-full h-16"
                        fill="#0d2c18" // bg-card from pro-dark-theme
                    >
                        <path d={pathD} className="transition-all duration-300 ease-in-out" />
                    </svg>

                    <div
                        style={indicatorStyle}
                        className="absolute top-0 left-0 bg-green-500 rounded-full transition-all duration-300 ease-in-out shadow-[0_0_15px_rgba(34,197,94,0.6)] border-4 border-[#0d2c18]"
                    >
                        {navItems.map(item => {
                            if (!item.to) return null;
                            const isActive = activeItemPath === item.to;
                            return (
                                <div key={`${item.key}-icon`} className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ease-in-out ${isActive ? 'opacity-100 scale-110' : 'opacity-0 scale-50'}`}>
                                    <item.icon style={{ width: ACTIVE_ICON_SIZE, height: ACTIVE_ICON_SIZE }} className="text-[#0d2c18]" />
                                </div>
                            )
                        })}
                    </div>

                    <div className="absolute top-0 left-0 right-0 h-16 flex justify-around items-center z-10">
                        {navItems.map((item) => {
                            if (item.onClick) {
                                return (
                                    <button
                                        key={item.key}
                                        onClick={item.onClick}
                                        className="flex flex-col items-center justify-center w-16 h-16"
                                        aria-label={item.label}
                                    >
                                        <item.icon
                                            style={{ width: ICON_SIZE, height: ICON_SIZE }}
                                            className={isMobileMenuOpen ? "text-red-500" : "text-white"}
                                        />
                                    </button>
                                );
                            }

                            const isActive = activeItemPath === item.to;
                            return (
                                <NavLink
                                    key={item.key}
                                    to={item.to!}
                                    end={item.end}
                                    ref={(el) => {
                                        if (el) itemRefs.current.set(item.to!, el);
                                    }}
                                    className="flex flex-col items-center justify-center w-16 h-16 transition-all duration-300 ease-in-out"
                                    style={{ transform: isActive ? 'translateY(-8px)' : 'translateY(0)' }}
                                >
                                    <item.icon
                                        style={{ width: ICON_SIZE, height: ICON_SIZE }}
                                        className={`transition-all duration-300 ${isActive ? 'opacity-0 scale-50' : 'opacity-100 scale-100 text-white/70 hover:text-white'}`}
                                    />
                                </NavLink>
                            )
                        })}
                    </div>
                </div>
            </nav>
        </>
    );
};

export default MobileNavBar;