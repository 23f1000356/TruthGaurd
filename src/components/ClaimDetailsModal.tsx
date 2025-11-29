import { X, Calendar, User, FileText, Link2, AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react';
import type { Claim } from '../pages/ProjectDetailsScreen';

interface ClaimDetailsModalProps {
  claim: Claim | null;
  onClose: () => void;
}

export function ClaimDetailsModal({ claim, onClose }: ClaimDetailsModalProps) {
  if (!claim) return null;

  // Mock detailed data - in real app, this would come from API
  const claimDetails = {
    submittedBy: 'John Doe',
    submittedDate: '2025-01-16',
    submittedTime: '14:32:15',
    source: 'User Submission',
    context: 'This claim was submitted as part of the Climate Change Research project. It requires verification against current scientific data and peer-reviewed sources.',
    reasoning: 'The claim about Arctic ice melting requires cross-referencing with satellite data from NASA, NOAA, and other climate monitoring organizations. Initial analysis suggests this may be an exaggeration of actual conditions.',
    methodology: 'Automated fact-checking using LLaMA 3 model with confidence scoring. Cross-referenced with 15+ sources including scientific journals, government reports, and climate databases.',
    who: {
      submittedBy: 'John Doe',
      verifiedBy: 'System (Auto)',
      reviewedBy: 'Pending',
      organization: 'Climate Research Team',
    },
    when: {
      claimDate: '2025-01-16',
      submittedAt: '2025-01-16 14:32:15',
      lastVerified: '2025-01-16 14:35:22',
      expiresAt: '2025-02-16',
    },
    why: {
      reason: 'Flagged for review due to low confidence score (65%) and potential misinformation risk. Requires human verification.',
      importance: 'High - Climate misinformation can have significant societal impact',
      urgency: 'Medium',
    },
    how: {
      detectionMethod: 'Automated AI Analysis',
      verificationSteps: [
        'Initial claim parsing and entity extraction',
        'Source credibility assessment',
        'Cross-reference with knowledge base',
        'Confidence scoring algorithm',
        'Flag for human review (low confidence)',
      ],
      toolsUsed: ['LLaMA 3 Model', 'Knowledge Base Search', 'Source Analyzer'],
    },
    sources: [
      {
        title: 'NASA Climate Data - Arctic Ice Extent',
        url: 'https://climate.nasa.gov/arctic-ice-extent',
        type: 'Government Source',
        reliability: 'High',
        date: '2024-12-15',
      },
      {
        title: 'NOAA Arctic Report Card 2024',
        url: 'https://arctic.noaa.gov/report-card',
        type: 'Scientific Report',
        reliability: 'High',
        date: '2024-11-20',
      },
      {
        title: 'Nature Climate Change - Arctic Ice Study',
        url: 'https://nature.com/climate-arctic',
        type: 'Peer-Reviewed Journal',
        reliability: 'Very High',
        date: '2024-10-05',
      },
    ],
    relatedClaims: [
      {
        id: '7',
        text: 'CO2 emissions decreased globally in 2024',
        verdict: 'unverified',
        similarity: 0.45,
      },
      {
        id: '8',
        text: 'Renewable energy is more expensive than fossil fuels',
        verdict: 'misleading',
        similarity: 0.32,
      },
    ],
  };

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
      <span className={`px-3 py-1 rounded-full text-sm font-bold border ${colors[verdict as keyof typeof colors]}`}>
        {labels[verdict as keyof typeof labels]}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center">
              <FileText size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Claim Details</h2>
              <p className="text-sm text-gray-500">Comprehensive information about this claim</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={24} className="text-gray-500" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Claim Text */}
          <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
            <div className="flex items-start justify-between gap-4 mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Claim</h3>
              <VerdictBadge verdict={claim.verdict} />
            </div>
            <p className="text-base text-gray-800 leading-relaxed">{claim.text}</p>
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-200">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Confidence:</span>
                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full"
                    style={{ width: `${claim.confidence * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {(claim.confidence * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock size={16} />
                <span>Date: {claim.date}</span>
              </div>
            </div>
          </div>

          {/* Grid of Key Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* WHO */}
            <div className="bg-blue-50 rounded-xl p-5 border border-blue-200">
              <div className="flex items-center gap-2 mb-3">
                <User size={20} className="text-blue-600" />
                <h4 className="font-semibold text-gray-900">Who</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Submitted by:</span>
                  <span className="ml-2 font-medium text-gray-900">{claimDetails.who.submittedBy}</span>
                </div>
                <div>
                  <span className="text-gray-600">Verified by:</span>
                  <span className="ml-2 font-medium text-gray-900">{claimDetails.who.verifiedBy}</span>
                </div>
                <div>
                  <span className="text-gray-600">Organization:</span>
                  <span className="ml-2 font-medium text-gray-900">{claimDetails.who.organization}</span>
                </div>
              </div>
            </div>

            {/* WHEN */}
            <div className="bg-purple-50 rounded-xl p-5 border border-purple-200">
              <div className="flex items-center gap-2 mb-3">
                <Calendar size={20} className="text-purple-600" />
                <h4 className="font-semibold text-gray-900">When</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Submitted:</span>
                  <span className="ml-2 font-medium text-gray-900">{claimDetails.when.submittedAt}</span>
                </div>
                <div>
                  <span className="text-gray-600">Last verified:</span>
                  <span className="ml-2 font-medium text-gray-900">{claimDetails.when.lastVerified}</span>
                </div>
                <div>
                  <span className="text-gray-600">Expires:</span>
                  <span className="ml-2 font-medium text-gray-900">{claimDetails.when.expiresAt}</span>
                </div>
              </div>
            </div>

            {/* WHY */}
            <div className="bg-orange-50 rounded-xl p-5 border border-orange-200">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle size={20} className="text-orange-600" />
                <h4 className="font-semibold text-gray-900">Why</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Reason:</span>
                  <p className="mt-1 font-medium text-gray-900">{claimDetails.why.reason}</p>
                </div>
                <div>
                  <span className="text-gray-600">Importance:</span>
                  <span className="ml-2 font-medium text-gray-900">{claimDetails.why.importance}</span>
                </div>
                <div>
                  <span className="text-gray-600">Urgency:</span>
                  <span className="ml-2 font-medium text-gray-900">{claimDetails.why.urgency}</span>
                </div>
              </div>
            </div>

            {/* HOW */}
            <div className="bg-teal-50 rounded-xl p-5 border border-teal-200">
              <div className="flex items-center gap-2 mb-3">
                <FileText size={20} className="text-teal-600" />
                <h4 className="font-semibold text-gray-900">How</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Method:</span>
                  <span className="ml-2 font-medium text-gray-900">{claimDetails.how.detectionMethod}</span>
                </div>
                <div>
                  <span className="text-gray-600">Tools:</span>
                  <span className="ml-2 font-medium text-gray-900">{claimDetails.how.toolsUsed.join(', ')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Context & Reasoning */}
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
              <h4 className="font-semibold text-gray-900 mb-3">Context</h4>
              <p className="text-sm text-gray-700 leading-relaxed">{claimDetails.context}</p>
            </div>

            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
              <h4 className="font-semibold text-gray-900 mb-3">Reasoning</h4>
              <p className="text-sm text-gray-700 leading-relaxed">{claimDetails.reasoning}</p>
            </div>
          </div>

          {/* Verification Steps */}
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-5 border border-indigo-200">
            <h4 className="font-semibold text-gray-900 mb-4">Verification Steps</h4>
            <ol className="space-y-2">
              {claimDetails.how.verificationSteps.map((step, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-semibold text-xs">
                    {idx + 1}
                  </span>
                  <span className="text-gray-700 pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Sources */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Link2 size={20} />
              Sources & References
            </h4>
            <div className="space-y-3">
              {claimDetails.sources.map((source, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline font-medium text-sm"
                      >
                        {source.title}
                      </a>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <span>{source.type}</span>
                        <span>•</span>
                        <span className={`px-2 py-0.5 rounded ${
                          source.reliability === 'Very High' ? 'bg-green-100 text-green-700' :
                          source.reliability === 'High' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {source.reliability}
                        </span>
                        <span>•</span>
                        <span>{source.date}</span>
                      </div>
                    </div>
                    <Link2 size={16} className="text-gray-400 flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Related Claims */}
          {claimDetails.relatedClaims.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Related Claims</h4>
              <div className="space-y-2">
                {claimDetails.relatedClaims.map((related) => (
                  <div
                    key={related.id}
                    className="bg-slate-50 rounded-lg border border-slate-200 p-3 text-sm"
                  >
                    <p className="text-gray-700 mb-2">{related.text}</p>
                    <div className="flex items-center gap-3">
                      <VerdictBadge verdict={related.verdict} />
                      <span className="text-xs text-gray-500">
                        Similarity: {(related.similarity * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-6 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <button className="px-6 py-2 text-gray-700 font-medium border border-slate-300 rounded-lg hover:bg-white transition-colors">
              Export Details
            </button>
            <button className="px-6 py-2 text-gray-700 font-medium border border-slate-300 rounded-lg hover:bg-white transition-colors">
              Share
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-700 font-medium border border-slate-300 rounded-lg hover:bg-white transition-colors"
            >
              Close
            </button>
            <button className="px-6 py-2 bg-gradient-to-r from-teal-600 to-blue-600 text-white font-medium rounded-lg hover:shadow-lg transition-all">
              Take Action
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

