import React from 'react';
import { NodeState, StatePaletteProps } from './types';
import { getColorForState } from './utils/colorMapping';

const StatePalette: React.FC<StatePaletteProps> = ({ 
  selectedState, 
  setSelectedState, 
  disabled = false, 
  modelType
}) => {
  // Define states based on model type
  const getStatesForModel = (): NodeState[] => {
    const baseStates: NodeState[] = [
      "Susceptible",
      "VaccinatedSafe", 
      "VaccinatedFailed",
      "Infected",
      "Immune"
    ];

    if (modelType === "SI") {
      return [...baseStates, "InfectionAttemptFailed"];
    }
    
    return baseStates;
  };

  const states = getStatesForModel();

  const handleStateClick = (state: NodeState) => {
    if (disabled) return;
    
    if (selectedState === state) {
      setSelectedState(null);
    } else {
      setSelectedState(state);
    }
  };

  const getStateLabel = (state: NodeState): string => {
    switch (state) {
      case "Susceptible": return "S";
      case "VaccinatedSafe": return "V";
      case "VaccinatedFailed": return "VF";
      case "Infected": return "I";
      case "Immune": return "R";
      case "InfectionAttemptFailed": return "X";
      default: return '';
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
          {getStateLabel(state)}
        </button>
      ))}
    </div>
  );
};

export default StatePalette;
