import React, { useEffect, useState } from 'react';
import { InfectionArrowsProps } from './types';

interface ArrowPosition {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  success: boolean;
}

const InfectionArrows: React.FC<InfectionArrowsProps> = ({ state, gridRef }) => {
  const [arrows, setArrows] = useState<ArrowPosition[]>([]);

  useEffect(() => {
    if (!gridRef.current) return;

    const gridRect = gridRef.current.getBoundingClientRect();
    const newArrows: ArrowPosition[] = [];

    state.history.forEach(({ from, to, success }) => {
      if (!from) return; // Skip seeded infections

      const fromEl = document.querySelector(`[data-node-id="${from}"]`);
      const toEl = document.querySelector(`[data-node-id="${to}"]`);

      if (!fromEl || !toEl) return;

      const fromRect = fromEl.getBoundingClientRect();
      const toRect = toEl.getBoundingClientRect();

      const x1 = fromRect.left + fromRect.width / 2 - gridRect.left;
      const y1 = fromRect.top + fromRect.height / 2 - gridRect.top;
      const x2 = toRect.left + toRect.width / 2 - gridRect.left;
      const y2 = toRect.top + toRect.height / 2 - gridRect.top;

      const dx = x2 - x1;
      const dy = y2 - y1;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const r = fromRect.width / 2;

      let x1p, y1p, x2p, y2p;

      if (dist <= 2 * r) {
        x1p = x1;
        y1p = y1;
        x2p = x2;
        y2p = y2;
      } else {
        x1p = x1 + (r / dist) * dx;
        y1p = y1 + (r / dist) * dy;
        x2p = x2 - (r / dist) * dx;
        y2p = y2 - (r / dist) * dy;
      }

      newArrows.push({ x1: x1p, y1: y1p, x2: x2p, y2: y2p, success });
    });

    setArrows(newArrows);
  }, [state.history, gridRef]);

  if (!gridRef.current) return null;

  return (
    <svg
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    >
      <defs>
        <marker
          id="arrowhead"
          markerWidth="6"
          markerHeight="6"
          refX="5"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L0,6 L6,3 z" fill="#000" />
        </marker>
      </defs>
      {arrows.map((arrow, i) => (
        <line
          key={i}
          x1={arrow.x1}
          y1={arrow.y1}
          x2={arrow.x2}
          y2={arrow.y2}
          stroke={arrow.success ? "#000000" : "#888888"}
          strokeWidth={2}
          strokeDasharray={arrow.success ? "0" : "4,4"}
          markerEnd="url(#arrowhead)"
        />
      ))}
    </svg>
  );
};

export default InfectionArrows;