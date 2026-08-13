import { create } from 'zustand';

export type SupportedLanguage = 'id' | 'en';

export interface SettingsStoreState {
  readonly bgmVolume: number;
  readonly sfxVolume: number;
  readonly isMuted: boolean;
  readonly highContrastMode: boolean;
  readonly language: SupportedLanguage;
  setBgmVolume: (volume: number) => void;
  setSfxVolume: (volume: number) => void;
  toggleMute: () => void;
  setHighContrastMode: (enabled: boolean) => void;
  setLanguage: (language: SupportedLanguage) => void;
  resetSettings: () => void;
}

const defaultSettings = {
  bgmVolume: 0.8,
  sfxVolume: 1,
  isMuted: false,
  highContrastMode: false,
  language: 'id' as const,
};

/** Approved user preferences only; persistence is intentionally deferred to its own slice. */
export const useSettingsStore = create<SettingsStoreState>((set) => ({
  ...defaultSettings,
  setBgmVolume: (bgmVolume) => set({ bgmVolume: normalizeVolume(bgmVolume) }),
  setSfxVolume: (sfxVolume) => set({ sfxVolume: normalizeVolume(sfxVolume) }),
  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
  setHighContrastMode: (highContrastMode) => set({ highContrastMode }),
  setLanguage: (language) => set({ language }),
  resetSettings: () => set(defaultSettings),
}));

function normalizeVolume(volume: number): number {
  return Math.min(1, Math.max(0, volume));
}
