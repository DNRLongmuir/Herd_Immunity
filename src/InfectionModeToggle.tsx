import React from 'react';
import { InfectionModeToggleProps } from './types';

const InfectionModeToggle: React.FC<InfectionModeToggleProps> = ({ infectionMode, setInfectionMode }) => {
  return (
    <button
      onClick={() => setInfectionMode(!infectionMode)}
      className={`px-4 py-2 rounded-lg font-semibold transition-colors duration-200 ${
        infectionMode
          ? 'bg-red-500 text-white hover:bg-red-600'
          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
      }`}
    >
      Infection Mode
    </button>
  );
};

export default InfectionModeToggle;