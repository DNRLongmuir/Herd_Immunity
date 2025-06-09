import React from 'react';
import { ModelTypeSelectorProps } from '../types';

const ModelTypeSelector: React.FC<ModelTypeSelectorProps> = ({ 
  modelType, 
  setModelType, 
  disabled = false 
}) => {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="model-type\" className="text-sm font-medium text-gray-700">
        Model Type:
      </label>
      <select
        id="model-type"
        value={modelType}
        onChange={(e) => setModelType(e.target.value as "SIR" | "SI")}
        disabled={disabled}
        className={`px-3 py-2 border border-gray-300 rounded-md text-sm font-semibold transition-colors ${
          disabled
            ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
            : 'bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500'
        }`}
        title={disabled ? 'Cannot change model type during infection mode' : 'Select epidemiological model'}
      >
        <option value="SIR">SIR</option>
        <option value="SI">SI</option>
      </select>
    </div>
  );
};

export default ModelTypeSelector;