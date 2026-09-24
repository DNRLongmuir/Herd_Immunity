import React, { useState } from 'react';
import { GridProps, GameState } from './types';
import { getColorForState } from './utils/colorMapping';
import { isManualTargetEligible, resolveManualExposure } from './utils/gameRules';
import ConfirmationDialog from './ConfirmationDialog';

const Grid: React.FC<GridProps> = ({
  state,
  setState,
  selectedState,
  infectionMode,
  vaccinationMode,
  pendingSource,
  setPendingSource,
  disabled = false,
  updateTimeSeriesIfChanged,
  darkMode = false
}) => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showVaccinatedWarning, setShowVaccinatedWarning] = useState(false);
  const [pendingInfection, setPendingInfection] = useState<{ from: string; to: string } | null>(null);
  

  const handleNodeClick = (nodeId: string) => {
    if (disabled) return;
    
    const node = state.nodes[nodeId];

    if (infectionMode) {
      if (pendingSource === null) {
        // Only allow selecting infected or vaccinatedFailed nodes as source
        if (node.state === "Infected" || node.state === "VaccinatedFailed") {
          setPendingSource(nodeId);
        }
      } else {
        if (nodeId === pendingSource) {
          setPendingSource(null);
          return;
        }

        // Check if target is VaccinatedSafe - always block unless vaccination mode is on
        if (node.state === "VaccinatedSafe" && !vaccinationMode) {
          setShowVaccinatedWarning(true);
          setPendingSource(null); // Clear pending source
          return;
        }
        
        if (!isManualTargetEligible(node.state, vaccinationMode)) {
          setPendingSource(null); // Clear pending source
          return;
        }
        
        // Show confirmation dialog for valid infection attempt
        setPendingInfection({ from: pendingSource, to: nodeId });
        setShowConfirmation(true);
      }
    } else if (selectedState !== null && state.history.length === 0) {
      const oldNodes = state.nodes;
      const updatedNodes = { ...oldNodes };
      updatedNodes[nodeId] = { ...updatedNodes[nodeId], state: selectedState };
      setState(prev => ({ ...prev, nodes: updatedNodes }));
      updateTimeSeriesIfChanged(updatedNodes, oldNodes, true);
    }
  };

  const handleInfectionConfirm = (success: boolean) => {
    if (!pendingInfection) return;

    const oldNodes = state.nodes;
    const updatedNodes = { ...oldNodes };
    const targetNode = { ...updatedNodes[pendingInfection.to] };

    targetNode.state = resolveManualExposure(
      targetNode.state,
      success,
      state.modelType,
      vaccinationMode
    );

    updatedNodes[pendingInfection.to] = targetNode;
    updateTimeSeriesIfChanged(updatedNodes, oldNodes);

    setState(prev => {
      const newState: GameState = {
        ...prev,
        nodes: updatedNodes,
        history: [...prev.history, {
          from: pendingInfection.from,
          to: pendingInfection.to,
          success,
          timestamp: Date.now(),
          previousState: oldNodes[pendingInfection.to].state,
        }]
      };
      return newState;
    });


    setPendingSource(null);
    setPendingInfection(null);
    setShowConfirmation(false);
  };

  return (
    <>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${state.gridSize.cols}, 64px)`,
          gap: '4px',
        }}
      >
        {Object.values(state.nodes).map(node => (
          <div
            key={node.id}
            data-node-id={node.id}
            onClick={() => handleNodeClick(node.id)}
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: disabled 
                ? "not-allowed" 
                : infectionMode 
                ? "crosshair" 
                : selectedState 
                ? "pointer" 
                : "default",
              backgroundColor: getColorForState(node.state),
              position: "relative",
              fontSize: "20px",
              fontWeight: "bold",
              userSelect: "none",
              border: pendingSource === node.id ? "2px solid #ff4444" : "none",
              opacity: disabled ? 0.7 : 1,
              color: "#000000", // Ensure numbers are always visible
            }}
            title={disabled ? 'Disabled during Auto-Play' : `Student ${node.studentNumber} - ${node.state}`}
          >
            {node.studentNumber}
          </div>
        ))}
      </div>

      {showConfirmation && (
        <ConfirmationDialog
          message={`Was infection from ${pendingInfection?.from} to ${pendingInfection?.to} successful?`}
          onConfirm={() => handleInfectionConfirm(true)}
          onCancel={() => handleInfectionConfirm(false)}
          darkMode={darkMode}
        />
      )}

      {showVaccinatedWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-lg p-6 max-w-md w-full transition-colors duration-300 ${
            darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
          }`}>
            <p className="text-lg mb-6">Infection cannot target a vaccinated node.</p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowVaccinatedWarning(false)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Grid;
