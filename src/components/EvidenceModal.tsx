import { X, ExternalLink } from 'lucide-react';

interface Evidence {
  title: string;
  url?: string;
  snippet?: string;
  text?: string;
  source: string;
  type?: 'web' | 'kb';
}

interface EvidenceModalProps {
  onClose: () => void;
  evidence?: Evidence[];
  claimText?: string;
  claimId?: number;
}

export function EvidenceModal({ onClose, evidence = [], claimText, claimId }: EvidenceModalProps) {
  // If no evidence provided, show empty state
  if (!evidence || evidence.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-8 py-6 border-b border-slate-200">
            <h2 className="text-2xl font-bold text-gray-900">
              {claimId ? `Evidence for Claim #${claimId}` : 'Evidence'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X size={24} className="text-gray-600" />
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center p-8">
            <p className="text-gray-500 text-center">No evidence sources available for this claim.</p>
          </div>

          <div className="border-t border-slate-200 px-8 py-4 flex justify-center">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-teal-500 text-teal-600 font-medium rounded-lg hover:bg-teal-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {claimId ? `Evidence for Claim #${claimId}` : 'Evidence'}
            </h2>
            {claimText && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{claimText}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          <div className="p-8 space-y-5">
            {evidence.map((ev, idx) => (
              <div key={idx} className="pb-5 border-b border-slate-200 last:border-b-0">
                {ev.url ? (
                  <a
                    href={ev.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-2 mb-2 hover:text-teal-600 transition-colors"
                  >
                    <h3 className="text-base font-semibold text-blue-600 hover:underline">
                      {ev.title || ev.source}
                    </h3>
                    <ExternalLink size={16} className="flex-shrink-0 mt-0.5" />
                  </a>
                ) : (
                  <div className="mb-2">
                    <h3 className="text-base font-semibold text-gray-900">
                      {ev.title || ev.source}
                    </h3>
                    {ev.type && (
                      <span className="text-xs text-gray-500 mt-1 inline-block">
                        {ev.type === 'kb' ? 'Knowledge Base' : 'Web Source'}
                      </span>
                    )}
                  </div>
                )}
                {(ev.snippet || ev.text) && (
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {ev.snippet || ev.text}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-200 px-8 py-4 flex justify-center">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-teal-500 text-teal-600 font-medium rounded-lg hover:bg-teal-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
