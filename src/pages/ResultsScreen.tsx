import { ArrowLeft, ExternalLink, Flag, Download, Eye } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../utils/api';

interface ResultsScreenProps {
  onNavigate: (page: 'home' | 'results' | 'history' | 'projects' | 'project-details' | 'kb-manager') => void;
  onViewEvidence: (evidence: Array<{
    title: string;
    url?: string;
    snippet?: string;
    text?: string;
    source: string;
    type?: 'web' | 'kb';
  }>, claimText: string, claimId: number) => void;
}

interface ClaimResult {
  id: number;
  text: string;
  verdict: 'true' | 'false' | 'misleading' | 'unverified';
  confidence: number;
  explanation: string;
  citations: string[];
  evidence?: Array<{
    title: string;
    url?: string;
    snippet?: string;
    source: string;
  }>;
}

const VerdictBadge = ({ verdict }: { verdict: string }) => {
  const colors = {
    true: 'bg-green-100 text-green-800 border-green-300',
    false: 'bg-red-100 text-red-800 border-red-300',
    misleading: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    unverified: 'bg-gray-100 text-gray-800 border-gray-300',
  };

  const labels = {
    true: 'TRUE',
    false: 'FALSE',
    misleading: 'MISLEADING',
    unverified: 'UNVERIFIED',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${colors[verdict as keyof typeof colors]}`}>
      {labels[verdict as keyof typeof labels]}
    </span>
  );
};

export default function ResultsScreen({ onNavigate, onViewEvidence }: ResultsScreenProps) {
  const [results, setResults] = useState<ClaimResult[]>([]);
  const [llmResults, setLlmResults] = useState<ClaimResult[]>([]);
  const [ddgResults, setDdgResults] = useState<ClaimResult[]>([]);
  const [activeTab, setActiveTab] = useState<'combined' | 'llm' | 'ddg'>('combined');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyText = async () => {
      // Get pending verification from sessionStorage
      const text = sessionStorage.getItem('pendingVerification');
      const mode = sessionStorage.getItem('verificationMode') || 'single';
      const topK = parseInt(sessionStorage.getItem('verificationTopK') || '5');

      if (!text) {
        setError('No text to verify. Please go back and enter text.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await api.verifyClaims(text, mode as 'single' | 'debate', topK, false);

        if (response.error) {
          setError(response.error);
          setLoading(false);
          return;
        }

        if (response.data) {
          // Transform backend response to frontend format
          const transformedResults: ClaimResult[] = response.data.claims.map((claim: any) => ({
            id: claim.id,
            text: claim.text,
            verdict: claim.verdict,
            confidence: claim.confidence,
            explanation: claim.explanation,
            citations: claim.citations || [],
            evidence: claim.evidence || [],
          }));

          setResults(transformedResults);

          // Set LLM results if available
          if (response.data.llm_results) {
            const llmTransformed: ClaimResult[] = response.data.llm_results.map((claim: any) => ({
              id: claim.id,
              text: claim.text,
              verdict: claim.verdict,
              confidence: claim.confidence,
              explanation: claim.explanation,
              citations: claim.citations || [],
              evidence: claim.evidence || [],
            }));
            setLlmResults(llmTransformed);
          }

          // Set DDG results if available
          if (response.data.ddg_results) {
            const ddgTransformed: ClaimResult[] = response.data.ddg_results.map((claim: any) => ({
              id: claim.id,
              text: claim.text,
              verdict: claim.verdict,
              confidence: claim.confidence,
              explanation: claim.explanation,
              citations: claim.citations || [],
              evidence: claim.evidence || [],
            }));
            setDdgResults(ddgTransformed);
          }

          // Save to history (non-blocking)
          api.addHistoryEntry({
            id: `history_${Date.now()}`,
            timestamp: new Date().toISOString(),
            text: text,
            claims: transformedResults,
            processing_time: response.data.processing_time,
          }).catch(err => {
            console.warn('Failed to save to history:', err);
            // Don't block on history save errors
          });
        }
      } catch (err) {
        console.error('Verification error:', err);
        setError(err instanceof Error ? err.message : 'Failed to verify claims');
      } finally {
        setLoading(false);
        // Clear session storage
        sessionStorage.removeItem('pendingVerification');
        sessionStorage.removeItem('verificationMode');
        sessionStorage.removeItem('verificationTopK');
      }
    };

    verifyText();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate('home')}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-700" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">MA</span>
              </div>
              <span className="text-xl font-bold text-gray-900">TruthGuard</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-slate-100 rounded-lg">
              <svg size={20} className="text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-purple-500"></div>
          </div>
        </div>
      </header>

      <main className="px-8 py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Claim Results</h1>

        {/* Tabs for different result types */}
        {(llmResults.length > 0 || ddgResults.length > 0) && (
          <div className="mb-6 border-b border-slate-200">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab('combined')}
                className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                  activeTab === 'combined'
                    ? 'border-teal-600 text-teal-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Combined Results
              </button>
              {llmResults.length > 0 && (
                <button
                  onClick={() => setActiveTab('llm')}
                  className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                    activeTab === 'llm'
                      ? 'border-teal-600 text-teal-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  LLM Verification (llama3)
                </button>
              )}
              {ddgResults.length > 0 && (
                <button
                  onClick={() => setActiveTab('ddg')}
                  className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                    activeTab === 'ddg'
                      ? 'border-teal-600 text-teal-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  DuckDuckGo Search
                </button>
              )}
            </div>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Verifying claims...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <p className="text-red-800 font-semibold mb-2">Error</p>
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => onNavigate('home')}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Go Back
            </button>
          </div>
        )}

        {!loading && !error && (activeTab === 'combined' ? results : activeTab === 'llm' ? llmResults : ddgResults).length === 0 && (
          <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
            <p className="text-gray-500 text-lg">
              {activeTab === 'llm' ? 'No LLM verification results available' : 
               activeTab === 'ddg' ? 'No DuckDuckGo search results available' : 
               'No claims found in the text'}
            </p>
          </div>
        )}

        <div className="space-y-6">
          {(activeTab === 'combined' ? results : activeTab === 'llm' ? llmResults : ddgResults).map((result) => (
            <div key={result.id} className="bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-lg font-semibold text-gray-900">{result.text}</p>
                      {activeTab === 'llm' && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded">
                          LLM
                        </span>
                      )}
                      {activeTab === 'ddg' && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                          DDG
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">Confidence: {(result.confidence * 100).toFixed(0)}%</p>
                  </div>
                  <VerdictBadge verdict={result.verdict} />
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Explanation</h3>
                  <div className="bg-slate-50 rounded-lg p-4 text-sm text-gray-700 border border-slate-100">{result.explanation}</div>
                </div>

                {result.citations && result.citations.length > 0 && (
                  <div className="pt-2">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Citations</h3>
                    <ul className="space-y-2">
                      {result.citations.map((citation, idx) => (
                        <li key={idx}>
                          <span className="text-sm text-gray-700">{citation}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.evidence && result.evidence.length > 0 && (
                  <div className="pt-2">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Evidence Sources</h3>
                    <ul className="space-y-2">
                      {result.evidence.map((ev, idx) => (
                        <li key={idx} className="border-l-2 border-blue-200 pl-3">
                          {ev.url ? (
                            <a
                              href={ev.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                            >
                              {ev.title || ev.source}
                              <ExternalLink size={14} />
                            </a>
                          ) : (
                            <div>
                              <p className="text-sm font-medium text-gray-900">{ev.title || ev.source}</p>
                              {ev.text && (
                                <p className="text-xs text-gray-500 mt-1">{ev.text.substring(0, 150)}...</p>
                              )}
                            </div>
                          )}
                          {ev.snippet && (
                            <p className="text-xs text-gray-500 mt-1 ml-5">{ev.snippet.substring(0, 100)}...</p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-100 flex gap-3">
                  <button
                    onClick={() => onViewEvidence(
                      result.evidence || [],
                      result.text,
                      result.id
                    )}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <Eye size={16} />
                    View Evidence
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                    <Flag size={16} />
                    Flag for Review
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors ml-auto">
                    <Download size={16} />
                    Export PDF
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex gap-4">
          <button
            onClick={() => onNavigate('home')}
            className="px-6 py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            Check Another Claim
          </button>
          <button
            onClick={() => onNavigate('history')}
            className="px-6 py-3 text-gray-700 font-medium border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            View History
          </button>
        </div>
      </main>
    </div>
  );
}
