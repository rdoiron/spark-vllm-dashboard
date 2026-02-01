import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

export type Theme = "light" | "dark" | "system"

export interface DisplaySettings {
  theme: Theme
  metricsRefreshRate: number
  logBufferSize: number
}

interface DisplaySettingsActions {
  setTheme: (theme: Theme) => void
  setMetricsRefreshRate: (rate: number) => void
  setLogBufferSize: (size: number) => void
  resetToDefaults: () => void
}

const defaultDisplaySettings: DisplaySettings = {
  theme: "system",
  metricsRefreshRate: 5000,
  logBufferSize: 2000,
}

export const useSettingsStore = create<DisplaySettings & DisplaySettingsActions>()(
  persist(
    (set) => ({
      ...defaultDisplaySettings,

      setTheme: (theme) => set({ theme }),

      setMetricsRefreshRate: (metricsRefreshRate) => set({ metricsRefreshRate }),

      setLogBufferSize: (logBufferSize) => set({ logBufferSize }),

      resetToDefaults: () => set({ ...defaultDisplaySettings }),
    }),
    {
      name: "vllm-dashboard-settings",
      storage: createJSONStorage(() => localStorage),
    }
  )
)

export function useSettings() {
  return useSettingsStore()
}