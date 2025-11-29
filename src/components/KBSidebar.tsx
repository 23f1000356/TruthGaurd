import { AlertCircle, Database, Search } from 'lucide-react';

interface KBSidebarProps {
  activeItem: 'review-queue' | 'knowledge-base' | 'source-analyzer';
  onNavigate: (item: 'review-queue' | 'knowledge-base' | 'source-analyzer') => void;
}

export default function KBSidebar({ activeItem, onNavigate }: KBSidebarProps) {
  const menuItems = [
    { id: 'review-queue' as const, label: 'Review Queue', icon: AlertCircle },
    { id: 'knowledge-base' as const, label: 'Knowledge Base', icon: Database },
    { id: 'source-analyzer' as const, label: 'Source Analyzer', icon: Search },
  ];

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 min-h-screen">
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-green-100 text-green-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

