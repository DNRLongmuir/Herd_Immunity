import React from 'react';
import { NodeState, StatePaletteProps } from './types';
import { getColorForState } from './utils/colorMapping';

const StatePalette: React.FC<StatePaletteProps> = ({ selectedState, setSelectedState, disabled = false }) => {
  const states: NodeState[] = [
    "Susceptible",
    "VaccinatedSafe",
    "VaccinatedFailed",
    "Infected",
    "Immune",
    "InfectionAttemptFailed"
  ];

  const handleStateClick = (state: NodeState) => {
    if (disabled) return;
    
    if (selectedState === state) {
      setSelectedState(null);
    } else {
      setSelectedState(state);
    }
  };

  return (
    <div className="flex gap-2 items-center">
      {states.map((state) => (
        <button
          key={state}
          onClick={() => handleStateClick(state)}
          disabled={disabled}
          className={`w-10 h-10 rounded transition-all duration-200 flex items-center justify-center text-xs font-bold ${
            disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
          }`}
          style={{
            backgroundColor: getColorForState(state),
            border: selectedState === state ? '2px solid black' : '2px solid transparent',
          }}
          title={disabled ? 'Disabled during Auto-Play' : state}
        >
          {state.charAt(0)}
        </button>
      ))}
    </div>
  );
};

export default StatePalette;