import React, { useState, useCallback } from 'react';
import { Search, Calendar, Target, FileText, FolderOpen, Clock } from 'lucide-react';
import { db } from '../services/db';

interface SearchViewProps {
  onNavigateToDaily: (date: string) => void;
  onNavigateToGoal: (goalId: string) => void;
  onNavigateToProject: (projectId: string) => void;
  onNavigateToNote: (noteId: string) => void;
}

interface SearchResult {
  type: string;
  id: string;
  title: string;
  snippet: string;
  date?: string;
}

const SearchView: React.FC<SearchViewProps> = ({
  onNavigateToDaily,
  onNavigateToGoal,
  onNavigateToProject,
  onNavigateToNote,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    try {
      const searchResults = await db.search(query);
      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [query]);

  const handleResultClick = (result: SearchResult) => {
    switch (result.type) {
      case 'daily_page':
        if (result.date) onNavigateToDaily(result.date);
        break;
      case 'annual_goal':
      case 'quarterly_goal':
        onNavigateToGoal(result.id);
        break;
      case 'project':
        onNavigateToProject(result.id);
        break;
      case 'note':
        onNavigateToNote(result.id);
        break;
    }
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'daily_page':
        return <Calendar className="w-5 h-5 text-amber-600" />;
      case 'annual_goal':
      case 'quarterly_goal':
        return <Target className="w-5 h-5 text-amber-600" />;
      case 'project':
        return <FolderOpen className="w-5 h-5 text-amber-600" />;
      case 'note':
        return <FileText className="w-5 h-5 text-amber-600" />;
      default:
        return <Search className="w-5 h-5 text-amber-600" />;
    }
  };

  const getResultTypeLabel = (type: string) => {
    switch (type) {
      case 'daily_page':
        return 'Daily Page';
      case 'annual_goal':
        return 'Annual Goal';
      case 'quarterly_goal':
        return 'Quarterly Goal';
      case 'project':
        return 'Project';
      case 'note':
        return 'Note';
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-amber-200 pb-6">
        <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-3">
          <Search className="w-8 h-8 text-amber-700" />
          Search
        </h1>
        <p className="text-sm opacity-60 mt-1">
          Search across all your planner data
        </p>
      </div>

      {/* Search Input */}
      <div className="planner-card p-6">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-40" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search goals, notes, projects, daily pages..."
              className="w-full bg-amber-50 border border-amber-200 rounded-lg pl-12 pr-4 py-3 text-lg focus:border-amber-500 outline-none"
              autoFocus
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="px-6 py-3 bg-amber-700 text-white font-medium rounded-lg hover:bg-amber-800 transition-colors disabled:opacity-50 touch-manipulation"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>

        <div className="mt-4 text-sm opacity-60">
          <p>Search tips:</p>
          <ul className="list-disc list-inside mt-1 space-y-0.5">
            <li>Search for keywords in goals, tasks, notes, and reflections</li>
            <li>Search is case-insensitive</li>
            <li>Results are shown with context snippets</li>
          </ul>
        </div>
      </div>

      {/* Results */}
      {isSearching ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="opacity-60">Searching...</p>
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">
              {results.length} Result{results.length !== 1 ? 's' : ''}
            </h2>
          </div>

          <div className="space-y-3">
            {results.map((result, index) => (
              <button
                key={`${result.type}-${result.id}-${index}`}
                onClick={() => handleResultClick(result)}
                className="w-full planner-card p-4 text-left hover:shadow-lg transition-shadow touch-manipulation"
              >
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-amber-100 rounded-lg flex-shrink-0">
                    {getResultIcon(result.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full">
                        {getResultTypeLabel(result.type)}
                      </span>
                      {result.date && (
                        <span className="text-xs opacity-50">
                          {new Date(result.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold mb-1">{result.title}</h3>
                    <p className="text-sm opacity-60 line-clamp-2">{result.snippet}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : hasSearched && query.trim() ? (
        <div className="text-center py-12">
          <Search className="w-16 h-16 text-amber-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">No Results Found</h3>
          <p className="opacity-60">
            Try different keywords or check your spelling
          </p>
        </div>
      ) : (
        <div className="text-center py-12">
          <Search className="w-16 h-16 text-amber-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Search Your Planner</h3>
          <p className="opacity-60">
            Enter keywords above to search across all your data
          </p>
        </div>
      )}
    </div>
  );
};

export default SearchView;
