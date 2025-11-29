import { useState } from 'react';
import { X, ZoomIn, ZoomOut } from 'lucide-react';
import { GraphNode, GraphEdge } from '../types';

const mockNodes: GraphNode[] = [
  { id: '1', type: 'claim', label: 'Climate change claim', reliability: 0.95 },
  { id: '2', type: 'evidence', label: 'NASA data', reliability: 0.98 },
  { id: '3', type: 'evidence', label: 'IPCC report', reliability: 0.96 },
  { id: '4', type: 'source', label: 'NASA.gov', reliability: 0.99 },
  { id: '5', type: 'source', label: 'IPCC.ch', reliability: 0.98 },
  { id: '6', type: 'claim', label: 'Temperature rise', reliability: 0.92 },
];

const mockEdges: GraphEdge[] = [
  { source: '1', target: '2' },
  { source: '1', target: '3' },
  { source: '2', target: '4' },
  { source: '3', target: '5' },
  { source: '6', target: '2' },
];

interface CitationGraphModalProps {
  onClose: () => void;
}

export default function CitationGraphModal({ onClose }: CitationGraphModalProps) {
  const [zoom, setZoom] = useState(1);
  const [showReliability, setShowReliability] = useState(true);

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'claim': return '#2E8372';
      case 'evidence': return '#FFFFFF';
      case 'source': return '#6366F1';
      default: return '#9CA3AF';
    }
  };

  const getNodeStyle = (node: GraphNode, index: number) => {
    const angle = (index / mockNodes.length) * 2 * Math.PI;
    const radius = 150;
    const x = 300 + radius * Math.cos(angle);
    const y = 300 + radius * Math.sin(angle);

    return {
      left: `${x}px`,
      top: `${y}px`,
      backgroundColor: getNodeColor(node.type),
      borderColor: node.type === 'evidence' ? '#2E8372' : 'transparent',
    };
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-6 z-50">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-[#1A1A1A]">Citation Graph Viewer</h3>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
              className="p-2 rounded-lg hover:bg-gray-100 transition-all"
            >
              <ZoomOut size={20} className="text-gray-600" />
            </button>
            <span className="text-sm text-gray-600 font-medium">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom(Math.min(2, zoom + 0.1))}
              className="p-2 rounded-lg hover:bg-gray-100 transition-all"
            >
              <ZoomIn size={20} className="text-gray-600" />
            </button>
            <button
              onClick={() => setShowReliability(!showReliability)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                showReliability
                  ? 'bg-[#2E8372] text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              Show Reliability
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-all"
            >
              <X size={20} className="text-gray-600" />
            </button>
          </div>
        </div>

        <div className="p-8 overflow-auto" style={{ height: '600px' }}>
          <div
            className="relative bg-[#F5F2ED] rounded-2xl"
            style={{
              width: '600px',
              height: '600px',
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
              margin: '0 auto',
            }}
          >
            <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
              {mockEdges.map((edge, index) => {
                const sourceNode = mockNodes.find(n => n.id === edge.source);
                const targetNode = mockNodes.find(n => n.id === edge.target);
                const sourceIndex = mockNodes.indexOf(sourceNode!);
                const targetIndex = mockNodes.indexOf(targetNode!);

                const angle1 = (sourceIndex / mockNodes.length) * 2 * Math.PI;
                const angle2 = (targetIndex / mockNodes.length) * 2 * Math.PI;
                const radius = 150;

                const x1 = 300 + radius * Math.cos(angle1);
                const y1 = 300 + radius * Math.sin(angle1);
                const x2 = 300 + radius * Math.cos(angle2);
                const y2 = 300 + radius * Math.sin(angle2);

                return (
                  <line
                    key={index}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#2E8372"
                    strokeWidth="2"
                    opacity="0.3"
                  />
                );
              })}
            </svg>

            {mockNodes.map((node, index) => (
              <div
                key={node.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                style={{ ...getNodeStyle(node, index), zIndex: 10 }}
              >
                <div
                  className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all group-hover:scale-110 ${
                    node.type === 'evidence' ? 'border-2' : ''
                  }`}
                  style={{
                    backgroundColor: getNodeColor(node.type),
                    borderColor: node.type === 'evidence' ? '#2E8372' : 'transparent',
                  }}
                >
                  <span className={`text-xs font-medium text-center px-2 ${
                    node.type === 'claim' || node.type === 'source' ? 'text-white' : 'text-[#2E8372]'
                  }`}>
                    {node.type === 'claim' ? 'C' : node.type === 'evidence' ? 'E' : 'S'}
                  </span>
                </div>
                <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg p-3 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  <p className="text-xs font-medium text-[#1A1A1A] mb-1">{node.label}</p>
                  {showReliability && node.reliability && (
                    <p className="text-xs text-gray-600">
                      Reliability: {(node.reliability * 100).toFixed(0)}%
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-[#2E8372]"></div>
              <span className="text-sm text-gray-600">Claims</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-white border-2 border-[#2E8372]"></div>
              <span className="text-sm text-gray-600">Evidence</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-[#6366F1]"></div>
              <span className="text-sm text-gray-600">Sources</span>
            </div>
          </div>
        </div>

        {showReliability && (
          <div className="p-6 bg-[#F5F2ED] border-t border-gray-200">
            <h4 className="text-sm font-semibold text-[#1A1A1A] mb-3">Network Metrics</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-4">
                <p className="text-xs text-gray-600 mb-1">Avg Reliability</p>
                <p className="text-2xl font-bold text-[#2E8372]">95%</p>
              </div>
              <div className="bg-white rounded-xl p-4">
                <p className="text-xs text-gray-600 mb-1">Evidence Links</p>
                <p className="text-2xl font-bold text-[#2E8372]">12</p>
              </div>
              <div className="bg-white rounded-xl p-4">
                <p className="text-xs text-gray-600 mb-1">Trust Score</p>
                <p className="text-2xl font-bold text-[#2E8372]">9.2</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
