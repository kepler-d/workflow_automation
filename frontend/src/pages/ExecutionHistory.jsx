import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, CheckCircle, XCircle, Loader, Terminal, Activity } from 'lucide-react';
import api from '../services/api';

const ExecutionHistory = () => {
  const navigate = useNavigate();
  const [runs, setRuns] = useState([]);
  const [selectedRun, setSelectedRun] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loadingRuns, setLoadingRuns] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    fetchRuns();
  }, []);

  const fetchRuns = async () => {
    setLoadingRuns(true);
    try {
      const response = await api.get('/workflows/runs/all');
      setRuns(response.data);
    } catch (error) {
      console.error('Failed to fetch runs:', error);
    } finally {
      setLoadingRuns(false);
    }
  };

  const fetchLogs = async (runId) => {
    setLoadingLogs(true);
    try {
      const response = await api.get(`/workflows/runs/${runId}/logs`);
      setLogs(response.data);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleRunClick = (run) => {
    setSelectedRun(run);
    fetchLogs(run._id);
  };

  return (
    <div className="h-screen w-full flex flex-col bg-gray-50">
      {/* Top Navbar */}
      <nav className="bg-white shadow-sm border-b px-6 py-4 flex items-center gap-4 z-10">
        <button 
          onClick={() => navigate('/dashboard')}
          className="text-gray-500 hover:text-gray-900 transition-colors p-2 rounded-lg hover:bg-gray-100"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-2">
          <Activity size={24} className="text-indigo-600" />
          <h1 className="text-xl font-bold text-gray-900">Global Execution History</h1>
        </div>
      </nav>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Runs List */}
        <div className="w-1/3 bg-white border-r shadow-sm flex flex-col z-10">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <h2 className="font-semibold text-gray-700">Recent Executions</h2>
            <span className="text-xs font-medium bg-gray-200 text-gray-600 px-2 py-1 rounded-full">{runs.length}</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loadingRuns ? (
              <div className="flex justify-center p-8 text-gray-400">
                <Loader className="animate-spin" size={24} />
              </div>
            ) : runs.length === 0 ? (
              <div className="text-center text-gray-500 mt-10">
                No executions found across your workflows.
              </div>
            ) : (
              runs.map((run) => (
                <div 
                  key={run._id}
                  onClick={() => handleRunClick(run)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedRun?._id === run._id 
                      ? 'bg-indigo-50 border-indigo-200 shadow-sm' 
                      : 'bg-white border-gray-100 hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium text-gray-900">{run.workflow?.name || 'Deleted Workflow'}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {new Date(run.startedAt).toLocaleString()}
                        {run.durationMs !== undefined && ` • ${(run.durationMs / 1000).toFixed(2)}s`}
                      </div>
                    </div>
                    <div>
                      {run.status === 'success' && <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full text-xs font-medium border border-emerald-100"><CheckCircle size={14} /> Success</span>}
                      {run.status === 'failed' && <span className="flex items-center gap-1 text-red-600 bg-red-50 px-2.5 py-0.5 rounded-full text-xs font-medium border border-red-100"><XCircle size={14} /> Failed</span>}
                      {run.status === 'running' && <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full text-xs font-medium border border-blue-100"><Loader className="animate-spin" size={14} /> Running</span>}
                    </div>
                  </div>
                  <div className="text-[10px] font-mono text-gray-400">Run ID: {run._id}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Panel: Execution Details */}
        <div className="flex-1 bg-gray-50/50 flex flex-col overflow-hidden">
          {selectedRun ? (
            <div className="flex-1 overflow-y-auto p-8">
              <div className="max-w-3xl mx-auto space-y-6">
                
                {/* Run Header Info */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                   <div>
                      <h2 className="text-xl font-bold text-gray-900 mb-1">{selectedRun.workflow?.name || 'Unknown Workflow'}</h2>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1"><Clock size={16} /> Started: {new Date(selectedRun.startedAt).toLocaleString()}</span>
                        {selectedRun.durationMs !== undefined && <span>Duration: {(selectedRun.durationMs / 1000).toFixed(2)}s</span>}
                      </div>
                   </div>
                   <div>
                        {selectedRun.status === 'success' && <span className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full text-sm font-semibold border border-emerald-100"><CheckCircle size={18} /> Execution Successful</span>}
                        {selectedRun.status === 'failed' && <span className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-full text-sm font-semibold border border-red-100"><XCircle size={18} /> Execution Failed</span>}
                   </div>
                </div>

                {/* Logs Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                    <Terminal size={18} className="text-gray-600" />
                    <h3 className="font-semibold text-gray-800">Node Execution Logs</h3>
                  </div>
                  
                  <div className="p-6">
                    {loadingLogs ? (
                      <div className="flex justify-center py-12 text-gray-400">
                        <Loader className="animate-spin" size={32} />
                      </div>
                    ) : logs.length === 0 ? (
                      <div className="text-center text-gray-500 py-12 border-2 border-dashed border-gray-100 rounded-xl">
                        No logs found for this run.
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {logs.map((log, index) => (
                          <div key={log._id} className="relative pl-8">
                            {/* Timeline line */}
                            {index !== logs.length - 1 && (
                              <div className="absolute left-[11px] top-8 bottom-[-24px] w-0.5 bg-gray-100"></div>
                            )}
                            
                            {/* Timeline dot */}
                            <div className={`absolute left-0 top-1.5 w-6 h-6 rounded-full border-4 border-white shadow-sm flex items-center justify-center ${
                              log.status === 'success' ? 'bg-emerald-500' : log.status === 'failed' ? 'bg-red-500' : 'bg-blue-500'
                            }`}></div>

                            <div className="bg-gray-900 rounded-xl overflow-hidden shadow-md border border-gray-800">
                              <div className="flex justify-between items-center px-4 py-3 bg-gray-800/80 border-b border-gray-700">
                                <div className="flex items-center gap-3">
                                  <span className="text-sm font-semibold text-gray-200 capitalize">{log.nodeType}</span>
                                  <span className="text-xs text-gray-500 bg-gray-900 px-2 py-0.5 rounded-md border border-gray-700">{log.nodeId}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  {log.status === 'success' && <span className="text-xs font-medium text-emerald-400">Success</span>}
                                  {log.status === 'failed' && <span className="text-xs font-medium text-red-400">Failed</span>}
                                  <span className="text-xs text-gray-500">{new Date(log.startedAt).toLocaleTimeString()}</span>
                                </div>
                              </div>
                              <div className="p-4 text-sm font-mono text-gray-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                                {log.error ? (
                                  <div className="text-red-400">{log.error}</div>
                                ) : (
                                  <div className="text-indigo-200">{JSON.stringify(log.outputData, null, 2)}</div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <Activity size={48} className="mb-4 text-gray-300" strokeWidth={1} />
              <p className="text-lg font-medium text-gray-500">Select an execution to view details</p>
              <p className="text-sm mt-2">Logs and node states will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExecutionHistory;
