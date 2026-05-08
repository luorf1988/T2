import { create } from 'zustand';
import { DEFAULT_KZ, type KZParams } from '@/domain/kz';
import { DEFAULT_KL, type KLParams } from '@/domain/kl';

export type Mode = 'KZ' | 'KL';

export interface UIState {
  showConcrete: boolean;
  concreteOpacity: number; // 0..1
  showLongitudinal: boolean;
  showStirrups: boolean;
  explode: number; // 0..1 爆炸视图程度
  ribStrength: number; // 月牙肋强度
}

export interface AppState {
  mode: Mode;
  kz: KZParams;
  kl: KLParams;
  ui: UIState;
  setMode: (m: Mode) => void;
  setKZ: (patch: Partial<KZParams>) => void;
  setKL: (patch: Partial<KLParams>) => void;
  setUI: (patch: Partial<UIState>) => void;
  reset: () => void;
}

const DEFAULT_UI: UIState = {
  showConcrete: true,
  concreteOpacity: 0.22,
  showLongitudinal: true,
  showStirrups: true,
  explode: 0,
  ribStrength: 0.55,
};

export const useStore = create<AppState>((set) => ({
  mode: 'KZ',
  kz: { ...DEFAULT_KZ },
  kl: { ...DEFAULT_KL },
  ui: { ...DEFAULT_UI },
  setMode: (m) => set({ mode: m }),
  setKZ: (patch) => set((s) => ({ kz: { ...s.kz, ...patch } })),
  setKL: (patch) => set((s) => ({ kl: { ...s.kl, ...patch } })),
  setUI: (patch) => set((s) => ({ ui: { ...s.ui, ...patch } })),
  reset: () => set({ kz: { ...DEFAULT_KZ }, kl: { ...DEFAULT_KL }, ui: { ...DEFAULT_UI } }),
}));
