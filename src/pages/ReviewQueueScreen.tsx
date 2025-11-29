import { useEffect, useState } from 'react';
import { Header } from '../components/Header';
import { VerdictBadge } from '../components/VerdictBadge';
import { supabase, Claim } from '../lib/supabase';
import { AlertCircle } from 'lucide-react';

export function ReviewQueueScreen({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [pendingClaims, setPendingClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPendingClaims();
  }, []);

  async function loadPendingClaims() {
    try {
      const { data, error } = await supabase
        .from('claims')
        .select('*')
        .in('status', ['pending', 'flagged'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingClaims(data || getMockPendingClaims());
    } catch (error) {
      console.error('Error loading pending claims:', error);
      setPendingClaims(getMockPendingClaims());
    } finally {
      setLoading(false);
    }
  }

  function getMockPendingClaims(): Claim[] {
    return [
      {
        id: '1',
        project_id: '1',
        claim_text: 'Voter ID laws reduce voter fraud significantly',
        verdict: 'Unverified',
        confidence: 45,
        status: 'pending',
        reason_flagged: 'Conflicting sources found',
        created_at: new Date().toISOString(),
      },
      {
        id: '2',
        project_id: '2',
        claim_text: 'Global temperatures have risen by 3 degrees in the last decade',
        verdict: 'Misleading',
        confidence: 62,
        status: 'flagged',
        reason_flagged: 'Partial truth - needs context',
        created_at: new Date().toISOString(),
      },
      {
        id: '3',
        project_id: '3',
        claim_text: 'Vitamin C supplements prevent common cold',
        verdict: 'False',
        confidence: 58,
        status: 'pending',
        reason_flagged: 'Low confidence score',
        created_at: new Date().toISOString(),
      },
    ];
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F2ED]">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-500">Loading review queue...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F2ED]">
      <Header currentPage="Review Queue" />

      <div className="max-w-6xl mx-auto px-8 py-8">
        <h2 className="text-2xl font-bold text-[#1A1A1A] mb-8">Review Queue</h2>

        {pendingClaims.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 shadow-sm text-center">
            <div className="text-gray-400 mb-4">
              <AlertCircle size={48} className="mx-auto" />
            </div>
            <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">No pending reviews</h3>
            <p className="text-gray-600">All claims have been reviewed.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {pendingClaims.map((claim) => (
              <div
                key={claim.id}
                className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <VerdictBadge verdict={claim.verdict} />
                      <span className="text-sm text-gray-500">
                        Confidence: {claim.confidence}%
                      </span>
                    </div>

                    <p className="text-base text-[#1A1A1A] mb-3 leading-relaxed">
                      {claim.claim_text}
                    </p>

                    {claim.reason_flagged && (
                      <div className="flex items-start gap-2 text-sm text-gray-600 bg-slate-50 p-3 rounded-lg">
                        <AlertCircle size={16} className="mt-0.5 text-[#2E8372]" />
                        <div>
                          <span className="font-medium">Reason flagged: </span>
                          {claim.reason_flagged}
                        </div>
                      </div>
                    )}
                  </div>

                  <button className="px-6 py-3 bg-[#2E8372] text-white rounded-full font-medium hover:bg-[#267062] transition-colors whitespace-nowrap shadow-sm">
                    Open for Manual Review
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
