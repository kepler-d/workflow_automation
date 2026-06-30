import { Handle, Position } from '@xyflow/react';
import { Webhook } from 'lucide-react';

const WebhookNode = ({ data }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-purple-200 min-w-[200px] overflow-hidden">
      <div className="bg-purple-50 p-3 border-b border-purple-100 flex items-center gap-2">
        <div className="p-1.5 bg-purple-100 rounded-lg text-purple-600">
          <Webhook size={16} />
        </div>
        <span className="font-semibold text-purple-900 text-sm">Webhook Trigger</span>
      </div>
      <div className="p-4">
        <p className="text-xs text-gray-500">Wait for incoming request</p>
      </div>
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="w-3 h-3 bg-purple-500 border-2 border-white"
      />
    </div>
  );
};

export default WebhookNode;
