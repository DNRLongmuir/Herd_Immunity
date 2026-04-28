import { GameState, GridNode } from '../types';
import { getColorForState } from './colorMapping';

export const exportGridToCanvas = (state: GameState, gameNumber: number, darkMode: boolean = false): void => {
  const { gridSize, nodes } = state;
  const cellSize = 64;
  const gap = 4;
  const padding = 16;
  
  // Calculate canvas dimensions
  const canvasWidth = gridSize.cols * cellSize + (gridSize.cols - 1) * gap + 2 * padding;
  const canvasHeight = gridSize.rows * cellSize + (gridSize.rows - 1) * gap + 2 * padding;
  
  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    console.error('Could not get canvas context');
    return;
  }
  
  // Set background color based on mode
  ctx.fillStyle = darkMode ? '#374151' : '#ffffff';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  
  // Helper function to get grid number
  const getGridNumber = (nodeId: string): number => {
    const [, rowStr, colStr] = nodeId.match(/r(\d+)c(\d+)/) || [];
    if (!rowStr || !colStr) return 0;
    
    const row = parseInt(rowStr, 10);
    const col = parseInt(colStr, 10);
    
    return row * gridSize.cols + col + 1;
  };
  
  // Draw each cell
  Object.values(nodes).forEach((node: GridNode) => {
    const x = padding + node.col * (cellSize + gap);
    const y = padding + node.row * (cellSize + gap);
    
    // Draw cell background with rounded corners
    ctx.fillStyle = getColorForState(node.state);
    ctx.beginPath();
    ctx.roundRect(x, y, cellSize, cellSize, 8);
    ctx.fill();
    
    // Draw cell number
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 20px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const gridNumber = getGridNumber(node.id);
    ctx.fillText(
      gridNumber.toString(),
      x + cellSize / 2,
      y + cellSize / 2
    );
  });
  
  // Draw infection arrows if any exist
  if (state.history.length > 0) {
    drawInfectionArrows(ctx, state, cellSize, gap, padding);
  }
  
  // Convert canvas to blob and download
  canvas.toBlob((blob) => {
    if (!blob) {
      console.error('Could not create blob from canvas');
      return;
    }
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `grid_snapshot_game${gameNumber}.png`;
    a.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
};

const drawInfectionArrows = (
  ctx: CanvasRenderingContext2D,
  state: GameState,
  cellSize: number,
  gap: number,
  padding: number
): void => {
  const { gridSize, history } = state;
  
  ctx.lineWidth = 2;
  
  history.forEach(({ from, to, success }) => {
    if (!from) return; // Skip seeded infections
    
    // Parse node positions
    const fromMatch = from.match(/r(\d+)c(\d+)/);
    const toMatch = to.match(/r(\d+)c(\d+)/);
    
    if (!fromMatch || !toMatch) return;
    
    const fromRow = parseInt(fromMatch[1], 10);
    const fromCol = parseInt(fromMatch[2], 10);
    const toRow = parseInt(toMatch[1], 10);
    const toCol = parseInt(toMatch[2], 10);
    
    // Calculate center points
    const fromX = padding + fromCol * (cellSize + gap) + cellSize / 2;
    const fromY = padding + fromRow * (cellSize + gap) + cellSize / 2;
    const toX = padding + toCol * (cellSize + gap) + cellSize / 2;
    const toY = padding + toRow * (cellSize + gap) + cellSize / 2;
    
    // Calculate arrow endpoints (stop at cell edges)
    const dx = toX - fromX;
    const dy = toY - fromY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const radius = cellSize / 2;
    
    let x1, y1, x2, y2;
    
    if (dist <= 2 * radius) {
      x1 = fromX;
      y1 = fromY;
      x2 = toX;
      y2 = toY;
    } else {
      x1 = fromX + (radius / dist) * dx;
      y1 = fromY + (radius / dist) * dy;
      x2 = toX - (radius / dist) * dx;
      y2 = toY - (radius / dist) * dy;
    }
    
    // Set arrow color and style
    ctx.strokeStyle = success ? '#000000' : '#888888';
    ctx.setLineDash(success ? [] : [4, 4]);
    
    // Draw arrow line
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    
    // Draw arrowhead
    const arrowLength = 8;
    const arrowAngle = Math.PI / 6;
    const angle = Math.atan2(y2 - y1, x2 - x1);
    
    ctx.fillStyle = success ? '#000000' : '#888888';
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(
      x2 - arrowLength * Math.cos(angle - arrowAngle),
      y2 - arrowLength * Math.sin(angle - arrowAngle)
    );
    ctx.lineTo(
      x2 - arrowLength * Math.cos(angle + arrowAngle),
      y2 - arrowLength * Math.sin(angle + arrowAngle)
    );
    ctx.closePath();
    ctx.fill();
  });
  
  // Reset line dash
  ctx.setLineDash([]);
};