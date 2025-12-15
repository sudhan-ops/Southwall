import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { originalDefaultLogoBase64 } from "../components/ui/logoData";

interface LogoState {
  currentLogo: string;
  defaultLogo: string;
  userHasSetLogo: boolean;
  setCurrentLogo: (logoBase64: string) => void;
  initLogo: (logo: string) => void;
  setDefaultLogoValue: (logo: string) => void;
  setDefaultLogo: () => void; // Sets current as default
  resetToDefault: () => void; // Sets current to default
  resetToOriginal: () => void; // Resets both to original
}

export const useLogoStore = create(
  persist<LogoState>(
    (set) => ({
      currentLogo: originalDefaultLogoBase64,
      defaultLogo: originalDefaultLogoBase64,
      userHasSetLogo: false,
      setCurrentLogo: (logoBase64) =>
        set({ currentLogo: logoBase64, userHasSetLogo: true }),
      initLogo: (logo) => set({ currentLogo: logo }),
      setDefaultLogoValue: (logo) => set({ defaultLogo: logo }),
      setDefaultLogo: () =>
        set((state) => ({ defaultLogo: state.currentLogo })),
      resetToDefault: () =>
        set((state) => ({ currentLogo: state.defaultLogo })),
      resetToOriginal: () =>
        set({
          currentLogo: originalDefaultLogoBase64,
          defaultLogo: originalDefaultLogoBase64,
        }),
    }),
    {
      name: "paradigm-app-logo",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
