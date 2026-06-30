import { Handle, Position } from '@xyflow/react';
import { Terminal } from 'lucide-react';

const LogNode = ({ data }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 min-w-[200px] overflow-hidden">
      <Handle 
        type="target" 
        position={Position.Top} 
        className="w-3 h-3 bg-gray-500 border-2 border-white"
      />
      <div className="bg-gray-50 p-3 border-b border-gray-100 flex items-center gap-2">
        <div className="p-1.5 bg-gray-200 rounded-lg text-gray-700">
          <Terminal size={16} />
        </div>
        <span className="font-semibold text-gray-900 text-sm">Console Log</span>
      </div>
      <div className="p-4">
        <p className="text-xs text-gray-500">Print message to console</p>
        {data?.config && (
          <div className="mt-2 text-xs font-mono bg-gray-100 p-1.5 rounded border border-gray-200 text-gray-800 truncate">
            Msg: {data.config.message}
          </div>
        )}
      </div>
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="w-3 h-3 bg-gray-500 border-2 border-white"
      />
    </div>
  );
};

export default LogNode;
