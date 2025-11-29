import { useState, useRef } from 'react';
import { Upload, Download, Network } from 'lucide-react';
import type { Claim } from './ProjectDetailsScreen';
import CitationGraphModal from './CitationGraphModal';

const mockClaims: Claim[] = [
  { id: '1', text: 'Climate change is primarily caused by human activities', verdict: 'true', confidence: 0.95, status: 'verified', date: '2025-01-15' },
  { id: '2', text: 'Vaccines cause autism in children', verdict: 'false', confidence: 0.98, status: 'verified', date: '2025-01-14' },
  { id: '3', text: 'The COVID-19 pandemic originated in a laboratory', verdict: 'unverified', confidence: 0.45, status: 'pending', date: '2025-01-13' },
  { id: '4', text: '5G technology is linked to health problems', verdict: 'misleading', confidence: 0.82, status: 'verified', date: '2025-01-12' },
  { id: '5', text: 'Drinking water reduces headache symptoms', verdict: 'true', confidence: 0.88, status: 'verified', date: '2025-01-11' },
];

export default function ReportBuilder() {
  const [selectedClaims, setSelectedClaims] = useState<string[]>([]);
  const [format, setFormat] = useState<'pdf' | 'html' | 'markdown'>('pdf');
  const [footerText, setFooterText] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showGraphModal, setShowGraphModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const toggleClaim = (id: string) => {
    setSelectedClaims(prev =>
      prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
    );
  };

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'true': return 'bg-[#DCFCE7] text-green-800';
      case 'false': return 'bg-[#FEE2E2] text-red-800';
      case 'misleading': return 'bg-[#FEF9C3] text-yellow-800';
      case 'unverified': return 'bg-[#F3F4F6] text-gray-800';
      default: return 'bg-gray-200 text-gray-800';
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      alert('Please upload an image file');
    }
    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
  };

  const handleLogoClick = () => {
    logoInputRef.current?.click();
  };

  const handleGenerate = () => {
    if (selectedClaims.length === 0) {
      alert('Please select at least one claim to generate a report');
      return;
    }

    setGenerating(true);
    
    // Simulate report generation
    setTimeout(() => {
      setGenerating(false);
      setShowReportModal(true);
    }, 1500);
  };

  const handleDownload = () => {
    const selectedClaimsData = mockClaims.filter(c => selectedClaims.includes(c.id));
    const reportData = {
      claims: selectedClaimsData,
      format,
      footerText,
      logo: logoPreview,
      generatedAt: new Date().toISOString(),
    };

    let content = '';
    let filename = '';
    let mimeType = '';

    if (format === 'pdf') {
      // Generate HTML that can be printed as PDF
      content = generateHTMLReport(reportData);
      filename = `report_${new Date().toISOString().split('T')[0]}.html`;
      mimeType = 'text/html';
    } else if (format === 'html') {
      content = generateHTMLReport(reportData);
      filename = `report_${new Date().toISOString().split('T')[0]}.html`;
      mimeType = 'text/html';
    } else if (format === 'markdown') {
      content = generateMarkdownReport(reportData);
      filename = `report_${new Date().toISOString().split('T')[0]}.md`;
      mimeType = 'text/markdown';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    setShowReportModal(false);
  };

  const generateHTMLReport = (data: { claims: Claim[]; footerText: string; logo: string | null }) => {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Fact-Check Report</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
    ${data.logo ? 'header { text-align: center; margin-bottom: 40px; }' : ''}
    h1 { color: #1A1A1A; border-bottom: 2px solid #2E8372; padding-bottom: 10px; }
    .claim { margin: 20px 0; padding: 15px; border-left: 4px solid #2E8372; background: #F5F2ED; }
    .verdict { display: inline-block; padding: 4px 12px; border-radius: 12px; font-weight: bold; font-size: 12px; margin-top: 8px; }
    .true { background: #DCFCE7; color: #166534; }
    .false { background: #FEE2E2; color: #991B1B; }
    .misleading { background: #FEF9C3; color: #854D0E; }
    .unverified { background: #F3F4F6; color: #374151; }
    footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #E5E7EB; text-align: center; color: #6B7280; font-size: 12px; }
  </style>
</head>
<body>
  ${data.logo ? `<header><img src="${data.logo}" alt="Logo" style="max-height: 80px;" /></header>` : ''}
  <h1>Fact-Check Report</h1>
  <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
  <p><strong>Total Claims:</strong> ${data.claims.length}</p>
  
  ${data.claims.map((claim) => `
    <div class="claim">
      <p><strong>Claim:</strong> ${claim.text}</p>
      <span class="verdict ${claim.verdict}">${claim.verdict.toUpperCase()}</span>
      <p style="margin-top: 8px; font-size: 12px; color: #6B7280;">Confidence: ${(claim.confidence * 100).toFixed(0)}%</p>
    </div>
  `).join('')}
  
  ${data.footerText ? `<footer>${data.footerText}</footer>` : '<footer>Generated by TruthGuard</footer>'}
</body>
</html>`;
  };

  const generateMarkdownReport = (data: { claims: Claim[]; footerText: string }) => {
    return `# Fact-Check Report

**Generated:** ${new Date().toLocaleString()}
**Total Claims:** ${data.claims.length}

---

${data.claims.map((claim) => `
## Claim ${claim.id}

**Text:** ${claim.text}

**Verdict:** \`${claim.verdict.toUpperCase()}\`

**Confidence:** ${(claim.confidence * 100).toFixed(0)}%

---
`).join('')}

${data.footerText ? data.footerText : '*Generated by TruthGuard*'}
`;
  };

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
        <div className="w-full">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-semibold text-[#1A1A1A]">Report Builder</h2>
            <button
              onClick={() => setShowGraphModal(true)}
              className="flex items-center space-x-2 px-4 py-2 rounded-full border-2 border-[#2E8372] text-[#2E8372] hover:bg-[#2E8372]/5 transition-all"
            >
              <Network size={18} />
              <span className="text-sm font-medium">View Citation Graph</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.08)] p-8">
              <h3 className="text-lg font-semibold text-[#1A1A1A] mb-6">Select Claims</h3>
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {mockClaims.map((claim) => (
                  <div
                    key={claim.id}
                    className="flex items-start space-x-4 p-4 rounded-xl bg-[#F5F2ED] hover:bg-gray-100 transition-all cursor-pointer"
                    onClick={() => toggleClaim(claim.id)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedClaims.includes(claim.id)}
                      onChange={() => toggleClaim(claim.id)}
                      className="mt-1 w-5 h-5 rounded border-gray-300 text-[#2E8372] focus:ring-[#2E8372]"
                    />
                    <div className="flex-1">
                      <p className="text-sm text-[#1A1A1A] mb-2">{claim.text}</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getVerdictColor(claim.verdict)}`}>
                        {claim.verdict.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.08)] p-8">
              <h3 className="text-lg font-semibold text-[#1A1A1A] mb-6">Report Options</h3>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-[#2B2B2B] mb-3">
                    Format
                  </label>
                  <div className="flex space-x-3">
                    {(['pdf', 'html', 'markdown'] as const).map((fmt) => (
                      <button
                        key={fmt}
                        onClick={() => setFormat(fmt)}
                        className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
                          format === fmt
                            ? 'bg-[#2E8372] text-white'
                            : 'bg-[#F5F2ED] text-[#2B2B2B] hover:bg-gray-200'
                        }`}
                      >
                        {fmt.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#2B2B2B] mb-3">
                    Branding Logo
                  </label>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <div
                    onClick={handleLogoClick}
                    className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-[#2E8372] transition-all cursor-pointer"
                  >
                    {logoPreview ? (
                      <div>
                        <img src={logoPreview} alt="Logo preview" className="mx-auto mb-3 max-h-20" />
                        <p className="text-sm text-gray-600 mb-2">Click to change logo</p>
                      </div>
                    ) : (
                      <>
                        <Upload className="mx-auto mb-3 text-gray-400" size={32} />
                        <p className="text-sm text-gray-600 mb-2">Drag & drop your logo here</p>
                        <button
                          type="button"
                          className="px-4 py-2 rounded-full border-2 border-[#2E8372] text-[#2E8372] text-sm font-medium hover:bg-[#2E8372]/5 transition-all"
                        >
                          Upload Logo
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#2B2B2B] mb-3">
                    Footer Text
                  </label>
                  <textarea
                    value={footerText}
                    onChange={(e) => setFooterText(e.target.value)}
                    placeholder="Enter custom footer text for your report..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#2E8372] transition-all resize-none"
                  />
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={selectedClaims.length === 0 || generating}
                  className="w-full px-6 py-4 rounded-full bg-[#2E8372] text-white font-semibold hover:bg-[#3C8E80] transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generating ? 'Generating...' : `Generate Report (${selectedClaims.length} claims)`}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-semibold text-[#1A1A1A] mb-4">Report Ready</h3>
            <p className="text-gray-600 mb-6">
              Your report with {selectedClaims.length} claims has been generated successfully.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowReportModal(false)}
                className="flex-1 px-6 py-3 rounded-full border-2 border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-all"
              >
                Close
              </button>
              <button
                onClick={handleDownload}
                className="flex-1 px-6 py-3 rounded-full bg-[#2E8372] text-white font-medium hover:bg-[#3C8E80] transition-all shadow-lg flex items-center justify-center space-x-2"
              >
                <Download size={18} />
                <span>Download</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {showGraphModal && (
        <CitationGraphModal onClose={() => setShowGraphModal(false)} />
      )}
    </>
  );
}
