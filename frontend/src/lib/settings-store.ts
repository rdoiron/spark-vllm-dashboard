import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

export type Theme = "light" | "dark" | "system"

export interface Settings {
  cluster: {
    sparkDockerPath: string
    containerName: string
    headNodeIP: string
    workerNodeIPs: string[]
  }
  display: {
    theme: Theme
    metricsRefreshRate: number
    logBufferSize: number
  }
}

interface SettingsActions {
  setSparkDockerPath: (path: string) => void
  setContainerName: (name: string) => void
  setHeadNodeIP: (ip: string) => void
  setWorkerNodeIPs: (ips: string[]) => void
  setTheme: (theme: Theme) => void
  setMetricsRefreshRate: (rate: number) => void
  setLogBufferSize: (size: number) => void
  resetToDefaults: () => void
}

const defaultSettings: Settings = {
  cluster: {
    sparkDockerPath: "",
    containerName: "vllm_node",
    headNodeIP: "192.168.1.100",
    workerNodeIPs: ["192.168.1.101", "192.168.1.102"],
  },
  display: {
    theme: "system",
    metricsRefreshRate: 5000,
    logBufferSize: 2000,
  },
}

export const useSettingsStore = create<Settings & SettingsActions>()(
  persist(
    (set) => ({
      ...defaultSettings,

      setSparkDockerPath: (sparkDockerPath) => set({ cluster: { ...defaultSettings.cluster, sparkDockerPath } }),
      setContainerName: (containerName) => set({ cluster: { ...defaultSettings.cluster, containerName } }),
      setHeadNodeIP: (headNodeIP) => set({ cluster: { ...defaultSettings.cluster, headNodeIP } }),
      setWorkerNodeIPs: (workerNodeIPs) => set({ cluster: { ...defaultSettings.cluster, workerNodeIPs } }),

      setTheme: (theme) => set((state) => ({
        display: { ...state.display, theme },
      })),

      setMetricsRefreshRate: (metricsRefreshRate) => set((state) => ({
        display: { ...state.display, metricsRefreshRate },
      })),

      setLogBufferSize: (logBufferSize) => set((state) => ({
        display: { ...state.display, logBufferSize },
      })),

      resetToDefaults: () => set(defaultSettings),
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