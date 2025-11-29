import { Upload, Link2, Eye, Trash2, FileText, Loader2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { WebSourceModal } from '../components/WebSourceModal';
import { DocumentAnalysisModal } from '../components/DocumentAnalysisModal';
import api from '../utils/api';

interface KBManagerScreenProps {
  onNavigate: (page: 'home' | 'results' | 'history' | 'projects' | 'project-details' | 'kb-manager') => void;
}

export interface Document {
  id: string;
  name: string;
  tags: string[];
  status: 'indexed' | 'processing' | 'failed';
  uploadedAt: string;
  type: 'pdf' | 'web';
  url?: string;
}

export default function KBManagerScreen(_props: KBManagerScreenProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [showWebSourceModal, setShowWebSourceModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [analyzingDocId, setAnalyzingDocId] = useState<string | null>(null);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const pdfFiles = files.filter(file => file.type === 'application/pdf' || file.name.endsWith('.pdf'));
    
    if (pdfFiles.length > 0) {
      handleFiles(pdfFiles);
    } else {
      alert('Please drop PDF files only');
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const pdfFiles = Array.from(files).filter(file => 
        file.type === 'application/pdf' || file.name.endsWith('.pdf')
      );
      
      if (pdfFiles.length > 0) {
        handleFiles(pdfFiles);
      } else {
        alert('Please select PDF files only');
      }
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFiles = async (files: File[]) => {
    setUploading(true);
    
    try {
      const uploadPromises = files.map(file => {
        const fileName = file.name.replace(/\.pdf$/i, ''); // Remove .pdf extension (case-insensitive)
        return api.uploadPDF(file, fileName);
      });

      const results = await Promise.all(uploadPromises);
      const successful = results.filter(r => r.data && !r.error);
      const failed = results.filter(r => r.error);
      
      if (successful.length > 0) {
        // Reload documents list
        loadDocuments();
        if (failed.length > 0) {
          alert(`Successfully uploaded ${successful.length} file(s). ${failed.length} file(s) failed: ${failed.map(f => f.error).join(', ')}`);
        } else {
          alert(`Successfully uploaded ${successful.length} PDF file(s)`);
        }
      } else {
        const errorMessages = failed.map(f => f.error).join('\n');
        alert(`Failed to upload files:\n${errorMessages}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert(`Failed to upload files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleWebSource = () => {
    setShowWebSourceModal(true);
  };

  const handleAddWebSource = async (url: string) => {
    setUploading(true);
    
    try {
      const response = await api.addWebSource(url);
      
      if (response.error) {
        alert(`Failed to add web source: ${response.error}`);
      } else {
        // Reload documents list
        loadDocuments();
        alert('Web source added successfully');
      }
    } catch (error) {
      console.error('Add web source error:', error);
      alert('Failed to add web source. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (confirm('Are you sure you want to delete this document?')) {
      try {
        const response = await api.deleteDocument(id);
        
        if (response.error) {
          alert(`Failed to delete document: ${response.error}`);
        } else {
          // Reload documents list
          loadDocuments();
          alert('Document deleted successfully');
        }
      } catch (error) {
        console.error('Delete error:', error);
        alert('Failed to delete document. Please try again.');
      }
    }
  };

  const handleViewAnalysis = async (docId: string) => {
    setAnalyzingDocId(docId);
    try {
      const response = await api.analyzeDocument(docId);
      
      if (response.error) {
        alert(`Failed to analyze document: ${response.error}`);
      } else if (response.data) {
        setAnalysisData(response.data);
        setShowAnalysisModal(true);
      }
    } catch (error) {
      console.error('Analysis error:', error);
      alert('Failed to analyze document. Please try again.');
    } finally {
      setAnalyzingDocId(null);
    }
  };

  const loadDocuments = async () => {
    try {
      const response = await api.listDocuments();
      
      if (response.data && !response.error) {
        const docs: Document[] = response.data.map(doc => ({
          id: doc.id,
          name: doc.title,
          tags: doc.tags,
          status: 'indexed' as const,
          uploadedAt: doc.added_at.split('T')[0],
          type: doc.source === 'web' ? 'web' as const : 'pdf' as const,
          url: doc.source === 'web' ? undefined : undefined,
        }));
        
        setDocuments(docs);
      }
    } catch (error) {
      console.error('Load documents error:', error);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
      <main className="px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Knowledge Base Manager</h1>
          <p className="text-gray-600">Manage and organize your knowledge bases for fact-checking</p>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          multiple
          onChange={handleFileInput}
          className="hidden"
        />

        {/* Document Upload Section */}
        <div className="mb-8">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors bg-white/70 backdrop-blur ${
              isDragging
                ? 'border-teal-500 bg-teal-50'
                : 'border-slate-300 bg-white/70'
            } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <FileText size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">
              {uploading ? 'Processing...' : 'Drag & Drop documents here'}
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Upload PDF or add web source
            </p>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={handleFileUpload}
                disabled={uploading}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-blue-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg hover:from-teal-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload size={20} />
                {uploading ? 'Uploading...' : 'Upload PDF'}
              </button>
              <button
                onClick={handleWebSource}
                disabled={uploading}
                className="flex items-center gap-2 px-6 py-3 text-gray-700 font-medium rounded-lg hover:bg-slate-100 transition-all duration-200 border border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Link2 size={20} />
                Add Web Source
              </button>
            </div>
          </div>
        </div>

        {/* Documents Section */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Documents ({documents.length})</h2>
          <div className="space-y-3">
            {documents.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                <FileText size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 text-lg">No documents yet</p>
                <p className="text-gray-400 text-sm mt-2">Upload a PDF or add a web source to get started</p>
              </div>
            ) : (
              documents.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white rounded-xl border border-slate-200 shadow-md p-6 hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-base font-medium text-gray-900">
                          {doc.name}
                        </h3>
                        {doc.type === 'web' && (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                            Web
                          </span>
                        )}
                      </div>
                      {doc.url && (
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline mb-2 block"
                        >
                          {doc.url}
                        </a>
                      )}
                      <div className="flex items-center gap-2 flex-wrap mb-3">
                        {doc.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          doc.status === 'indexed'
                            ? 'bg-green-100 text-green-700'
                            : doc.status === 'processing'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {doc.status === 'indexed' ? 'Indexed' : doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleViewAnalysis(doc.id)}
                        disabled={analyzingDocId === doc.id}
                        className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {analyzingDocId === doc.id ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Eye size={16} />
                            View Analysis
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="p-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {showWebSourceModal && (
        <WebSourceModal
          onClose={() => setShowWebSourceModal(false)}
          onAdd={handleAddWebSource}
        />
      )}

      {showAnalysisModal && analysisData && (
        <DocumentAnalysisModal
          onClose={() => {
            setShowAnalysisModal(false);
            setAnalysisData(null);
          }}
          analysis={analysisData}
        />
      )}
    </div>
  );
}
