import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppShell from './components/layout/AppShell';
import SearchPage from './pages/SearchPage';
import GraphPage from './pages/GraphPage';
import CollectionsPage from './pages/CollectionsPage';
import DiscoveryPage from './pages/DiscoveryPage';
import TrailsPage from './pages/TrailsPage';
import AuthorsPage from './pages/AuthorsPage';
import MonitorsPage from './pages/MonitorsPage';
import SettingsPage from './pages/SettingsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<Navigate to="/search" replace />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/graph" element={<GraphPage />} />
            <Route path="/discovery" element={<DiscoveryPage />} />
            <Route path="/collections" element={<CollectionsPage />} />
            <Route path="/authors" element={<AuthorsPage />} />
            <Route path="/monitors" element={<MonitorsPage />} />
            <Route path="/trails" element={<TrailsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
