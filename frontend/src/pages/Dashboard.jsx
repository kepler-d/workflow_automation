import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import api from '../services/api';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newWorkflowName, setNewWorkflowName] = useState('');
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch user profile and workflows concurrently
        const [userRes, workflowsRes] = await Promise.all([
          api.get('/auth/me'),
          api.get('/workflows')
        ]);
        
        setUser(userRes.data);
        setWorkflows(workflowsRes.data);
      } catch (err) {
        console.error(err);
        // api interceptor handles the 401 redirect
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleCreateWorkflow = async (e) => {
    e.preventDefault();
    if (!newWorkflowName.trim()) return;

    setCreating(true);
    try {
      const response = await api.post('/workflows', {
        name: newWorkflowName,
        nodes: [],
        edges: []
      });
      setWorkflows([response.data, ...workflows]);
      setIsModalOpen(false);
      setNewWorkflowName('');
    } catch (err) {
      console.error('Failed to create workflow', err);
      alert('Failed to create workflow');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteWorkflow = async (id) => {
    if (!window.confirm('Are you sure you want to delete this workflow?')) return;
    
    try {
      await api.delete(`/workflows/${id}`);
      setWorkflows(workflows.filter(w => w._id !== id));
    } catch (err) {
      console.error('Failed to delete workflow', err);
      alert('Failed to delete workflow');
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-indigo-600">FlowForge</h1>
            </div>
            <div className="flex items-center space-x-6">
              <button
                onClick={() => navigate('/executions')}
                className="text-gray-600 hover:text-indigo-600 font-medium text-sm transition-colors"
              >
                Execution History
              </button>
              <span className="text-gray-700 font-medium">Welcome, {user?.name}</span>
              <button
                onClick={handleLogout}
                className="text-gray-500 hover:text-gray-700 font-medium text-sm transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Your Workflows</h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium"
          >
            <Plus size={20} />
            Create Workflow
          </button>
        </div>

        {workflows.length === 0 ? (
          <div className="border-2 border-dashed border-gray-300 rounded-xl h-64 flex flex-col items-center justify-center bg-white shadow-sm">
            <p className="text-gray-500 text-lg font-medium mb-4">No workflows yet.</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-indigo-600 font-medium hover:text-indigo-700"
            >
              Create your first workflow &rarr;
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workflows.map((workflow) => (
              <div 
                key={workflow._id} 
                onClick={() => navigate(`/workflows/${workflow._id}`)}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col hover:shadow-md transition-shadow cursor-pointer relative"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 truncate pr-4" title={workflow.name}>
                    {workflow.name}
                  </h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteWorkflow(workflow._id);
                    }}
                    className="text-gray-400 hover:text-red-500 transition-colors z-10 relative"
                    title="Delete Workflow"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${workflow.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {workflow.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(workflow.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Workflow Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Create New Workflow</h3>
            <form onSubmit={handleCreateWorkflow}>
              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Workflow Name
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  autoFocus
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g. Welcome Email Flow"
                  value={newWorkflowName}
                  onChange={(e) => setNewWorkflowName(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newWorkflowName.trim()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
