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

  private getCurrentState(): Promise<GameState> {
    return new Promise(resolve => {
      this.setState(current => {
        resolve(current);
        return current;
      });
    });
  }

  private async processInfectedNode(currentNodeId: string): Promise<void> {
    if (!this.isRunning) return;

    const gameState = await this.getCurrentState();

    const currentNode = gameState.nodes[currentNodeId];
    if (!currentNode || (currentNode.state !== "Infected" && currentNode.state !== "VaccinatedFailed")) {
      return;
    }

    const neighbors = this.getOrthogonalNeighbors(currentNodeId, gameState.gridSize);

    for (const neighborId of neighbors) {
      if (!this.isRunning) return;

      const latestState = await this.getCurrentState();
      const neighborState = latestState.nodes[neighborId]?.state;

      if (neighborState === "Infected") continue;
      if (neighborState === "VaccinatedSafe") continue;
      if (latestState.modelType === "SIR" && neighborState === "Immune") continue;
      if (neighborState !== "Susceptible") continue;

      await this.delay(1000);
      if (!this.isRunning) return;

      const success = Math.random() < 0.5;

      this.setState(prevState => {
        const updatedNodes = { ...prevState.nodes };
        let targetNode = { ...updatedNodes[neighborId] };
        let stateChanged = false;

        if (prevState.modelType === "SIR") {
          if (success) {
            targetNode.state = "Infected";
            stateChanged = true;
            this.queue.push(neighborId);
          } else {
            targetNode.state = "Immune";
            stateChanged = true;
          }
        } else {
          if (success) {
            targetNode.state = "Infected";
            stateChanged = true;
            this.queue.push(neighborId);
          } else {
            targetNode.state = "InfectionAttemptFailed";
            stateChanged = true;
          }
        }

        updatedNodes[neighborId] = targetNode;

        if (stateChanged) {
          this.updateTimeSeriesCallback(updatedNodes, prevState.nodes);
        }

        return {
          ...prevState,
          nodes: updatedNodes,
          history: [...prevState.history, {
            from: currentNodeId,
            to: neighborId,
            success,
            timestamp: Date.now(),
            previousState: prevState.nodes[neighborId].state,
          }],
        };
      });
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.abortController) {
        this.abortController = new AbortController();
      }

      const timeoutId = setTimeout(resolve, ms);

      const onAbort = () => {
        clearTimeout(timeoutId);
        reject(new Error('Aborted'));
      };

      this.abortController.signal.addEventListener('abort', onAbort, { once: true });
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
      updatedNodes[randomNode.id] = { ...updatedNodes[randomNode.id], state: "Infected" };
      
      const newHistoryEntry = {
        from: null,
        to: randomNode.id,
        success: true,
        timestamp: Date.now(),
        previousState: oldNodes[randomNode.id].state,
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
      while (this.queue.length > 0 && this.isRunning) {
        const currentNodeId = this.queue.shift()!;

        const currentState = await this.getCurrentState();
        if (!this.hasInfectableSusceptibleNeighbors(currentState)) {
          this.queue = [];
          break;
        }

        await this.processInfectedNode(currentNodeId);
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