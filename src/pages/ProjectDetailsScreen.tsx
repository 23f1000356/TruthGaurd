import { Eye, MoreVertical, Check, X, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { ClaimDetailsModal } from '../components/ClaimDetailsModal';
import { exportToCSV, exportToJSON, exportToPDF, getAllClaims } from '../utils/exportUtils';
import api from '../utils/api';

interface ProjectDetailsScreenProps {
  onNavigate: (page: 'home' | 'results' | 'history' | 'projects' | 'project-details' | 'kb-manager') => void;
}

export interface Claim {
  id: string;
  text: string;
  verdict: 'true' | 'false' | 'misleading' | 'unverified';
  confidence: number;
  status: 'verified' | 'pending' | 'flagged';
  date: string;
  review_status?: 'pending' | 'approved' | 'rejected';
}

const initialClaims: Claim[] = [
  {
    id: '1',
    text: 'Climate change is accelerating faster than predicted',
    verdict: 'true',
    confidence: 0.89,
    status: 'verified',
    date: '2025-01-15',
  },
  {
    id: '2',
    text: 'Global temperatures have decreased in the last decade',
    verdict: 'false',
    confidence: 0.96,
    status: 'verified',
    date: '2025-01-14',
  },
  {
    id: '3',
    text: 'Renewable energy now powers majority of global electricity',
    verdict: 'misleading',
    confidence: 0.78,
    status: 'verified',
    date: '2025-01-13',
  },
  {
    id: '4',
    text: 'Carbon dioxide levels reached record high in 2024',
    verdict: 'true',
    confidence: 0.94,
    status: 'verified',
    date: '2025-01-12',
  },
  {
    id: '5',
    text: 'Sea levels are rising due to melting ice caps',
    verdict: 'true',
    confidence: 0.91,
    status: 'pending',
    date: '2025-01-11',
  },
];

const initialReviewQueue: Claim[] = [
  {
    id: '6',
    text: 'Arctic ice has completely melted in summer 2024',
    verdict: 'unverified',
    confidence: 0.65,
    status: 'pending',
    date: '2025-01-16',
  },
  {
    id: '7',
    text: 'CO2 emissions decreased globally in 2024',
    verdict: 'unverified',
    confidence: 0.72,
    status: 'flagged',
    date: '2025-01-15',
  },
  {
    id: '8',
    text: 'Renewable energy is more expensive than fossil fuels',
    verdict: 'misleading',
    confidence: 0.68,
    status: 'pending',
    date: '2025-01-14',
  },
  {
    id: '9',
    text: 'Climate models have been proven inaccurate',
    verdict: 'unverified',
    confidence: 0.55,
    status: 'flagged',
    date: '2025-01-13',
  },
];

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
    <span className={`px-2 py-1 rounded-full text-xs font-bold border ${colors[verdict as keyof typeof colors]}`}>
      {labels[verdict as keyof typeof labels]}
    </span>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const colors = {
    verified: 'bg-blue-50 text-blue-700 border-blue-200',
    pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    flagged: 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium border ${colors[status as keyof typeof colors]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

export default function ProjectDetailsScreen({ onNavigate }: ProjectDetailsScreenProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'claims' | 'review' | 'exports'>('overview');
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [exporting, setExporting] = useState<'pdf' | 'csv' | 'json' | null>(null);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [reviewQueue, setReviewQueue] = useState<Claim[]>([]);
  const [approvedClaims, setApprovedClaims] = useState<Claim[]>([]);
  const [rejectedClaims, setRejectedClaims] = useState<Claim[]>([]);
  const [projectName, setProjectName] = useState('Loading...');
  const [loading, setLoading] = useState(true);
  const [projectId, setProjectId] = useState<string | null>(null);

  useEffect(() => {
    loadProjectData();
  }, []);

  const loadProjectData = async () => {
    try {
      setLoading(true);
      const storedProjectId = sessionStorage.getItem('selectedProjectId');
      
      if (!storedProjectId) {
        alert('No project selected');
        onNavigate('projects');
        return;
      }
      
      setProjectId(storedProjectId);
      const response = await api.getProject(storedProjectId);
      
      if (response.error) {
        alert(`Failed to load project: ${response.error}`);
        onNavigate('projects');
        return;
      }
      
      if (response.data) {
        const project = response.data;
        setProjectName(project.name);
        
        // Transform claims from backend format
        const allClaims: Claim[] = (project.claims || []).map((c: any) => ({
          id: String(c.id || c.text?.substring(0, 10) || Math.random()),
          text: c.text || '',
          verdict: c.verdict || 'unverified',
          confidence: c.confidence || 0.5,
          status: c.review_status === 'approved' ? 'verified' : c.review_status === 'rejected' ? 'flagged' : 'pending',
          date: c.added_at ? new Date(c.added_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          review_status: c.review_status || 'pending'
        }));
        
        // Separate claims by review status
        const pending = allClaims.filter(c => c.review_status === 'pending' || !c.review_status);
        const approved = allClaims.filter(c => c.review_status === 'approved');
        const rejected = allClaims.filter(c => c.review_status === 'rejected');
        
        // All verified claims (approved + pending with high confidence)
        const verified = allClaims.filter(c => 
          c.review_status === 'approved' || 
          (c.status === 'verified' && c.review_status !== 'rejected')
        );
        
        setClaims(verified);
        setReviewQueue(pending);
        setApprovedClaims(approved);
        setRejectedClaims(rejected);
      }
    } catch (error) {
      console.error('Load project error:', error);
      alert('Failed to load project data');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (claimId: string) => {
    if (!projectId) return;
    
    try {
      const response = await api.approveClaim(projectId, claimId);
      
      if (response.error) {
        alert(`Failed to approve claim: ${response.error}`);
        return;
      }
      
      // Reload project data
      await loadProjectData();
    } catch (error) {
      console.error('Approve error:', error);
      alert('Failed to approve claim');
    }
  };

  const handleReject = async (claimId: string) => {
    if (!projectId) return;
    
    try {
      const response = await api.rejectClaim(projectId, claimId);
      
      if (response.error) {
        alert(`Failed to reject claim: ${response.error}`);
        return;
      }
      
      // Reload project data
      await loadProjectData();
    } catch (error) {
      console.error('Reject error:', error);
      alert('Failed to reject claim');
    }
  };

  const handleExportPDF = () => {
    setExporting('pdf');
    const allClaims = getAllClaims(claims, reviewQueue);
    try {
      exportToPDF(allClaims, projectName);
      setTimeout(() => setExporting(null), 1000);
    } catch (error) {
      console.error('Export failed:', error);
      setExporting(null);
      alert('Failed to export PDF. Please try again.');
    }
  };

  const handleExportCSV = () => {
    setExporting('csv');
    const allClaims = getAllClaims(claims, reviewQueue);
    try {
      exportToCSV(allClaims, projectName);
      setTimeout(() => setExporting(null), 500);
    } catch (error) {
      console.error('Export failed:', error);
      setExporting(null);
      alert('Failed to export CSV. Please try again.');
    }
  };

  const handleExportJSON = () => {
    setExporting('json');
    const allClaims = getAllClaims(claims, reviewQueue);
    try {
      exportToJSON(allClaims, projectName);
      setTimeout(() => setExporting(null), 500);
    } catch (error) {
      console.error('Export failed:', error);
      setExporting(null);
      alert('Failed to export JSON. Please try again.');
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'claims', label: 'Claims' },
    { id: 'review', label: 'Review Queue' },
    { id: 'exports', label: 'Exports' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  const totalClaims = claims.length + reviewQueue.length;
  const lastUpdated = claims.length > 0 
    ? new Date(claims[0].date).toLocaleDateString()
    : 'Never';

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
      <main className="px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{projectName}</h1>
          <p className="text-gray-600">
            {totalClaims} claims verified • Last updated {lastUpdated} • Status: <span className="font-semibold text-green-700">Active</span>
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="border-b border-slate-200">
            <div className="flex gap-8 px-8 py-0">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 text-sm font-medium border-b-2 transition-all ${
                    activeTab === tab.id
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-8">
            {activeTab === 'claims' && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left px-4 py-3 font-bold text-sm text-gray-900">Claim</th>
                      <th className="text-left px-4 py-3 font-bold text-sm text-gray-900">Verdict</th>
                      <th className="text-left px-4 py-3 font-bold text-sm text-gray-900">Confidence</th>
                      <th className="text-left px-4 py-3 font-bold text-sm text-gray-900">Status</th>
                      <th className="text-left px-4 py-3 font-bold text-sm text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {claims.map((claim, idx) => (
                      <tr
                        key={claim.id}
                        className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                          idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                        }`}
                      >
                        <td className="px-4 py-4 text-sm text-gray-900 max-w-xs truncate">{claim.text}</td>
                        <td className="px-4 py-4">
                          <VerdictBadge verdict={claim.verdict} />
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-teal-500 to-blue-600 rounded-full"
                                style={{ width: `${claim.confidence * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-medium text-gray-700">
                              {(claim.confidence * 100).toFixed(0)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <StatusBadge status={claim.status} />
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setSelectedClaim(claim)}
                              className="p-1.5 text-teal-600 border border-teal-300 rounded-lg hover:bg-teal-50 transition-colors"
                            >
                              <Eye size={16} />
                            </button>
                            <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                              <MoreVertical size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-xl p-6 border border-green-200">
                  <p className="text-sm text-gray-600 mb-1">Total Verified</p>
                  <p className="text-3xl font-bold text-green-700">
                    {claims.filter((c) => c.status === 'verified').length}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-6 border border-red-200">
                  <p className="text-sm text-gray-600 mb-1">False Claims</p>
                  <p className="text-3xl font-bold text-red-700">
                    {claims.filter((c) => c.verdict === 'false').length}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200">
                  <p className="text-sm text-gray-600 mb-1">Misleading</p>
                  <p className="text-3xl font-bold text-yellow-700">
                    {claims.filter((c) => c.verdict === 'misleading').length}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                  <p className="text-sm text-gray-600 mb-1">Avg Confidence</p>
                  <p className="text-3xl font-bold text-blue-700">
                    {claims.length > 0
                      ? Math.round(
                          (claims.reduce((sum, c) => sum + c.confidence, 0) / claims.length) * 100
                        )
                      : 0}
                    %
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'review' && (
              <div className="space-y-6">
                {/* Pending Review Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Claims Pending Review ({reviewQueue.length})
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Review and verify claims that need attention
                      </p>
                    </div>
                  </div>

                  {reviewQueue.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <p className="text-gray-500 text-lg">No claims pending review</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {reviewQueue.map((claim) => (
                        <div
                          key={claim.id}
                          className="bg-slate-50 rounded-lg border border-slate-200 p-6 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between gap-4 mb-4">
                            <div className="flex-1">
                              <p className="text-base font-medium text-gray-900 mb-3">{claim.text}</p>
                              <div className="flex items-center gap-4 flex-wrap">
                                <VerdictBadge verdict={claim.verdict} />
                                <StatusBadge status={claim.status} />
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-500">Confidence:</span>
                                  <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full"
                                      style={{ width: `${claim.confidence * 100}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-xs font-medium text-gray-700">
                                    {(claim.confidence * 100).toFixed(0)}%
                                  </span>
                                </div>
                                <span className="text-xs text-gray-500">Date: {claim.date}</span>
                              </div>
                            </div>
                          </div>

                          <div className="pt-4 border-t border-slate-200 flex items-center gap-3">
                            <button
                              onClick={() => handleApprove(claim.id)}
                              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
                            >
                              <Check size={16} />
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(claim.id)}
                              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
                            >
                              <X size={16} />
                              Reject
                            </button>
                            <button
                              onClick={() => setSelectedClaim(claim)}
                              className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
                            >
                              <Eye size={16} />
                              View Details
                            </button>
                            <button className="flex items-center gap-2 px-4 py-2 text-orange-600 border border-orange-300 rounded-lg hover:bg-orange-50 transition-colors ml-auto">
                              <AlertCircle size={16} />
                              Flag Issue
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Approved Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Approved Claims ({approvedClaims.length})
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Claims that have been reviewed and approved
                      </p>
                    </div>
                  </div>

                  {approvedClaims.length === 0 ? (
                    <div className="text-center py-12 bg-green-50 rounded-lg">
                      <p className="text-gray-500 text-lg">No approved claims yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {approvedClaims.map((claim) => (
                        <div
                          key={claim.id}
                          className="bg-green-50 rounded-lg border border-green-200 p-6 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between gap-4 mb-4">
                            <div className="flex-1">
                              <p className="text-base font-medium text-gray-900 mb-3">{claim.text}</p>
                              <div className="flex items-center gap-4 flex-wrap">
                                <VerdictBadge verdict={claim.verdict} />
                                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded border border-green-300">
                                  APPROVED
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-500">Confidence:</span>
                                  <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full"
                                      style={{ width: `${claim.confidence * 100}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-xs font-medium text-gray-700">
                                    {(claim.confidence * 100).toFixed(0)}%
                                  </span>
                                </div>
                                <span className="text-xs text-gray-500">Date: {claim.date}</span>
                              </div>
                            </div>
                          </div>
                          <div className="pt-4 border-t border-green-200">
                            <button
                              onClick={() => setSelectedClaim(claim)}
                              className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
                            >
                              <Eye size={16} />
                              View Details
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Rejected Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Rejected Claims ({rejectedClaims.length})
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Claims that have been reviewed and rejected
                      </p>
                    </div>
                  </div>

                  {rejectedClaims.length === 0 ? (
                    <div className="text-center py-12 bg-red-50 rounded-lg">
                      <p className="text-gray-500 text-lg">No rejected claims</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {rejectedClaims.map((claim) => (
                        <div
                          key={claim.id}
                          className="bg-red-50 rounded-lg border border-red-200 p-6 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between gap-4 mb-4">
                            <div className="flex-1">
                              <p className="text-base font-medium text-gray-900 mb-3">{claim.text}</p>
                              <div className="flex items-center gap-4 flex-wrap">
                                <VerdictBadge verdict={claim.verdict} />
                                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded border border-red-300">
                                  REJECTED
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-500">Confidence:</span>
                                  <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-gradient-to-r from-red-400 to-red-600 rounded-full"
                                      style={{ width: `${claim.confidence * 100}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-xs font-medium text-gray-700">
                                    {(claim.confidence * 100).toFixed(0)}%
                                  </span>
                                </div>
                                <span className="text-xs text-gray-500">Date: {claim.date}</span>
                              </div>
                            </div>
                          </div>
                          <div className="pt-4 border-t border-red-200">
                            <button
                              onClick={() => setSelectedClaim(claim)}
                              className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
                            >
                              <Eye size={16} />
                              View Details
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'exports' && (
              <div className="space-y-4">
                <button
                  onClick={handleExportPDF}
                  disabled={exporting === 'pdf'}
                  className="w-full px-4 py-3 text-left border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-between group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="font-medium text-gray-900 group-hover:text-teal-600">
                    {exporting === 'pdf' ? 'Exporting PDF...' : 'Export as PDF'}
                  </span>
                  <span className="text-gray-400 group-hover:text-teal-600">→</span>
                </button>
                <button
                  onClick={handleExportCSV}
                  disabled={exporting === 'csv'}
                  className="w-full px-4 py-3 text-left border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-between group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="font-medium text-gray-900 group-hover:text-teal-600">
                    {exporting === 'csv' ? 'Exporting CSV...' : 'Export as CSV'}
                  </span>
                  <span className="text-gray-400 group-hover:text-teal-600">→</span>
                </button>
                <button
                  onClick={handleExportJSON}
                  disabled={exporting === 'json'}
                  className="w-full px-4 py-3 text-left border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-between group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="font-medium text-gray-900 group-hover:text-teal-600">
                    {exporting === 'json' ? 'Exporting JSON...' : 'Export as JSON'}
                  </span>
                  <span className="text-gray-400 group-hover:text-teal-600">→</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 flex gap-4">
          <button
            onClick={() => onNavigate('projects')}
            className="px-6 py-3 text-gray-700 font-medium border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Back to Projects
          </button>
          <button className="px-6 py-3 bg-gradient-to-r from-teal-600 to-blue-600 text-white font-medium rounded-lg hover:shadow-lg transition-all">
            Edit Project
          </button>
        </div>
      </main>

      {selectedClaim && (
        <ClaimDetailsModal
          claim={selectedClaim}
          onClose={() => setSelectedClaim(null)}
        />
      )}
    </div>
  );
}
