import { GameState, GridNode, NodeState } from '../types';

export interface AutoPlayStep {
  fromNodeId: string;
  toNodeId: string;
  success: boolean;
}

export class AutoPlaySimulator {
  private queue: string[] = [];
  private isRunning = false;
  private abortController: AbortController | null = null;

  constructor(
    private setState: React.Dispatch<React.SetStateAction<GameState>>,
    private updateTimeSeriesCallback: (updatedNodes: Record<string, GridNode>, oldNodes: Record<string, GridNode>) => void,
    private onComplete: () => void
  ) {}

  private getOrthogonalNeighbors(nodeId: string, gridSize: { rows: number; cols: number }): string[] {
    const [, rowStr, colStr] = nodeId.match(/r(\d+)c(\d+)/) || [];
    if (!rowStr || !colStr) return [];
    
    const row = parseInt(rowStr, 10);
    const col = parseInt(colStr, 10);
    const neighbors: string[] = [];

    // Up
    if (row > 0) neighbors.push(`r${row - 1}c${col}`);
    // Down
    if (row < gridSize.rows - 1) neighbors.push(`r${row + 1}c${col}`);
    // Left
    if (col > 0) neighbors.push(`r${row}c${col - 1}`);
    // Right
    if (col < gridSize.cols - 1) neighbors.push(`r${row}c${col + 1}`);

    return neighbors;
  }

  private countNodeStates(nodes: Record<string, GridNode>): Record<NodeState, number> {
    const counts: Record<NodeState, number> = {
      Susceptible: 0,
      VaccinatedSafe: 0,
      VaccinatedFailed: 0,
      Infected: 0,
      Immune: 0,
      InfectionAttemptFailed: 0,
    };
    
    Object.values(nodes).forEach(node => {
      counts[node.state]++;
    });
    
    return counts;
  }

  private async processInfectedNode(currentNodeId: string, gameState: GameState): Promise<void> {
    if (!this.isRunning) return;

    // CRITICAL: Only process if the current node is still Infected or VaccinatedFailed
    const currentNode = gameState.nodes[currentNodeId];
    if (!currentNode || (currentNode.state !== "Infected" && currentNode.state !== "VaccinatedFailed")) {
      console.log(`Skipping node ${currentNodeId} - no longer infectious (state: ${currentNode?.state})`);
      return;
    }

    // Get all orthogonal neighbors
    const neighbors = this.getOrthogonalNeighbors(currentNodeId, gameState.gridSize);

    // Loop through each neighbor and decide eligibility at runtime
    for (const neighborId of neighbors) {
      if (!this.isRunning) return;

      // Always read the latest state
      const neighborState = gameState.nodes[neighborId]?.state;

      // Skip nodes that are already Infected
      if (neighborState === "Infected") continue;

      // Always skip VaccinatedSafe nodes in Auto-Play (no vaccination efficacy in auto mode)
      if (neighborState === "VaccinatedSafe") {
        continue;
      }

      // In SIR mode, skip Immune nodes
      if (gameState.modelType === "SIR" && neighborState === "Immune") {
        continue;
      }

      // Skip nodes that aren't Susceptible (after checking specific states above)
      if (neighborState !== "Susceptible") {
        continue;
      }

      // Wait 1 second before attempting infection
      await this.delay(1000);
      if (!this.isRunning) return;

      // 50/50 infection attempt
      const success = Math.random() < 0.5;
      console.log(
        `Attempting infection from ${currentNodeId} to ${neighborId}: ${
          success ? "SUCCESS" : "FAILED"
        } (${gameState.modelType} mode)`
      );

      // Update state, queue, history, and time series
      this.setState(prevState => {
        const updatedNodes = { ...prevState.nodes };
        const targetNode = updatedNodes[neighborId];
        const originalState = targetNode.state;
        let stateChanged = false;

        if (prevState.modelType === "SIR") {
          // SIR: failure → R (Immune), success → I
          if (success) {
            targetNode.state = "Infected";
            stateChanged = true;
            this.queue.push(neighborId);
          } else {
            targetNode.state = "Immune";
            stateChanged = true;
          }
        } else {
          // SI: failure → stay Susceptible, success → I
          if (success) {
            targetNode.state = "Infected";
            stateChanged = true;
            this.queue.push(neighborId);
          }
          // On failure in SI mode, leave as Susceptible (no change)
          // stateChanged remains false for SI failures
        }

        // Update time series if state actually changed
        if (stateChanged) {
          const currentCounts = this.countNodeStates(updatedNodes);
          this.updateTimeSeriesCallback(updatedNodes, prevState.nodes);
        }
        const newHistoryEntry = {
          from: currentNodeId,
          to: neighborId,
          success,
          timestamp: Date.now(),
        };

        const newState: GameState = {
          ...prevState,
          nodes: updatedNodes,
          history: [...prevState.history, newHistoryEntry],
        };

        return newState;
      });
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.abortController) {
        this.abortController = new AbortController();
      }

      const timeoutId = setTimeout(resolve, ms);
      
      this.abortController.signal.addEventListener('abort', () => {
        clearTimeout(timeoutId);
        reject(new Error('Aborted'));
      });
    });
  }

  private findInfectedNodes(gameState: GameState): string[] {
    return Object.values(gameState.nodes)
      .filter(node => node.state === "Infected" || node.state === "VaccinatedFailed")
      .map(node => node.id);
  }

  private seedRandomInfection(gameState: GameState): string | null {
    const susceptibleNodes = Object.values(gameState.nodes)
      .filter(node => node.state === "Susceptible");
    
    if (susceptibleNodes.length === 0) return null;
    
    const randomNode = susceptibleNodes[Math.floor(Math.random() * susceptibleNodes.length)];
    
    this.setState(prevState => {
      const oldNodes = prevState.nodes;
      const updatedNodes = { ...prevState.nodes };
      updatedNodes[randomNode.id].state = "Infected";
      
      const newHistoryEntry = {
        from: null, // Seeded infection
        to: randomNode.id,
        success: true,
        timestamp: Date.now()
      };

      const newState = {
        ...prevState,
        nodes: updatedNodes,
        history: [...prevState.history, newHistoryEntry]
      };

      // Update time series if state changed
      this.updateTimeSeriesCallback(updatedNodes, oldNodes);

      return newState;
    });

    return randomNode.id;
  }

  private hasInfectableSusceptibleNeighbors(gameState: GameState): boolean {
    const infectedNodes = this.findInfectedNodes(gameState);
    
    for (const infectedNodeId of infectedNodes) {
      const neighbors = this.getOrthogonalNeighbors(infectedNodeId, gameState.gridSize);
      
      // Filter based on model type - same logic as processInfectedNode
      const eligibleNeighbors = neighbors.filter(neighborId => {
        const neighborState = gameState.nodes[neighborId]?.state;

        // Skip nodes that are already Infected
        if (neighborState === "Infected") return false;

        // Skip VaccinatedSafe nodes in Auto-Play
        if (neighborState === "VaccinatedSafe") return false;

        // In SIR mode, skip Immune nodes
        if (gameState.modelType === "SIR" && neighborState === "Immune") return false;

        // Only consider Susceptible neighbors (after excluding specific states)
        if (neighborState !== "Susceptible") return false;

        return true;
      });
      
      if (eligibleNeighbors.length > 0) {
        return true;
      }
    }
    
    return false;
  }

  async start(gameState: GameState): Promise<void> {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.abortController = new AbortController();
    
    console.log(`Starting auto-play simulation in ${gameState.modelType} mode`);

    // Find existing infected nodes or seed one
    let infectedNodes = this.findInfectedNodes(gameState);
    
    if (infectedNodes.length === 0) {
      console.log('No infected nodes found, seeding random infection');
      const seededNode = this.seedRandomInfection(gameState);
      if (seededNode) {
        infectedNodes = [seededNode];
        // Wait a moment for state to update
        await this.delay(500);
      } else {
        console.log('No susceptible nodes available for seeding');
        this.stop();
        return;
      }
    }

    // Initialize queue with infected nodes
    this.queue = [...infectedNodes];
    console.log(`Initialized queue with ${this.queue.length} infected nodes`);

    try {
      // Process queue until empty or no more infections possible
      while (this.queue.length > 0 && this.isRunning) {
        const currentNodeId = this.queue.shift()!;
        console.log(`Processing queue item: ${currentNodeId}, remaining queue: ${this.queue.length}`);
        
        // Get current game state for processing
        await new Promise<void>((resolve, reject) => {
          this.setState(currentState => {
            // Check if there are still susceptible neighbors that can be infected
            if (!this.hasInfectableSusceptibleNeighbors(currentState)) {
              console.log(`No more eligible neighbors available for infection in ${currentState.modelType} mode, stopping auto-play`);
              this.queue = []; // Clear queue to stop processing
              resolve();
              return currentState;
            }
            
            this.processInfectedNode(currentNodeId, currentState)
              .then(resolve)
              .catch(reject);
            return currentState;
          });
        });
      }
      
      if (this.isRunning) {
        console.log('Auto-play simulation completed');
        this.onComplete();
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'Aborted') {
        console.log('Auto-play simulation aborted');
      } else {
        console.error('Auto-play simulation error:', error);
      }
    } finally {
      this.stop();
    }
  }

  stop(): void {
    console.log('Stopping auto-play simulation');
    this.isRunning = false;
    this.queue = [];
    
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  getIsRunning(): boolean {
    return this.isRunning;
  }

  getQueueLength(): number {
    return this.queue.length;
  }
}