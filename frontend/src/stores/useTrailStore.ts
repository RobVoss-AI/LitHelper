import { create } from 'zustand';
import {
  listTrails,
  createTrail,
  getTrail,
  deleteTrail,
  addTrailStep,
} from '../api/trails';
import type { TrailSummary, TrailDetail, TrailStepOut } from '../api/trails';

interface TrailState {
  trails: TrailSummary[];
  activeTrail: TrailDetail | null;
  currentStepIndex: number;
  isRecording: boolean;

  fetchTrails: () => Promise<void>;
  startTrail: (name?: string) => Promise<void>;
  stopRecording: () => void;
  loadTrail: (id: number) => Promise<void>;
  deleteTrail: (id: number) => Promise<void>;
  recordStep: (
    stepType: string,
    payload?: Record<string, any>,
    resultSnapshot?: Record<string, any>,
  ) => Promise<void>;
  goToStep: (index: number) => void;
  goBack: () => void;
  goForward: () => void;
  canGoBack: () => boolean;
  canGoForward: () => boolean;
}

export const useTrailStore = create<TrailState>((set, get) => ({
  trails: [],
  activeTrail: null,
  currentStepIndex: -1,
  isRecording: false,

  fetchTrails: async () => {
    try {
      const trails = await listTrails();
      set({ trails });
    } catch {
      // ignore
    }
  },

  startTrail: async (name) => {
    try {
      const trail = await createTrail(name);
      set({ activeTrail: trail, isRecording: true, currentStepIndex: -1 });
      await get().fetchTrails();
    } catch {
      // ignore
    }
  },

  stopRecording: () => {
    set({ isRecording: false });
  },

  loadTrail: async (id) => {
    try {
      const trail = await getTrail(id);
      set({
        activeTrail: trail,
        currentStepIndex: trail.steps.length - 1,
        isRecording: false,
      });
    } catch {
      // ignore
    }
  },

  deleteTrail: async (id) => {
    try {
      await deleteTrail(id);
      const { activeTrail } = get();
      if (activeTrail && activeTrail.id === id) {
        set({ activeTrail: null, currentStepIndex: -1, isRecording: false });
      }
      await get().fetchTrails();
    } catch {
      // ignore
    }
  },

  recordStep: async (stepType, payload, resultSnapshot) => {
    const { activeTrail, isRecording } = get();
    if (!activeTrail || !isRecording) return;
    try {
      const step = await addTrailStep(activeTrail.id, stepType, payload, resultSnapshot);
      set((state) => {
        if (!state.activeTrail) return state;
        const newSteps = [...state.activeTrail.steps, step];
        return {
          activeTrail: {
            ...state.activeTrail,
            steps: newSteps,
            step_count: newSteps.length,
          },
          currentStepIndex: newSteps.length - 1,
        };
      });
    } catch {
      // ignore
    }
  },

  goToStep: (index) => {
    const { activeTrail } = get();
    if (!activeTrail) return;
    if (index >= 0 && index < activeTrail.steps.length) {
      set({ currentStepIndex: index });
    }
  },

  goBack: () => {
    const { currentStepIndex } = get();
    if (currentStepIndex > 0) {
      set({ currentStepIndex: currentStepIndex - 1 });
    }
  },

  goForward: () => {
    const { activeTrail, currentStepIndex } = get();
    if (!activeTrail) return;
    if (currentStepIndex < activeTrail.steps.length - 1) {
      set({ currentStepIndex: currentStepIndex + 1 });
    }
  },

  canGoBack: () => get().currentStepIndex > 0,

  canGoForward: () => {
    const { activeTrail, currentStepIndex } = get();
    if (!activeTrail) return false;
    return currentStepIndex < activeTrail.steps.length - 1;
  },
}));
