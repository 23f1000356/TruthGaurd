import { Settings, BarChart3, Users, Chrome, FileText } from 'lucide-react';

interface NavigationProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

export default function Navigation({ currentView, onViewChange }: NavigationProps) {
  const navItems = [
    { id: 'settings', label: 'Model Settings', icon: Settings },
    { id: 'report', label: 'Report Builder', icon: FileText },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'extension', label: 'Extension', icon: Chrome },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2E8372] to-[#3C8E80] flex items-center justify-center">
            <span className="text-white font-bold text-lg">M</span>
          </div>
          <h1 className="text-xl font-semibold text-[#1A1A1A]">TruthGuard</h1>
        </div>

        <div className="flex items-center space-x-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all ${
                  currentView === item.id
                    ? 'bg-[#2E8372] text-white'
                    : 'text-[#2B2B2B] hover:bg-gray-100'
                }`}
              >
                <Icon size={18} />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-full bg-[#2E8372] flex items-center justify-center text-white text-sm font-medium">
            A
          </div>
        </div>
      </div>
    </nav>
  );
}
