import React from 'react';
import { GridProps, NodeState } from './types';
import { getColorForState } from './utils/colorMapping';

const Grid: React.FC<GridProps> = ({
  state,
  setState,
  selectedState,
  infectionMode,
  vaccinationMode,
  pendingSource,
  setPendingSource
}) => {
  const handleNodeClick = (nodeId: string) => {
    const node = state.nodes[nodeId];

    if (infectionMode) {
      if (pendingSource === null) {
        // Only allow selecting infected nodes as source
        if (node.state === "Infected") {
          setPendingSource(nodeId);
        }
      } else {
        // Handle infection attempt
        const success = window.confirm(`Was infection from ${pendingSource} to ${nodeId} successful?`);
        
        setState(prev => {
          const updatedNodes = { ...prev.nodes };
          
          if (success) {
            if (vaccinationMode && updatedNodes[nodeId].state === "VaccinatedSafe") {
              updatedNodes[nodeId].state = "VaccinatedFailed";
            } else if (updatedNodes[nodeId].state !== "Immune" && 
                      updatedNodes[nodeId].state !== "VaccinatedSafe") {
              updatedNodes[nodeId].state = "Infected";
            }
          } else {
            if (updatedNodes[nodeId].state !== "Immune" && 
                updatedNodes[nodeId].state !== "VaccinatedSafe") {
              updatedNodes[nodeId].state = "InfectionAttemptFailed";
            }
          }

          return {
            ...prev,
            nodes: updatedNodes,
            history: [...prev.history, {
              from: pendingSource,
              to: nodeId,
              success,
              timestamp: Date.now()
            }]
          };
        });

        setPendingSource(null);
      }
    } else if (selectedState !== null) {
      setState(prev => {
        const updatedNodes = { ...prev.nodes };
        updatedNodes[nodeId].state = selectedState;
        return { ...prev, nodes: updatedNodes };
      });
    }
  };

  return (
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
            cursor: infectionMode ? "crosshair" : selectedState ? "pointer" : "default",
            backgroundColor: getColorForState(node.state),
            position: "relative",
            fontSize: "20px",
            fontWeight: "bold",
            userSelect: "none",
            border: pendingSource === node.id ? "2px solid #ff4444" : "none",
          }}
        >
          {node.state.charAt(0).toUpperCase()}
        </div>
      ))}
    </div>
  );
};

export default Grid;