import { ColorScheme } from "../store/brandingStore";

interface ThemeDefinition {
    id: ColorScheme;
    label: string;
    colors: {
        /** Background color for Sidebar and Mobile Header */
        sidebarBg: string;
        /** Border color for Sidebar and Mobile Header */
        sidebarBorder: string;
        /** Background for active navigation items */
        activeItemBg: string;
        /** Text color for active navigation items */
        activeItemText: string;
        /** Background for Mobile Layout container */
        mobileBg: string;
        /** Primary color for cards/text in mobile view */
        primary: string;
        /** Secondary color for borders/muted elements */
        secondary: string;
    };
    isDark: boolean;
}

export const themeDefinitions: Record<ColorScheme, ThemeDefinition> = {
    green: {
        id: "green",
        label: "Paradigm Green",
        isDark: false,
        colors: {
            sidebarBg: "#041b0f",
            sidebarBorder: "#1f3d2b",
            activeItemBg: "#006B3F",
            activeItemText: "#ffffff",
            mobileBg: "#041b0f", // Original Green theme uses dark mobile bg
            primary: "#22c55e", // Bright green for text on dark bg
            secondary: "#1f3d2b",
        },
    },
    purple: {
        id: "purple",
        label: "Royal Purple",
        isDark: false,
        colors: {
            sidebarBg: "#3B0764",
            sidebarBorder: "#4C1D95",
            activeItemBg: "#5B21B6",
            activeItemText: "#ffffff",
            mobileBg: "#ffffff", // Clean white for others
            primary: "#5B21B6",
            secondary: "#E9D5FF",
        },
    },
    red: {
        id: "red",
        label: "Crimson Red",
        isDark: false,
        colors: {
            sidebarBg: "#450A0A",
            sidebarBorder: "#7F1D1D",
            activeItemBg: "#991B1B",
            activeItemText: "#ffffff",
            mobileBg: "#ffffff",
            primary: "#991B1B",
            secondary: "#FECACA",
        },
    },
    amber: {
        id: "amber",
        label: "Amber Gold",
        isDark: false,
        colors: {
            sidebarBg: "#451A03",
            sidebarBorder: "#92400E",
            activeItemBg: "#B45309",
            activeItemText: "#ffffff",
            mobileBg: "#ffffff",
            primary: "#B45309",
            secondary: "#FDE68A",
        },
    },
    "professional-blue": {
        id: "professional-blue",
        label: "Professional Blue",
        isDark: false,
        colors: {
            sidebarBg: "#172554", // blue-950
            sidebarBorder: "#1E3A8A", // blue-900
            activeItemBg: "#2563EB",
            activeItemText: "#ffffff",
            mobileBg: "#ffffff",
            primary: "#2563EB",
            secondary: "#BFDBFE",
        },
    },
    "dark-saas": {
        id: "dark-saas",
        label: "Dark SaaS",
        isDark: true,
        colors: {
            sidebarBg: "#020617", // slate-950
            sidebarBorder: "#1E293B", // slate-800
            activeItemBg: "#22D3EE", // Cyan accent
            activeItemText: "#020617", // Dark text on bright accent
            mobileBg: "#020617",
            primary: "#22D3EE",
            secondary: "#1E293B",
        },
    },
    "teal-mint": {
        id: "teal-mint",
        label: "Teal & Mint",
        isDark: false,
        colors: {
            sidebarBg: "#042F2E", // teal-950
            sidebarBorder: "#115E59", // teal-800
            activeItemBg: "#0D9488",
            activeItemText: "#ffffff",
            mobileBg: "#ffffff",
            primary: "#0D9488",
            secondary: "#99F6E4",
        },
    },
    "indigo-violet": {
        id: "indigo-violet",
        label: "Indigo & Violet",
        isDark: false,
        colors: {
            sidebarBg: "#1E1B4B", // indigo-950
            sidebarBorder: "#3730A3", // indigo-800
            activeItemBg: "#4F46E5",
            activeItemText: "#ffffff",
            mobileBg: "#ffffff",
            primary: "#4F46E5",
            secondary: "#C7D2FE",
        },
    },
    "green-finance": {
        id: "green-finance",
        label: "Green Finance",
        isDark: false,
        colors: {
            sidebarBg: "#052E16", // emerald-950
            sidebarBorder: "#065F46", // emerald-800
            activeItemBg: "#15803D",
            activeItemText: "#ffffff",
            mobileBg: "#ffffff",
            primary: "#15803D",
            secondary: "#BBF7D0",
        },
    },
    "orange-energy": {
        id: "orange-energy",
        label: "Orange Energy",
        isDark: false,
        colors: {
            sidebarBg: "#431407", // orange-950
            sidebarBorder: "#9A3412", // orange-800
            activeItemBg: "#EA580C",
            activeItemText: "#ffffff",
            mobileBg: "#ffffff",
            primary: "#EA580C",
            secondary: "#FED7AA",
        },
    },
    "red-alert": {
        id: "red-alert",
        label: "Red Alert",
        isDark: false,
        colors: {
            sidebarBg: "#450A0A", // red-950
            sidebarBorder: "#7F1D1D", // red-900
            activeItemBg: "#DC2626",
            activeItemText: "#ffffff",
            mobileBg: "#ffffff",
            primary: "#DC2626",
            secondary: "#FECACA",
        },
    },
    "neutral-gray": {
        id: "neutral-gray",
        label: "Neutral Gray",
        isDark: false,
        colors: {
            sidebarBg: "#111827", // gray-900
            sidebarBorder: "#374151", // gray-700
            activeItemBg: "#374151",
            activeItemText: "#ffffff",
            mobileBg: "#ffffff",
            primary: "#374151",
            secondary: "#E5E7EB",
        },
    },
    "cyan-tech": {
        id: "cyan-tech",
        label: "Cyan Tech",
        isDark: false,
        colors: {
            sidebarBg: "#083344", // cyan-950
            sidebarBorder: "#155E75", // cyan-800
            activeItemBg: "#0891B2",
            activeItemText: "#ffffff",
            mobileBg: "#ffffff",
            primary: "#0891B2",
            secondary: "#A5F3FC",
        },
    },
    "black-gold": {
        id: "black-gold",
        label: "Premium Black & Gold",
        isDark: true,
        colors: {
            sidebarBg: "#020617", // almost black
            sidebarBorder: "#FACC15", // gold
            activeItemBg: "#FACC15",
            activeItemText: "#000000", // Black text on gold
            mobileBg: "#0B0F19",
            primary: "#FACC15",
            secondary: "#1F2937",
        },
    },
};

export const getThemeColors = (scheme: ColorScheme) => {
    const theme = themeDefinitions[scheme] || themeDefinitions["green"];
    return { ...theme.colors, isDark: theme.isDark };
};
