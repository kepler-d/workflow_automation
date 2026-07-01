import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ArrowLeft, Save, Plus, Webhook, Terminal, Globe, Clock, History } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import api from '../services/api';

import WebhookNode from '../components/nodes/WebhookNode';
import LogNode from '../components/nodes/LogNode';
import HttpNode from '../components/nodes/HttpNode';
import DelayNode from '../components/nodes/DelayNode';
import ExecutionHistoryModal from '../components/ExecutionHistoryModal';

const nodeTypes = {
  webhook: WebhookNode,
  log: LogNode,
  http: HttpNode,
  delay: DelayNode,
};

const WorkflowBuilder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [workflow, setWorkflow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    const fetchWorkflow = async () => {
      try {
        const response = await api.get(`/workflows/${id}`);
        setWorkflow(response.data);
        setNodes(response.data.nodes || []);
        setEdges(response.data.edges || []);
      } catch (err) {
        console.error('Failed to fetch workflow', err);
        alert('Failed to load workflow');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchWorkflow();
  }, [id, navigate, setNodes, setEdges]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/workflows/${id}`, {
        name: workflow.name,
        nodes: nodes,
        edges: edges,
      });
      alert('Workflow saved successfully!');
    } catch (err) {
      console.error('Failed to save workflow', err);
      alert('Failed to save workflow');
    } finally {
      setSaving(false);
    }
  };

  const addNode = (type) => {
    // Generate a unique ID and calculate position
    const newNodeId = `${type}-${uuidv4()}`;
    const xPos = Math.random() * 200 + 100;
    const yPos = Math.random() * 200 + 100;

    let config = {};
    if (type === 'webhook') config = { path: "/new-user" };
    if (type === 'log') config = { message: "Workflow Started" };
    if (type === 'delay') config = { seconds: 10 };
    if (type === 'http') config = { url: "", method: "GET" };

    const newNode = {
      id: newNodeId,
      type,
      position: { x: xPos, y: yPos },
      data: { label: `${type} node`, config },
    };

    setNodes((nds) => nds.concat(newNode));
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading builder...</div>;
  }

  return (
    <div className="h-screen w-full flex flex-col bg-gray-50">
      <ExecutionHistoryModal 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)} 
        workflowId={id} 
      />
      {/* Top Navbar */}
      <nav className="bg-white shadow-sm border-b px-4 py-3 flex justify-between items-center z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/dashboard')}
            className="text-gray-500 hover:text-gray-900 transition-colors p-2 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{workflow?.name}</h1>
            <p className="text-xs text-gray-500">
              {nodes.length} Nodes • {edges.length} Connections
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsHistoryOpen(true)}
            className="flex items-center gap-2 bg-white text-gray-700 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors shadow-sm font-medium"
          >
            <History size={18} />
            History
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium disabled:opacity-50"
          >
            <Save size={18} />
            {saving ? 'Saving...' : 'Save Workflow'}
          </button>
        </div>
      </nav>

      <div className="flex-1 flex overflow-hidden">
        {/* Node Toolbar / Sidebar */}
        <div className="w-64 bg-white border-r shadow-sm p-4 flex flex-col gap-4 z-10 overflow-y-auto">
          <h2 className="font-semibold text-gray-700 uppercase tracking-wider text-xs mb-2">Add Nodes</h2>
          
          <button 
            onClick={() => addNode('webhook')}
            className="flex items-center gap-3 p-3 rounded-xl border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors text-left"
          >
            <Webhook size={18} />
            <span className="font-medium text-sm">Webhook Trigger</span>
          </button>

          <button 
            onClick={() => addNode('log')}
            className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors text-left"
          >
            <Terminal size={18} />
            <span className="font-medium text-sm">Console Log</span>
          </button>

          <button 
            onClick={() => addNode('http')}
            className="flex items-center gap-3 p-3 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors text-left"
          >
            <Globe size={18} />
            <span className="font-medium text-sm">HTTP Request</span>
          </button>

          <button 
            onClick={() => addNode('delay')}
            className="flex items-center gap-3 p-3 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors text-left"
          >
            <Clock size={18} />
            <span className="font-medium text-sm">Delay</span>
          </button>
        </div>

        {/* Canvas */}
        <div className="flex-1 h-full w-full relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
          >
            <Controls />
            <MiniMap nodeStrokeWidth={3} zoomable pannable />
            <Background variant="dots" gap={12} size={1} />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
};

export default WorkflowBuilder;
