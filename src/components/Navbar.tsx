import { ChevronDown, Home, History, FolderKanban, Database, BarChart3, Puzzle, Settings } from 'lucide-react';

interface NavbarProps {
  currentPage: 'home' | 'results' | 'history' | 'projects' | 'project-details' | 'kb-manager' | 'analytics' | 'extensions' | 'settings';
  onNavigate: (page: 'home' | 'results' | 'history' | 'projects' | 'project-details' | 'kb-manager' | 'analytics' | 'extensions' | 'settings') => void;
}

export default function Navbar({ currentPage, onNavigate }: NavbarProps) {
  const navItems = [
    { id: 'home' as const, label: 'Home', icon: Home },
    { id: 'history' as const, label: 'History', icon: History },
    { id: 'projects' as const, label: 'Projects', icon: FolderKanban },
    { id: 'kb-manager' as const, label: 'KB Manager', icon: Database },
    { id: 'analytics' as const, label: 'Analytics', icon: BarChart3 },
    { id: 'extensions' as const, label: 'Extensions', icon: Puzzle },
    { id: 'settings' as const, label: 'Settings', icon: Settings },
  ];

  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="flex items-center justify-between px-8 py-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">MA</span>
            </div>
            <span className="text-xl font-bold text-gray-900">TruthGuard</span>
          </div>
          
          <nav className="flex items-center gap-1 ml-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-teal-500 to-blue-600 text-white shadow-md'
                      : 'text-gray-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 bg-white rounded-lg border border-slate-200 hover:bg-slate-50">
            <span>Model: Local LLaMA 3</span>
            <ChevronDown size={16} />
          </button>
          <button className="p-2 hover:bg-slate-100 rounded-lg">
            <svg size={20} className="text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-purple-500"></div>
        </div>
      </div>
    </header>
  );
}

