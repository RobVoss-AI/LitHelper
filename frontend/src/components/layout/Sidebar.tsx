import { Search, Network, Compass, FolderOpen, UserCheck, Bell, GitBranch, BookOpen, Settings, Sun, Moon, Monitor } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useThemeStore } from '../../stores/useThemeStore';

const navItems = [
  { to: '/search', icon: Search, label: 'Search' },
  { to: '/graph', icon: Network, label: 'Graph' },
  { to: '/discovery', icon: Compass, label: 'Discovery' },
  { to: '/collections', icon: FolderOpen, label: 'Collections' },
  { to: '/authors', icon: UserCheck, label: 'Authors' },
  { to: '/monitors', icon: Bell, label: 'Monitors' },
  { to: '/trails', icon: GitBranch, label: 'Trails' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
  const { theme, setTheme } = useThemeStore();

  const cycleTheme = () => {
    const order = ['system', 'light', 'dark'] as const;
    const idx = order.indexOf(theme);
    setTheme(order[(idx + 1) % 3]);
  };

  const ThemeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;

  return (
    <aside className="w-16 lg:w-56 bg-[var(--color-bg-secondary)] border-r border-[var(--color-border)] flex flex-col shrink-0">
      <div className="p-3 lg:p-4 border-b border-[var(--color-border)] flex items-center gap-2">
        <BookOpen className="w-6 h-6 text-[var(--color-primary)]" />
        <span className="hidden lg:block font-bold text-lg">LitHelper</span>
      </div>
      <nav className="flex-1 py-2">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 lg:px-4 py-2.5 mx-1 rounded-lg transition-colors ${
                isActive
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text)]'
              }`
            }
          >
            <Icon className="w-5 h-5 shrink-0" />
            <span className="hidden lg:block text-sm font-medium">{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="p-2 border-t border-[var(--color-border)] space-y-1">
        <button
          onClick={cycleTheme}
          className="flex items-center gap-3 px-3 lg:px-4 py-2 mx-1 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text)] transition-colors w-full"
        >
          <ThemeIcon className="w-5 h-5 shrink-0" />
          <span className="hidden lg:block text-sm font-medium capitalize">{theme}</span>
        </button>
        <a
          href="https://VossAIConsulting.com"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden lg:flex items-center justify-center px-3 py-1.5 mx-1 text-[10px] text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors"
        >
          Built by VossAI Consulting
        </a>
        <span className="hidden lg:block text-center text-[9px] text-[var(--color-text-secondary)]/60 px-3">
          CC BY-SA 4.0
        </span>
      </div>
    </aside>
  );
}
