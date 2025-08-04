import React from 'react';
import { InfectionModeToggleProps } from './types';

const InfectionModeToggle: React.FC<InfectionModeToggleProps> = ({ 
  infectionMode, 
  setInfectionMode, 
  disabled = false,
  darkMode = false
}) => {
  return (
    <button
      onClick={() => !disabled && setInfectionMode(!infectionMode)}
      disabled={disabled}
      className={`px-4 py-2 rounded-lg font-semibold transition-colors duration-300 ${
        disabled
          ? darkMode 
            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          : infectionMode
          ? 'bg-red-500 text-white hover:bg-red-600'
          : darkMode
          ? 'bg-gray-600 text-gray-200 hover:bg-gray-500'
          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
      }`}
      title={disabled ? 'Disabled during Auto-Play' : 'Toggle Infection Mode'}
    >
      Infection Mode
    </button>
  );
};

export default InfectionModeToggle;