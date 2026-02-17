import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { HelpCircle } from 'lucide-react';
import Sidebar from './Sidebar';
import TrailBreadcrumbs from '../trails/TrailBreadcrumbs';
import StartHereModal from '../shared/StartHereModal';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

function useFirstVisit() {
  const [isFirst] = useState(() => {
    const seen = localStorage.getItem('lithelper-onboarded');
    if (!seen) {
      localStorage.setItem('lithelper-onboarded', '1');
      return true;
    }
    return false;
  });
  return isFirst;
}

export default function AppShell() {
  useKeyboardShortcuts();
  const isFirstVisit = useFirstVisit();
  const [showOnboarding, setShowOnboarding] = useState(isFirstVisit);

  return (
    <div className="flex w-full min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center border-b border-[var(--color-border)] bg-[var(--color-bg)]">
          <div className="flex-1">
            <TrailBreadcrumbs />
          </div>
          <button
            onClick={() => setShowOnboarding(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 mr-2 text-xs rounded-lg text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-colors font-medium"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Start Here
          </button>
        </div>
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
      {showOnboarding && <StartHereModal onClose={() => setShowOnboarding(false)} />}
    </div>
  );
}
