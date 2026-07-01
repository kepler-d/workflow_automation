import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Mail } from 'lucide-react';

const EmailNode = ({ data, isConnectable }) => {
  const handleChange = (field, value) => {
    if (data.onChange) {
      data.onChange({
        ...data.config,
        [field]: value
      });
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-teal-200 min-w-[280px] overflow-hidden relative">
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-teal-500 border-2 border-white"
      />

      <div className="bg-teal-50 px-4 py-3 border-b border-teal-100 flex items-center gap-2">
        <Mail size={18} className="text-teal-600" />
        <div className="font-semibold text-teal-900">{data.label || 'Send Email'}</div>
      </div>
      
      <div className="p-4 bg-white flex flex-col gap-3">
        <div>
          <div className="text-xs text-gray-500 mb-1 font-medium">To</div>
          <input 
            type="text"
            className="w-full text-sm p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
            placeholder="user@example.com"
            value={data.config?.to || ''}
            onChange={(e) => handleChange('to', e.target.value)}
          />
        </div>
        
        <div>
          <div className="text-xs text-gray-500 mb-1 font-medium">Subject</div>
          <input 
            type="text"
            className="w-full text-sm p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
            placeholder="Notification"
            value={data.config?.subject || ''}
            onChange={(e) => handleChange('subject', e.target.value)}
          />
        </div>

        <div>
          <div className="text-xs text-gray-500 mb-1 font-medium">Body</div>
          <textarea 
            className="w-full text-sm p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none resize-none"
            placeholder="Hello World"
            rows="3"
            value={data.config?.body || ''}
            onChange={(e) => handleChange('body', e.target.value)}
          ></textarea>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-teal-500 border-2 border-white"
      />
    </div>
  );
};

export default memo(EmailNode);
