import { useState } from 'react';
import { Settings as SettingsIcon, FileText, Users, Cpu } from 'lucide-react';
import { ModelSettings as ModelSettingsType } from '../types';
import ReportBuilder from './ReportBuilder';
import TeamManagement from './TeamManagement';

export default function ModelSettings() {
  const [activeSection, setActiveSection] = useState<'model' | 'report-builder' | 'team-management'>('model');
  const [settings, setSettings] = useState<ModelSettingsType>({
    model: 'Local LLaMA 3',
    temperature: 0.7,
    maxTokens: 2048,
    agentsCount: 'auto',
    strictJsonMode: true,
  });

  const sections = [
    { id: 'model' as const, label: 'Model Settings', icon: Cpu },
    { id: 'report-builder' as const, label: 'Report Builder', icon: FileText },
    { id: 'team-management' as const, label: 'Team Management', icon: Users },
  ];

  const handleReset = () => {
    setSettings({
      model: 'Local LLaMA 3',
      temperature: 0.7,
      maxTokens: 2048,
      agentsCount: 'auto',
      strictJsonMode: true,
    });
  };

  const handleSave = () => {
    console.log('Saving settings:', settings);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
      <main className="px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center">
              <SettingsIcon size={20} className="text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">Settings</h1>
          </div>
          <p className="text-gray-600">Manage model configuration, reports, and team members</p>
        </div>

        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <nav className="space-y-2">
                {sections.map((section) => {
                  const Icon = section.icon;
                  const isActive = activeSection === section.id;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-r from-teal-500 to-blue-600 text-white shadow-md'
                          : 'text-gray-700 hover:bg-slate-100'
                      }`}
                    >
                      <Icon size={20} />
                      <span className="font-medium">{section.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {activeSection === 'model' && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
                <h2 className="text-2xl font-semibold text-[#1A1A1A] mb-8">Model Configuration</h2>

          <div className="space-y-8">
            <div>
              <label className="block text-sm font-medium text-[#2B2B2B] mb-3">
                Model
              </label>
              <select
                value={settings.model}
                onChange={(e) => setSettings({ ...settings, model: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#2E8372] transition-all"
              >
                <option>Local LLaMA 3</option>
                <option>Mixtral</option>
                <option>Phi-3 Mini</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-[#2B2B2B]">
                  Temperature
                </label>
                <span className="text-sm font-semibold text-[#2E8372] bg-[#2E8372]/10 px-3 py-1 rounded-full">
                  {settings.temperature.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={settings.temperature}
                onChange={(e) => setSettings({ ...settings, temperature: parseFloat(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#2E8372] [&::-webkit-slider-thumb]:cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#2B2B2B] mb-3">
                Max Tokens
              </label>
              <input
                type="number"
                value={settings.maxTokens}
                onChange={(e) => setSettings({ ...settings, maxTokens: parseInt(e.target.value) })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#2E8372] transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#2B2B2B] mb-3">
                Agents Count
              </label>
              <select
                value={settings.agentsCount}
                onChange={(e) => setSettings({ ...settings, agentsCount: e.target.value === 'auto' ? 'auto' : parseInt(e.target.value) })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#2E8372] transition-all"
              >
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="5">5</option>
                <option value="auto">Auto</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-4 bg-[#F5F2ED] rounded-xl">
              <div>
                <div className="text-sm font-medium text-[#1A1A1A] mb-1">
                  Strict JSON Mode
                </div>
                <div className="text-xs text-gray-600">
                  Enforce strict JSON output format for all responses
                </div>
              </div>
              <button
                onClick={() => setSettings({ ...settings, strictJsonMode: !settings.strictJsonMode })}
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  settings.strictJsonMode ? 'bg-[#2E8372]' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform ${
                    settings.strictJsonMode ? 'translate-x-7' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex space-x-4 pt-6">
              <button
                onClick={handleReset}
                className="flex-1 px-6 py-3 rounded-full border-2 border-[#2E8372] text-[#2E8372] font-medium hover:bg-[#2E8372]/5 transition-all"
              >
                Reset to Defaults
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-6 py-3 rounded-full bg-[#2E8372] text-white font-medium hover:bg-[#3C8E80] transition-all shadow-lg"
              >
                Save Settings
              </button>
            </div>
          </div>
              </div>
            )}
            {activeSection === 'report-builder' && <ReportBuilder />}
            {activeSection === 'team-management' && <TeamManagement />}
          </div>
        </div>
      </main>
    </div>
  );
}
