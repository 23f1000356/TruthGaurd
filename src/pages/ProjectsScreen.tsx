import { Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../utils/api';

interface ProjectsScreenProps {
  onNavigate: (page: 'home' | 'results' | 'history' | 'projects' | 'project-details' | 'kb-manager') => void;
}

interface Project {
  id: string;
  name: string;
  claimCount: number;
  status: 'active' | 'completed' | 'pending';
  lastUpdated: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'completed':
      return 'bg-blue-100 text-blue-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusLabel = (status: string) => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

export default function ProjectsScreen({ onNavigate }: ProjectsScreenProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await api.listProjects();

      if (response.error) {
        setError(response.error);
        setLoading(false);
        return;
      }

      if (response.data) {
        // Transform backend projects to frontend format
        const transformedProjects: Project[] = response.data.map((proj: any) => {
          const lastUpdated = new Date(proj.updated_at);
          const now = new Date();
          const diffTime = Math.abs(now.getTime() - lastUpdated.getTime());
          const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          let lastUpdatedStr = '';
          if (diffHours < 1) {
            lastUpdatedStr = 'Just now';
          } else if (diffHours < 24) {
            lastUpdatedStr = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
          } else if (diffDays < 7) {
            lastUpdatedStr = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
          } else {
            lastUpdatedStr = lastUpdated.toLocaleDateString();
          }

          return {
            id: proj.id,
            name: proj.name,
            claimCount: proj.claims?.length || 0,
            status: proj.status as 'active' | 'completed' | 'pending',
            lastUpdated: lastUpdatedStr,
          };
        });

        setProjects(transformedProjects);
      }
    } catch (err) {
      console.error('Projects load error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;

    try {
      const response = await api.createProject(newProjectName.trim());

      if (response.error) {
        alert(`Failed to create project: ${response.error}`);
        return;
      }

      setShowCreateModal(false);
      setNewProjectName('');
      loadProjects(); // Reload projects
    } catch (err) {
      console.error('Create project error:', err);
      alert('Failed to create project');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
      <main className="px-8 py-12">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">My Projects</h1>
            <p className="text-gray-600">Manage and organize your verification projects</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-600 to-blue-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-200"
          >
            <Plus size={20} />
            New Project
          </button>
        </div>

        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-96">
              <h2 className="text-xl font-bold mb-4">Create New Project</h2>
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Project name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
                onKeyPress={(e) => e.key === 'Enter' && handleCreateProject()}
              />
              <div className="flex gap-3">
                <button
                  onClick={handleCreateProject}
                  className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                >
                  Create
                </button>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewProjectName('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading projects...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <p className="text-red-800 font-semibold">Error loading projects</p>
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {!loading && !error && projects.length === 0 && (
          <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
            <p className="text-gray-500 text-lg mb-4">No projects yet</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              Create Your First Project
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => {
                sessionStorage.setItem('selectedProjectId', project.id);
                onNavigate('project-details');
              }}
              className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 hover:border-teal-200 border border-slate-200 p-6 cursor-pointer group overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-teal-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-teal-700 transition-colors">
                      {project.name}
                    </h3>
                    <p className="text-sm text-gray-500">{project.claimCount} claims verified</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getStatusColor(
                      project.status
                    )}`}
                  >
                    {getStatusLabel(project.status)}
                  </span>
                </div>

                <div className="mb-6 pt-4 border-t border-slate-100">
                  <p className="text-xs text-gray-500">Last updated: {project.lastUpdated}</p>
                </div>

                <div className="flex items-center gap-3">
                  <button className="flex-1 px-4 py-2 bg-gradient-to-r from-teal-500 to-teal-600 text-white font-medium rounded-lg hover:shadow-md transition-all duration-200 text-sm group-hover:from-teal-600 group-hover:to-teal-700">
                    Open Project
                  </button>
                  <button className="px-4 py-2 text-gray-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-all duration-200 text-sm">
                    ⋮
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

      </main>
    </div>
  );
}
