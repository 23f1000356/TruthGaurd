import { X, CheckCircle2, XCircle, AlertTriangle, HelpCircle, TrendingUp } from 'lucide-react';

interface DocumentAnalysisModalProps {
  onClose: () => void;
  analysis: {
    doc_id: string;
    total_claims: number;
    statistics: {
      true: number;
      false: number;
      misleading: number;
      unverified: number;
    };
    percentages: {
      true: number;
      false: number;
      misleading: number;
      unverified: number;
    };
    claims: Array<{
      id: number;
      text: string;
      verdict: 'true' | 'false' | 'misleading' | 'unverified';
      confidence: number;
      explanation: string;
      evidence_count: number;
      source_credibility: number;
    }>;
    summary?: string;
    overall_accuracy?: string;
    accuracy_assessment?: string;
  };
}

export function DocumentAnalysisModal({ onClose, analysis }: DocumentAnalysisModalProps) {
  const { statistics, percentages, claims, total_claims, summary, overall_accuracy, accuracy_assessment } = analysis;

  const getVerdictIcon = (verdict: string) => {
    switch (verdict) {
      case 'true':
        return <CheckCircle2 className="text-green-600" size={20} />;
      case 'false':
        return <XCircle className="text-red-600" size={20} />;
      case 'misleading':
        return <AlertTriangle className="text-yellow-600" size={20} />;
      default:
        return <HelpCircle className="text-gray-600" size={20} />;
    }
  };

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'true':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'false':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'misleading':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Document Analysis</h2>
            <p className="text-sm text-gray-600 mt-1">
              Analysis results for {total_claims} claims found in the document
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        {/* Document Summary and Overall Assessment */}
        {(summary || accuracy_assessment) && (
          <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-b border-gray-200">
            {summary && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Document Summary</h3>
                <p className="text-sm text-gray-800 leading-relaxed">{summary}</p>
              </div>
            )}
            {accuracy_assessment && (
              <div className="mt-4 p-4 bg-white rounded-lg border-2 border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-semibold text-gray-700">Overall Assessment:</span>
                  {overall_accuracy === 'mostly_accurate' && (
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-bold rounded-full border border-green-300">
                      ✓ Mostly Accurate
                    </span>
                  )}
                  {overall_accuracy === 'mostly_false' && (
                    <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-bold rounded-full border border-red-300">
                      ✗ Mostly False
                    </span>
                  )}
                  {overall_accuracy === 'misleading' && (
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-bold rounded-full border border-yellow-300">
                      ⚠ Misleading
                    </span>
                  )}
                  {overall_accuracy === 'mixed' && (
                    <span className="px-3 py-1 bg-orange-100 text-orange-800 text-sm font-bold rounded-full border border-orange-300">
                      ⚡ Mixed Accuracy
                    </span>
                  )}
                  {overall_accuracy === 'unverified' && (
                    <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm font-bold rounded-full border border-gray-300">
                      ? Unverified
                    </span>
                  )}
                  {overall_accuracy === 'unknown' && (
                    <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm font-bold rounded-full border border-gray-300">
                      ? Unknown
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-700 mt-2">{accuracy_assessment}</p>
              </div>
            )}
          </div>
        )}

        {/* Statistics Overview */}
        <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-b border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="text-green-600" size={20} />
                <span className="text-sm font-medium text-gray-700">True</span>
              </div>
              <div className="text-2xl font-bold text-green-600">{statistics.true}</div>
              <div className="text-xs text-gray-500">{percentages.true.toFixed(1)}%</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="text-red-600" size={20} />
                <span className="text-sm font-medium text-gray-700">False</span>
              </div>
              <div className="text-2xl font-bold text-red-600">{statistics.false}</div>
              <div className="text-xs text-gray-500">{percentages.false.toFixed(1)}%</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="text-yellow-600" size={20} />
                <span className="text-sm font-medium text-gray-700">Misleading</span>
              </div>
              <div className="text-2xl font-bold text-yellow-600">{statistics.misleading}</div>
              <div className="text-xs text-gray-500">{percentages.misleading.toFixed(1)}%</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <HelpCircle className="text-gray-600" size={20} />
                <span className="text-sm font-medium text-gray-700">Unverified</span>
              </div>
              <div className="text-2xl font-bold text-gray-600">{statistics.unverified}</div>
              <div className="text-xs text-gray-500">{percentages.unverified.toFixed(1)}%</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="text-blue-600" size={16} />
              <span className="text-sm font-medium text-gray-700">Content Breakdown</span>
            </div>
            <div className="h-6 bg-gray-200 rounded-full overflow-hidden flex">
              {percentages.true > 0 && (
                <div
                  className="bg-green-500 h-full flex items-center justify-center text-white text-xs font-medium"
                  style={{ width: `${percentages.true}%` }}
                >
                  {percentages.true > 5 && `${percentages.true.toFixed(0)}%`}
                </div>
              )}
              {percentages.false > 0 && (
                <div
                  className="bg-red-500 h-full flex items-center justify-center text-white text-xs font-medium"
                  style={{ width: `${percentages.false}%` }}
                >
                  {percentages.false > 5 && `${percentages.false.toFixed(0)}%`}
                </div>
              )}
              {percentages.misleading > 0 && (
                <div
                  className="bg-yellow-500 h-full flex items-center justify-center text-white text-xs font-medium"
                  style={{ width: `${percentages.misleading}%` }}
                >
                  {percentages.misleading > 5 && `${percentages.misleading.toFixed(0)}%`}
                </div>
              )}
              {percentages.unverified > 0 && (
                <div
                  className="bg-gray-400 h-full flex items-center justify-center text-white text-xs font-medium"
                  style={{ width: `${percentages.unverified}%` }}
                >
                  {percentages.unverified > 5 && `${percentages.unverified.toFixed(0)}%`}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Claims List */}
        <div className="flex-1 overflow-y-auto p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Claims</h3>
          <div className="space-y-4">
            {claims.map((claim) => (
              <div
                key={claim.id}
                className={`border-2 rounded-xl p-4 ${getVerdictColor(claim.verdict)}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 flex-1">
                    {getVerdictIcon(claim.verdict)}
                    <span className="font-medium text-sm uppercase">{claim.verdict}</span>
                    <span className="text-xs opacity-75">
                      ({Math.round(claim.confidence * 100)}% confidence)
                    </span>
                  </div>
                </div>
                <p className="text-sm font-medium mb-2">{claim.text}</p>
                <p className="text-xs opacity-90 mb-2">{claim.explanation}</p>
                <div className="flex items-center gap-4 text-xs opacity-75">
                  <span>Evidence: {claim.evidence_count} sources</span>
                  <span>Credibility: {Math.round(claim.source_credibility * 100)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

