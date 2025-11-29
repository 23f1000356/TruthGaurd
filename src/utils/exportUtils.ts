import type { Claim } from '../pages/ProjectDetailsScreen';

// Helper to get all claims data (combines verified claims and review queue)
export const getAllClaims = (verifiedClaims: Claim[], reviewQueue: Claim[]): Claim[] => {
  return [...verifiedClaims, ...reviewQueue];
};

// Export as CSV
export const exportToCSV = (claims: Claim[], projectName: string) => {
  const headers = ['ID', 'Claim Text', 'Verdict', 'Confidence', 'Status', 'Date'];
  const rows = claims.map((claim) => [
    claim.id,
    claim.text,
    claim.verdict.toUpperCase(),
    `${(claim.confidence * 100).toFixed(0)}%`,
    claim.status.charAt(0).toUpperCase() + claim.status.slice(1),
    claim.date,
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${projectName}_claims_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Export as JSON
export const exportToJSON = (claims: Claim[], projectName: string) => {
  const data = {
    projectName,
    exportDate: new Date().toISOString(),
    totalClaims: claims.length,
    claims: claims.map((claim) => ({
      id: claim.id,
      text: claim.text,
      verdict: claim.verdict,
      confidence: claim.confidence,
      confidencePercentage: `${(claim.confidence * 100).toFixed(0)}%`,
      status: claim.status,
      date: claim.date,
    })),
  };

  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${projectName}_claims_${new Date().toISOString().split('T')[0]}.json`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Export as PDF
export const exportToPDF = (claims: Claim[], projectName: string) => {
  // Create HTML content for PDF
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>${projectName} - Claims Export</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            color: #333;
          }
          h1 {
            color: #1e40af;
            border-bottom: 2px solid #1e40af;
            padding-bottom: 10px;
          }
          .info {
            margin: 20px 0;
            color: #666;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
          }
          th {
            background-color: #f3f4f6;
            font-weight: bold;
            color: #1f2937;
          }
          tr:nth-child(even) {
            background-color: #f9fafb;
          }
          .verdict-true { color: #059669; font-weight: bold; }
          .verdict-false { color: #dc2626; font-weight: bold; }
          .verdict-misleading { color: #d97706; font-weight: bold; }
          .verdict-unverified { color: #6b7280; font-weight: bold; }
          .status-verified { color: #2563eb; }
          .status-pending { color: #d97706; }
          .status-flagged { color: #dc2626; }
        </style>
      </head>
      <body>
        <h1>${projectName}</h1>
        <div class="info">
          <p><strong>Export Date:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>Total Claims:</strong> ${claims.length}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Claim Text</th>
              <th>Verdict</th>
              <th>Confidence</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            ${claims
              .map(
                (claim) => `
              <tr>
                <td>${claim.id}</td>
                <td>${claim.text}</td>
                <td class="verdict-${claim.verdict}">${claim.verdict.toUpperCase()}</td>
                <td>${(claim.confidence * 100).toFixed(0)}%</td>
                <td class="status-${claim.status}">${claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}</td>
                <td>${claim.date}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      </body>
    </html>
  `;

  // Open in new window and print
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for content to load, then trigger print dialog
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        // Optionally close after print
        // printWindow.close();
      }, 250);
    };
  } else {
    // Fallback: create blob and download as HTML
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${projectName}_claims_${new Date().toISOString().split('T')[0]}.html`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

