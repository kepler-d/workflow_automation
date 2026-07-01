import React, { useState, useEffect } from 'react';
import { X, Clock, CheckCircle, XCircle, Loader, Terminal } from 'lucide-react';
import api from '../services/api';

const ExecutionHistoryModal = ({ isOpen, onClose, workflowId }) => {
  const [runs, setRuns] = useState([]);
  const [selectedRun, setSelectedRun] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loadingRuns, setLoadingRuns] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    if (isOpen && workflowId) {
      fetchRuns();
    }
  }, [isOpen, workflowId]);

  const fetchRuns = async () => {
    setLoadingRuns(true);
    try {
      const response = await api.get(`/workflows/${workflowId}/runs`);
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

  const handleBack = () => {
    setSelectedRun(null);
    setLogs([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-3">
            {selectedRun ? (
              <button onClick={handleBack} className="text-gray-500 hover:text-gray-900 transition-colors">
                &larr; Back to Runs
              </button>
            ) : (
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Clock size={20} className="text-indigo-500" />
                Execution History
              </h2>
            )}
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
          {!selectedRun ? (
            // Runs List
            loadingRuns ? (
              <div className="flex justify-center items-center h-full text-gray-400">
                <Loader className="animate-spin" size={24} />
              </div>
            ) : runs.length === 0 ? (
              <div className="text-center text-gray-500 mt-10">
                No execution history found for this workflow.
              </div>
            ) : (
              <div className="space-y-3">
                {runs.map((run) => (
                  <div 
                    key={run._id}
                    onClick={() => handleRunClick(run)}
                    className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all flex justify-between items-center"
                  >
                    <div>
                      <div className="text-sm text-gray-500 mb-1">
                        {new Date(run.startedAt).toLocaleString()}
                        {run.durationMs !== undefined && ` • ${(run.durationMs / 1000).toFixed(2)}s`}
                      </div>
                      <div className="text-xs text-gray-400">Run ID: {run._id}</div>
                    </div>
                    <div>
                      {run.status === 'success' && <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full text-sm font-medium"><CheckCircle size={16} /> Success</span>}
                      {run.status === 'failed' && <span className="flex items-center gap-1 text-red-600 bg-red-50 px-3 py-1 rounded-full text-sm font-medium"><XCircle size={16} /> Failed</span>}
                      {run.status === 'running' && <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-3 py-1 rounded-full text-sm font-medium"><Loader className="animate-spin" size={16} /> Running</span>}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            // Run Details & Logs
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center">
                 <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Run Details</h3>
                    <div className="text-sm text-gray-500">Started: {new Date(selectedRun.startedAt).toLocaleString()}</div>
                    {selectedRun.completedAt && <div className="text-sm text-gray-500">Completed: {new Date(selectedRun.completedAt).toLocaleString()}</div>}
                    {selectedRun.durationMs !== undefined && <div className="text-sm text-gray-500">Duration: {(selectedRun.durationMs / 1000).toFixed(2)} seconds</div>}
                 </div>
                 <div>
                      {selectedRun.status === 'success' && <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full text-sm font-medium"><CheckCircle size={16} /> Success</span>}
                      {selectedRun.status === 'failed' && <span className="flex items-center gap-1 text-red-600 bg-red-50 px-3 py-1 rounded-full text-sm font-medium"><XCircle size={16} /> Failed</span>}
                 </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Terminal size={18} className="text-gray-500" />
                  Node Execution Logs
                </h3>
                
                {loadingLogs ? (
                  <div className="flex justify-center p-8 text-gray-400">
                    <Loader className="animate-spin" size={24} />
                  </div>
                ) : logs.length === 0 ? (
                  <div className="text-center text-gray-500 bg-white p-8 rounded-xl border border-gray-100 border-dashed">
                    No logs found for this run.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {logs.map((log, index) => (
                      <div key={log._id} className="bg-gray-900 rounded-xl overflow-hidden shadow-lg border border-gray-800">
                        <div className="flex justify-between items-center px-4 py-2 bg-gray-800/80 border-b border-gray-700">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-gray-400">#{index + 1}</span>
                            <span className="text-sm font-medium text-gray-200 capitalize">{log.nodeType}</span>
                            <span className="text-xs text-gray-500 bg-gray-900 px-2 py-0.5 rounded-md">{log.nodeId}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {log.status === 'success' && <span className="text-xs text-emerald-400">Success</span>}
                            {log.status === 'failed' && <span className="text-xs text-red-400">Failed</span>}
                            <span className="text-xs text-gray-500">{new Date(log.startedAt).toLocaleTimeString()}</span>
                          </div>
                        </div>
                        <div className="p-4 text-sm font-mono text-gray-300 overflow-x-auto whitespace-pre-wrap">
                          {log.error ? (
                            <div className="text-red-400">{log.error}</div>
                          ) : (
                            <div className="text-indigo-200">{JSON.stringify(log.outputData, null, 2)}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExecutionHistoryModal;
