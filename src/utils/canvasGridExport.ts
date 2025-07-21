@@ .. @@
 export const exportGridToCanvas = (state: GameState, gameNumber: number): void => {
   const { gridSize, nodes } = state;
 }
-  const cellSize = 80;
+  const cellSize = 64;
   const gap = 4;
   const padding = 16;
   
   // Calculate canvas dimensions
   const canvasWidth = gridSize.cols * cellSize + (gridSize.cols - 1) * gap + 2 * padding;
   const canvasHeight = gridSize.rows * cellSize + (gridSize.rows - 1) * gap + 2 * padding;