import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type ColorScheme =
    | "green"
    | "purple"
    | "red"
    | "amber"
    | "professional-blue"
    | "dark-saas"
    | "teal-mint"
    | "indigo-violet"
    | "green-finance"
    | "orange-energy"
    | "red-alert"
    | "neutral-gray"
    | "cyan-tech"
    | "black-gold";

interface BrandingState {
    colorScheme: ColorScheme;
    appTitle: string;
    userHasSetPreference: boolean;
    setColorScheme: (scheme: ColorScheme) => void;
    setAppTitle: (title: string) => void;
    initBranding: (scheme: ColorScheme, title?: string) => void;
}

export const useBrandingStore = create<BrandingState>()(
    persist(
        (set) => ({
            colorScheme: "green", // Default to green (Paradigm)
            appTitle: "Paradigm Employee Onboarding",
            userHasSetPreference: false,
            setColorScheme: (scheme) =>
                set({ colorScheme: scheme, userHasSetPreference: true }),
            setAppTitle: (title) => set({ appTitle: title }),
            initBranding: (scheme, title) =>
                set((state) => ({
                    colorScheme: scheme,
                    appTitle: title || state.appTitle,
                })),
        }),
        {
            name: "paradigm-branding",
            storage: createJSONStorage(() => localStorage),
        },
    ),
);
