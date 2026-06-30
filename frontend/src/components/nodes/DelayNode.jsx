import { Handle, Position } from '@xyflow/react';
import { Clock } from 'lucide-react';

const DelayNode = ({ data }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-amber-200 min-w-[200px] overflow-hidden">
      <Handle 
        type="target" 
        position={Position.Top} 
        className="w-3 h-3 bg-amber-500 border-2 border-white"
      />
      <div className="bg-amber-50 p-3 border-b border-amber-100 flex items-center gap-2">
        <div className="p-1.5 bg-amber-100 rounded-lg text-amber-600">
          <Clock size={16} />
        </div>
        <span className="font-semibold text-amber-900 text-sm">Delay</span>
      </div>
      <div className="p-4">
        <p className="text-xs text-gray-500">Wait for specified time</p>
      </div>
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="w-3 h-3 bg-amber-500 border-2 border-white"
      />
    </div>
  );
};

export default DelayNode;
