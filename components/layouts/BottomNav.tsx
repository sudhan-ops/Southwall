import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, CalendarCheck, ListTodo, User } from 'lucide-react';
import { usePermissionsStore } from '../../store/permissionsStore';
import { useAuthStore } from '../../store/authStore';
import { useBrandingStore } from '../../store/brandingStore';
import { getThemeColors } from '../../utils/themeUtils';

const BottomNav: React.FC = () => {
    const { user } = useAuthStore();
    const { permissions } = usePermissionsStore();
    const { colorScheme } = useBrandingStore();

    if (!user) return null;

    const userPermissions = permissions[user.role] || [];

    // Define mobile navigation items
    const navItems = [
        {
            to: '/mobile-home',
            label: 'Home',
            icon: Home,
            show: true
        },
        {
            to: '/attendance/dashboard',
            label: 'Attendance',
            icon: CalendarCheck,
            show: userPermissions.includes('view_own_attendance')
        },
        {
            to: '/tasks',
            label: 'Tasks',
            icon: ListTodo,
            show: userPermissions.includes('manage_tasks')
        },
        {
            to: '/profile',
            label: 'Profile',
            icon: User,
            show: true
        }
    ];

    const globalThemeColors = getThemeColors(colorScheme);
    
    // Derived theme colors for BottomNav
    const themeColors = {
        bg: globalThemeColors.sidebarBg,
        border: globalThemeColors.sidebarBorder,
        activeText: globalThemeColors.primary,
        inactiveText: globalThemeColors.isDark || globalThemeColors.sidebarBg !== '#ffffff' ? 'text-gray-400' : 'text-slate-400'
    };

    return (
        <nav
            id="mobile-bottom-nav"
            className="fixed bottom-0 left-0 right-0 z-40 transition-colors duration-300"
            style={{ 
                paddingBottom: 'env(safe-area-inset-bottom)',
                backgroundColor: themeColors.bg,
                borderTopColor: themeColors.border,
                borderTopWidth: '1px'
            }}
        >
            <div className="flex justify-around items-center h-16">
                {navItems.filter(item => item.show).map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                            `flex flex-col items-center justify-center flex-1 h-full transition-colors ${isActive ? '' : themeColors.inactiveText}`
                        }
                        style={({ isActive }) => isActive ? { color: themeColors.activeText } : {}}
                    >
                        <item.icon className="w-6 h-6" />
                        <span className="text-xs mt-1">{item.label}</span>
                    </NavLink>
                ))}
            </div>
        </nav>
    );
};

export default BottomNav;
