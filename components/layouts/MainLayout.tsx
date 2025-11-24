

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Outlet, NavLink, Navigate, useLocation } from 'react-router-dom';
import { ChevronsLeft, ChevronsRight, ChevronDown, ChevronUp, ShieldCheck, LayoutDashboard, ClipboardCheck, Map as MapIcon, ClipboardList, User, Briefcase, ListTodo, Building, Users, Shirt, Settings, GitBranch, Calendar, CalendarCheck2, ShieldHalf, FileDigit, GitPullRequest, Home, BriefcaseBusiness, UserPlus, ArrowLeft, IndianRupee, PackagePlus, LifeBuoy, MapPin, X } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { usePermissionsStore } from '../../store/permissionsStore';
import Logo from '../ui/Logo';
import type { Permission } from '../../types';
import Button from '../ui/Button';
import { useUiSettingsStore } from '../../store/uiSettingsStore';
import MobileNavBar from './MobileNavBar';
import { useNotificationStore } from '../../store/notificationStore';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import Header from './Header';
import { api } from '../../services/api';

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
    { to: '/hr/field-officer-tracking', label: 'User Activity Tracking', icon: MapIcon, permission: 'view_field_officer_tracking' },
    // Manage geofenced locations for attendance
    { to: '/hr/locations', label: 'Geo Locations', icon: MapPin, permission: 'manage_attendance_rules' },
    // User‑specific geofencing management
    { to: '/attendance/locations', label: 'My Locations', icon: MapPin, permission: 'view_own_attendance' },
];


const SidebarContent: React.FC<{ isCollapsed: boolean, onLinkClick?: () => void, hideHeader?: boolean, mode?: 'light' | 'dark' }> = ({ isCollapsed, onLinkClick, hideHeader = false, mode = 'light' }) => {
    const { user } = useAuthStore();
    const { permissions } = usePermissionsStore();
    const availableNavLinks = user ? allNavLinks
        .filter(link => permissions[user.role]?.includes(link.permission))
        .sort((a, b) => a.label.localeCompare(b.label))
        : [];

    return (
        <div className="flex flex-col">
            {!hideHeader && (
                <div className={`p-4 border-b border-white/10 bg-white flex justify-center h-16 items-center transition-all duration-300 flex-shrink-0`}>
                    {isCollapsed ? (
                        <ShieldCheck className="h-8 w-8 text-accent" />
                    ) : (
                        <Logo />
                    )}
                </div>
            )}
            <nav className="px-3 py-4 space-y-1.5">
                {availableNavLinks.map(link => (
                    <NavLink
                        key={link.to}
                        to={link.to}
                        onClick={onLinkClick}
                        className={({ isActive }) =>
                            `group flex items-center px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 ease-in-out ${isCollapsed ? 'justify-center' : ''} ${mode === 'light'
                                ? isActive
                                    ? 'text-white shadow-sm border'
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                : isActive
                                    ? 'bg-[#1c3a23] text-white shadow-sm border border-white/5'
                                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                            }`
                        }
                        style={({ isActive }) => {
                            if (!isActive) return {};
                            return mode === 'light'
                                ? { backgroundColor: '#006B3F', borderColor: '#005632' }
                                : {}; // Dark mode bg is handled by class
                        }}
                        title={isCollapsed ? link.label : undefined}
                    >
                        {({ isActive }) => (
                            <>
                                <link.icon
                                    className={`h-5 w-5 flex-shrink-0 transition-colors duration-200 ${mode === 'light'
                                        ? isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'
                                        : isActive ? 'text-emerald-400' : 'text-gray-400 group-hover:text-white'
                                        } ${isCollapsed ? '' : 'mr-3'}`}
                                />
                                {!isCollapsed && <span>{link.label}</span>}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>
        </div>
    );
};


const MainLayout: React.FC = () => {
    const { user } = useAuthStore();
    const { fetchNotifications } = useNotificationStore();
    const { permissions } = usePermissionsStore();
    const { autoScrollOnHover } = useUiSettingsStore();
    const location = useLocation();

    const mainContentRef = useRef<HTMLDivElement>(null);
    const pageScrollIntervalRef = useRef<number | null>(null);

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [scrollPosition, setScrollPosition] = useState(0);
    const [showScrollButtons, setShowScrollButtons] = useState(false);

    const isMobile = useMediaQuery('(max-width: 767px)');

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
        const body = document.body;
        if (isMobileMenuOpen) {
            body.style.overflow = 'hidden';
        } else {
            body.style.overflow = '';
        }
        return () => { body.style.overflow = ''; };
    }, [isMobileMenuOpen]);

    useEffect(() => {
        if (user) {
            fetchNotifications();
        }
    }, [user, fetchNotifications]);

    const hideNavPaths = ['/onboarding/add'];
    const showMobileNavBar = isMobile && !hideNavPaths.some(path => location.pathname.startsWith(path));

    if (!user) {
        return <Navigate to="/auth/login" replace />;
    }

    return (
        // Use responsive padding and gap values to improve layout on small screens. Previously the layout used fixed
        // `p-8 gap-8`, which caused the sidebar and main content to squeeze on narrow viewports. Now we apply
        // progressively larger spacing on wider screens while keeping things compact on mobile. The `min-h-screen`
        // ensures the container grows as needed instead of forcing a fixed height.
        <div className={`flex min-h-screen bg-page ${!isMobile ? 'p-4 md:p-6 lg:p-8 gap-4 md:gap-6 lg:gap-8' : ''}`}>

            {/* Desktop Sidebar */}
            {!isMobile && (
                <aside className={`hidden md:flex md:flex-col md:flex-shrink-0 transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'w-20' : 'w-72'} bg-white border-r border-gray-200/60`}>
                    <div className="flex-1 overflow-y-auto overflow-x-hidden">
                        <SidebarContent isCollapsed={isSidebarCollapsed} mode="light" />
                    </div>
                    <div className="flex-shrink-0 px-2 pt-2 border-t border-border mt-auto flex items-center">
                        <button
                            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                            className="flex-1 flex items-center justify-center p-2 rounded-lg text-muted hover:bg-page transition-colors"
                            title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        >
                            {isSidebarCollapsed ? <ChevronsRight className="h-5 w-5" /> : <ChevronsLeft className="h-5 w-5" />}
                        </button>
                    </div>
                </aside>
            )}

            {/* Mobile Sidebar & Backdrop */}
            {isMobileMenuOpen && (
                <>
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden" onClick={() => setIsMobileMenuOpen(false)} aria-hidden="true"></div>
                    <aside
                        className="fixed inset-y-0 left-0 w-80 bg-[#0d1f12] z-40 transform transition-transform duration-300 ease-in-out md:hidden shadow-2xl flex flex-col border-r border-white/10"
                        style={{ transform: isMobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)' }}
                    >
                        <div className="p-4 flex justify-center h-20 items-center flex-shrink-0 !bg-white shadow-sm">
                            <Logo />
                        </div>
                        <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
                            <SidebarContent isCollapsed={false} onLinkClick={() => setIsMobileMenuOpen(false)} hideHeader={true} mode="dark" />
                        </div>
                        <div className="p-4 border-t border-white/10 mt-auto flex-shrink-0 bg-[#0a1a10]">
                            <button
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="relative w-full flex items-center justify-center p-3.5 rounded-xl text-white/80 hover:text-white hover:bg-white/5 transition-all duration-200 group"
                            >
                                <div className="flex items-center gap-2">
                                    <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
                                    <span className="font-medium">Close Menu</span>
                                </div>
                                <X className="absolute right-3.5 h-5 w-5 text-red-500" />
                            </button>
                        </div>
                    </aside>
                </>
            )}

            <div className={`flex-1 flex flex-col ${!isMobile ? 'bg-gray-50/50' : ''}`}>
                <Header
                    setIsMobileMenuOpen={setIsMobileMenuOpen}
                />

                {/* Main Content */}
                <main ref={mainContentRef} className={`flex-1 bg-page overflow-y-auto ${showMobileNavBar ? 'pb-32' : ''}`}>
                    <div className={!isMobile ? 'p-4 sm:p-6 lg:p-8' : 'p-4'}>
                        {/* Bordered Card Container removed to fix white screen issue */}
                        <Outlet />
                    </div>
                </main>

            </div>
            {showMobileNavBar && user && (
                <MobileNavBar />
            )}
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
