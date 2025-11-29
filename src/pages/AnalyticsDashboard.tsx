import { TrendingUp, TrendingDown, CheckCircle, AlertCircle, Users, Target, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../utils/api';

export default function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([
    { label: 'Claims Processed', value: '0', change: '0%', trend: 'up' as 'up' | 'down', color: 'bg-[#FEF9C3]' },
    { label: 'Accuracy Rate', value: '0%', change: '0%', trend: 'up' as 'up' | 'down', color: 'bg-[#E9D5FF]' },
    { label: 'Manual Corrections', value: '0', change: '0%', trend: 'down' as 'up' | 'down', color: 'bg-[#FED7AA]' },
    { label: 'Active Users', value: '1', change: '0%', trend: 'up' as 'up' | 'down', color: 'bg-[#BFDBFE]' },
  ]);
  const [verdictData, setVerdictData] = useState([
    { verdict: 'True', count: 0, color: '#DCFCE7', percentage: 0 },
    { verdict: 'False', count: 0, color: '#FEE2E2', percentage: 0 },
    { verdict: 'Misleading', count: 0, color: '#FEF9C3', percentage: 0 },
    { verdict: 'Unverified', count: 0, color: '#F3F4F6', percentage: 0 },
  ]);
  const [trendingTopics, setTrendingTopics] = useState<Array<{ topic: string; searches: number; trend: 'up' | 'down' }>>([]);
  const [topSources, setTopSources] = useState<Array<{ domain: string; count: number }>>([]);
  const [accuracyOverTime, setAccuracyOverTime] = useState<Array<{ week: string; accuracy: number }>>([]);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await api.getAnalytics();
      
      if (response.error) {
        console.error('Analytics error:', response.error);
        setLoading(false);
        return;
      }
      
      if (response.data) {
        const data = response.data;
        
        // Update stats
        setStats([
          {
            label: 'Claims Processed',
            value: data.stats.claims_processed.toLocaleString(),
            change: `${data.stats.claims_change >= 0 ? '+' : ''}${data.stats.claims_change.toFixed(1)}%`,
            trend: data.stats.claims_change >= 0 ? 'up' : 'down',
            color: 'bg-[#FEF9C3]'
          },
          {
            label: 'Accuracy Rate',
            value: `${data.stats.accuracy_rate.toFixed(1)}%`,
            change: `${data.stats.accuracy_change >= 0 ? '+' : ''}${data.stats.accuracy_change.toFixed(1)}%`,
            trend: data.stats.accuracy_change >= 0 ? 'up' : 'down',
            color: 'bg-[#E9D5FF]'
          },
          {
            label: 'Manual Corrections',
            value: data.stats.manual_corrections.toLocaleString(),
            change: `${data.stats.corrections_change >= 0 ? '+' : ''}${data.stats.corrections_change.toFixed(1)}%`,
            trend: data.stats.corrections_change >= 0 ? 'up' : 'down',
            color: 'bg-[#FED7AA]'
          },
          {
            label: 'Active Users',
            value: data.stats.active_users.toLocaleString(),
            change: `${data.stats.users_change >= 0 ? '+' : ''}${data.stats.users_change.toFixed(1)}%`,
            trend: data.stats.users_change >= 0 ? 'up' : 'down',
            color: 'bg-[#BFDBFE]'
          },
        ]);
        
        // Update verdict distribution
        const verdictColors: Record<string, string> = {
          'True': '#DCFCE7',
          'False': '#FEE2E2',
          'Misleading': '#FEF9C3',
          'Unverified': '#F3F4F6'
        };
        
        const verdictMap = new Map(data.verdict_distribution.map(v => [v.verdict, v]));
        setVerdictData([
          { verdict: 'True', count: verdictMap.get('True')?.count || 0, color: verdictColors['True'], percentage: verdictMap.get('True')?.percentage || 0 },
          { verdict: 'False', count: verdictMap.get('False')?.count || 0, color: verdictColors['False'], percentage: verdictMap.get('False')?.percentage || 0 },
          { verdict: 'Misleading', count: verdictMap.get('Misleading')?.count || 0, color: verdictColors['Misleading'], percentage: verdictMap.get('Misleading')?.percentage || 0 },
          { verdict: 'Unverified', count: verdictMap.get('Unverified')?.count || 0, color: verdictColors['Unverified'], percentage: verdictMap.get('Unverified')?.percentage || 0 },
        ]);
        
        // Update trending topics
        setTrendingTopics(data.trending_topics.map(t => ({
          topic: t.topic,
          searches: t.searches,
          trend: t.trend as 'up' | 'down'
        })));
        
        // Update top sources
        setTopSources(data.top_sources);
        
        // Update accuracy over time
        setAccuracyOverTime(data.accuracy_over_time);
      }
    } catch (error) {
      console.error('Load analytics error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F2ED] py-12 px-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-[#2E8372] mx-auto mb-4" />
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  // Calculate accuracy over time for graph
  const maxAccuracy = Math.max(...accuracyOverTime.map(a => a.accuracy), 100);
  const graphPoints = accuracyOverTime.map((point, index) => {
    const x = (index * 60) + 60;
    const y = 200 - (point.accuracy / maxAccuracy * 100);
    return { x, y, accuracy: point.accuracy };
  });

  return (
    <div className="min-h-screen bg-[#F5F2ED] py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-semibold text-[#1A1A1A] mb-2">Analytics Dashboard</h2>
            <p className="text-gray-600">Organization-Level Usage Insights</p>
          </div>
          <button
            onClick={loadAnalytics}
            className="px-4 py-2 bg-[#2E8372] text-white rounded-lg hover:bg-[#256d5f] transition-colors text-sm"
          >
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className={`${stat.color} rounded-3xl p-6 shadow-[0_4px_16px_rgba(0,0,0,0.06)]`}>
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-full bg-white/50 flex items-center justify-center">
                  {index === 0 && <CheckCircle size={24} className="text-[#2E8372]" />}
                  {index === 1 && <Target size={24} className="text-[#2E8372]" />}
                  {index === 2 && <AlertCircle size={24} className="text-[#2E8372]" />}
                  {index === 3 && <Users size={24} className="text-[#2E8372]" />}
                </div>
                <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                  stat.trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {stat.trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  <span>{stat.change}</span>
                </div>
              </div>
              <p className="text-sm text-gray-700 mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-[#1A1A1A]">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-3xl shadow-[0_4px_16px_rgba(0,0,0,0.06)] p-8">
            <h3 className="text-lg font-semibold text-[#1A1A1A] mb-6">Verdict Distribution</h3>
            <div className="space-y-4">
              {verdictData.map((item, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-[#2B2B2B]">{item.verdict}</span>
                    <span className="text-sm text-gray-600">{item.count.toLocaleString()} ({item.percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="h-3 rounded-full transition-all"
                      style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200 flex justify-center">
              <div className="relative w-48 h-48">
                <svg className="w-full h-full transform -rotate-90">
                  {verdictData.map((item, index) => {
                    const total = verdictData.reduce((sum, v) => sum + v.count, 0);
                    const percentage = (item.count / total) * 100;
                    const circumference = 2 * Math.PI * 70;
                    const offset = verdictData.slice(0, index).reduce((sum, v) => sum + (v.count / total) * 100, 0);
                    const strokeDashoffset = circumference - (circumference * offset) / 100;

                    return (
                      <circle
                        key={index}
                        cx="96"
                        cy="96"
                        r="70"
                        fill="none"
                        stroke={item.color}
                        strokeWidth="24"
                        strokeDasharray={`${(circumference * percentage) / 100} ${circumference}`}
                        strokeDashoffset={-strokeDashoffset}
                      />
                    );
                  })}
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-[0_4px_16px_rgba(0,0,0,0.06)] p-8">
            <h3 className="text-lg font-semibold text-[#1A1A1A] mb-6">Accuracy Over Time</h3>
            <div className="relative h-64">
              {accuracyOverTime.length > 0 ? (
                <svg className="w-full h-full" viewBox="0 0 400 256" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#2E8372" />
                      <stop offset="100%" stopColor="#F5F2ED" />
                    </linearGradient>
                  </defs>
                  <polyline
                    points={graphPoints.map(p => `${p.x},${p.y}`).join(' ')}
                    fill="none"
                    stroke="#2E8372"
                    strokeWidth="3"
                    className="drop-shadow-lg"
                  />
                  <polyline
                    points={`${graphPoints.map(p => `${p.x},${p.y}`).join(' ')} ${graphPoints[graphPoints.length - 1].x},256 60,256`}
                    fill="url(#gradient)"
                    opacity="0.2"
                  />
                  {graphPoints.map((point, i) => (
                    <circle
                      key={i}
                      cx={point.x}
                      cy={point.y}
                      r="4"
                      fill="#2E8372"
                      className="hover:r-6 transition-all cursor-pointer"
                    />
                  ))}
                </svg>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <p>No data available</p>
                </div>
              )}
              <div className="flex justify-between mt-4 text-xs text-gray-600">
                {accuracyOverTime.map((point, i) => (
                  <span key={i}>{point.week}</span>
                ))}
              </div>
            </div>
            <div className="mt-6 flex items-center justify-center space-x-2 text-sm">
              <span className="text-gray-600">Current Accuracy:</span>
              <span className="text-2xl font-bold text-[#2E8372]">
                {accuracyOverTime.length > 0 
                  ? `${accuracyOverTime[accuracyOverTime.length - 1].accuracy.toFixed(1)}%`
                  : '0%'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-3xl shadow-[0_4px_16px_rgba(0,0,0,0.06)] p-8">
            <h3 className="text-lg font-semibold text-[#1A1A1A] mb-6">Trending Topics</h3>
            <div className="space-y-4">
              {trendingTopics.map((topic, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-[#F5F2ED] rounded-xl hover:bg-gray-100 transition-all">
                  <div className="flex items-center space-x-4">
                    <span className="text-lg font-bold text-[#2E8372]">#{index + 1}</span>
                    <span className="text-sm font-medium text-[#1A1A1A]">{topic.topic}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-600">{topic.searches.toLocaleString()}</span>
                    {topic.trend === 'up' ? (
                      <TrendingUp size={16} className="text-green-600" />
                    ) : (
                      <TrendingDown size={16} className="text-red-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-[0_4px_16px_rgba(0,0,0,0.06)] p-8">
            <h3 className="text-lg font-semibold text-[#1A1A1A] mb-6">Source Usage Frequency</h3>
            <div className="space-y-4">
              {topSources.map((source, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-[#2B2B2B]">{source.domain}</span>
                    <span className="text-sm text-gray-600">{source.count.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="h-2.5 rounded-full bg-[#2E8372] transition-all"
                      style={{ width: `${(source.count / topSources[0].count) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
