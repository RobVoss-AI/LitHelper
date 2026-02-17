import { useEffect, useState } from 'react';
import { Plus, RefreshCw, Trash2, ChevronRight, Bell, BellOff, Eye } from 'lucide-react';
import {
  listMonitors,
  createMonitor,
  getMonitor,
  deleteMonitor,
  checkMonitor,
  markResultRead,
} from '../api/monitors';
import type { MonitorSummary, MonitorDetail } from '../api/monitors';

export default function MonitorsPage() {
  const [monitors, setMonitors] = useState<MonitorSummary[]>([]);
  const [active, setActive] = useState<MonitorDetail | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newQuery, setNewQuery] = useState('');
  const [newInterval, setNewInterval] = useState(24);
  const [checking, setChecking] = useState(false);

  const fetchMonitors = async () => {
    try {
      const list = await listMonitors();
      setMonitors(list);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchMonitors();
  }, []);

  const handleCreate = async () => {
    if (!newName.trim() || !newQuery.trim()) return;
    await createMonitor({
      name: newName,
      query: newQuery,
      check_interval_hours: newInterval,
    });
    setNewName('');
    setNewQuery('');
    setShowCreate(false);
    await fetchMonitors();
  };

  const handleLoadDetail = async (id: number) => {
    try {
      const detail = await getMonitor(id);
      setActive(detail);
    } catch {
      // ignore
    }
  };

  const handleDelete = async (id: number) => {
    await deleteMonitor(id);
    if (active?.id === id) setActive(null);
    await fetchMonitors();
  };

  const handleCheck = async () => {
    if (!active) return;
    setChecking(true);
    try {
      const detail = await checkMonitor(active.id);
      setActive(detail);
      await fetchMonitors();
    } catch {
      // ignore
    } finally {
      setChecking(false);
    }
  };

  const handleMarkRead = async (resultId: number) => {
    if (!active) return;
    await markResultRead(active.id, resultId);
    await handleLoadDetail(active.id);
    await fetchMonitors();
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="p-4 border-b border-[var(--color-border)]">
        <h1 className="text-xl font-bold mb-1">Monitored Searches</h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Save searches and check periodically for new matching papers.
        </p>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Monitor list */}
        <div className="w-80 border-r border-[var(--color-border)] flex flex-col">
          <div className="p-3 border-b border-[var(--color-border)] flex items-center justify-between">
            <span className="text-sm font-medium">Monitors ({monitors.length})</span>
            <button
              onClick={() => setShowCreate(!showCreate)}
              className="p-1.5 rounded hover:bg-[var(--color-bg-tertiary)]"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {showCreate && (
            <div className="p-3 border-b border-[var(--color-border)] space-y-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Monitor name"
                className="w-full px-3 py-1.5 text-sm rounded border border-[var(--color-border)] bg-[var(--color-bg)]"
                autoFocus
              />
              <input
                type="text"
                value={newQuery}
                onChange={(e) => setNewQuery(e.target.value)}
                placeholder="Search query"
                className="w-full px-3 py-1.5 text-sm rounded border border-[var(--color-border)] bg-[var(--color-bg)]"
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
              <div className="flex items-center gap-2">
                <label className="text-xs text-[var(--color-text-secondary)]">Check every</label>
                <select
                  value={newInterval}
                  onChange={(e) => setNewInterval(Number(e.target.value))}
                  className="px-2 py-1 text-xs rounded border border-[var(--color-border)] bg-[var(--color-bg)]"
                >
                  <option value={6}>6 hours</option>
                  <option value={12}>12 hours</option>
                  <option value={24}>24 hours</option>
                  <option value={72}>3 days</option>
                  <option value={168}>Weekly</option>
                </select>
              </div>
              <button
                onClick={handleCreate}
                className="w-full py-1.5 text-sm rounded bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-light)]"
              >
                Create Monitor
              </button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {monitors.map((m) => (
              <div
                key={m.id}
                className={`flex items-center gap-2 px-3 py-3 border-b border-[var(--color-border)] cursor-pointer hover:bg-[var(--color-bg-tertiary)] ${
                  active?.id === m.id ? 'bg-[var(--color-bg-tertiary)]' : ''
                }`}
                onClick={() => handleLoadDetail(m.id)}
              >
                {m.unread_count > 0 ? (
                  <Bell className="w-4 h-4 text-[var(--color-accent)] shrink-0" />
                ) : (
                  <BellOff className="w-4 h-4 text-[var(--color-text-secondary)] shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{m.name}</p>
                    {m.unread_count > 0 && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-[var(--color-accent)] text-white font-medium">
                        {m.unread_count}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)] truncate">
                    "{m.query}" &middot; {m.known_result_count} results
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(m.id);
                  }}
                  className="p-1 rounded text-[var(--color-text-secondary)] hover:text-red-500 hover:bg-red-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {monitors.length === 0 && (
              <div className="p-4 text-center text-sm text-[var(--color-text-secondary)]">
                No monitored searches yet.
              </div>
            )}
          </div>
        </div>

        {/* Monitor detail */}
        <div className="flex-1 overflow-y-auto">
          {active ? (
            <div className="max-w-3xl mx-auto p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold">{active.name}</h2>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    Query: "{active.query}" &middot; {active.known_result_count} total results
                    {active.last_checked_at && (
                      <> &middot; Last checked: {new Date(active.last_checked_at).toLocaleString()}</>
                    )}
                  </p>
                </div>
                <button
                  onClick={handleCheck}
                  disabled={checking}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm rounded bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-light)] disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
                  {checking ? 'Checking...' : 'Check Now'}
                </button>
              </div>

              {active.results.length > 0 ? (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">
                    New Results ({active.results.filter((r) => !r.is_read).length} unread)
                  </h3>
                  <div className="border border-[var(--color-border)] rounded-lg divide-y divide-[var(--color-border)]">
                    {active.results.map((r) => (
                      <div
                        key={r.id}
                        className={`flex items-center gap-3 px-4 py-3 ${
                          r.is_read ? 'opacity-60' : ''
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm truncate ${r.is_read ? '' : 'font-medium'}`}>
                            {r.paper_title || r.paper_openalex_id}
                          </p>
                          <p className="text-xs text-[var(--color-text-secondary)]">
                            {r.found_at && 'Found: ' + new Date(r.found_at).toLocaleDateString()}
                          </p>
                        </div>
                        {!r.is_read && (
                          <button
                            onClick={() => handleMarkRead(r.id)}
                            className="p-1 rounded text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-sm text-[var(--color-text-secondary)] border border-dashed border-[var(--color-border)] rounded-lg">
                  No results yet. Click "Check Now" to run the first check.
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-[var(--color-text-secondary)]">
              <p>Select a monitor to view its results</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
