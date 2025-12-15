

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Outlet, NavLink, Navigate, useLocation } from 'react-router-dom';
import { ChevronsLeft, ChevronsRight, ChevronDown, ChevronUp, ShieldCheck, LayoutDashboard, ClipboardCheck, Map as MapIcon, ClipboardList, User, Briefcase, ListTodo, Building, Users, Shirt, Settings, GitBranch, Calendar, CalendarCheck2, ShieldHalf, FileDigit, GitPullRequest, Home, BriefcaseBusiness, UserPlus, IndianRupee, PackagePlus, LifeBuoy, MapPin, ArrowLeft, Navigation } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { usePermissionsStore } from '../../store/permissionsStore';
import Logo from '../ui/Logo';
import type { Permission } from '../../types';
import Button from '../ui/Button';
import { useUiSettingsStore } from '../../store/uiSettingsStore';
import { useNotificationStore } from '../../store/notificationStore';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import Header from './Header';
import { useBrandingStore } from '../../store/brandingStore';
import { getThemeColors } from '../../utils/themeUtils';

export interface NavLinkConfig {
    to: string;
    label: string;
    icon: React.ElementType;
    permission: Permission;
}

// All links are defined here, and filtered by role below.
export const allNavLinks: NavLinkConfig[] = [
    { to: '/verification/dashboard', label: 'All Submissions', icon: LayoutDashboard, permission: 'view_all_submissions' },
    { to: '/developer/api', label: 'API Settings', icon: Settings, permission: 'view_developer_settings' },
    { to: '/attendance/dashboard', label: 'Attendance', icon: Calendar, permission: 'view_own_attendance' },
    { to: '/hr/attendance-settings', label: 'Attendance Rules', icon: CalendarCheck2, permission: 'manage_attendance_rules' },
    { to: '/support', label: 'Backend Support', icon: LifeBuoy, permission: 'access_support_desk' },
    { to: '/hr/entities', label: 'Client Management', icon: Briefcase, permission: 'view_entity_management' },
    { to: '/hr/enrollment-rules', label: 'Enrollment Rules', icon: ClipboardCheck, permission: 'manage_enrollment_rules' },
    { to: '/hr/policies-and-insurance', label: 'Insurance Management', icon: ShieldHalf, permission: 'manage_insurance' },
    { to: '/billing/summary', label: 'Invoice Summary', icon: FileDigit, permission: 'view_invoice_summary' },
    { to: '/billing/cost-analysis', label: 'Verification Costing', icon: IndianRupee, permission: 'view_verification_costing' },
    { to: '/admin/approval-workflow', label: 'Leave Approval Settings', icon: GitBranch, permission: 'manage_approval_workflow' },
    { to: '/hr/leave-management', label: 'Leave Management', icon: GitPullRequest, permission: 'manage_leave_requests' },
    { to: '/admin/modules', label: 'Module Management', icon: PackagePlus, permission: 'manage_modules' },
    { to: '/onboarding', label: 'New Enrollment', icon: UserPlus, permission: 'create_enrollment' },
    { to: '/operations/dashboard', label: 'Operations', icon: BriefcaseBusiness, permission: 'view_operations_dashboard' },
    { to: '/profile', label: 'Profile', icon: User, permission: 'view_own_attendance' },
    { to: '/admin/roles', label: 'Role Management', icon: ShieldCheck, permission: 'manage_roles_and_permissions' },
    { to: '/site/dashboard', label: 'Site Dashboard', icon: Home, permission: 'view_site_dashboard' },
    { to: '/admin/sites', label: 'Site Management', icon: Building, permission: 'manage_sites' },
    { to: '/tasks', label: 'Task Management', icon: ListTodo, permission: 'manage_tasks' },
    { to: '/uniforms', label: 'Uniform Management', icon: Shirt, permission: 'manage_uniforms' },
    { to: '/admin/users', label: 'User Management', icon: Users, permission: 'manage_users' },
    { to: '/admin/patrol/dashboard', label: 'Patrol Dashboard', icon: ClipboardList, permission: 'manage_approval_workflow' },
    { to: '/hr/field-officer-tracking', label: 'User Activity Tracking', icon: MapIcon, permission: 'view_field_officer_tracking' },
    // Manage geofenced locations for attendance
    { to: '/hr/locations', label: 'Geo Locations', icon: MapPin, permission: 'manage_attendance_rules' },
    // User‑specific geofencing management
    { to: '/attendance/locations', label: 'My Locations', icon: Navigation, permission: 'view_own_attendance' },
    { to: '/patrol/scan', label: 'Patrol Scanner', icon: ShieldCheck, permission: 'view_developer_settings' },
];


import { useLogoStore } from '../../store/logoStore';
import { originalDefaultLogoBase64 } from '../ui/logoData';

const SidebarContent: React.FC<{ isCollapsed: boolean, onLinkClick?: () => void, onExpand?: () => void, hideHeader?: boolean, mode?: 'light' | 'dark', isMobile?: boolean }> = ({ isCollapsed, onLinkClick, onExpand, hideHeader = false, mode = 'light', isMobile = false }) => {
    const { user } = useAuthStore();
    const { permissions } = usePermissionsStore();
    const { colorScheme } = useBrandingStore();
    const { currentLogo } = useLogoStore();
    const location = useLocation();

    // Check if we are using a custom logo
    const isCustomLogo = currentLogo && currentLogo !== originalDefaultLogoBase64;

    const availableNavLinks = user ? allNavLinks
        .filter(link => permissions[user.role]?.includes(link.permission))
        .sort((a, b) => a.label.localeCompare(b.label))
        : [];

    // Dynamic accent colors based on branding
    const themeColors = getThemeColors(colorScheme);

    const handleLinkClick = (e: React.MouseEvent) => {
        // On mobile, if collapsed, clicking an icon should expand the sidebar instead of navigating
        if (isMobile && isCollapsed && onExpand) {
            e.preventDefault();
            onExpand();
            return;
        }

        // Otherwise (expanded or desktop), proceed with navigation and trigger onLinkClick (which collapses on mobile)
        if (onLinkClick) {
            onLinkClick();
        }
    };

    return (
        <div className="flex flex-col">
            {hideHeader && isCollapsed && (
                <div className={`p-4 border-b flex justify-center h-16 items-center transition-all duration-300 flex-shrink-0`}
                    style={{
                        borderColor: themeColors.sidebarBorder,
                        backgroundColor: themeColors.sidebarBg
                    }}>
                    <button onClick={() => window.location.href = '/#/profile'} className={`btn-icon inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-white/10 focus:outline-none`} aria-label="Go to profile page">
                        <span className="sr-only">Go to profile</span>
                        <ArrowLeft className="block h-6 w-6" />
                    </button>
                </div>
            )}
            {hideHeader && !isCollapsed && (
                <div className={`p-4 border-b flex justify-center h-16 items-center transition-all duration-300 flex-shrink-0`}
                    style={{
                        borderColor: themeColors.sidebarBorder,
                        backgroundColor: themeColors.sidebarBg
                    }}>
                    {/* Empty header - just background color */}
                </div>
            )}
            {!hideHeader && (
                <div className={`p-4 border-b border-gray-200 bg-white flex justify-center h-16 items-center transition-all duration-300 flex-shrink-0 overlay-hidden`}>
                    {isCollapsed ? (
                        <div className="h-8 w-8 overflow-hidden flex items-center justify-center">
                            {isCustomLogo ? (
                                <img src={currentLogo} alt="Logo" className="h-8 w-auto object-contain" />
                            ) : (
                                <Logo className="h-8 max-w-none object-left object-cover" />
                            )}
                        </div>
                    ) : (
                        isCustomLogo ? (
                             <img src={currentLogo} alt="Logo" className="h-14 lg:h-16 w-auto object-contain" />
                        ) : (
                             <Logo className="h-14 lg:h-16" />
                        )
                    )}
                </div>
            )}
            <nav className="px-3 py-4 space-y-1.5">
                {availableNavLinks.map(link => (
                    <NavLink
                        key={link.to}
                        to={link.to}
                        onClick={handleLinkClick}
                        className={({ isActive }) =>
                            `group flex items-center px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 ease-in-out ${isCollapsed ? 'justify-center' : ''} ${mode === 'light'
                                ? isActive
                                    ? '!text-white shadow-sm border bg-accent'
                                    : 'text-slate-700 hover:bg-gray-100 hover:text-slate-900'
                                : isActive
                                    ? '!text-white shadow-sm border border-white/5'
                                    : 'text-white hover:bg-white/10 hover:text-white'
                            } ${isActive && mode === 'light' ? 'nav-active-white' : ''}`
                        }
                        style={({ isActive }) => {
                            if (!isActive) return {};
                            if (mode === 'light') {
                                return { backgroundColor: themeColors.activeItemBg, borderColor: themeColors.sidebarBorder, color: '#ffffff' };
                            } else {
                                // Dark mode (Mobile sidebar)
                                return { backgroundColor: themeColors.activeItemBg, color: themeColors.activeItemText };
                            }
                        }}
                        title={link.label}
                    >
                        {({ isActive }) => (
                            <>
                                <link.icon
                                    className={`h-5 w-5 flex-shrink-0 transition-colors duration-200 ${mode === 'light'
                                        ? isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-700'
                                        : isActive ? 'text-white' : 'text-white group-hover:text-white'
                                        } ${isCollapsed ? '' : 'mr-3'}`}
                                />
                                {!isCollapsed && (
                                    <span
                                        className={isActive && mode === 'light' ? '!text-white' : ''}
                                        style={isActive && mode === 'light' ? { color: '#ffffff' } : {}}
                                    >
                                        {link.label}
                                    </span>
                                )}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* Force override for active menu items in light mode using high specificity */}
            <style dangerouslySetInnerHTML={{__html: `
                .nav-active-white,
                .nav-active-white *,
                a[aria-current="page"] span,
                a[aria-current="page"] svg {
                    color: #ffffff !important;
                }
            `}} />
        </div>
    );
};


const MainLayout: React.FC = () => {
    const { user } = useAuthStore();
    const { fetchNotifications } = useNotificationStore();
    const { permissions } = usePermissionsStore();
    const { autoScrollOnHover } = useUiSettingsStore();
    const { colorScheme } = useBrandingStore();
    const location = useLocation();
    const isMobile = useMediaQuery('(max-width: 767px)');

    const mainContentRef = useRef<HTMLDivElement>(null);
    const pageScrollIntervalRef = useRef<number | null>(null);

    // Initialize sidebar state based on device type. 
    // On mobile, start collapsed (true). On desktop, start expanded (false).
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true); // Default to true to prevent flash
    const [scrollPosition, setScrollPosition] = useState(0);
    const [showScrollButtons, setShowScrollButtons] = useState(false);

    // Update sidebar state when switching between mobile/desktop
    useEffect(() => {
        setIsSidebarCollapsed(isMobile);
    }, [isMobile]);

    const stopPageScrolling = useCallback(() => {
        if (pageScrollIntervalRef.current !== null) {
            clearInterval(pageScrollIntervalRef.current);
            pageScrollIntervalRef.current = null;
        }
    }, []);

    const startPageScrolling = useCallback((direction: 'up' | 'down') => {
        stopPageScrolling();
        const mainEl = mainContentRef.current;
        if (!mainEl) return;

        const scroll = () => {
            mainEl.scrollBy({ top: direction === 'up' ? -window.innerHeight * 0.8 : window.innerHeight * 0.8, behavior: 'smooth' });
        };
        scroll(); // immediate scroll
        pageScrollIntervalRef.current = window.setInterval(scroll, 300);
    }, [stopPageScrolling]);


    useEffect(() => {
        const handleScroll = () => {
            const mainEl = mainContentRef.current;
            if (mainEl) {
                setShowScrollButtons(mainEl.scrollHeight > mainEl.clientHeight);
                setScrollPosition(mainEl.scrollTop);
            }
        };

        const mainEl = mainContentRef.current;
        mainEl?.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('resize', handleScroll);

        // Initial check
        handleScroll();

        return () => {
            mainEl?.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleScroll);
            stopPageScrolling();
        };
    }, [stopPageScrolling]);


    useEffect(() => {
        if (user) {
            fetchNotifications();
        }
    }, [user, fetchNotifications]);

    if (!user) {
        return <Navigate to="/auth/login" replace />;
    }

    // Dynamic accent colors based on branding for the main layout wrapper
    const themeColors = getThemeColors(colorScheme);

    return (
        // ensures the container grows as needed instead of forcing a fixed height.
        <div className={`flex min-h-screen ${isMobile ? themeColors.mobileBg : 'bg-page'} ${!isMobile ? 'p-4 md:p-6 lg:p-8 gap-4 md:gap-6 lg:gap-8' : ''}`}
             style={isMobile && themeColors.isDark ? { backgroundColor: themeColors.mobileBg } : {}}
        >

            {/* Backdrop for mobile when sidebar is expanded */}
            {isMobile && !isSidebarCollapsed && (
                <div
                    className="fixed inset-0 bg-black/50 z-20 transition-opacity duration-300"
                    onClick={() => setIsSidebarCollapsed(true)}
                />
            )}

            {/* Sidebar - Overlay on mobile, fixed on desktop */}
            <aside className={`flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out ${isMobile ? (isSidebarCollapsed ? 'w-16' : 'w-64') : (isSidebarCollapsed ? 'w-20' : 'w-72')} ${isMobile ? 'border-r' : 'bg-white border-r border-gray-200/60'} ${isMobile ? 'fixed left-0 top-0 bottom-0 z-50' : ''}`}
                style={isMobile ? {
                    backgroundColor: themeColors.sidebarBg,
                    borderRightColor: themeColors.sidebarBorder
                } : undefined}>
                <div className="flex-1 overflow-y-auto overflow-x-hidden">
                    <SidebarContent
                        isCollapsed={isSidebarCollapsed}
                        mode={isMobile ? "dark" : 'light'} 
                        onLinkClick={isMobile ? () => setIsSidebarCollapsed(true) : undefined}
                        onExpand={() => setIsSidebarCollapsed(false)}
                        hideHeader={isMobile}
                        isMobile={isMobile}
                    />
                </div>
                <div className={`flex-shrink-0 px-2 pt-2 mt-auto flex items-center ${isMobile ? 'border-t' : 'border-t border-border'}`}
                    style={isMobile ? { borderColor: themeColors.sidebarBorder } : undefined}
                >
                    <button
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        className={`flex-1 flex items-center justify-center p-2 rounded-lg transition-colors ${isMobile ? 'text-white/70 hover:bg-white/10' : 'text-muted hover:bg-page'}`}
                        title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        {isSidebarCollapsed ? <ChevronsRight className="h-5 w-5" /> : <ChevronsLeft className="h-5 w-5" />}
                    </button>
                </div>
            </aside>

            <div className={`flex-1 flex flex-col ${isMobile ? '' : 'bg-gray-50/50'} ${isMobile && isSidebarCollapsed ? 'ml-16' : ''}`}
                style={isMobile ? { backgroundColor: themeColors.mobileBg } : undefined}
            >
                <Header />

                {/* Main Content */}
                <main ref={mainContentRef} className={`flex-1 overflow-y-auto ${isMobile ? '' : 'bg-page'}`}
                    style={isMobile && themeColors.isDark ? { backgroundColor: themeColors.mobileBg } : undefined}
                >
                    <div className="p-4">
                        {/* Bordered Card Container removed to fix white screen issue */}
                        <Outlet />
                    </div>
                </main>

            </div>
            {/* Scroll-to-top/bottom buttons */}
            {showScrollButtons && !isMobile && (
                <div className="fixed bottom-8 right-8 z-50 flex flex-col gap-2 no-print">
                    <Button
                        variant="secondary"
                        size="sm"
                        className="!rounded-full !p-2 shadow-lg"
                        onMouseEnter={autoScrollOnHover ? () => startPageScrolling('up') : undefined}
                        onMouseLeave={stopPageScrolling}
                        onMouseDown={() => startPageScrolling('up')}
                        onMouseUp={stopPageScrolling}
                        onTouchStart={() => startPageScrolling('up')}
                        onTouchEnd={stopPageScrolling}
                        disabled={scrollPosition <= 0}
                        aria-label="Scroll Up"
                    >
                        <ChevronUp className="h-5 w-5" />
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        className="!rounded-full !p-2 shadow-lg"
                        onMouseEnter={autoScrollOnHover ? () => startPageScrolling('down') : undefined}
                        onMouseLeave={stopPageScrolling}
                        onMouseDown={() => startPageScrolling('down')}
                        onMouseUp={stopPageScrolling}
                        onTouchStart={() => startPageScrolling('down')}
                        onTouchEnd={stopPageScrolling}
                        disabled={mainContentRef.current ? Math.ceil(mainContentRef.current.clientHeight + scrollPosition) >= mainContentRef.current.scrollHeight : false}
                        aria-label="Scroll Down"
                    >
                        <ChevronDown className="h-5 w-5" />
                    </Button>
                </div>
            )}
        </div>
    );
};

export default MainLayout;
