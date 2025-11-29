import { useState } from 'react';
import { Settings, History, LayoutDashboard, Sparkles } from 'lucide-react';

export default function ExtensionPopup() {
  const [highlightedText] = useState('Vaccines have been proven to cause autism in multiple studies.');
  const [verdict, setVerdict] = useState<{
    type: 'true' | 'false' | 'misleading' | 'unverified' | null;
    confidence: number;
    explanation: string;
  } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const getVerdictColor = (type: string) => {
    switch (type) {
      case 'true': return 'bg-[#DCFCE7] text-green-800';
      case 'false': return 'bg-[#FEE2E2] text-red-800';
      case 'misleading': return 'bg-[#FEF9C3] text-yellow-800';
      case 'unverified': return 'bg-[#F3F4F6] text-gray-800';
      default: return 'bg-gray-200 text-gray-800';
    }
  };

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setVerdict({
        type: 'false',
        confidence: 0.96,
        explanation: 'Multiple peer-reviewed studies have found no causal link between vaccines and autism. This claim has been thoroughly debunked by the scientific community.',
      });
      setIsAnalyzing(false);
    }, 1500);
  };

  return (
    <div className="w-[400px] bg-[#F5F2ED] font-sans">
      <div className="bg-[#F5F2ED] px-5 py-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2E8372] to-[#3C8E80] flex items-center justify-center">
            <Sparkles size={16} className="text-white" />
          </div>
          <span className="text-base font-semibold text-[#1A1A1A]">TruthGuard</span>
        </div>
        <button className="p-1.5 hover:bg-gray-200 rounded-lg transition-all">
          <Settings size={16} className="text-gray-600" />
        </button>
      </div>

      <div className="p-5 space-y-4">
        <div>
          <h3 className="text-xs font-semibold text-[#2B2B2B] mb-2">Highlighted Text</h3>
          <div className="bg-white rounded-xl p-3 border-2 border-[#2E8372]/20 shadow-[0_0_12px_rgba(46,131,114,0.1)] max-h-[90px] overflow-y-auto">
            <p className="text-sm text-[#1A1A1A] leading-relaxed">{highlightedText}</p>
          </div>
        </div>

        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className="w-full px-6 py-3 rounded-full bg-[#2E8372] text-white font-semibold hover:bg-[#3C8E80] transition-all shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isAnalyzing ? (
            <span className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Analyzing...</span>
            </span>
          ) : (
            'Analyze Selected Text'
          )}
        </button>

        {verdict && (
          <div className="bg-white rounded-xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.08)] space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className={`inline-block px-3 py-1.5 rounded-full text-xs font-bold ${getVerdictColor(verdict.type!)}`}>
                {verdict.type?.toUpperCase()}
              </span>
              <span className="text-xs text-gray-600">
                Confidence: <span className="font-semibold text-[#2E8372]">{(verdict.confidence * 100).toFixed(0)}%</span>
              </span>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-[#2B2B2B] mb-1.5">Explanation</h4>
              <p className="text-xs text-gray-700 leading-relaxed">{verdict.explanation}</p>
            </div>

            <button className="w-full px-4 py-2 rounded-full border-2 border-[#2E8372] text-[#2E8372] text-sm font-medium hover:bg-[#2E8372]/5 transition-all">
              View Evidence
            </button>
          </div>
        )}
      </div>

      <div className="px-5 py-3 border-t border-gray-200 flex items-center justify-around">
        <button className="flex flex-col items-center space-y-1 px-3 py-2 hover:bg-gray-100 rounded-lg transition-all group">
          <Settings size={18} className="text-[#2E8372] group-hover:scale-110 transition-transform" />
          <span className="text-xs text-gray-600">Settings</span>
        </button>
        <button className="flex flex-col items-center space-y-1 px-3 py-2 hover:bg-gray-100 rounded-lg transition-all group">
          <History size={18} className="text-[#2E8372] group-hover:scale-110 transition-transform" />
          <span className="text-xs text-gray-600">History</span>
        </button>
        <button className="flex flex-col items-center space-y-1 px-3 py-2 hover:bg-gray-100 rounded-lg transition-all group">
          <LayoutDashboard size={18} className="text-[#2E8372] group-hover:scale-110 transition-transform" />
          <span className="text-xs text-gray-600">Dashboard</span>
        </button>
      </div>
    </div>
  );
}
