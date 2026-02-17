import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function useKeyboardShortcuts() {
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;

      // Don't intercept when typing in inputs
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (isMod && e.key === 'k') {
        e.preventDefault();
        navigate('/search');
        // Focus search input
        setTimeout(() => {
          const input = document.querySelector<HTMLInputElement>('input[type="text"]');
          input?.focus();
        }, 100);
      }

      if (isMod && e.key === '[') {
        e.preventDefault();
        window.history.back();
      }

      if (isMod && e.key === ']') {
        e.preventDefault();
        window.history.forward();
      }

      // Number shortcuts for nav
      if (isMod && e.key >= '1' && e.key <= '8') {
        e.preventDefault();
        const routes = ['/search', '/graph', '/discovery', '/collections', '/authors', '/monitors', '/trails', '/settings'];
        const idx = parseInt(e.key) - 1;
        if (idx < routes.length) navigate(routes[idx]);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate]);
}
