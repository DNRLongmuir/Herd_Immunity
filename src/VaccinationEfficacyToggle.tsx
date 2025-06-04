import React from 'react';
import { VaccinationEfficacyToggleProps } from './types';

const VaccinationEfficacyToggle: React.FC<VaccinationEfficacyToggleProps> = ({
  vaccinationMode,
  setVaccinationMode,
  vaccinationLabel,
  setVaccinationLabel,
}) => {
  const onClickToggle = () => {
    if (!vaccinationMode) {
      const label = window.prompt("Enter vaccination‐efficacy label (e.g. \"75%\"):");
      if (label && label.trim() !== "") {
        setVaccinationMode(true);
        setVaccinationLabel(label.trim());
      } else {
        setVaccinationMode(false);
        setVaccinationLabel(null);
      }
    } else {
      setVaccinationMode(false);
      setVaccinationLabel(null);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onClickToggle}
        className={`px-4 py-2 rounded-lg font-semibold transition-colors duration-200 ${
          vaccinationMode
            ? 'bg-yellow-500 text-white hover:bg-yellow-600'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        Vaccination Efficacy
      </button>
      {vaccinationMode && vaccinationLabel && (
        <span className="text-sm font-bold">{vaccinationLabel}</span>
      )}
    </div>
  );
};

export default VaccinationEfficacyToggle;