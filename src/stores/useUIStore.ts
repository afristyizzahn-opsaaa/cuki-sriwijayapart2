import { create } from 'zustand';

export interface UIStoreState {
  readonly activeModal: string | null;
  readonly activeMenu: string | null;
  readonly activePanel: string | null;
  setActiveModal: (modal: string | null) => void;
  setActiveMenu: (menu: string | null) => void;
  setActivePanel: (panel: string | null) => void;
  resetUI: () => void;
}

const emptyUIState = {
  activeModal: null,
  activeMenu: null,
  activePanel: null,
} as const;

/** Presentation-only transient state; it has no gameplay authority or engine imports. */
export const useUIStore = create<UIStoreState>((set) => ({
  ...emptyUIState,
  setActiveModal: (activeModal) => set({ activeModal }),
  setActiveMenu: (activeMenu) => set({ activeMenu }),
  setActivePanel: (activePanel) => set({ activePanel }),
  resetUI: () => set(emptyUIState),
}));
