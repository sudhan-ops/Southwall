import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type ColorScheme = "blue" | "green" | "purple" | "red" | "amber";

interface BrandingState {
    colorScheme: ColorScheme;
    setColorScheme: (scheme: ColorScheme) => void;
    initBranding: (scheme: ColorScheme) => void;
}

export const useBrandingStore = create<BrandingState>()(
    persist(
        (set) => ({
            colorScheme: "blue", // Default to blue (SouthWall)
            setColorScheme: (scheme) => set({ colorScheme: scheme }),
            initBranding: (scheme) => set({ colorScheme: scheme }),
        }),
        {
            name: "paradigm-branding",
            storage: createJSONStorage(() => localStorage),
        },
    ),
);
