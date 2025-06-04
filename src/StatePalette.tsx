import React from 'react';
import { NodeState, StatePaletteProps } from './types';
import { getColorForState } from './utils/colorMapping';

const StatePalette: React.FC<StatePaletteProps> = ({ selectedState, setSelectedState }) => {
  const states: NodeState[] = [
    "Susceptible",
    "VaccinatedSafe",
    "VaccinatedFailed",
    "Infected",
    "Immune",
    "InfectionAttemptFailed"
  ];

  const handleStateClick = (state: NodeState) => {
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
          className="w-10 h-10 rounded transition-all duration-200 flex items-center justify-center text-xs font-bold"
          style={{
            backgroundColor: getColorForState(state),
            border: selectedState === state ? '2px solid black' : '2px solid transparent',
          }}
          title={state}
        >
          {state.charAt(0)}
        </button>
      ))}
    </div>
  );
};

export default StatePalette;