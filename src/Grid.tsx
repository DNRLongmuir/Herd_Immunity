import React, { useState } from 'react';
import { GridProps, NodeState, GameState } from './types';
import { getColorForState } from './utils/colorMapping';
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
        // Check if target is VaccinatedSafe - always block unless vaccination mode is on
        if (node.state === "VaccinatedSafe" && !vaccinationMode) {
          setShowVaccinatedWarning(true);
          setPendingSource(null); // Clear pending source
          return;
        }
        
        // In SIR mode, silently ignore Immune (Recovered) targets
        if (state.modelType === "SIR" && node.state === "Immune") {
          setPendingSource(null); // Clear pending source
          return;
        }
        
        // Show confirmation dialog for valid infection attempt
        setPendingInfection({ from: pendingSource, to: nodeId });
        setShowConfirmation(true);
      }
    } else if (selectedState !== null) {
      setState(prev => {
        const oldNodes = prev.nodes;
        const updatedNodes = { ...prev.nodes };
        updatedNodes[nodeId] = { ...updatedNodes[nodeId], state: selectedState };

        // Update time series if state changed
        updateTimeSeriesIfChanged(updatedNodes, oldNodes);

        return { ...prev, nodes: updatedNodes };
      });
    }
  };

  const handleInfectionConfirm = (success: boolean) => {
    if (!pendingInfection) return;

    setState(prev => {
      const oldNodes = prev.nodes;
      const updatedNodes = { ...prev.nodes };
      let targetNode = { ...updatedNodes[pendingInfection.to] };

      if (success) {
        if (vaccinationMode && targetNode.state === "VaccinatedSafe") {
          targetNode.state = "VaccinatedFailed";
        } else if (targetNode.state !== "Immune" &&
                  targetNode.state !== "VaccinatedSafe") {
          targetNode.state = "Infected";
        }
      } else {
        // Handle failed infection based on model type
        if (prev.modelType === "SIR") {
          if (targetNode.state !== "Immune" &&
              targetNode.state !== "VaccinatedSafe") {
            targetNode.state = "Immune";
          }
        } else {
          if (targetNode.state !== "Immune" &&
              targetNode.state !== "VaccinatedSafe") {
            targetNode.state = "InfectionAttemptFailed";
          }
        }
      }

      updatedNodes[pendingInfection.to] = targetNode;

      // Update time series if state changed
      updateTimeSeriesIfChanged(updatedNodes, oldNodes);
      
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

  const getGridNumber = (nodeId: string): number => {
    const [, rowStr, colStr] = nodeId.match(/r(\d+)c(\d+)/) || [];
    if (!rowStr || !colStr) return 0;
    const row = parseInt(rowStr, 10);
    const col = parseInt(colStr, 10);
    const positionIndex = row * state.gridSize.cols + col;
    return state.nodeOrder[positionIndex] ?? positionIndex + 1;
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
            title={disabled ? 'Disabled during Auto-Play' : `Node ${getGridNumber(node.id)} - ${node.state}`}
          >
            {getGridNumber(node.id)}
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