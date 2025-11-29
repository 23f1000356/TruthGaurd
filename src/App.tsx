import { useState } from 'react';
import HomeScreen from './pages/HomeScreen';
import ResultsScreen from './pages/ResultsScreen';
import HistoryScreen from './pages/HistoryScreen';
import ProjectsScreen from './pages/ProjectsScreen';
import ProjectDetailsScreen from './pages/ProjectDetailsScreen';
import KBManagerScreen from './pages/KBManagerScreen';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import ExtensionPopup from './pages/ExtensionPopup';
import ModelSettings from './pages/ModelSettings';
import { EvidenceModal } from './components/EvidenceModal';
import Navbar from './components/Navbar';

interface Evidence {
  title: string;
  url?: string;
  snippet?: string;
  text?: string;
  source: string;
  type?: 'web' | 'kb';
}

function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'results' | 'history' | 'projects' | 'project-details' | 'kb-manager' | 'analytics' | 'extensions' | 'settings'>('home');
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [evidenceData, setEvidenceData] = useState<Evidence[]>([]);
  const [claimText, setClaimText] = useState<string>('');
  const [claimId, setClaimId] = useState<number>(0);

  const handleNavigate = (page: 'home' | 'results' | 'history' | 'projects' | 'project-details' | 'kb-manager' | 'analytics' | 'extensions' | 'settings') => {
    setCurrentPage(page);
  };

  return (
    <div className="min-h-screen">
      <Navbar currentPage={currentPage} onNavigate={handleNavigate} />
      
      {currentPage === 'home' && (
        <HomeScreen onNavigate={handleNavigate} />
      )}
      {currentPage === 'results' && (
        <ResultsScreen
          onNavigate={handleNavigate}
          onViewEvidence={(evidence, text, id) => {
            setEvidenceData(evidence);
            setClaimText(text);
            setClaimId(id);
            setShowEvidenceModal(true);
          }}
        />
      )}
      {currentPage === 'history' && (
        <HistoryScreen onNavigate={handleNavigate} />
      )}
      {currentPage === 'projects' && (
        <ProjectsScreen onNavigate={handleNavigate} />
      )}
      {currentPage === 'project-details' && (
        <ProjectDetailsScreen onNavigate={handleNavigate} />
      )}
      {currentPage === 'kb-manager' && (
        <KBManagerScreen onNavigate={handleNavigate} />
      )}
      {currentPage === 'analytics' && (
        <AnalyticsDashboard />
      )}
      {currentPage === 'extensions' && (
        <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100">
          <main className="px-8 py-8">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Extensions</h1>
              <p className="text-gray-600">Browser extensions and integrations</p>
            </div>
            <div className="bg-white/70 backdrop-blur rounded-2xl shadow-lg p-8 border border-white/50">
              <ExtensionPopup />
            </div>
          </main>
        </div>
      )}
      {currentPage === 'settings' && (
        <ModelSettings />
      )}

      {showEvidenceModal && (
        <EvidenceModal
          onClose={() => {
            setShowEvidenceModal(false);
            setEvidenceData([]);
            setClaimText('');
            setClaimId(0);
          }}
          evidence={evidenceData}
          claimText={claimText}
          claimId={claimId}
        />
      )}
    </div>
  );
}

export default App;
