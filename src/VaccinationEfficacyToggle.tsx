import React, { useState } from 'react';
import { VaccinationEfficacyToggleProps } from './types';

const VaccinationEfficacyToggle: React.FC<VaccinationEfficacyToggleProps> = ({
  vaccinationMode,
  setVaccinationMode,
  vaccinationLabel,
  setVaccinationLabel,
  disabled = false,
  darkMode = false,
}) => {
  const [showDialog, setShowDialog] = useState(false);

  const handleSubmit = (label: string) => {
    setVaccinationMode(true);
    setVaccinationLabel(label);
    setShowDialog(false);
  };

  const onClickToggle = () => {
    if (disabled) return;
    
    if (!vaccinationMode) {
      setShowDialog(true);
    } else {
      setVaccinationMode(false);
      setVaccinationLabel(null);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onClickToggle}
        disabled={disabled}
        className={`px-4 py-2 rounded-lg font-semibold transition-colors duration-300 ${
          disabled
            ? darkMode 
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : vaccinationMode
            ? 'bg-yellow-500 text-white hover:bg-yellow-600'
            : darkMode
            ? 'bg-gray-600 text-gray-200 hover:bg-gray-500'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
        title={disabled ? 'Disabled during Auto-Play' : 'Toggle Vaccination Efficacy'}
      >
        Vaccination Efficacy
      </button>
      {vaccinationMode && vaccinationLabel && (
        <span className={`text-sm font-bold transition-colors duration-300 ${
          darkMode ? 'text-gray-200' : 'text-gray-900'
        }`}>{vaccinationLabel}</span>
      )}
      {showDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-lg p-6 max-w-md w-full transition-colors duration-300 ${
            darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
          }`}>
            <h2 className="text-xl font-bold mb-4">Enter Vaccination Efficacy</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              const input = (e.target as HTMLFormElement).efficacy.value;
              if (input.trim()) {
                handleSubmit(input.trim());
              }
            }}>
              <div className="mb-4">
                <label htmlFor="efficacy" className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Efficacy Label (e.g. "75%")
                </label>
                <input
                  type="text"
                  id="efficacy"
                  name="efficacy"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-300 ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                  placeholder="Enter efficacy"
                  autoFocus
                  required
                />
              </div>
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setShowDialog(false)}
                  className={`px-4 py-2 rounded transition-colors ${
                    darkMode 
                      ? 'bg-gray-600 text-gray-200 hover:bg-gray-500' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Set Efficacy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VaccinationEfficacyToggle;