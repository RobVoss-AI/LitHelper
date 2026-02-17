import { useState, type FormEvent } from 'react';
import { Search } from 'lucide-react';
import { useSearchStore } from '../../stores/useSearchStore';

export default function SearchBar() {
  const { query, setQuery, executeSearch, isLoading } = useSearchStore();
  const [input, setInput] = useState(query);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setQuery(input);
    executeSearch();
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-secondary)]" />
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Search papers by title, keyword, DOI, or author..."
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
        />
      </div>
      <button
        type="submit"
        disabled={isLoading || !input.trim()}
        className="px-6 py-2.5 rounded-lg bg-[var(--color-primary)] text-white font-medium hover:bg-[var(--color-primary-light)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? 'Searching...' : 'Search'}
      </button>
    </form>
  );
}
