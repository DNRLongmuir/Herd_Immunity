import React from 'react';
import { ModelTypeSelectorProps } from '../types';

const ModelTypeSelector: React.FC<ModelTypeSelectorProps> = ({ 
  modelType, 
  setModelType, 
  disabled = false,
  darkMode = false
}) => {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="model-type" className={`text-sm font-medium transition-colors duration-300 ${
        darkMode ? 'text-gray-300' : 'text-gray-700'
      }`}>
        Model Type:
      </label>
      <select
        id="model-type"
        value={modelType}
        onChange={(e) => setModelType(e.target.value as "SIR" | "SI")}
        disabled={disabled}
        className={`px-3 py-2 border rounded-md text-sm font-semibold transition-colors duration-300 ${
          disabled
            ? darkMode
              ? 'bg-gray-700 border-gray-600 text-gray-500 cursor-not-allowed'
              : 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed'
            : darkMode
            ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500'
            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500'
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