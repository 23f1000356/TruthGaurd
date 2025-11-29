import { useState } from 'react';
import { Search, FileText, Link2, TrendingUp, CheckCircle, XCircle, AlertTriangle, ExternalLink, Shield, Clock } from 'lucide-react';
import api from '../utils/api';

interface HomeScreenProps {
  onNavigate: (page: 'home' | 'results' | 'history' | 'projects' | 'project-details' | 'kb-manager') => void;
}

interface SourceAnalysisResult {
  url: string;
  credibility: 'high' | 'medium' | 'low';
  credibilityScore: number;
  sourceType: string;
  domain: string;
  lastUpdated: string;
  author: string;
  factCheckStatus: 'verified' | 'unverified' | 'disputed';
  reliability: string;
  bias: string;
  citations: number;
  issues: string[];
  strengths: string[];
}

export default function HomeScreen({ onNavigate }: HomeScreenProps) {
  const [claim, setClaim] = useState('');
  const [mode, setMode] = useState<'single' | 'debate'>('single');
  const [topK, setTopK] = useState(5);
  const [model, setModel] = useState('llama');
  const [sourceUrl, setSourceUrl] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<SourceAnalysisResult | null>(null);

  const handleVerify = async () => {
    if (claim.trim()) {
      // Store claim for results screen
      sessionStorage.setItem('pendingVerification', claim);
      sessionStorage.setItem('verificationMode', mode);
      sessionStorage.setItem('verificationTopK', topK.toString());
      
      // Navigate to results (which will trigger verification)
      onNavigate('results');
    }
  };

  const handleAnalyzeSource = async () => {
    if (sourceUrl.trim()) {
      setAnalyzing(true);
      setAnalysisResult(null);
      
      try {
        const response = await api.analyzeSource(sourceUrl);
        
        if (response.error) {
          alert(`Analysis failed: ${response.error}`);
          setAnalyzing(false);
          return;
        }
        
        if (response.data) {
          const data = response.data;
          const credibilityLevel = data.trust_score >= 80 ? 'high' : data.trust_score >= 60 ? 'medium' : 'low';
          
          const result: SourceAnalysisResult = {
            url: sourceUrl,
            credibility: credibilityLevel,
            credibilityScore: Math.round(data.trust_score * 100),
            sourceType: data.is_fact_checker ? 'Fact-Checker' : data.is_academic ? 'Academic' : 'Article',
            domain: data.domain,
            lastUpdated: new Date().toLocaleDateString(),
            author: 'Unknown',
            factCheckStatus: data.is_fact_checker ? 'verified' : data.is_unreliable ? 'disputed' : 'unverified',
            reliability: data.trust_score >= 80 ? 'Very Reliable' : data.trust_score >= 60 ? 'Reliable' : 'Moderately Reliable',
            bias: data.bias || 'Unknown',
            citations: 0,
            issues: data.is_unreliable ? ['Source has been flagged as unreliable'] : [],
            strengths: [
              data.is_fact_checker ? 'Verified fact-checking source' : '',
              data.is_academic ? 'Academic or educational domain' : '',
              `Trust score: ${Math.round(data.trust_score * 100)}%`,
            ].filter(Boolean),
          };
          
          setAnalysisResult(result);
        }
      } catch (error) {
        alert('Invalid URL or analysis failed. Please try again.');
        console.error('Source analysis error:', error);
      } finally {
        setAnalyzing(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100">
      <main className="px-8 py-8">
        <div className="grid grid-cols-3 gap-8">
          <div className="col-span-2 space-y-8">
            <div className="bg-white/70 backdrop-blur rounded-2xl shadow-lg p-8 border border-white/50">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Fact Check Anything</h2>

              <textarea
                value={claim}
                onChange={(e) => setClaim(e.target.value)}
                placeholder="Enter a claim to verify..."
                className="w-full h-60 p-4 text-gray-800 placeholder-gray-400 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
              />

              <div className="mt-6 space-y-4">
                <div className="flex gap-8">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-gray-700">Mode:</span>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={mode === 'single'}
                          onChange={() => setMode('single')}
                          className="w-4 h-4 text-teal-500"
                        />
                        <span className="text-sm text-gray-700">Single</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={mode === 'debate'}
                          onChange={() => setMode('debate')}
                          className="w-4 h-4 text-teal-500"
                        />
                        <span className="text-sm text-gray-700">Debate</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">Top-K:</label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={topK}
                      onChange={(e) => setTopK(parseInt(e.target.value))}
                      className="w-16 px-3 py-1 text-sm text-gray-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">Model:</label>
                    <select
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="px-3 py-1 text-sm text-gray-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="llama">LLaMA</option>
                      <option value="mistral">Mistral</option>
                      <option value="gemma">Gemma</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex items-center gap-4">
                <button
                  onClick={handleVerify}
                  className="px-8 py-3 bg-gradient-to-r from-teal-600 to-blue-600 text-white font-semibold rounded-xl hover:shadow-lg hover:from-teal-700 hover:to-blue-700 transition-all duration-200"
                >
                  Verify Claim
                </button>
                <button
                  onClick={() => setClaim('')}
                  className="px-6 py-3 text-gray-700 font-medium border border-slate-300 rounded-xl hover:bg-slate-50 transition-all duration-200"
                >
                  Clear
                </button>
                <a href="#" className="ml-auto text-sm text-blue-600 hover:underline font-medium">
                  Docs & Prompt Guide →
                </a>
              </div>
            </div>

            {/* Source Analyzer Section */}
            <div className="bg-white/70 backdrop-blur rounded-2xl shadow-lg p-8 border border-white/50">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <Search size={20} className="text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900">Source Analyzer</h2>
              </div>
              <p className="text-gray-600 mb-6">
                Analyze and verify the credibility of sources, articles, and URLs
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter URL or Source
                  </label>
                  <div className="relative">
                    <Link2 size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={sourceUrl}
                      onChange={(e) => setSourceUrl(e.target.value)}
                      placeholder="https://example.com/article..."
                      className="w-full pl-10 pr-4 py-3 text-gray-800 placeholder-gray-400 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText size={16} className="text-blue-600" />
                      <span className="text-sm font-medium text-gray-700">Source Type</span>
                    </div>
                    <select className="w-full px-3 py-2 text-sm text-gray-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      <option>Auto-detect</option>
                      <option>Article</option>
                      <option>Research Paper</option>
                      <option>News Source</option>
                      <option>Blog Post</option>
                    </select>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp size={16} className="text-purple-600" />
                      <span className="text-sm font-medium text-gray-700">Analysis Depth</span>
                    </div>
                    <select className="w-full px-3 py-2 text-sm text-gray-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      <option>Standard</option>
                      <option>Deep Analysis</option>
                      <option>Quick Check</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-2">
                  <button
                    onClick={handleAnalyzeSource}
                    disabled={analyzing || !sourceUrl.trim()}
                    className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {analyzing ? 'Analyzing...' : 'Analyze Source'}
                  </button>
                  <button
                    onClick={() => {
                      setSourceUrl('');
                      setAnalysisResult(null);
                    }}
                    className="px-6 py-3 text-gray-700 font-medium border border-slate-300 rounded-xl hover:bg-slate-50 transition-all duration-200"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Analysis Results */}
              {analysisResult && (
                <div className="mt-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Analysis Results</h3>
                    <a
                      href={analysisResult.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-indigo-600 hover:underline"
                    >
                      <ExternalLink size={16} />
                      Open Source
                    </a>
                  </div>

                  {/* Credibility Score */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Credibility Score</span>
                      <span className={`text-lg font-bold ${
                        analysisResult.credibility === 'high' ? 'text-green-600' :
                        analysisResult.credibility === 'medium' ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {analysisResult.credibilityScore}%
                      </span>
                    </div>
                    <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          analysisResult.credibility === 'high' ? 'bg-gradient-to-r from-green-500 to-green-600' :
                          analysisResult.credibility === 'medium' ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                          'bg-gradient-to-r from-red-500 to-red-600'
                        }`}
                        style={{ width: `${analysisResult.credibilityScore}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {analysisResult.credibility === 'high' ? (
                        <CheckCircle size={16} className="text-green-600" />
                      ) : analysisResult.credibility === 'medium' ? (
                        <AlertTriangle size={16} className="text-yellow-600" />
                      ) : (
                        <XCircle size={16} className="text-red-600" />
                      )}
                      <span className={`text-xs font-medium ${
                        analysisResult.credibility === 'high' ? 'text-green-700' :
                        analysisResult.credibility === 'medium' ? 'text-yellow-700' :
                        'text-red-700'
                      }`}>
                        {analysisResult.credibility.charAt(0).toUpperCase() + analysisResult.credibility.slice(1)} Credibility
                      </span>
                    </div>
                  </div>

                  {/* Source Information Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-white rounded-lg p-4 border border-indigo-100">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText size={16} className="text-indigo-600" />
                        <span className="text-xs text-gray-500">Source Type</span>
                      </div>
                      <p className="text-sm font-medium text-gray-900">{analysisResult.sourceType}</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-indigo-100">
                      <div className="flex items-center gap-2 mb-1">
                        <Shield size={16} className="text-indigo-600" />
                        <span className="text-xs text-gray-500">Reliability</span>
                      </div>
                      <p className="text-sm font-medium text-gray-900">{analysisResult.reliability}</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-indigo-100">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock size={16} className="text-indigo-600" />
                        <span className="text-xs text-gray-500">Last Updated</span>
                      </div>
                      <p className="text-sm font-medium text-gray-900">{analysisResult.lastUpdated}</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-indigo-100">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText size={16} className="text-indigo-600" />
                        <span className="text-xs text-gray-500">Citations</span>
                      </div>
                      <p className="text-sm font-medium text-gray-900">{analysisResult.citations} references</p>
                    </div>
                  </div>

                  {/* Strengths */}
                  {analysisResult.strengths.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <CheckCircle size={16} className="text-green-600" />
                        Strengths
                      </h4>
                      <ul className="space-y-1">
                        {analysisResult.strengths.map((strength, idx) => (
                          <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                            <span className="text-green-600 mt-1">•</span>
                            <span>{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Issues */}
                  {analysisResult.issues.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <AlertTriangle size={16} className="text-yellow-600" />
                        Issues & Concerns
                      </h4>
                      <ul className="space-y-1">
                        {analysisResult.issues.map((issue, idx) => (
                          <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                            <span className="text-yellow-600 mt-1">•</span>
                            <span>{issue}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="col-span-1">
            <div className="bg-white/70 backdrop-blur rounded-2xl shadow-lg p-6 border border-white/50 sticky top-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Tips</h3>
              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex gap-2">
                  <span className="text-teal-600 font-bold">•</span>
                  <span>Be specific with your claims for better results</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-teal-600 font-bold">•</span>
                  <span>Include context and timeframe when possible</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-teal-600 font-bold">•</span>
                  <span>Check multiple sources for verification</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-teal-600 font-bold">•</span>
                  <span>Debate mode compares multiple perspectives</span>
                </li>
              </ul>

              <div className="mt-6 pt-6 border-t border-slate-200">
                <h4 className="text-sm font-bold text-gray-900 mb-3">Verdict Guide</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    <span className="text-xs text-gray-700">True</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <span className="text-xs text-gray-700">False</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <span className="text-xs text-gray-700">Misleading</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
