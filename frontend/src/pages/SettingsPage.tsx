import { useEffect, useState, useRef } from 'react';
import { Upload, Download, Link2, Unlink, RefreshCw, ArrowDown, ArrowUp, Share2 } from 'lucide-react';
import {
  getZoteroConfig,
  setZoteroConfig,
  removeZoteroConfig,
  listZoteroCollections,
  pullFromZotero,
  pushToZotero,
} from '../api/zotero';
import type { ZoteroConfigOut, ZoteroCollectionOut, ZoteroSyncResult } from '../api/zotero';
import { importFile, exportCollection } from '../api/importExport';
import type { ImportResult } from '../api/importExport';
import { exportBundle, importBundle } from '../api/sharing';
import { listCollections } from '../api/collections';
import type { CollectionSummary } from '../api/collections';

export default function SettingsPage() {
  // Zotero state
  const [zotConfig, setZotConfig] = useState<ZoteroConfigOut | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [libraryId, setLibraryId] = useState('');
  const [libraryType, setLibraryType] = useState('user');
  const [connecting, setConnecting] = useState(false);
  const [zotCollections, setZotCollections] = useState<ZoteroCollectionOut[]>([]);
  const [loadingZotColl, setLoadingZotColl] = useState(false);

  // Sync state
  const [collections, setCollections] = useState<CollectionSummary[]>([]);
  const [selectedLitCollection, setSelectedLitCollection] = useState<number | ''>('');
  const [selectedZotCollection, setSelectedZotCollection] = useState('');
  const [syncResult, setSyncResult] = useState<ZoteroSyncResult | null>(null);
  const [syncing, setSyncing] = useState(false);

  // Import state
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Export state
  const [exportCollectionId, setExportCollectionId] = useState<number | ''>('');
  const [exportFormat, setExportFormat] = useState('bibtex');

  // Sharing state
  const [shareCollectionId, setShareCollectionId] = useState<number | ''>('');
  const [shareImportResult, setShareImportResult] = useState<string | null>(null);
  const shareFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getZoteroConfig().then(setZotConfig);
    listCollections().then(setCollections);
  }, []);

  const handleConnect = async () => {
    if (!apiKey || !libraryId) return;
    setConnecting(true);
    try {
      const config = await setZoteroConfig({ api_key: apiKey, library_id: libraryId, library_type: libraryType });
      setZotConfig(config);
      setApiKey('');
    } catch {
      alert('Failed to connect. Check your API key and library ID.');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    await removeZoteroConfig();
    setZotConfig(null);
    setZotCollections([]);
  };

  const handleLoadZotCollections = async () => {
    setLoadingZotColl(true);
    try {
      const colls = await listZoteroCollections();
      setZotCollections(colls);
    } catch {
      // ignore
    } finally {
      setLoadingZotColl(false);
    }
  };

  const handlePull = async () => {
    if (!selectedLitCollection) return;
    setSyncing(true);
    setSyncResult(null);
    try {
      const result = await pullFromZotero({
        zotero_collection_key: selectedZotCollection || undefined,
        lithelper_collection_id: selectedLitCollection as number,
      });
      setSyncResult(result);
    } catch {
      alert('Pull failed.');
    } finally {
      setSyncing(false);
    }
  };

  const handlePush = async () => {
    if (!selectedLitCollection) return;
    setSyncing(true);
    setSyncResult(null);
    try {
      const result = await pushToZotero({
        lithelper_collection_id: selectedLitCollection as number,
        zotero_collection_key: selectedZotCollection || undefined,
      });
      setSyncResult(result);
    } catch {
      alert('Push failed.');
    } finally {
      setSyncing(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    try {
      const result = await importFile(file);
      setImportResult(result);
    } catch {
      alert('Import failed.');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleExport = async () => {
    if (!exportCollectionId) return;
    try {
      const content = await exportCollection(exportCollectionId as number, exportFormat);
      const ext = exportFormat === 'ris' ? '.ris' : '.bib';
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'collection' + ext;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Export failed.');
    }
  };

  const handleShareExport = async () => {
    if (!shareCollectionId) return;
    try {
      const bundle = await exportBundle(shareCollectionId as number);
      const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'lithelper-collection.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Share export failed.');
    }
  };

  const handleShareImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setShareImportResult(null);
    try {
      const result = await importBundle(file);
      setShareImportResult('Collection imported successfully! (ID: ' + result.collection_id + ')');
      listCollections().then(setCollections);
    } catch {
      setShareImportResult('Import failed.');
    }
    if (shareFileRef.current) shareFileRef.current.value = '';
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto p-6 space-y-8">
        <div>
          <h1 className="text-xl font-bold mb-1">Settings</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Manage Zotero integration, import/export, and sharing.
          </p>
        </div>

        {/* Zotero Connection */}
        <section className="space-y-3">
          <h2 className="font-semibold flex items-center gap-2">
            <Link2 className="w-4 h-4" />
            Zotero Integration
          </h2>

          {zotConfig ? (
            <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Connected</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    Library: {zotConfig.library_id} ({zotConfig.library_type})
                    {zotConfig.last_sync_at && <> &middot; Last sync: {new Date(zotConfig.last_sync_at).toLocaleString()}</>}
                  </p>
                </div>
                <button
                  onClick={handleDisconnect}
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded text-red-500 hover:bg-red-50"
                >
                  <Unlink className="w-3 h-3" />
                  Disconnect
                </button>
              </div>

              {/* Sync controls */}
              <div className="space-y-2 pt-2 border-t border-[var(--color-border)]">
                <div className="flex gap-2">
                  <button
                    onClick={handleLoadZotCollections}
                    disabled={loadingZotColl}
                    className="text-xs px-2 py-1 rounded border border-[var(--color-border)] hover:bg-[var(--color-bg-tertiary)]"
                  >
                    {loadingZotColl ? 'Loading...' : 'Load Zotero Collections'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-[var(--color-text-secondary)]">LitHelper Collection</label>
                    <select
                      value={selectedLitCollection}
                      onChange={(e) => setSelectedLitCollection(e.target.value ? Number(e.target.value) : '')}
                      className="w-full px-2 py-1.5 text-sm rounded border border-[var(--color-border)] bg-[var(--color-bg)]"
                    >
                      <option value="">Select...</option>
                      {collections.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-[var(--color-text-secondary)]">Zotero Collection (optional)</label>
                    <select
                      value={selectedZotCollection}
                      onChange={(e) => setSelectedZotCollection(e.target.value)}
                      className="w-full px-2 py-1.5 text-sm rounded border border-[var(--color-border)] bg-[var(--color-bg)]"
                    >
                      <option value="">Entire library</option>
                      {zotCollections.map((c) => (
                        <option key={c.key} value={c.key}>{c.name} ({c.num_items})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handlePull}
                    disabled={syncing || !selectedLitCollection}
                    className="flex items-center gap-1 text-sm px-3 py-1.5 rounded bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-light)] disabled:opacity-50"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                    Pull from Zotero
                  </button>
                  <button
                    onClick={handlePush}
                    disabled={syncing || !selectedLitCollection}
                    className="flex items-center gap-1 text-sm px-3 py-1.5 rounded border border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 disabled:opacity-50"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                    Push to Zotero
                  </button>
                  {syncing && (
                    <RefreshCw className="w-4 h-4 animate-spin text-[var(--color-primary)] self-center" />
                  )}
                </div>

                {syncResult && (
                  <div className="text-sm px-3 py-2 rounded bg-green-50 text-green-700">
                    Synced {syncResult.synced}/{syncResult.total} items.
                    {syncResult.failed > 0 && <> {syncResult.failed} failed.</>}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)] space-y-3">
              <p className="text-sm text-[var(--color-text-secondary)]">
                Connect your Zotero account to enable two-way sync.
              </p>
              <div className="space-y-2">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Zotero API Key"
                  className="w-full px-3 py-1.5 text-sm rounded border border-[var(--color-border)] bg-[var(--color-bg)]"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={libraryId}
                    onChange={(e) => setLibraryId(e.target.value)}
                    placeholder="Library ID"
                    className="flex-1 px-3 py-1.5 text-sm rounded border border-[var(--color-border)] bg-[var(--color-bg)]"
                  />
                  <select
                    value={libraryType}
                    onChange={(e) => setLibraryType(e.target.value)}
                    className="px-3 py-1.5 text-sm rounded border border-[var(--color-border)] bg-[var(--color-bg)]"
                  >
                    <option value="user">User</option>
                    <option value="group">Group</option>
                  </select>
                </div>
                <button
                  onClick={handleConnect}
                  disabled={connecting || !apiKey || !libraryId}
                  className="flex items-center gap-1 px-4 py-1.5 text-sm rounded bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-light)] disabled:opacity-50"
                >
                  <Link2 className="w-3.5 h-3.5" />
                  {connecting ? 'Connecting...' : 'Connect Zotero'}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Import */}
        <section className="space-y-3">
          <h2 className="font-semibold flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Import (BibTeX / RIS)
          </h2>
          <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)] space-y-3">
            <p className="text-sm text-[var(--color-text-secondary)]">
              Upload a .bib or .ris file to resolve entries via OpenAlex.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".bib,.ris,.bibtex"
              onChange={handleImport}
              className="text-sm"
            />
            {importing && <p className="text-sm text-[var(--color-primary)]">Importing...</p>}
            {importResult && (
              <div className="text-sm px-3 py-2 rounded bg-green-50 text-green-700">
                Resolved {importResult.resolved}/{importResult.total} entries.
                {importResult.failed > 0 && (
                  <span> {importResult.failed} could not be resolved.</span>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Export */}
        <section className="space-y-3">
          <h2 className="font-semibold flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Collection
          </h2>
          <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)] space-y-3">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="text-xs text-[var(--color-text-secondary)]">Collection</label>
                <select
                  value={exportCollectionId}
                  onChange={(e) => setExportCollectionId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-1.5 text-sm rounded border border-[var(--color-border)] bg-[var(--color-bg)]"
                >
                  <option value="">Select collection...</option>
                  {collections.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.paper_count} papers)</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-[var(--color-text-secondary)]">Format</label>
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value)}
                  className="px-3 py-1.5 text-sm rounded border border-[var(--color-border)] bg-[var(--color-bg)]"
                >
                  <option value="bibtex">BibTeX</option>
                  <option value="ris">RIS</option>
                </select>
              </div>
              <button
                onClick={handleExport}
                disabled={!exportCollectionId}
                className="flex items-center gap-1 px-4 py-1.5 text-sm rounded bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-light)] disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                Export
              </button>
            </div>
          </div>
        </section>

        {/* Sharing */}
        <section className="space-y-3">
          <h2 className="font-semibold flex items-center gap-2">
            <Share2 className="w-4 h-4" />
            Share with Friends
          </h2>
          <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)] space-y-3">
            <p className="text-sm text-[var(--color-text-secondary)]">
              Export a collection as a JSON bundle to share with friends, or import one.
            </p>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="text-xs text-[var(--color-text-secondary)]">Collection to share</label>
                <select
                  value={shareCollectionId}
                  onChange={(e) => setShareCollectionId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-1.5 text-sm rounded border border-[var(--color-border)] bg-[var(--color-bg)]"
                >
                  <option value="">Select collection...</option>
                  {collections.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.paper_count} papers)</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleShareExport}
                disabled={!shareCollectionId}
                className="flex items-center gap-1 px-4 py-1.5 text-sm rounded bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-light)] disabled:opacity-50"
              >
                <Share2 className="w-3.5 h-3.5" />
                Export Bundle
              </button>
            </div>
            <div className="pt-2 border-t border-[var(--color-border)]">
              <label className="text-xs text-[var(--color-text-secondary)]">Import bundle from friend</label>
              <input
                ref={shareFileRef}
                type="file"
                accept=".json"
                onChange={handleShareImport}
                className="text-sm mt-1"
              />
            </div>
            {shareImportResult && (
              <div className="text-sm px-3 py-2 rounded bg-green-50 text-green-700">
                {shareImportResult}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
