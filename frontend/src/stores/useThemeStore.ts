import { create } from 'zustand';

type Theme = 'system' | 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  if (theme !== 'system') {
    root.classList.add(theme);
  }
}

const savedTheme = (typeof localStorage !== 'undefined'
  ? localStorage.getItem('lithelper-theme') as Theme
  : null) || 'system';

applyTheme(savedTheme);

export const useThemeStore = create<ThemeState>((set) => ({
  theme: savedTheme,
  setTheme: (theme) => {
    applyTheme(theme);
    localStorage.setItem('lithelper-theme', theme);
    set({ theme });
  },
}));
