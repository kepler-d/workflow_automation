import { Handle, Position } from '@xyflow/react';
import { Globe } from 'lucide-react';

const HttpNode = ({ data }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-blue-200 min-w-[200px] overflow-hidden">
      <Handle 
        type="target" 
        position={Position.Top} 
        className="w-3 h-3 bg-blue-500 border-2 border-white"
      />
      <div className="bg-blue-50 p-3 border-b border-blue-100 flex items-center gap-2">
        <div className="p-1.5 bg-blue-100 rounded-lg text-blue-600">
          <Globe size={16} />
        </div>
        <span className="font-semibold text-blue-900 text-sm">HTTP Request</span>
      </div>
      <div className="p-4">
        <p className="text-xs text-gray-500">Make an external API call</p>
        {data?.config && (
          <div className="mt-2 text-xs font-mono bg-blue-50 p-1.5 rounded border border-blue-100 text-blue-800">
            {data.config.method} {data.config.url || '(No URL)'}
          </div>
        )}
      </div>
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="w-3 h-3 bg-blue-500 border-2 border-white"
      />
    </div>
  );
};

export default HttpNode;
