import React, { useState } from 'react';
import { GridProps, NodeState } from './types';
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
  disabled = false
}) => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingInfection, setPendingInfection] = useState<{ from: string; to: string } | null>(null);

  const handleNodeClick = (nodeId: string) => {
    if (disabled) return;
    
    const node = state.nodes[nodeId];

    if (infectionMode) {
      if (pendingSource === null) {
        // Only allow selecting infected nodes as source
        if (node.state === "Infected") {
          setPendingSource(nodeId);
        }
      } else {
        // Show confirmation dialog for infection attempt
        setPendingInfection({ from: pendingSource, to: nodeId });
        setShowConfirmation(true);
      }
    } else if (selectedState !== null) {
      setState(prev => {
        const updatedNodes = { ...prev.nodes };
        updatedNodes[nodeId].state = selectedState;
        return { ...prev, nodes: updatedNodes };
      });
    }
  };

  const handleInfectionConfirm = (success: boolean) => {
    if (!pendingInfection) return;

    setState(prev => {
      const updatedNodes = { ...prev.nodes };
      const targetNode = updatedNodes[pendingInfection.to];
      
      if (success) {
        if (vaccinationMode && targetNode.state === "VaccinatedSafe") {
          targetNode.state = "VaccinatedFailed";
        } else if (targetNode.state !== "Immune" && 
                  targetNode.state !== "VaccinatedSafe" &&
                  targetNode.state !== "Recovered") { // Recovered nodes can't be infected in SIR
          targetNode.state = "Infected";
        }
      } else {
        // Handle failed infection based on model type
        if (state.modelType === "SIR") {
          // In SIR model, failed infection leads to recovery
          if (targetNode.state !== "Immune" && 
              targetNode.state !== "VaccinatedSafe" &&
              targetNode.state !== "Recovered") {
            targetNode.state = "Recovered";
          }
        } else {
          // In SI model, failed infection leaves node susceptible or marks as failed attempt
          if (targetNode.state !== "Immune" && 
              targetNode.state !== "VaccinatedSafe") {
            targetNode.state = "InfectionAttemptFailed";
          }
        }
      }

      return {
        ...prev,
        nodes: updatedNodes,
        history: [...prev.history, {
          from: pendingInfection.from,
          to: pendingInfection.to,
          success,
          timestamp: Date.now()
        }]
      };
    });

    setPendingSource(null);
    setPendingInfection(null);
    setShowConfirmation(false);
  };

  const getStateLabel = (state: NodeState): string => {
    switch (state) {
      case "Susceptible": return "S";
      case "VaccinatedSafe": return "V";
      case "VaccinatedFailed": return "F";
      case "Infected": return "I";
      case "Immune": return "M";
      case "InfectionAttemptFailed": return "F";
      case "Recovered": return "R";
      default: return state.charAt(0).toUpperCase();
    }
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
            }}
            title={disabled ? 'Disabled during Auto-Play' : undefined}
          >
            {getStateLabel(node.state)}
          </div>
        ))}
      </div>

      {showConfirmation && (
        <ConfirmationDialog
          message={`Was infection from ${pendingInfection?.from} to ${pendingInfection?.to} successful?`}
          onConfirm={() => handleInfectionConfirm(true)}
          onCancel={() => handleInfectionConfirm(false)}
        />
      )}
    </>
  );
};

export default Grid;