import { useState } from 'react';
import { Header } from '../components/Header';
import { supabase, SourceAnalysis } from '../lib/supabase';
import { Search, TrendingUp, Globe, Shield, Users, Target, ExternalLink } from 'lucide-react';

export function SourceAnalyzerScreen({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [url, setUrl] = useState('');
  const [analysis, setAnalysis] = useState<SourceAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('1M');

  async function analyzeSource() {
    if (!url.trim()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('source_analysis')
        .select('*')
        .eq('url', url)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setAnalysis(data);
      } else {
        setAnalysis(getMockAnalysis(url));
      }
    } catch (error) {
      console.error('Error analyzing source:', error);
      setAnalysis(getMockAnalysis(url));
    } finally {
      setLoading(false);
    }
  }

  function getMockAnalysis(sourceUrl: string): SourceAnalysis {
    return {
      id: '1',
      url: sourceUrl,
      domain_age: '15 years, 3 months',
      category: 'News & Media',
      trust_score: 87,
      popularity: 'High (Top 500 globally)',
      bias: 'Center-Left',
      reputation_data: {
        scores: [
          { date: '2024-05', score: 82 },
          { date: '2024-06', score: 84 },
          { date: '2024-07', score: 85 },
          { date: '2024-08', score: 86 },
          { date: '2024-09', score: 87 },
        ],
      },
      analyzed_at: new Date().toISOString(),
    };
  }

  return (
    <div className="min-h-screen bg-[#F5F2ED]">
      <Header currentPage="Source Analyzer" />

      <div className="max-w-6xl mx-auto px-8 py-8">
        <h2 className="text-2xl font-bold text-[#1A1A1A] mb-8">Source Analyzer</h2>

        <div className="bg-white rounded-2xl p-8 shadow-sm mb-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && analyzeSource()}
                placeholder="Enter website URL to analyze..."
                className="w-full px-6 py-4 border-2 border-[#D3D3D3] rounded-xl text-base focus:outline-none focus:border-[#2E8372] transition-colors"
              />
            </div>
            <button
              onClick={analyzeSource}
              disabled={loading}
              className="px-8 py-4 bg-[#2E8372] text-white rounded-xl font-medium hover:bg-[#267062] transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
            >
              <Search size={20} />
              {loading ? 'Analyzing...' : 'Analyze'}
            </button>
          </div>
        </div>

        {analysis && (
          <>
            <div className="bg-white rounded-2xl p-8 shadow-sm mb-6">
              <h3 className="text-lg font-bold text-[#1A1A1A] mb-6">Source Information</h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-teal-50 rounded-xl">
                    <Globe size={24} className="text-[#2E8372]" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Domain Age</div>
                    <div className="text-lg font-semibold text-[#1A1A1A]">
                      {analysis.domain_age}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 bg-teal-50 rounded-xl">
                    <Target size={24} className="text-[#2E8372]" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Category</div>
                    <div className="text-lg font-semibold text-[#1A1A1A]">
                      {analysis.category}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 bg-teal-50 rounded-xl">
                    <Shield size={24} className="text-[#2E8372]" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Trust Score</div>
                    <div className="text-lg font-semibold text-[#1A1A1A]">
                      {analysis.trust_score}/100
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 bg-teal-50 rounded-xl">
                    <Users size={24} className="text-[#2E8372]" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Popularity</div>
                    <div className="text-lg font-semibold text-[#1A1A1A]">
                      {analysis.popularity}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 bg-teal-50 rounded-xl">
                    <TrendingUp size={24} className="text-[#2E8372]" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Bias</div>
                    <div className="text-lg font-semibold text-[#1A1A1A]">{analysis.bias}</div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 bg-teal-50 rounded-xl">
                    <ExternalLink size={24} className="text-[#2E8372]" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">History Link</div>
                    <a
                      href={analysis.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-lg font-semibold text-[#2563EB] hover:underline"
                    >
                      View Archive
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-[#1A1A1A]">
                  Domain Reputation Over Time
                </h3>
                <div className="flex gap-2">
                  {['1W', '1M', '6M', '1Y', 'ALL'].map((range) => (
                    <button
                      key={range}
                      onClick={() => setTimeRange(range)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        timeRange === range
                          ? 'bg-[#2E8372] text-white'
                          : 'border-2 border-[#2E8372] text-[#2E8372] hover:bg-teal-50'
                      }`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative h-64 border border-gray-200 rounded-xl p-6">
                <svg className="w-full h-full" viewBox="0 0 600 200">
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#2E8372" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#2E8372" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  <g className="text-xs text-gray-500">
                    <line x1="50" y1="0" x2="50" y2="200" stroke="#E0E0E0" strokeWidth="1" />
                    {[0, 50, 100, 150, 200].map((y) => (
                      <g key={y}>
                        <line
                          x1="50"
                          y1={y}
                          x2="600"
                          y2={y}
                          stroke="#E0E0E0"
                          strokeWidth="1"
                          strokeDasharray="4"
                        />
                        <text x="35" y={y + 4} textAnchor="end" fill="currentColor">
                          {100 - (y / 2)}
                        </text>
                      </g>
                    ))}
                  </g>

                  <polyline
                    points="50,36 150,28 250,22 350,18 450,14 550,13"
                    fill="url(#gradient)"
                    stroke="none"
                  />

                  <polyline
                    points="50,36 150,28 250,22 350,18 450,14 550,13"
                    fill="none"
                    stroke="#2E8372"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {[
                    { x: 50, y: 36 },
                    { x: 150, y: 28 },
                    { x: 250, y: 22 },
                    { x: 350, y: 18 },
                    { x: 450, y: 14 },
                    { x: 550, y: 13 },
                  ].map((point, i) => (
                    <circle
                      key={i}
                      cx={point.x}
                      cy={point.y}
                      r="4"
                      fill="#2E8372"
                      stroke="white"
                      strokeWidth="2"
                    />
                  ))}
                </svg>
              </div>
            </div>
          </>
        )}

        {!analysis && !loading && (
          <div className="bg-white rounded-2xl p-12 shadow-sm text-center">
            <Search size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">
              Enter a URL to analyze
            </h3>
            <p className="text-gray-600">
              Get detailed information about source credibility, bias, and reputation
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
