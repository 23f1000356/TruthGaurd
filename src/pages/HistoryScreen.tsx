import { Search, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../utils/api';

interface HistoryScreenProps {
  onNavigate: (page: 'home' | 'results' | 'history' | 'projects' | 'project-details' | 'kb-manager') => void;
}

interface HistoryItem {
  id: string;
  claim: string;
  verdict: 'true' | 'false' | 'misleading' | 'unverified';
  date: string;
}

const VerdictBadge = ({ verdict }: { verdict: string }) => {
  const colors = {
    true: 'bg-green-100 text-green-700',
    false: 'bg-red-100 text-red-700',
    misleading: 'bg-yellow-100 text-yellow-700',
    unverified: 'bg-gray-100 text-gray-700',
  };

  const labels = {
    true: 'TRUE',
    false: 'FALSE',
    misleading: 'MISLEADING',
    unverified: 'UNVERIFIED',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold ${colors[verdict as keyof typeof colors]}`}>
      {labels[verdict as keyof typeof labels]}
    </span>
  );
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
};

export default function HistoryScreen({ onNavigate }: HistoryScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'true' | 'false' | 'misleading' | 'unverified'>('all');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setLoading(true);
        const response = await api.getHistory(100, 0);

        if (response.error) {
          setError(response.error);
          setLoading(false);
          return;
        }

        if (response.data) {
          // Transform backend history to frontend format
          const transformedHistory: HistoryItem[] = [];
          const seenClaims = new Set<string>(); // Track seen claims to prevent duplicates
          
          // First, deduplicate entries themselves (in case same entry was saved twice)
          const uniqueEntries = new Map<string, any>();
          response.data.entries.forEach((entry: any) => {
            // Use entry ID as key, or create one from text + timestamp
            const entryKey = entry.id || `${entry.text}_${entry.timestamp}`;
            if (!uniqueEntries.has(entryKey)) {
              uniqueEntries.set(entryKey, entry);
            }
          });
          
          // Now process unique entries
          Array.from(uniqueEntries.values()).forEach((entry: any) => {
            if (entry.claims && Array.isArray(entry.claims)) {
              entry.claims.forEach((claim: any) => {
                const claimText = claim.text || claim.claim || '';
                if (!claimText.trim()) return; // Skip empty claims
                
                // Create unique key: claim text + timestamp (to allow same claim at different times)
                const uniqueKey = `${claimText}_${entry.timestamp}`;
                
                // Only add if we haven't seen this exact claim at this exact time
                if (!seenClaims.has(uniqueKey)) {
                  seenClaims.add(uniqueKey);
                  transformedHistory.push({
                    id: `${entry.id}_${claim.id || Date.now()}`,
                    claim: claimText,
                    verdict: claim.verdict,
                    date: entry.timestamp,
                  });
                }
              });
            }
          });

          // Sort by date (newest first) after deduplication
          transformedHistory.sort((a, b) => {
            return new Date(b.date).getTime() - new Date(a.date).getTime();
          });

          setHistory(transformedHistory);
        }
      } catch (err) {
        console.error('History load error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load history');
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, []);

  const filteredHistory = history.filter((item) => {
    const matchesSearch = item.claim.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === 'all' || item.verdict === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const filterButtons = [
    { label: 'All', value: 'all' as const },
    { label: 'True', value: 'true' as const },
    { label: 'False', value: 'false' as const },
    { label: 'Misleading', value: 'misleading' as const },
    { label: 'Unverified', value: 'unverified' as const },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <main className="px-8 py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Verification History</h1>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading history...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <p className="text-red-800 font-semibold">Error loading history</p>
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search claims..."
                className="w-full pl-10 pr-4 py-3 text-gray-800 bg-gray-50 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <select className="px-4 py-3 text-gray-700 bg-gray-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500">
              <option>Sort by: Date</option>
              <option>Sort by: Verdict</option>
              <option>Sort by: Confidence</option>
            </select>
          </div>

          <div className="flex gap-2 flex-wrap">
            {filterButtons.map((btn) => (
              <button
                key={btn.value}
                onClick={() => setActiveFilter(btn.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeFilter === btn.value
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {filteredHistory.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-lg border border-slate-200 hover:shadow-md transition-all hover:border-slate-300 cursor-pointer p-6 flex items-center justify-between"
            >
              <div className="flex-1">
                <p className="text-base font-medium text-gray-900 mb-2">{item.claim}</p>
                <div className="flex items-center gap-3">
                  <VerdictBadge verdict={item.verdict} />
                  <span className="text-xs text-gray-500">{formatDate(item.date)}</span>
                </div>
              </div>
              <button className="ml-6 p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ChevronRight size={20} className="text-gray-400" />
              </button>
            </div>
          ))}

          {filteredHistory.length === 0 && (
            <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
              <p className="text-gray-500 text-lg">No results found</p>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
