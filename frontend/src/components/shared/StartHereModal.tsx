import { useState } from 'react';
import { Search, Network, Compass, FolderOpen, UserCheck, Bell, GitBranch, Settings, ChevronRight, ChevronLeft, Rocket, X } from 'lucide-react';

const steps = [
  {
    icon: Rocket,
    title: 'Welcome to LitHelper',
    description: 'Your personal literature discovery tool — built to help you find, explore, and organize academic research like never before.',
    detail: 'LitHelper combines the best of Research Rabbit and Litmaps into one desktop app, powered by OpenAlex\'s database of 250M+ academic works.',
  },
  {
    icon: Search,
    title: '1. Search Papers',
    description: 'Start by searching for any topic, author, or paper title.',
    detail: 'Results show key metadata at a glance: citations, year, open access status, authors, and source. Use Cmd+K to jump to search anytime.',
  },
  {
    icon: Network,
    title: '2. Explore Citation Graphs',
    description: 'Click "Explore" on any paper to build an interactive citation network.',
    detail: 'Nodes are sized by citation count and colored by year. Right-click any node to expand its citations. Toggle between graph view, scatter plot (year vs. citations), or split view.',
  },
  {
    icon: Compass,
    title: '3. Multi-Seed Discovery',
    description: 'Add 3-5 seed papers, then discover related work you might have missed.',
    detail: 'Co-citation analysis finds papers frequently cited alongside your seeds. Bibliographic coupling finds papers sharing the same references. Results are ranked by overlap score.',
  },
  {
    icon: FolderOpen,
    title: '4. Organize into Collections',
    description: 'Save papers into named collections for your projects.',
    detail: 'Click the "Save" button on any paper card to add it to a collection. Export collections as BibTeX or RIS, or share them as JSON bundles with collaborators.',
  },
  {
    icon: UserCheck,
    title: '5. Track Authors & Monitor Searches',
    description: 'Follow researchers and save search queries for ongoing monitoring.',
    detail: 'Author tracking highlights new publications. Monitored searches check for new matching papers at your chosen interval. Both features help you stay current.',
  },
  {
    icon: GitBranch,
    title: '6. Record Your Research Trail',
    description: 'Start recording before you explore — every step is logged.',
    detail: 'Navigate back and forward through your exact path using the breadcrumbs bar. Save trails to revisit your research journey later.',
  },
  {
    icon: Settings,
    title: '7. Connect Zotero & Import/Export',
    description: 'Two-way sync with Zotero, plus BibTeX and RIS import/export.',
    detail: 'Go to Settings to connect your Zotero account. Pull a Zotero collection into LitHelper, or push your discoveries back. Import .bib/.ris files to resolve papers via OpenAlex.',
  },
];

interface Props {
  onClose: () => void;
}

export default function StartHereModal({ onClose }: Props) {
  const [step, setStep] = useState(0);
  const current = steps[step];
  const Icon = current.icon;
  const isLast = step === steps.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-2">
          <div className="flex items-center gap-2">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? 'w-6 bg-[var(--color-primary)]' : 'w-1.5 bg-[var(--color-border)]'
                }`}
              />
            ))}
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-[var(--color-bg-tertiary)]">
            <X className="w-4 h-4 text-[var(--color-text-secondary)]" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-[var(--color-primary)]/10">
              <Icon className="w-7 h-7 text-[var(--color-primary)]" />
            </div>
            <h2 className="text-xl font-bold">{current.title}</h2>
          </div>
          <p className="text-sm font-medium">{current.description}</p>
          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
            {current.detail}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
          <button
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
          <span className="text-xs text-[var(--color-text-secondary)]">
            {step + 1} / {steps.length}
          </span>
          {isLast ? (
            <button
              onClick={onClose}
              className="flex items-center gap-1 text-sm px-4 py-1.5 rounded-lg bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-light)] transition-colors font-medium"
            >
              Get Started
              <Rocket className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => setStep(step + 1)}
              className="flex items-center gap-1 text-sm px-4 py-1.5 rounded-lg bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-light)] transition-colors font-medium"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
