import React, { useState } from 'react';
import { VaccinationEfficacyToggleProps } from './types';
import SessionDialog from './SessionDialog';

const VaccinationEfficacyToggle: React.FC<VaccinationEfficacyToggleProps> = ({
  vaccinationMode,
  setVaccinationMode,
  vaccinationLabel,
  setVaccinationLabel,
}) => {
  const [showDialog, setShowDialog] = useState(false);

  const handleSubmit = (label: string) => {
    setVaccinationMode(true);
    setVaccinationLabel(label);
    setShowDialog(false);
  };

  const onClickToggle = () => {
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
      {showDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Enter Vaccination Efficacy</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              const input = (e.target as HTMLFormElement).efficacy.value;
              if (input.trim()) {
                handleSubmit(input.trim());
              }
            }}>
              <div className="mb-4">
                <label htmlFor="efficacy" className="block text-sm font-medium text-gray-700 mb-2">
                  Efficacy Label (e.g. "75%")
                </label>
                <input
                  type="text"
                  id="efficacy"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter efficacy"
                  autoFocus
                  required
                />
              </div>
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setShowDialog(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
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