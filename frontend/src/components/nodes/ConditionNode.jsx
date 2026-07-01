import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { GitBranch } from 'lucide-react';

const ConditionNode = ({ data, isConnectable }) => {
  const handleChange = (field, value) => {
    if (data.onChange) {
      data.onChange({
        ...data.config,
        [field]: value
      });
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-orange-200 min-w-[280px] overflow-hidden relative">
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-orange-500 border-2 border-white"
      />

      <div className="bg-orange-50 px-4 py-3 border-b border-orange-100 flex items-center gap-2">
        <GitBranch size={18} className="text-orange-600" />
        <div className="font-semibold text-orange-900">{data.label || 'IF Condition'}</div>
      </div>
      
      <div className="p-4 bg-white flex flex-col gap-3">
        <div>
          <div className="text-xs text-gray-500 mb-1 font-medium">Field (e.g. payload.amount)</div>
          <input 
            type="text"
            className="w-full text-sm p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
            placeholder="payload.status"
            value={data.config?.field || ''}
            onChange={(e) => handleChange('field', e.target.value)}
          />
        </div>
        
        <div>
          <div className="text-xs text-gray-500 mb-1 font-medium">Operator</div>
          <select
            className="w-full text-sm p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none bg-white"
            value={data.config?.operator || '=='}
            onChange={(e) => handleChange('operator', e.target.value)}
          >
            <option value="==">Equals (==)</option>
            <option value="!=">Not Equals (!=)</option>
            <option value=">">Greater Than (&gt;)</option>
            <option value="<">Less Than (&lt;)</option>
            <option value=">=">Greater or Equal (&gt;=)</option>
            <option value="<=">Less or Equal (&lt;=)</option>
          </select>
        </div>

        <div>
          <div className="text-xs text-gray-500 mb-1 font-medium">Value</div>
          <input 
            type="text"
            className="w-full text-sm p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
            placeholder="paid"
            value={data.config?.value || ''}
            onChange={(e) => handleChange('value', e.target.value)}
          />
        </div>
      </div>

      <div className="bg-gray-50 p-2 flex justify-between px-6 text-xs font-semibold text-gray-500">
        <span className="text-green-600">True</span>
        <span className="text-red-600">False</span>
      </div>

      {/* Output Handles */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="true"
        isConnectable={isConnectable}
        className="w-3 h-3 bg-green-500 border-2 border-white"
        style={{ left: '25%' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        isConnectable={isConnectable}
        className="w-3 h-3 bg-red-500 border-2 border-white"
        style={{ left: '75%' }}
      />
    </div>
  );
};

export default memo(ConditionNode);
