import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Clock } from 'lucide-react';

const ScheduleNode = ({ data, isConnectable }) => {
  const handleChange = (evt) => {
    if (data.onChange) {
      data.onChange({
        ...data.config,
        cronExpression: evt.target.value
      });
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-pink-200 min-w-[250px] overflow-hidden">
      <div className="bg-pink-50 px-4 py-3 border-b border-pink-100 flex items-center gap-2">
        <Clock size={18} className="text-pink-600" />
        <div className="font-semibold text-pink-900">{data.label || 'Schedule Trigger'}</div>
      </div>
      
      <div className="p-4 bg-white">
        <div className="text-xs text-gray-500 mb-2 font-medium">Cron Expression</div>
        <input 
          type="text"
          className="w-full text-sm p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition-all"
          placeholder="* * * * *"
          value={data.config?.cronExpression || ''}
          onChange={handleChange}
        />
        <div className="text-[10px] text-gray-400 mt-2 font-mono">
          min hour day month day-of-week
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-pink-500 border-2 border-white"
      />
    </div>
  );
};

export default memo(ScheduleNode);
